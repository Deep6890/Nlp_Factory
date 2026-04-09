"""
SpeechToText/audio_pipeline.py
================================
Full pipeline: Audio → STT → Translation → Insights JSON

Two STT modes:
  fast  — Sarvam AI cloud API (~3s, 1/day limit, needs internet)
  slow  — Local Whisper models (~1-5min, unlimited, fully offline)

Both modes produce the same 25-key output JSON.
"""

from __future__ import annotations

import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

os.environ["TRANSFORMERS_OFFLINE"]            = "1"
os.environ["HF_DATASETS_OFFLINE"]             = "1"
os.environ["HF_HUB_OFFLINE"]                  = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

_THIS = Path(__file__).parent
_ROOT = _THIS.parent

for _p in [str(_THIS), str(_ROOT / "insightsEngine"), str(_ROOT / "LangtextToEng")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s",
                    datefmt="%H:%M:%S")
log = logging.getLogger(__name__)


# ── STT ───────────────────────────────────────────────────────────────────────

def _stt_fast(audio_path: str, language: Optional[str]) -> dict:
    """Sarvam AI cloud STT — fast, 1/day limit."""
    from sarvam_stt import SarvamSTT, DailyLimitExceeded
    stt = SarvamSTT()
    try:
        return stt.transcribe(audio_path, language=language, check_limit=True)
    except DailyLimitExceeded as e:
        log.warning("[STT-FAST] Daily limit hit — falling back to slow. %s", e)
        result = _stt_slow(audio_path, language)
        result["fallback_reason"] = str(e)
        return result


def _stt_slow(audio_path: str, language: Optional[str]) -> dict:
    """Local Whisper — unlimited, offline."""
    from indic_stt import get_stt
    stt = get_stt()
    result = stt.transcribe(audio_path, language=language)
    try:
        stt._free_stt_ram()
    except Exception:
        pass
    return result


# ── Translation ───────────────────────────────────────────────────────────────

def _translate(text: str, src_lang: str) -> tuple[str, bool]:
    """Returns (english_text, translation_applied)."""
    if not text.strip():
        return text, False
    if src_lang.lower() in {"en", "english", "eng"}:
        return text, False
    try:
        from translation_pipeline import translate, free_ram as free_translation_ram
        translated = translate(text, src_lang=src_lang)
        free_translation_ram()
        if translated and translated != text:
            return translated, True
    except Exception as e:
        log.warning("[Translation] Failed (%s): %s", src_lang, e)
    return text, False


# ── Insights ──────────────────────────────────────────────────────────────────

def _insights(english_text: str, source_lang: str, original_text: str) -> dict:
    try:
        from pipeline import process_text_pipeline
        return process_text_pipeline(
            text=english_text,
            source_lang=source_lang,
            original_text=original_text,
            skip_finance_filter=False,
        )
    except Exception as e:
        log.error("[Insights] Failed: %s", e)
        return {
            "finance_detected": False, "source_language": source_lang,
            "original_text": original_text, "english_text": english_text,
            "sentiment_label": "neutral", "sentiment_score": 0.0,
            "intent": "unknown", "domain": "general", "summary": "",
            "emotion": "neutral", "urgency": "low", "risk_level": "low",
            "amount": None, "entities": [], "keywords": [],
        }


# ── Main ──────────────────────────────────────────────────────────────────────

def process_audio(
    audio_path: str,
    language:   Optional[str] = None,
    mode:       str = "slow",
) -> dict:
    """
    Full audio-to-insights pipeline.

    Args:
        audio_path : local file path (.wav/.mp3/.flac/.m4a/.webm)
        language   : BCP-47 hint e.g. 'hi','ta','en' or None for auto
        mode       : 'fast' (Sarvam, 1/day) or 'slow' (local Whisper, unlimited)

    Returns 25-key dict — same schema regardless of mode.
    """
    t0 = time.perf_counter()
    log.info("[Pipeline] mode=%s  file=%s  lang=%s", mode, Path(audio_path).name, language or "auto")

    # Stage 1 — STT
    stt_r = _stt_fast(audio_path, language) if mode == "fast" else _stt_slow(audio_path, language)

    raw_text  = stt_r.get("text", "")
    lang_code = stt_r.get("language", language or "unknown")
    log.info("[STT] model=%s  lang=%s  conf=%.2f  text=%r",
             stt_r.get("stt_model_used"), lang_code,
             stt_r.get("confidence", 0.0), raw_text[:80])

    # Stage 2 — Translation
    english_text, translation_applied = _translate(raw_text, lang_code)
    if translation_applied:
        log.info("[Translation] %s → en  %r", lang_code, english_text[:80])

    # Stage 3 — Insights
    ins = _insights(english_text or raw_text, lang_code, raw_text) if raw_text.strip() else {
        "finance_detected": False, "sentiment_label": "neutral", "sentiment_score": 0.0,
        "intent": "unknown", "domain": "general", "summary": "", "emotion": "neutral",
        "urgency": "low", "risk_level": "low", "amount": None, "entities": [], "keywords": [],
    }

    return {
        # STT
        "original_transcript": raw_text,
        "detected_language":   lang_code,
        "language_name":       stt_r.get("language_name", lang_code),
        "stt_confidence":      stt_r.get("confidence", 0.0),
        "stt_model_used":      stt_r.get("stt_model_used", "unknown"),
        "audio_duration_sec":  stt_r.get("audio_duration_sec", 0.0),
        "stt_error":           stt_r.get("stt_error"),
        # Translation
        "english_text":        english_text,
        "translation_applied": translation_applied,
        # Insights
        "finance_detected":    ins.get("finance_detected", False),
        "sentiment_label":     ins.get("sentiment_label", "neutral"),
        "sentiment_score":     ins.get("sentiment_score", 0.0),
        "intent":              ins.get("intent", "unknown"),
        "domain":              ins.get("domain", "general"),
        "summary":             ins.get("summary", ""),
        "emotion":             ins.get("emotion", "neutral"),
        "urgency":             ins.get("urgency", "low"),
        "risk_level":          ins.get("risk_level", "low"),
        "amount":              ins.get("amount"),
        "entities":            ins.get("entities", []),
        "keywords":            ins.get("keywords", []),
        # Meta
        "mode":                stt_r.get("fallback_reason") and "slow_fallback" or mode,
        "fallback_reason":     stt_r.get("fallback_reason"),
        "pipeline_version":    "3.1-sarvam+ai4bharat",
        "processed_at":        datetime.now().isoformat(timespec="seconds"),
        "total_time_sec":      round(time.perf_counter() - t0, 2),
    }
