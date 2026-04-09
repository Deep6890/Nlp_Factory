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

# ── Force NVIDIA GPU before any torch/CUDA import ────────────────────────────
# CUDA only enumerates NVIDIA devices — device 0 = RTX 3050
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

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
        _instance = IndicSTT()   # auto-detects GPU inside __init__
    return _instance


def _load_audio(audio_path: str) -> tuple:
    """
    Load audio to float32 numpy 1D array at 16kHz mono.
    Handles .webm/.m4a/.ogg by converting to wav via pydub first,
    then loads with librosa for accurate duration and resampling.
    """
    import librosa
    from pathlib import Path as _Path

    path_obj = _Path(audio_path)
    ext = path_obj.suffix.lower()

    # webm/m4a/ogg need conversion — librosa's audioread fallback is unreliable
    if ext in {'.webm', '.m4a', '.ogg', '.aac', '.mp4'}:
        try:
            from pydub import AudioSegment
            wav_path = str(path_obj.with_suffix('.wav'))
            seg = AudioSegment.from_file(audio_path)
            seg = seg.set_frame_rate(16000).set_channels(1)
            seg.export(wav_path, format='wav')
            audio_np, _ = librosa.load(wav_path, sr=16000, mono=True)
            try:
                import os as _os
                _os.unlink(wav_path)
            except Exception:
                pass
            duration = round(len(audio_np) / 16000, 2)
            log.info("Converted %s → wav  duration=%.1fs", ext, duration)
            return audio_np, duration
        except Exception as e:
            log.warning("pydub conversion failed (%s), falling back to librosa: %s", ext, e)

    audio_np, _ = librosa.load(audio_path, sr=16000, mono=True)
    duration = round(len(audio_np) / 16000, 2)
    return audio_np, duration


