"""
models/indicwhisper.py  –  Whisper-based STT for all 22 Indian languages.

Uses openai/whisper-large-v3 (or smaller variants) which natively supports
all major Indian languages. The language code is passed directly to Whisper's
generation so it never auto-detects incorrectly.

Usage:
    from models.indicwhisper import IndicWhisperSTT
    stt = IndicWhisperSTT(language="hi")
    text = stt.transcribe_file("audio.wav")
    text = stt.transcribe(audio_numpy_array)
"""

from __future__ import annotations
import logging
import os
from pathlib import Path

import numpy as np
import torch
from transformers import (
    AutoModelForSpeechSeq2Seq,
    AutoProcessor,
    pipeline,
)

from config import (
    INDICWHISPER_MODELS,
    CACHE_DIR,
    HF_TOKEN,
    SAMPLE_RATE,
)
from audio_utils import load_audio

logger = logging.getLogger(__name__)

# ── Whisper language code mapping ──────────────────────────────────────────────
# Maps our BCP-47 codes → Whisper's internal language tokens
# (whisper-large-v3 uses these exact strings in its tokenizer)
WHISPER_LANG_MAP: dict[str, str] = {
    "hi":  "hindi",
    "bn":  "bengali",
    "ta":  "tamil",
    "te":  "telugu",
    "mr":  "marathi",
    "gu":  "gujarati",
    "kn":  "kannada",
    "ml":  "malayalam",
    "pa":  "punjabi",
    "or":  "odia",
    "as":  "assamese",
    "ur":  "urdu",
    "sa":  "sanskrit",
    "mai": "maithili",
    "kok": "konkani",
    "ne":  "nepali",
    "sd":  "sindhi",
    "ks":  "kashmiri",
    "doi": "dogri",
    "mni": "manipuri",
    "sat": "santali",
    "brx": "bodo",
    "multilingual": None,   # auto-detect
}


