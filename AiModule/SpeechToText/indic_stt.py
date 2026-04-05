"""
SpeechToText/indic_stt.py
==========================
Indian language STT — restored original high-accuracy stack.

Model priority:
  1. openai/whisper-large-v3  via transformers (cached, best accuracy for Indian languages)
     - Anti-hallucination kwargs: no_repeat_ngram_size, compression_ratio_threshold,
       logprob_threshold, temperature=0 (greedy, deterministic)
     - Language forced explicitly — never auto-detects wrong language
  2. Systran/faster-whisper-tiny (cached 72MB, instant fallback)
  3. Emergency empty dict — never crashes

RAM usage:
  - whisper-large-v3 loads in float32 on CPU: ~3GB RAM
  - If RAM is tight it falls back to faster-whisper-tiny: ~200MB RAM
"""

import os
import logging
import sys
from pathlib import Path
from typing import Optional

import numpy as np

# Force offline mode — use only locally cached models, zero HTTP calls
os.environ["TRANSFORMERS_OFFLINE"]            = "1"
os.environ["HF_DATASETS_OFFLINE"]             = "1"
os.environ["HF_HUB_OFFLINE"]                  = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

log = logging.getLogger(__name__)

# ── Language maps ─────────────────────────────────────────────────────────────
# BCP-47 -> Whisper internal language token
WHISPER_LANG_MAP: dict[str, str] = {
    "hi":  "hindi",      "ta":  "tamil",      "te":  "telugu",
    "bn":  "bengali",    "kn":  "kannada",    "ml":  "malayalam",
    "gu":  "gujarati",   "pa":  "punjabi",    "mr":  "marathi",
    "ur":  "urdu",       "en":  "english",    "as":  "assamese",
    "or":  "odia",       "sa":  "sanskrit",   "ne":  "nepali",
    "sd":  "sindhi",     "ks":  "kashmiri",   "mai": "maithili",
    "kok": "konkani",    "doi": "dogri",      "mni": "manipuri",
    "sat": "santali",    "brx": "bodo",
}

LANG_MAP = WHISPER_LANG_MAP  # alias for external use

# Cached model IDs
_LARGE_V3_ID = "openai/whisper-large-v3"
_MEDIUM_ID   = "Systran/faster-whisper-medium"
_TINY_ID     = "Systran/faster-whisper-tiny"

# Singleton
_instance: Optional["IndicSTT"] = None

def get_stt() -> "IndicSTT":
    global _instance
    if _instance is None:
        _instance = IndicSTT()
    return _instance


def _load_audio(audio_path: str) -> tuple:
    """Load audio to float32 numpy 1D array at 16kHz mono using librosa."""
    import librosa
    audio_np, _ = librosa.load(audio_path, sr=16000, mono=True)
    duration = round(len(audio_np) / 16000, 2)
    return audio_np, duration