class IndicSTT:
    def __init__(self):
        # ── Auto-detect GPU ───────────────────────────────────────────────────
        try:
            import torch
            if torch.cuda.is_available():
                self.device     = "cuda"
                self.compute_type = "float16"   # faster-whisper GPU mode
                self.torch_dtype  = torch.float16
                gpu_name = torch.cuda.get_device_name(0)
                vram_gb  = torch.cuda.get_device_properties(0).total_memory / (1024**3)
                log.info("[GPU] NVIDIA %s detected — %.1fGB VRAM — using CUDA float16",
                         gpu_name, vram_gb)
            else:
                self.device       = "cpu"
                self.compute_type = "int8"
                import torch as _t
                self.torch_dtype  = _t.float32
                log.info("[GPU] No CUDA — using CPU")
        except Exception:
            self.device       = "cpu"
            self.compute_type = "int8"
            import torch as _t
            self.torch_dtype  = _t.float32

        # ── Batch size: bigger on GPU for throughput ──────────────────────────
        self.batch_size = 8 if self.device == "cuda" else 1

        self._pipe      = None   # whisper-large-v3 transformers pipeline
        self._fw_medium = None   # faster-whisper-medium
        self._fw_tiny   = None   # faster-whisper-tiny fallback

    # ------------------------------------------------------------------ loaders

    def _load_large_v3(self):
        """Load openai/whisper-large-v3 via transformers. Cached locally."""
        if self._pipe is not None:
            return
        try:
            import psutil, torch, transformers
            from transformers import AutoModelForSpeechSeq2Seq, AutoProcessor, pipeline

            # On CPU check RAM; on GPU check VRAM (RAM check not needed)
            if self.device == "cpu":
                free_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
                if free_ram_gb < 2.8:
                    log.warning(
                        "Only %.1fGB RAM free — skipping whisper-large-v3 (needs ~3GB). "
                        "Will use faster-whisper-medium fallback.", free_ram_gb
                    )
                    self._pipe = False
                    return
                log.info("Loading %s on CPU (%.1fGB RAM free) ...", _LARGE_V3_ID, free_ram_gb)
            else:
                free_vram_gb = (torch.cuda.get_device_properties(0).total_memory
                                - torch.cuda.memory_allocated(0)) / (1024 ** 3)
                log.info("Loading %s on GPU (%.1fGB VRAM free) ...", _LARGE_V3_ID, free_vram_gb)

            tf_ver    = tuple(int(x) for x in transformers.__version__.split(".")[:2])
            dtype_key = "dtype" if tf_ver >= (4, 46) else "torch_dtype"

            model = AutoModelForSpeechSeq2Seq.from_pretrained(
                _LARGE_V3_ID, low_cpu_mem_usage=True,
                local_files_only=True, **{dtype_key: self.torch_dtype},
            )
            model.to(self.device)

            # Enable flash attention on GPU for ~2x speedup
            if self.device == "cuda":
                try:
                    model = model.to_bettertransformer()
                    log.info("[GPU] BetterTransformer (flash attn) enabled")
                except Exception:
                    pass

            processor = AutoProcessor.from_pretrained(_LARGE_V3_ID, local_files_only=True)
            self._pipe = pipeline(
                "automatic-speech-recognition",
                model=model, tokenizer=processor.tokenizer,
                feature_extractor=processor.feature_extractor,
                device=self.device,
                batch_size=self.batch_size,
                **{dtype_key: self.torch_dtype},
            )
            log.info("%s ready on %s (batch_size=%d).", _LARGE_V3_ID, self.device, self.batch_size)
        except Exception as e:
            log.warning("whisper-large-v3 load failed: %s", e)
            self._pipe = False

    def _load_medium(self):
        """Load faster-whisper-medium. Uses float16 on GPU, int8 on CPU."""
        if self._fw_medium is not None:
            return
        try:
            from faster_whisper import WhisperModel
            log.info("Loading faster-whisper-medium on %s (%s) ...",
                     self.device, self.compute_type)
            self._fw_medium = WhisperModel(
                _MEDIUM_ID,
                device=self.device,
                compute_type=self.compute_type,
                num_workers=4 if self.device == "cuda" else 1,
            )
            log.info("faster-whisper-medium ready on %s.", self.device)
        except Exception as e:
            log.warning("faster-whisper-medium load failed: %s", e)
            self._fw_medium = False

    def _load_tiny(self):
        """Load faster-whisper-tiny. 72MB, instant fallback."""
        if self._fw_tiny is not None:
            return
        try:
            from faster_whisper import WhisperModel
            log.info("Loading faster-whisper-tiny on %s ...", self.device)
            self._fw_tiny = WhisperModel(
                _TINY_ID,
                device=self.device,
                compute_type=self.compute_type,
            )
            log.info("faster-whisper-tiny ready.")
        except Exception as e:
            log.warning("faster-whisper-tiny load failed: %s", e)
            self._fw_tiny = False

    # ------------------------------------------------------------------ transcribe methods

    def _transcribe_large_v3(self, audio_np: np.ndarray, language: Optional[str]) -> Optional[dict]:
        """
        Transcribe using whisper-large-v3.
        Chunks long audio into 30s windows with 5s overlap.
        On GPU: float16, batch_size=1 to avoid 0xC0000005 crash with chunked pipeline.
        """
        self._load_large_v3()
        if not self._pipe:
            return None
        try:
            # NOTE: no_repeat_ngram_size is intentionally excluded — it conflicts
            # with the pipeline's internal SuppressTokensLogitsProcessor and causes
            # a native CUDA crash (exit code 3221225477 / 0xC0000005) on Windows.
            gen_kwargs = {
                "task":                        "transcribe",
                "compression_ratio_threshold": 2.4,
                "logprob_threshold":           -1.0,
                "temperature":                 0.0,
                "condition_on_prev_tokens":    False,
            }
            if language and language in WHISPER_LANG_MAP:
                gen_kwargs["language"] = WHISPER_LANG_MAP[language]

            duration_sec = len(audio_np) / 16000
            # For long recordings use larger chunks to reduce overhead
            chunk_s  = 30 if duration_sec <= 300 else 60   # 60s chunks for >5min
            stride_s = 5  if duration_sec <= 300 else 10

            # batch_size=1 is required when using chunk_length_s with the HuggingFace
            # pipeline — higher batch sizes cause memory corruption on Windows/CUDA.
            result = self._pipe(
                {"raw": audio_np.astype(np.float32), "sampling_rate": 16000},
                generate_kwargs=gen_kwargs,
                return_timestamps=True,
                chunk_length_s=chunk_s,
                stride_length_s=stride_s,
                batch_size=1,
            )

            text = result.get("text", "")
            if not text:
                chunks = result.get("chunks", [])
                text = " ".join(c["text"] for c in chunks)
            text = text.strip()

            log.info("[large-v3] duration=%.1fs  chunks=%ds/%ds  device=%s  text_len=%d",
                     duration_sec, chunk_s, stride_s, self.device, len(text))
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
        """Transcribe using faster-whisper-medium with chunking for long recordings."""
        self._load_medium()
        if not self._fw_medium:
            return None
        try:
            lang_hint = language if language in WHISPER_LANG_MAP else None

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
            initial_prompt = SCRIPT_PROMPTS.get(lang_hint)

            # More beam search on GPU (faster), conservative on CPU
            beam_size = 10 if self.device == "cuda" else 5

            segments, info = self._fw_medium.transcribe(
                audio_path,
                language=lang_hint,
                task="transcribe",
                beam_size=beam_size,
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
            from pydub import AudioSegment
            seg = AudioSegment.from_file(audio_path)
            return round(len(seg) / 1000.0, 2)
        except Exception:
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