class IndicWhisperSTT:
    """
    Whisper-based Indic STT engine.

    Args:
        language   (str): BCP-47 code ('hi', 'ta', …) or 'multilingual'.
        model_id   (str): Override HuggingFace model ID (default: from config).
        device     (str): 'cuda', 'cpu', or 'auto'.
        batch_size (int): Inference batch size.
    """

    def __init__(
        self,
        language: str = "hi",
        model_id: str | None = None,
        device: str = "auto",
        batch_size: int = 1,
    ):
        self.language = language

        # ── Device ─────────────────────────────────────────────────────────────
        if device == "auto":
            self.device = "cuda" if torch.cuda.is_available() else "cpu"
        else:
            self.device = device

        self.dtype = torch.float16 if self.device == "cuda" else torch.float32

        # ── Model ID ───────────────────────────────────────────────────────────
        if model_id:
            self.model_id = model_id
        else:
            # Check for a defined model in config
            cfg_model = INDICWHISPER_MODELS.get(language)
            if cfg_model and "large-v3" not in cfg_model:
                self.model_id = cfg_model
            else:
                # Fallback to the size defined in .env (stops PC crashing on RAM limits)
                size = os.getenv("STT_WHISPER_SIZE", "medium")
                self.model_id = f"openai/whisper-{size}"

        # print(f"[IndicWhisper] Loading {self.model_id} on {self.device} …")
        logger.info(f"[IndicWhisper] Loading {self.model_id} on {self.device}")

        # ── Load model ──────────────────────────────────────────────────────────
        try:
            self._load_model(batch_size)
        except Exception as e:
            raise RuntimeError(
                f"[IndicWhisper] Failed to load '{self.model_id}': {e}\n"
                "Check your internet connection. The model will be downloaded ~3GB on first run."
            ) from e

        # ── Whisper language kwarg (passed to generate()) ───────────────────────
        self._whisper_lang = WHISPER_LANG_MAP.get(language)
        logger.info(f"[IndicWhisper] Ready — lang={language} → whisper_lang={self._whisper_lang}")
        # print(f"[IndicWhisper] ✓ Model ready — language: {language}")

    # ── Loader ─────────────────────────────────────────────────────────────────
    def _load_model(self, batch_size: int) -> None:
        model = AutoModelForSpeechSeq2Seq.from_pretrained(
            self.model_id,
            torch_dtype=self.dtype,
            low_cpu_mem_usage=True,
            cache_dir=str(CACHE_DIR),
            token=HF_TOKEN if HF_TOKEN else None,
        )
        model.to(self.device)

        processor = AutoProcessor.from_pretrained(
            self.model_id,
            cache_dir=str(CACHE_DIR),
            token=HF_TOKEN if HF_TOKEN else None,
        )

        self.pipe = pipeline(
            "automatic-speech-recognition",
            model=model,
            tokenizer=processor.tokenizer,
            feature_extractor=processor.feature_extractor,
            torch_dtype=self.dtype,
            device=self.device,
            batch_size=batch_size,
        )

    # ── Language kwargs ───────────────────────────────────────────────────────────────────
    def _generate_kwargs(self) -> dict:
        """Build generation kwargs for Whisper — forces language and prevents hallucination."""
        kwargs: dict = {
            "task": "transcribe",
            # ── Anti-hallucination / anti-repetition ─────────────────────────────
            # Prevents "ताए ताए ताए..." style repetition loops
            "no_repeat_ngram_size": 5,
            # Detect and reject outputs with too much repetition (ratio >= threshold)
            "compression_ratio_threshold": 2.4,
            # Reject low-confidence hallucinations (log-prob below threshold)
            "logprob_threshold": -1.0,
            # Deterministic decoding: temperature=0 means greedy (no random sampling)
            "temperature": 0.0,
            # Don't condition new chunk on previous chunk tokens (prevents cascade errors)
            "condition_on_prev_tokens": False,
        }
        if self._whisper_lang:
            kwargs["language"] = self._whisper_lang
        return kwargs

    # ── Public API ──────────────────────────────────────────────────────────────
    def transcribe(self, audio: np.ndarray, sample_rate: int = SAMPLE_RATE) -> str:
        """
        Transcribe a float32 1-D numpy audio array.
        Handles both short (<30s) and long-form (>30s) audio automatically.

        Args:
            audio       : float32 array at sample_rate Hz.
            sample_rate : SR of input (16000 recommended).
        Returns:
            Transcribed string.
        """
        if audio.ndim != 1:
            if audio.ndim == 2:
                audio = audio.mean(axis=0)  # stereo → mono
            else:
                raise ValueError("audio must be 1-D float32 numpy array")

        if len(audio) == 0:
            return ""

        audio_input = {"raw": audio.astype(np.float32), "sampling_rate": sample_rate}
        duration_sec = len(audio) / sample_rate

        # Whisper needs return_timestamps=True for audio longer than 30 seconds.
        # We always enable it so both short and long audio work identically —
        # then we join the text chunks to get the full transcript.
        result = self.pipe(
            audio_input,
            generate_kwargs=self._generate_kwargs(),
            return_timestamps=True,          # required for long-form; works on short too
            chunk_length_s=30,               # process in 30s windows
            stride_length_s=5,               # 5s overlap between windows
        )

        # result["chunks"] = [{"text": "...", "timestamp": (start, end)}, ...]
        # result["text"]   = joined text (available in newer transformers)
        if "text" in result and result["text"]:
            return result["text"].strip()

        # Fallback: join chunks manually
        chunks = result.get("chunks", [])
        return " ".join(c["text"] for c in chunks).strip()

    def transcribe_file(self, path: str | Path) -> str:
        """Load audio from file and transcribe."""
        audio = load_audio(str(path))
        return self.transcribe(audio)

    def transcribe_with_timestamps(
        self, audio: np.ndarray, sample_rate: int = SAMPLE_RATE
    ) -> dict:
        """Transcribe and return word-level timestamps dict."""
        audio_input = {"raw": audio.astype(np.float32), "sampling_rate": sample_rate}
        result = self.pipe(
            audio_input,
            generate_kwargs=self._generate_kwargs(),
            return_timestamps="word",
            chunk_length_s=30,
            stride_length_s=5,
        )
        return result

    def __repr__(self) -> str:
        return (
            f"IndicWhisperSTT(model={self.model_id}, "
            f"lang={self.language}, device={self.device})"
        )