class IndicSTT:
    def __init__(self, device: str = "cpu"):
        self.device    = device
        self._pipe     = None   # whisper-large-v3 transformers pipeline
        self._fw_medium = None  # faster-whisper-medium (cached, good accuracy)
        self._fw_tiny  = None   # faster-whisper-tiny fallback

    # ------------------------------------------------------------------ loaders

    def _load_large_v3(self):
        """Load openai/whisper-large-v3 via transformers. Cached locally."""
        if self._pipe is not None:
            return
        try:
            import psutil, torch, transformers
            from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

            free_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
            if free_ram_gb < 2.8:
                log.warning(
                    "Only %.1fGB RAM free — skipping whisper-large-v3 (needs ~3GB). "
                    "Will use faster-whisper-medium fallback.", free_ram_gb
                )
                self._pipe = False
                return

            log.info("Loading %s (%.1fGB RAM free) ...", _LARGE_V3_ID, free_ram_gb)
            dtype = torch.float16 if self.device == "cuda" else torch.float32
            tf_ver = tuple(int(x) for x in transformers.__version__.split(".")[:2])
            dtype_key = "dtype" if tf_ver >= (4, 46) else "torch_dtype"

            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                _LARGE_V3_ID, low_cpu_mem_usage=True,
                local_files_only=True, **{dtype_key: dtype},
            )
            model.to(self.device)
            processor = AutoProcessor.from_pretrained(_LARGE_V3_ID, local_files_only=True)
            self._pipe = pipeline(
                "automatic-speech-recognition",
                model=model, tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                device=self.device, **{dtype_key: dtype},
            )
            log.info("%s ready.", _LARGE_V3_ID)
        except Exception as e:
            log.warning("whisper-large-v3 load failed: %s", e)
            self._pipe = False

    def _load_medium(self):
        """Load faster-whisper-medium (cached 1.4GB, ~900MB RAM, good accuracy)."""
        if self._fw_medium is not None:
            return
        try:
            from faster_whisper import WhisperModel
            log.info("Loading faster-whisper-medium ...")
            self._fw_medium = WhisperModel(
                _MEDIUM_ID, device=self.device, compute_type="int8"
            )
            log.info("faster-whisper-medium ready.")
        except Exception as e:
            log.warning("faster-whisper-medium load failed: %s", e)
            self._fw_medium = False

    def _load_tiny(self):
        """Load faster-whisper-tiny. Already cached at 72MB."""
        if self._fw_tiny is not None:
            return
        try:
            from faster_whisper import WhisperModel
            log.info("Loading faster-whisper-tiny ...")
            self._fw_tiny = WhisperModel(_TINY_ID, device=self.device, compute_type="int8")
            log.info("faster-whisper-tiny ready.")
        except Exception as e:
            log.warning("faster-whisper-tiny load failed: %s", e)
            self._fw_tiny = False

    # ------------------------------------------------------------------ transcribe methods

    def _transcribe_large_v3(self, audio_np: np.ndarray, language: Optional[str]) -> Optional[dict]:
        """
        Transcribe using whisper-large-v3 with full anti-hallucination kwargs.
        These are the same kwargs that gave good accuracy in the original codebase.
        """
        self._load_large_v3()
        if not self._pipe:
            return None
        try:
            gen_kwargs = {
                "task":                     "transcribe",
                "no_repeat_ngram_size":     5,       # prevents repetition loops
                "compression_ratio_threshold": 2.4,  # rejects repetitive outputs
                "logprob_threshold":        -1.0,    # rejects low-confidence hallucinations
                "temperature":              0.0,     # greedy decoding, deterministic
                "condition_on_prev_tokens": False,   # prevents cascade errors
            }
            # Force language — never let Whisper auto-detect wrong language
            if language and language in WHISPER_LANG_MAP:
                gen_kwargs["language"] = WHISPER_LANG_MAP[language]

            result = self._pipe(
                {"raw": audio_np.astype(np.float32), "sampling_rate": 16000},
                generate_kwargs=gen_kwargs,
                return_timestamps=True,   # handles both short and long audio
                chunk_length_s=30,
                stride_length_s=5,
            )

            text = result.get("text", "")
            if not text:
                chunks = result.get("chunks", [])
                text = " ".join(c["text"] for c in chunks)
            text = text.strip()

            return {
                "text":       text,
                "confidence": 0.85 if text else 0.0,
                "model":      _LARGE_V3_ID,
                "lang":       language or "unknown",
            }
        except Exception as e:
            log.warning("whisper-large-v3 transcription failed: %s", e)
            return None

    def _transcribe_medium(self, audio_path: str, language: Optional[str]) -> Optional[dict]:
        """Transcribe using faster-whisper-medium. Better accuracy than tiny."""
        self._load_medium()
        if not self._fw_medium:
            return None
        try:
            lang_hint = language if language in WHISPER_LANG_MAP else None

            # Script-anchoring prompts — forces model to output in correct script
            # Prevents romanization or accidental English output
            SCRIPT_PROMPTS = {
                "hi": "यह एक हिंदी वार्तालाप है।",
                "ta": "இது தமிழ் உரையாடல்.",
                "te": "ఇది తెలుగు సంభాషణ.",
                "bn": "এটি একটি বাংলা কথোপকথন।",
                "kn": "ಇದು ಕನ್ನಡ ಸಂಭಾಷಣೆ.",
                "ml": "ഇത് ഒരു മലയാളം സംഭാഷണമാണ്.",
                "gu": "આ એક ગુજરાતી વાર્તાલાપ છે.",
                "pa": "ਇਹ ਇੱਕ ਪੰਜਾਬੀ ਗੱਲਬਾਤ ਹੈ।",
                "mr": "हे एक मराठी संभाषण आहे.",
                "ur": "یہ ایک اردو گفتگو ہے۔",
            }
            initial_prompt = SCRIPT_PROMPTS.get(lang_hint, None)

            segments, info = self._fw_medium.transcribe(
                audio_path,
                language=lang_hint,
                task="transcribe",
                beam_size=10,
                best_of=5,
                patience=2.0,
                temperature=[0.0, 0.2, 0.4],
                compression_ratio_threshold=2.4,
                log_prob_threshold=-1.0,
                no_speech_threshold=0.6,
                condition_on_previous_text=True,
                initial_prompt=initial_prompt,
                vad_filter=True,
                vad_parameters={"min_silence_duration_ms": 500},
                word_timestamps=False,
            )
            text = " ".join(s.text for s in segments).strip()
            detected = getattr(info, "language", language or "unknown")
            return {
                "text":       text,
                "confidence": round(float(getattr(info, "language_probability", 0.8)), 4),
                "model":      _MEDIUM_ID,
                "lang":       detected,
            }
        except Exception as e:
            log.warning("faster-whisper-medium failed: %s", e)
            return None
            text = " ".join(s.text for s in segments).strip()
            return {
                "text":       text,
                "confidence": round(float(getattr(info, "language_probability", 0.8)), 4),
                "model":      _MEDIUM_ID,
                "lang":       getattr(info, "language", language or "unknown"),
            }
        except Exception as e:
            log.warning("faster-whisper-medium failed: %s", e)
            return None

    def _free_stt_ram(self):
        """Unload STT model from RAM so translation model can load."""
        import gc
        if self._pipe and self._pipe is not False:
            try:
                del self._pipe.model
            except Exception:
                pass
            self._pipe = None
        if self._fw_medium and self._fw_medium is not False:
            self._fw_medium = None
        if self._fw_tiny and self._fw_tiny is not False:
            self._fw_tiny = None
        gc.collect()
        try:
            import torch
            torch.cuda.empty_cache()
        except Exception:
            pass
        import psutil
        log.info("RAM after STT unload: %.1fGB free",
                 psutil.virtual_memory().available / (1024**3))

    # ------------------------------------------------------------------ helpers

    def _duration(self, audio_path: str) -> float:
        try:
            import librosa
            return round(librosa.get_duration(path=audio_path), 2)
        except Exception:
            try:
                import wave
                with wave.open(audio_path) as w:
                    return round(w.getnframes() / w.getframerate(), 2)
            except Exception:
                return 0.0

    def _build(self, r: dict, audio_path: str) -> dict:
        lang = r.get("lang", "unknown")
        return {
            "text":               r["text"],
            "language":           lang,
            "language_name":      LANG_MAP.get(lang, lang),
            "confidence":         r["confidence"],
            "stt_model_used":     r["model"],
            "stt_error":          None,
            "audio_duration_sec": self._duration(audio_path),
        }

    def _error(self, msg: str, language: Optional[str], audio_path: str) -> dict:
        return {
            "text":               "",
            "language":           language or "unknown",
            "language_name":      LANG_MAP.get(language or "", "unknown"),
            "confidence":         0.0,
            "stt_model_used":     "none",
            "stt_error":          msg,
            "audio_duration_sec": self._duration(audio_path),
        }

    # ------------------------------------------------------------------ public

    def transcribe(self, audio_path: str, language: Optional[str] = None) -> dict:
        """
        Transcribe audio file. Never raises.

        Args:
            audio_path : .wav / .mp3 / .flac
            language   : BCP-47 code e.g. 'hi','ta','te','bn' or None for auto

        Returns dict:
            text, language, language_name, confidence,
            stt_model_used, stt_error, audio_duration_sec
        """
        audio_path = str(Path(audio_path).resolve())
        errors     = []

        if not os.path.exists(audio_path):
            return self._error(f"File not found: {audio_path}", language, audio_path)

        # Load audio once for the transformers pipeline
        try:
            audio_np, _ = _load_audio(audio_path)
        except Exception as e:
            return self._error(f"Audio load failed: {e}", language, audio_path)

        # Priority 1: whisper-large-v3 (best accuracy, cached)
        try:
            r = self._transcribe_large_v3(audio_np, language)
            if r and r["text"]:
                log.info("whisper-large-v3 OK  lang=%s conf=%.2f  text=%r",
                         r["lang"], r["confidence"], r["text"][:80])
                return self._build(r, audio_path)
            if r:
                errors.append("large-v3:empty_output")
        except Exception as e:
            errors.append(f"large-v3:{e}")

        # Priority 2: faster-whisper-medium (cached 1.4GB, ~900MB RAM)
        try:
            r = self._transcribe_medium(audio_path, language)
            if r and r["text"]:
                log.info("faster-whisper-medium OK  lang=%s conf=%.2f  text=%r",
                         r["lang"], r["confidence"], r["text"][:80])
                return self._build(r, audio_path)
            if r:
                errors.append("medium:empty_output")
        except Exception as e:
            errors.append(f"medium:{e}")

        # Priority 3: faster-whisper-tiny (cached 72MB, instant)
        try:
            self._load_tiny()
            if self._fw_tiny:
                lang_hint = language if language in WHISPER_LANG_MAP else None
                segments, info = self._fw_tiny.transcribe(
                    audio_path, language=lang_hint,
                    beam_size=5, vad_filter=True, word_timestamps=False,
                )
                text = " ".join(s.text for s in segments).strip()
                if text:
                    r = {
                        "text": text,
                        "confidence": round(float(getattr(info, "language_probability", 0.5)), 4),
                        "model": _TINY_ID,
                        "lang": getattr(info, "language", language or "unknown"),
                    }
                    log.info("faster-whisper-tiny OK  lang=%s conf=%.2f",
                             r["lang"], r["confidence"])
                    return self._build(r, audio_path)
                errors.append("tiny:empty_output")
        except Exception as e:
            errors.append(f"tiny:{e}")

        # Emergency
        log.error("All STT models failed: %s", " | ".join(errors))
        return self._error(" | ".join(errors), language, audio_path)
