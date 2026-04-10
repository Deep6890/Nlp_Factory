"""
SpeechToText/sarvam_stt.py
===========================
Sarvam AI fast STT — cloud API, ~2-5 seconds per recording.
Supports all 11 Indian languages + English.

Daily limit: 1 fast transcription per user per day.
Tracked in: AiModule/.sarvam_usage.json  { "YYYY-MM-DD": count }

Usage:
    from sarvam_stt import SarvamSTT, DailyLimitExceeded
    stt = SarvamSTT()
    result = stt.transcribe("audio.wav", language="hi")
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import date
from pathlib import Path
from typing import Optional

log = logging.getLogger(__name__)

# ── Config ────────────────────────────────────────────────────────────────────
_API_KEY      = os.environ.get("SARVAM_API_KEY", "sk_534odh01_Dcn2V1bnRbzgpbpYkFjsOKp7")
_API_URL      = "https://api.sarvam.ai/speech-to-text"
_DAILY_LIMIT  = int(os.environ.get("SARVAM_DAILY_LIMIT", "5"))
_USAGE_FILE   = Path(__file__).parent.parent / ".sarvam_usage.json"

# Sarvam language codes
_LANG_MAP = {
    "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN", "bn": "bn-IN",
    "kn": "kn-IN", "ml": "ml-IN", "gu": "gu-IN", "pa": "pa-IN",
    "mr": "mr-IN", "ur": "ur-IN", "or": "od-IN", "en": "en-IN",
    "hi-IN": "hi-IN", "ta-IN": "ta-IN", "te-IN": "te-IN",
}

_LANG_NAMES = {
    "hi-IN": "Hindi",   "ta-IN": "Tamil",     "te-IN": "Telugu",
    "bn-IN": "Bengali", "kn-IN": "Kannada",   "ml-IN": "Malayalam",
    "gu-IN": "Gujarati","pa-IN": "Punjabi",   "mr-IN": "Marathi",
    "ur-IN": "Urdu",    "od-IN": "Odia",      "en-IN": "English",
}


class DailyLimitExceeded(Exception):
    """Raised when the daily fast-transcription quota is exhausted."""
    pass


class SarvamSTT:
    """Sarvam AI cloud STT — fast, accurate, supports 11 Indian languages."""

    def __init__(self):
        self._api_key = _API_KEY

    # ── Daily usage tracking ──────────────────────────────────────────────────

    def _load_usage(self) -> dict:
        try:
            if _USAGE_FILE.exists():
                return json.loads(_USAGE_FILE.read_text())
        except Exception:
            pass
        return {}

    def _save_usage(self, usage: dict):
        try:
            _USAGE_FILE.write_text(json.dumps(usage))
        except Exception as e:
            log.warning("Could not save usage file: %s", e)

    def get_today_count(self) -> int:
        today = str(date.today())
        return self._load_usage().get(today, 0)

    def can_use_today(self) -> bool:
        return self.get_today_count() < _DAILY_LIMIT

    def _increment_usage(self):
        today = str(date.today())
        usage = self._load_usage()
        usage[today] = usage.get(today, 0) + 1
        # Keep only last 7 days
        keys = sorted(usage.keys())
        if len(keys) > 7:
            for old in keys[:-7]:
                del usage[old]
        self._save_usage(usage)

    # ── Transcription ─────────────────────────────────────────────────────────

    def transcribe(
        self,
        audio_path: str,
        language: Optional[str] = None,
        check_limit: bool = True,
    ) -> dict:
        """
        Transcribe audio using Sarvam AI API.

        Args:
            audio_path   : path to audio file (wav/mp3/m4a/ogg/flac)
            language     : BCP-47 code e.g. 'hi', 'ta', 'en' (None = auto hi-IN)
            check_limit  : if True, raises DailyLimitExceeded when quota hit

        Returns:
            dict with keys: text, language, language_name, confidence,
                            stt_model_used, stt_error, audio_duration_sec
        """
        import requests

        audio_path = str(Path(audio_path).absolute())

        if not os.path.exists(audio_path):
            return self._error(f"File not found: {audio_path}", language, audio_path)

        # Daily limit check
        if check_limit and not self.can_use_today():
            raise DailyLimitExceeded(
                f"Daily fast transcription limit ({_DAILY_LIMIT}/day) reached. "
                "Use slow mode or try again tomorrow."
            )

        # Map language code — None means auto-detect (don't send language_code to Sarvam)
        lang_code = _LANG_MAP.get(language, None) if language else None
        headers   = {"api-subscription-key": self._api_key}

        log.info("[Sarvam] Transcribing %s  lang=%s", Path(audio_path).name, lang_code or "auto-detect")
        t0 = time.perf_counter()

        try:
            text, detected = self._transcribe_chunked(audio_path, lang_code, headers)
            elapsed = round(time.perf_counter() - t0, 2)

            log.info("[Sarvam] Done in %.2fs  text=%r", elapsed, text[:80])

            # Increment usage only on success
            self._increment_usage()

            return {
                "text":               text,
                "language":           detected.split("-")[0] if "-" in detected else detected,
                "language_name":      _LANG_NAMES.get(detected, detected),
                "confidence":         0.92,   # Sarvam doesn't return confidence
                "stt_model_used":     "sarvam/saarika:v2.5",
                "stt_error":          None,
                "audio_duration_sec": self._duration(audio_path),
            }

        except DailyLimitExceeded:
            raise
        except Exception as e:
            log.error("[Sarvam] Request failed: %s", e)
            return self._error(str(e), language, audio_path)

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _ensure_max_30s(self, audio_path: str) -> str:
        """
        DEPRECATED — replaced by _transcribe_chunked.
        Kept as no-op to avoid breaking callers.
        """
        return audio_path

    def _transcribe_chunked(
        self,
        audio_path: str,
        lang_code: Optional[str],
        headers: dict,
    ) -> tuple:
        """
        Split audio into 30s chunks, transcribe each via Sarvam, join results.
        Returns (full_text, detected_language_code).
        """
        import requests
        from pydub import AudioSegment

        seg = AudioSegment.from_file(audio_path)
        duration_ms = len(seg)
        chunk_ms    = 30_000  # 30 seconds

        if duration_ms <= chunk_ms:
            # Single chunk — send as-is
            text, detected = self._call_sarvam_api(audio_path, lang_code, headers)
            return text, detected

        log.info("[Sarvam] Audio %.1fs — splitting into 30s chunks", duration_ms / 1000)
        texts    = []
        detected = lang_code or "unknown"
        chunk_idx = 0
        for start in range(0, duration_ms, chunk_ms):
            chunk = seg[start:start + chunk_ms]
            tmp_wav = audio_path.rsplit('.', 1)[0] + f'_chunk{chunk_idx}.wav'
            chunk.export(tmp_wav, format='wav')
            log.info("[Sarvam] Chunk %d: %.1f–%.1fs", chunk_idx, start/1000, min((start+chunk_ms)/1000, duration_ms/1000))
            try:
                text, chunk_detected = self._call_sarvam_api(tmp_wav, lang_code, headers)
                if text:
                    texts.append(text.strip())
                # Use first successfully detected language
                if chunk_detected and chunk_detected != "unknown" and detected == "unknown":
                    detected = chunk_detected
            except Exception as e:
                log.warning("[Sarvam] Chunk %d failed: %s", chunk_idx, e)
            finally:
                try:
                    import os as _os
                    _os.unlink(tmp_wav)
                except Exception:
                    pass
            chunk_idx += 1

        return ' '.join(texts), detected

    def _call_sarvam_api(self, audio_path: str, lang_code: Optional[str], headers: dict) -> tuple:
        """Send a single ≤30s audio file to Sarvam. Returns (text, detected_language_code)."""
        import requests
        data = {"model": "saarika:v2.5"}
        if lang_code:
            data["language_code"] = lang_code
        with open(audio_path, "rb") as f:
            files = {"file": (Path(audio_path).name, f, self._mime(audio_path))}
            resp  = requests.post(_API_URL, headers=headers, files=files, data=data, timeout=60)
        if resp.status_code != 200:
            err_body = resp.text[:300]
            try:
                err_body = resp.json().get("detail", err_body)
            except Exception:
                pass
            raise RuntimeError(f"Sarvam API {resp.status_code}: {err_body}")
        body     = resp.json()
        text     = body.get("transcript", "").strip()
        detected = body.get("language_code", lang_code or "unknown")
        return text, detected

    def _mime(self, path: str) -> str:
        ext = Path(path).suffix.lower()
        return {
            ".wav": "audio/wav", ".mp3": "audio/mpeg",
            ".m4a": "audio/mp4", ".ogg": "audio/ogg",
            ".flac": "audio/flac", ".webm": "audio/webm",
            ".aac": "audio/aac",
        }.get(ext, "audio/wav")

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

    def _error(self, msg: str, language: Optional[str], audio_path: str) -> dict:
        return {
            "text":               "",
            "language":           language or "unknown",
            "language_name":      _LANG_NAMES.get(_LANG_MAP.get(language or "", ""), "Unknown"),
            "confidence":         0.0,
            "stt_model_used":     "sarvam/saarika:v2.5",
            "stt_error":          msg,
            "audio_duration_sec": self._duration(audio_path),
        }
