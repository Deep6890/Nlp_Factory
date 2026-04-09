"""
insightsEngine/pipeline.py
============================
Produces a FIXED 15-key insights JSON — structure never changes.

Fixed output keys (always present, never added/removed):
  1.  finance_detected
  2.  source_language
  3.  original_text
  4.  english_text
  5.  sentiment_label
  6.  sentiment_score
  7.  intent
  8.  domain
  9.  summary
  10. emotion
  11. urgency
  12. risk_level
  13. amount
  14. entities
  15. keywords
"""

from __future__ import annotations
import logging
import time
from typing import Optional

from finance_detector import is_finance_related
from local_nlp import extract_local_entities, extract_keywords
from sentiment_engine import get_sentiment
from llm_extractor import extract_advanced_insights

logger = logging.getLogger(__name__)

# The canonical 15-key schema — order and keys are FIXED
_SCHEMA_DEFAULTS: dict = {
    "finance_detected": False,
    "source_language":  "unknown",
    "original_text":    "",
    "english_text":     "",
    "sentiment_label":  "neutral",
    "sentiment_score":  0.0,
    "intent":           "unknown",
    "domain":           "general",
    "summary":          "",
    "emotion":          "neutral",
    "urgency":          "low",
    "risk_level":       "low",
    "amount":           None,
    "entities":         [],
    "keywords":         [],
}


def _build_output(**overrides) -> dict:
    """Return a fresh copy of the schema with overrides applied. Keys are always fixed."""
    result = dict(_SCHEMA_DEFAULTS)
    for k, v in overrides.items():
        if k in result:
            result[k] = v
    return result


def process_text_pipeline(
    text: str,
    source_lang: str = "en",
    original_text: str | None = None,
    skip_finance_filter: bool = False,
) -> dict:
    """
    Process (English) text and return a FIXED 15-key insights dict.

    Always returns a dict — never returns None.
    If not finance-related, finance_detected=False and analysis fields are defaults.
    """
    if not text or not isinstance(text, str) or not text.strip():
        return _build_output(source_language=source_lang, original_text=original_text or "")

    text = text.strip()

    # Finance filter — still run full analysis even if not finance
    is_finance = skip_finance_filter or is_finance_related(text)

    # Always run sentiment, NLP and LLM — finance flag just labels the result
    # Sentiment
    sentiment = get_sentiment(text)
    sent_label = sentiment.get("label", "neutral")
    sent_score = sentiment.get("score", 0.0)

    # Local NLP
    entities = extract_local_entities(text)
    keywords = extract_keywords(text)

    # LLM deep extraction — always run
    advanced = extract_advanced_insights(text, lang=source_lang)

    return _build_output(
        finance_detected=is_finance,
        source_language=source_lang,
        original_text=original_text or text,
        english_text=text,
        sentiment_label=sent_label,
        sentiment_score=sent_score,
        intent=advanced.get("intent", "unknown"),
        domain=advanced.get("domain", "general"),
        summary=advanced.get("summary", ""),
        emotion=advanced.get("emotion", "neutral"),
        urgency=advanced.get("urgency", "low"),
        risk_level=advanced.get("risk_level", "low"),
        amount=advanced.get("amount"),
        entities=entities,
        keywords=keywords,
    )
