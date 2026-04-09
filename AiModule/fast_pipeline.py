"""
fast_pipeline.py
================
FAST pipeline using Sarvam AI speech-to-text (Indian languages, cloud).
~5-10 seconds vs 2-5 minutes for local whisper.

Sarvam API: https://www.sarvam.ai/apis/speech-to-text
Supports: hi, bn, gu, kn, ml, mr, od, pa, ta, te, en

Usage:
    python fast_pipeline.py <audio_path_or_url> [language]

Requires: SARVAM_API_KEY in .env
Per-day limit enforced by caller (Node.js backend).
"""

from __future__ import annotations

import json
import logging
import os
import sys
import tempfile
import urllib.request
import urllib.parse
import http.client
from pathlib import Path
from datetime import datetime
import time

if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger(__name__)

_ROOT = Path(__file__).parent.resolve()
for _p in [str(_ROOT / "insightsEngine"), str(_ROOT / "LangtextToEng")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

from dotenv import load_dotenv
load_dotenv(_ROOT / ".." / ".env", override=False)

# Sarvam language code mapping
SARVAM_LANG = {
    "hi": "hi-IN", "bn": "bn-IN", "gu": "gu-IN", "kn": "kn-IN",
    "ml": "ml-IN", "mr": "mr-IN", "od": "od-IN", "pa": "pa-IN",
    "ta": "ta-IN", "te": "te-IN", "en": "en-IN",
    # fallbacks
    "hindi": "hi-IN", "bengali": "bn-IN", "gujarati": "gu-IN",
    "kannada": "kn-IN", "malayalam": "ml-IN", "marathi": "mr-IN",
    "punjabi": "pa-IN", "tamil": "ta-IN", "telugu": "te-IN",
}


def _download(url: str) -> str:
    ext = Path(url.split("?")[0]).suffix or ".webm"
    if ext not in {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".webm", ".aac", ".mp4"}:
        ext = ".webm"
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    log.info("Downloading audio from %s", url[:80])
    urllib.request.urlretrieve(url, tmp.name)
    log.info("Downloaded %d bytes to %s", os.path.getsize(tmp.name), tmp.name)
    return tmp.name


def _transcribe_sarvam(audio_path: str, language: str = "hi") -> dict:
    """
    Transcribe using Sarvam AI speech-to-text API.
    Returns STT result dict.
    """
    import requests

    api_key  = os.environ.get("SARVAM_API_KEY", "").strip()
    lang_code = SARVAM_LANG.get(language.lower(), "hi-IN")

    log.info("[FAST-SARVAM] Transcribing with lang=%s (%s)", language, lang_code)

    url = "https://api.sarvam.ai/speech-to-text"

    with open(audio_path, "rb") as f:
        audio_bytes = f.read()

    # Sarvam expects multipart/form-data
    files = {
        "file": (Path(audio_path).name, audio_bytes, "audio/webm"),
    }
    data = {
        "language_code": lang_code,
        "model":         "saarika:v2",   # Sarvam's latest multilingual model
        "with_timestamps": "false",
    }
    headers = {
        "api-subscription-key": api_key,
    }

    resp = requests.post(url, files=files, data=data, headers=headers, timeout=60)

    if resp.status_code != 200:
        raise RuntimeError(f"Sarvam API error {resp.status_code}: {resp.text[:200]}")

    result = resp.json()
    transcript = result.get("transcript", "")
    log.info("[FAST-SARVAM] Done. text=%s", transcript[:80])

    return {
        "text":             transcript,
        "language":         language,
        "language_name":    lang_code,
        "confidence":       0.92,
        "stt_model_used":   "sarvam/saarika:v2",
        "audio_duration_sec": result.get("duration", 0.0),
        "stt_error":        None,
    }


def _translate(text: str, src_lang: str) -> str:
    if src_lang in ("en", "english", "eng", "en-IN"):
        return text
    try:
        from translation_pipeline import translate, free_ram
        result = translate(text, src_lang=src_lang.split("-")[0])
        free_ram()
        return result or text
    except Exception as e:
        log.warning("Translation failed: %s", e)
        return text


def _insights(english_text: str, source_lang: str, original_text: str) -> dict:
    try:
        from pipeline import process_text_pipeline
        return process_text_pipeline(
            text=english_text,
            source_lang=source_lang.split("-")[0],
            original_text=original_text,
        )
    except Exception as e:
        log.error("Insights failed: %s", e)
        return {}


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python fast_pipeline.py <path_or_url> [language]"}))
        sys.exit(1)

    source   = sys.argv[1]
    language = sys.argv[2] if len(sys.argv) > 2 else "hi"
    tmp_path = None
    t_start  = time.perf_counter()

    try:
        # Download if URL
        if source.startswith("http://") or source.startswith("https://"):
            tmp_path   = _download(source)
            audio_path = tmp_path
        else:
            audio_path = source
            if not os.path.exists(audio_path):
                print(json.dumps({"error": f"File not found: {audio_path}"}))
                sys.exit(1)

        # STT via Sarvam
        stt = _transcribe_sarvam(audio_path, language)

        # Translate to English
        english_text        = _translate(stt["text"], stt["language"])
        translation_applied = english_text != stt["text"]

        # Insights (LLM + NLP)
        log.info("[FAST] Running insights engine...")
        ins = _insights(english_text, stt["language"], stt["text"])

        total_time = round(time.perf_counter() - t_start, 2)
        log.info("[FAST] Total time: %.2fs", total_time)

        result = {
            "original_transcript":  stt["text"],
            "detected_language":    stt["language"],
            "language_name":        stt["language_name"],
            "stt_confidence":       stt["confidence"],
            "stt_model_used":       stt["stt_model_used"],
            "audio_duration_sec":   stt["audio_duration_sec"],
            "stt_error":            stt["stt_error"],
            "english_text":         english_text,
            "translation_applied":  translation_applied,
            "finance_detected":     ins.get("finance_detected", False),
            "sentiment_label":      ins.get("sentiment_label", "neutral"),
            "sentiment_score":      ins.get("sentiment_score", 0.0),
            "intent":               ins.get("intent", "unknown"),
            "domain":               ins.get("domain", "general"),
            "summary":              ins.get("summary", ""),
            "emotion":              ins.get("emotion", "neutral"),
            "urgency":              ins.get("urgency", "low"),
            "risk_level":           ins.get("risk_level", "low"),
            "amount":               ins.get("amount"),
            "entities":             ins.get("entities", []),
            "keywords":             ins.get("keywords", []),
            "pipeline_version":     "4.0-fast-sarvam",
            "processed_at":         datetime.now().isoformat(timespec="seconds"),
            "total_time_sec":       total_time,
        }

        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        log.error("Fast pipeline failed: %s", e)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
