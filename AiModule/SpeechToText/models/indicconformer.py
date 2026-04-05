"""
models/indicconformer.py  –  IndicConformer NeMo-based inference engine.

IndicConformer is the highest-accuracy model family from AI4Bharat,
using a Conformer architecture with hybrid CTC/RNNT decoding.
It requires the NeMo framework (NVIDIA).

Two backends are provided:
  1. NemoBackend   – full NeMo, best accuracy (GPU recommended).
  2. TransformersBackend – lightweight fallback using the multilingual
       IndicConformer converted weights (if available on HF as Wav2Vec2/Whisper).

Usage:
    from models.indicconformer import IndicConformerSTT
    stt = IndicConformerSTT(language="hi", decoder="ctc")
    text = stt.transcribe(audio_array)
    text = stt.transcribe_file("audio.wav")
"""

from __future__ import annotations
import logging
from pathlib import Path

import numpy as np

from config import (
    INDICCONFORMER_MODELS,
    INDICCONFORMER_MULTILINGUAL,
    CACHE_DIR,
    HF_TOKEN,
    SAMPLE_RATE,
)
from audio_utils import load_audio

logger = logging.getLogger(__name__)


# ── Try importing NeMo ─────────────────────────────────────────────────────────
try:
    import torch
    import nemo.collections.asr as nemo_asr
    NEMO_AVAILABLE = True
except ImportError:
    NEMO_AVAILABLE = False
    logger.warning(
        "[IndicConformer] NeMo not installed. "
        "Install via: pip install nemo_toolkit[asr]  or  see setup_nemo.sh\n"
        "Falling back to Transformers-based multilingual conformer."
    )


class _NemoBackend:
    """NeMo-based IndicConformer backend (full accuracy)."""

    def __init__(self, model_id: str, decoder: str, device: str):
        import torch
        self._device = torch.device("cuda" if "cuda" in device else "cpu")
        logger.info(f"[IndicConformer/NeMo] Loading {model_id}")

        self.model = nemo_asr.models.ASRModel.from_pretrained(
            model_name=model_id,
            map_location=self._device,
        )
        self.model.freeze()
        self.model.to(self._device)

        # Switch decoder if requested
        if decoder == "ctc":
            self.model.change_decoding_strategy(decoder_type="ctc_greedy")
        elif decoder == "rnnt":
            self.model.change_decoding_strategy(decoder_type="rnnt_greedy")

    def transcribe(self, audio: np.ndarray, sample_rate: int) -> str:
        import tempfile, os
        # NeMo ASRModel.transcribe() requires file paths
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
            tmp_path = f.name

        try:
            import soundfile as sf
            sf.write(tmp_path, audio, sample_rate)
            results = self.model.transcribe([tmp_path])
            text = results[0] if isinstance(results[0], str) else results[0].text
        finally:
            os.unlink(tmp_path)

        return text.strip()


class _TransformersBackend:
    """
    Lightweight Transformers fallback for when NeMo is unavailable.
    Uses Wav2Vec2/Whisper-style weights converted from IndicConformer.
    Falls back to openai/whisper-large-v3 if model not found.
    """

    def __init__(self, model_id: str, device: str):
        import torch
        from transformers import pipeline, AutoModelForSpeechSeq2Seq, AutoProcessor

        self._device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(
            f"[IndicConformer/TF-Fallback] Loading via Transformers: {model_id}"
        )
        try:
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=model_id,
                device=self._device,
                torch_dtype=torch.float16 if self._device=="cuda" else torch.float32,
            )
        except Exception as e:
            import os
            # Prevent OOM crashing by checking .env (default to 'small' since large-v3 crashed the PC earlier)
            size = os.getenv("STT_WHISPER_SIZE", "small")
            fallback_model = f"openai/whisper-{size}"
            
            logger.warning(f"[IndicConformer/TF-Fallback] Error loading '{model_id}' (likely gated by IIT Madras). Falling back to {fallback_model}...")
            
            self.pipe = pipeline(
                "automatic-speech-recognition",
                model=fallback_model,
                device=self._device,
            )

    def transcribe(self, audio: np.ndarray, sample_rate: int) -> str:
        result = self.pipe({"raw": audio, "sampling_rate": sample_rate})
        return result["text"].strip()


# ── Public class ───────────────────────────────────────────────────────────────
class IndicConformerSTT:
    """
    IndicConformer ASR for any Indian language.

    Automatically selects NeMo backend if installed, else Transformers fallback.

    Args:
        language (str): 'hi', 'ta', … or 'multilingual'.
        decoder  (str): 'ctc' or 'rnnt' (NeMo backend only).
        device   (str): 'cuda', 'cpu', or 'auto'.
        model_id (str): Override the default model ID.
    """

    def __init__(
        self,
        language: str = "hi",
        decoder: str = "ctc",
        device: str = "auto",
        model_id: str | None = None,
    ):
        self.language = language
        self.decoder  = decoder

        if device == "auto":
            try:
                import torch
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
            except ImportError:
                self.device = "cpu"
        else:
            self.device = device

        self.model_id = model_id or INDICCONFORMER_MODELS.get(language, INDICCONFORMER_MULTILINGUAL)

        if NEMO_AVAILABLE:
            self._backend = _NemoBackend(self.model_id, self.decoder, self.device)
            self._backend_name = "NeMo"
        else:
            # For Transformers fallback, prefer the multilingual checkpoint
            fallback_id = INDICCONFORMER_MULTILINGUAL
            self._backend = _TransformersBackend(fallback_id, self.device)
            self._backend_name = "Transformers-Fallback"

        logger.info(
            f"[IndicConformer] Ready — backend={self._backend_name}, "
            f"lang={self.language}, decoder={self.decoder}"
        )

    def transcribe(self, audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> str:
        """
        Transcribe float32 1-D numpy audio array.

        Args:
            audio       : float32 numpy 1-D array.
            sample_rate : SR of input (16000 recommended).
        Returns:
            Transcribed text.
        """
        return self._backend.transcribe(audio, sample_rate)

    def transcribe_file(self, path: str | Path) -> str:
        """Load audio file and transcribe."""
        audio = load_audio(path)
        return self.transcribe(audio)

    @property
    def backend(self) -> str:
        return self._backend_name

    def __repr__(self) -> str:
        return (
            f"IndicConformerSTT(model={self.model_id}, lang={self.language}, "
            f"decoder={self.decoder}, backend={self._backend_name})"
        )
