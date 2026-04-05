"""
insightsEngine/local_nlp.py
============================
Local NLP extraction using spaCy.

Provides:
  - Entity extraction   (spaCy en_core_web_sm / en_core_web_lg)
  - Keyword extraction  (noun/propn/verb filtering)
  - Language detection  (thin wrapper over langdetect)

NOTE: Sentiment is now in sentiment_engine.py (multilingual).
"""

from __future__ import annotations
import logging
import re
from typing import Optional

logger = logging.getLogger(__name__)

# -- spaCy model loading (lazy, cached) ----------------------------------------
_nlp = None


def _get_nlp():
    global _nlp
    if _nlp is None:
        # Try large model first (better NER), fall back to small
        for model in ("en_core_web_lg", "en_core_web_sm"):
            try:
                import spacy
                _nlp = spacy.load(model)
                logger.info("spaCy model loaded: %s", model)
                break
            except ImportError:
                logger.warning("spaCy not installed. Run: pip install spacy && python -m spacy download en_core_web_sm")
                break  # Don't retry — spaCy itself is missing
            except OSError:
                continue  # Model not found, try next
        if _nlp is None:
            logger.debug("spaCy unavailable — using fallback entity/keyword extraction.")
    return _nlp


# -- Language detection --------------------------------------------------------
def detect_language(text: str) -> str:
    """Detect language code using langdetect."""
    try:
        from langdetect import detect
        return detect(text)
    except Exception:
        return "unknown"


# -- Entity extraction ---------------------------------------------------------
# Entity types we care about (financial context)
_USEFUL_ENTITY_TYPES = {
    "PERSON", "ORG", "GPE", "MONEY", "PERCENT", "DATE", "TIME",
    "CARDINAL", "ORDINAL", "QUANTITY", "PRODUCT", "WORK_OF_ART",
}


def extract_local_entities(text: str) -> list[dict]:
    """
    Extract named entities using spaCy.

    Returns list of:
        {"text": "...", "type": "PERSON|ORG|MONEY|...", "start": int, "end": int}
    """
    nlp = _get_nlp()
    if nlp is None:
        return _regex_entity_fallback(text)

    try:
        doc = nlp(text[:1000])  # limit for speed
        seen = set()
        entities = []
        for ent in doc.ents:
            if ent.label_ not in _USEFUL_ENTITY_TYPES:
                continue
            key = (ent.text.strip().lower(), ent.label_)
            if key in seen:
                continue
            seen.add(key)
            entities.append({
                "text": ent.text.strip(),
                "type": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
            })
        return entities
    except Exception as e:
        logger.warning("spaCy entity extraction failed: %s", e)
        return _regex_entity_fallback(text)


def _regex_entity_fallback(text: str) -> list[dict]:
    """Fallback entity extraction when spaCy is unavailable."""
    entities = []
    # Currency amounts
    for m in re.finditer(r"[\u20B9$£€]\s*\d[\d,]*|\d[\d,]*\s*(?:rs|rupees|dollars?)", text, re.I):
        entities.append({"text": m.group().strip(), "type": "MONEY", "start": m.start(), "end": m.end()})
    # Dates
    for m in re.finditer(r"\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\b(?:today|tomorrow|yesterday)\b", text, re.I):
        entities.append({"text": m.group().strip(), "type": "DATE", "start": m.start(), "end": m.end()})
    # Percentages
    for m in re.finditer(r"\d+\.?\d*\s*%", text):
        entities.append({"text": m.group().strip(), "type": "PERCENT", "start": m.start(), "end": m.end()})
    return entities


# -- Keyword extraction --------------------------------------------------------
_STOP_VERBS = {"is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
               "do", "does", "did", "will", "would", "could", "should", "may", "might"}


def extract_keywords(text: str) -> list[str]:
    """
    Extract meaningful keywords (nouns, proper nouns, important verbs).
    Falls back to simple word frequency if spaCy is unavailable.
    """
    nlp = _get_nlp()
    if nlp is None:
        return _simple_keyword_fallback(text)

    try:
        doc = nlp(text[:1000])
        keywords = set()
        for token in doc:
            if (
                token.is_alpha
                and not token.is_stop
                and token.pos_ in {"NOUN", "PROPN", "VERB"}
                and len(token.lemma_) > 2
                and token.lemma_.lower() not in _STOP_VERBS
            ):
                keywords.add(token.lemma_.lower())
        return sorted(keywords)
    except Exception as e:
        logger.warning("spaCy keyword extraction failed: %s", e)
        return _simple_keyword_fallback(text)


def _simple_keyword_fallback(text: str) -> list[str]:
    """Simple word frequency-based keyword extraction."""
    _common = {"the", "a", "an", "is", "are", "was", "were", "i", "you", "he", "she",
               "we", "they", "to", "of", "in", "for", "on", "and", "or", "but", "it"}
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    return sorted(set(w for w in words if w not in _common))
