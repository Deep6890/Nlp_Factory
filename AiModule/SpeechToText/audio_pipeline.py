"""
SpeechToText/audio_pipeline.py
================================
Full pipeline: Audio -> AI4Bharat STT -> NLLB Translation -> Insights JSON

Output: 21-key structured JSON covering STT metadata, translation,
        financial intelligence, sentiment, entities, and pipeline diagnostics.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Optional

# Block ALL HuggingFace HTTP calls — use only cached models
os.environ["TRANSFORMERS_OFFLINE"]            = "1"
os.environ["HF_DATASETS_OFFLINE"]             = "1"
os.environ["HF_HUB_OFFLINE"]                  = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

# ── Path setup ────────────────────────────────────────────────────────────────
_THIS  = Path(__file__).parent.resolve()
_ROOT  = _THIS.parent.resolve()

for _p in [str(_THIS), str(_ROOT / "insightsEngine"), str(_ROOT / "LangtextToEng")]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── Lazy imports ──────────────────────────────────────────────────────────────

def _get_stt():
    from indic_stt import get_stt
    return get_stt()

def _translate(text: str, src_lang: str) -> str:
    try:
        from translation_pipeline import translate, free_ram as free_translation_ram
        result = translate(text, src_lang=src_lang)
        free_translation_ram()   # free ~2.5GB RAM before insights engine loads
        return result or text
    except Exception as e:
        log.warning("Translation failed (%s): %s", src_lang, e)
        return text

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
        log.error("Insights engine failed: %s", e)
        return _default_insights(source_lang, original_text, english_text)

def _default_insights(lang: str, original: str, english: str) -> dict:
    return {
        "finance_detected":  False,
        "source_language":   lang,
        "original_text":     original,
        "english_text":      english,
        "sentiment_label":   "neutral",
        "sentiment_score":   0.0,
        "intent":            "unknown",
        "domain":            "general",
        "summary":           "",
        "emotion":           "neutral",
        "urgency":           "low",
        "risk_level":        "low",
        "amount":            None,
        "entities":          [],
        "keywords":          [],
    }

# ── Main pipeline ─────────────────────────────────────────────────────────────

def process_audio(
    audio_path: str,
    language:   Optional[str] = None,
    device:     str = "cpu",
) -> dict:
    """
    Full audio-to-insights pipeline.

    Args:
        audio_path : .wav / .mp3 / .flac file path
        language   : BCP-47 hint ('hi','ta','te','bn','kn','ml','gu','pa','mr','ur')
                     or None for auto-detect
        device     : 'cpu' or 'cuda'

    Returns:
        21-key dict:
          STT keys    : transcript, detected_language, language_name,
                        stt_confidence, stt_model_used, audio_duration_sec, stt_error
          Translation : english_text, translation_applied
          Insights    : finance_detected, sentiment_label, sentiment_score,
                        intent, domain, summary, emotion, urgency,
                        risk_level, amount, entities, keywords
          Meta        : pipeline_version, processed_at, total_time_sec
    """
    t_start = time.perf_counter()

    # ── Stage 1: Speech to Text ───────────────────────────────────────────────
    log.info("[STT] Starting transcription ...")
    stt    = _get_stt()
    stt_r  = stt.transcribe(audio_path, language=language)

    raw_text   = stt_r.get("text", "")
    lang_code  = stt_r.get("language", language or "unknown")
    lang_name  = stt_r.get("language_name", "unknown")
    stt_conf   = stt_r.get("confidence", 0.0)
    stt_model  = stt_r.get("stt_model_used", "none")
    duration   = stt_r.get("audio_duration_sec", 0.0)
    stt_error  = stt_r.get("stt_error")

    log.info("[STT] Done. model=%s lang=%s conf=%.2f text=%r",
             stt_model, lang_code, stt_conf, raw_text[:80])

    # Free STT model RAM before loading NLLB translation (~2.5GB needed)
    try:
        stt._free_stt_ram()
    except Exception:
        pass

    # ── Stage 2: Translate to English ─────────────────────────────────────────
    english_langs      = {"en", "english", "eng"}
    translation_applied = False

    if not raw_text.strip():
        log.warning("[Translation] Skipped — empty transcript.")
        english_text = ""
    elif lang_code.lower() in english_langs:
        log.info("[Translation] Skipped — already English.")
        english_text = raw_text
    else:
        log.info("[Translation] Translating %s -> English ...", lang_code)
        english_text        = _translate(raw_text, lang_code)
        translation_applied = english_text != raw_text
        log.info("[Translation] Done. %r", english_text[:80])

    # ── Stage 3: Insights ─────────────────────────────────────────────────────
    if raw_text.strip():
        log.info("[Insights] Running insights engine ...")
        ins = _insights(english_text or raw_text, lang_code, raw_text)
    else:
        log.warning("[Insights] Skipped — no transcript.")
        ins = _default_insights(lang_code, "", "")

    # ── Assemble final output ─────────────────────────────────────────────────
    total_time = round(time.perf_counter() - t_start, 2)

    return {
        # ── STT ──────────────────────────────────────────────────────────────
        "original_transcript": raw_text,
        "detected_language":   lang_code,
        "language_name":       lang_name,
        "stt_confidence":      stt_conf,
        "stt_model_used":      stt_model,
        "audio_duration_sec":  duration,
        "stt_error":           stt_error,

        # ── Translation ───────────────────────────────────────────────────────
        "english_text":        english_text,
        "translation_applied": translation_applied,

        # ── Financial Insights ────────────────────────────────────────────────
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

        # ── Pipeline Meta ─────────────────────────────────────────────────────
        "pipeline_version":    "3.0-ai4bharat",
        "processed_at":        datetime.now().isoformat(timespec="seconds"),
        "total_time_sec":      total_time,
    }


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python audio_pipeline.py <audio_path> [language]")
        print("       language: hi ta te bn kn ml gu pa mr ur en (default: auto)")
        print("Example: python audio_pipeline.py sample.wav hi")
        sys.exit(1)

    _audio = sys.argv[1]
    _lang  = sys.argv[2] if len(sys.argv) > 2 else None

    log.info("Processing: %s  language=%s", _audio, _lang or "auto")
    result = process_audio(_audio, language=_lang)

    out = json.dumps(result, indent=2, ensure_ascii=False)
    print("\n" + "=" * 60)
    print("  PIPELINE OUTPUT")
    print("=" * 60)
    print(out)
    print("=" * 60)
    print(f"\nDone in {result['total_time_sec']}s")
