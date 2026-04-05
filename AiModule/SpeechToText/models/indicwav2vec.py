"""
models/indicwav2vec.py  –  IndicWav2Vec CTC inference engine.

IndicWav2Vec = Wav2Vec2-based models pre-trained on 40 Indian languages
by AI4Bharat / Speech-Lab IIT Madras.

Works entirely via HuggingFace Transformers — no NeMo needed.

Usage:
    from models.indicwav2vec import IndicWav2VecSTT
    stt = IndicWav2VecSTT(language="hi")
    text = stt.transcribe(audio_array)
    text = stt.transcribe_file("audio.wav")
"""

from __future__ import annotations
import logging
from pathlib import Path

import numpy as np
import torch
from transformers import (
    AutoModelForCTC,
    AutoProcessor,
    Wav2Vec2Processor,
    Wav2Vec2ForCTC,
)
from huggingface_hub.utils import RepositoryNotFoundError

from config import (
    INDICWAV2VEC_MODELS,
    CACHE_DIR,
    HF_TOKEN,
    SAMPLE_RATE,
)
from audio_utils import load_audio

logger = logging.getLogger(__name__)


class IndicWav2VecSTT:
    """
    CTC-based STT for Indic languages using IndicWav2Vec.

    Args:
        language (str): BCP-47 code ('hi', 'ta', 'bn', …) or 'multilingual'.
        model_id (str): Override default HuggingFace model ID.
        device   (str): 'cuda', 'cpu', or 'auto'.
    """

    def __init__(
        self,
        language: str = "hi",
        model_id: str | None = None,
        device: str = "auto",
    ):
        self.language = language

        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.model_id = model_id or self._resolve_model(language)
        logger.info(f"[IndicWav2Vec] Loading model: {self.model_id} on {self.device}")

        self._fallback_pipe = None
        try:
            self.processor = AutoProcessor.from_pretrained(
                self.model_id,
                cache_dir=str(CACHE_DIR),
                token=HF_TOKEN if HF_TOKEN else None,
            )
            self.model = AutoModelForCTC.from_pretrained(
                self.model_id,
                cache_dir=str(CACHE_DIR),
                token=HF_TOKEN if HF_TOKEN else None,
            ).to(self.device)
            self.model.eval()
            logger.info("[IndicWav2Vec] Model ready ✓")
            print(f"[IndicWav2Vec] ✓ Ready — {self.model_id}")
        except Exception as e:
            logger.warning(
                f"[IndicWav2Vec] Could not load '{self.model_id}': {e}\n"
                "This model is likely GATED. Accept terms at:\n"
                f"  https://huggingface.co/{self.model_id}\n"
                "Then add HF_TOKEN=hf_xxx to your .env file.\n"
                "Falling back to openai/whisper-large-v3 for now…"
            )
            print(f"[IndicWav2Vec] ⚠ Gated model — falling back to Whisper")
            from transformers import pipeline as hf_pipeline
            import torch as _torch
            _dtype = _torch.float16 if self.device == "cuda" else _torch.float32
            self._fallback_pipe = hf_pipeline(
                "automatic-speech-recognition",
                model="openai/whisper-large-v3",
                torch_dtype=_dtype,
                device=self.device,
            )
            from models.indicwhisper import WHISPER_LANG_MAP
            self._fallback_lang = WHISPER_LANG_MAP.get(language)
            self.processor = None
            self.model = None
            print(f"[IndicWav2Vec] ✓ Fallback Whisper ready")

    # ── Internal ───────────────────────────────────────────────────────────────
    def _resolve_model(self, lang: str) -> str:
        if lang in INDICWAV2VEC_MODELS:
            return INDICWAV2VEC_MODELS[lang]
        logger.warning(
            f"[IndicWav2Vec] No model configured for '{lang}'. "
            "Using multilingual backbone (requires fine-tuning)."
        )
        return INDICWAV2VEC_MODELS["multilingual"]

    def _preprocess(self, audio: np.ndarray, sample_rate: int) -> torch.Tensor:
        """Tokenise raw audio for the model."""
        inputs = self.processor(
            audio,
            sampling_rate=sample_rate,
            return_tensors="pt",
            padding=True,
        )
        return inputs.input_values.to(self.device)

    # ── Public API ─────────────────────────────────────────────────────────────
    def transcribe(self, audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> str:
        """
        Transcribe a numpy float32 1-D audio array.
        Uses CTC greedy decode if native model loaded, else falls back to Whisper.

        Args:
            audio       : float32 1-D numpy array.
            sample_rate : SR of input (model expects 16000 Hz).
        Returns:
            Decoded string.
        """
        # ── Fallback: use Whisper pipeline when native model couldn't load ──────
        if self._fallback_pipe is not None:
            gen_kwargs: dict = {"task": "transcribe"}
            if hasattr(self, "_fallback_lang") and self._fallback_lang:
                gen_kwargs["language"] = self._fallback_lang
            result = self._fallback_pipe(
                {"raw": audio.astype(np.float32), "sampling_rate": sample_rate},
                generate_kwargs=gen_kwargs,
                return_timestamps=False,
            )
            return (result["text"] or "").strip()

        # ── Native CTC path ────────────────────────────────────────────────────
        input_values = self._preprocess(audio, sample_rate)
        with torch.no_grad():
            logits = self.model(input_values).logits
        pred_ids   = torch.argmax(logits, dim=-1)
        transcript = self.processor.batch_decode(pred_ids)[0]
        return transcript.strip()

    def transcribe_batch(
        self, audio_list: list[np.ndarray], sample_rate: int = SAMPLE_RATE
    ) -> list[str]:
        """Transcribe a batch of numpy arrays."""
        if self._fallback_pipe is not None:
            return [self.transcribe(a, sample_rate) for a in audio_list]

        inputs = self.processor(
            audio_list,
            sampling_rate=sample_rate,
            return_tensors="pt",
            padding=True,
        )
        input_values = inputs.input_values.to(self.device)
        with torch.no_grad():
            logits = self.model(input_values).logits
        pred_ids    = torch.argmax(logits, dim=-1)
        transcripts = self.processor.batch_decode(pred_ids)
        return [t.strip() for t in transcripts]

    def transcribe_file(self, path: str | Path) -> str:
        """Load audio from file and transcribe."""
        audio = load_audio(path)
        return self.transcribe(audio)

    def transcribe_long_audio(
        self,
        audio: np.ndarray,
        chunk_sec: float = 20.0,
        overlap_sec: float = 1.0,
        sample_rate: int = SAMPLE_RATE,
    ) -> str:
        """
        Sliding-window transcription for long audio (> 30 s).
        Splits into chunks with overlap, transcribes each, and joins.
        """
        chunk_len   = int(chunk_sec * sample_rate)
        overlap_len = int(overlap_sec * sample_rate)
        step        = chunk_len - overlap_len

        parts: list[str] = []
        start = 0
        while start < len(audio):
            end   = min(start + chunk_len, len(audio))
            chunk = audio[start:end]
            text  = self.transcribe(chunk, sample_rate)
            parts.append(text)
            if end == len(audio):
                break
            start += step

        return " ".join(parts).strip()

    def __repr__(self) -> str:
        return f"IndicWav2VecSTT(model={self.model_id}, lang={self.language}, device={self.device})"
