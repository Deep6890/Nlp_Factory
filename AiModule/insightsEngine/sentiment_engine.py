"""
insightsEngine/sentiment_engine.py
====================================
Multilingual sentiment analysis engine.

Strategy (priority order):
  1. transformers pipeline with multilingual-sentiment model  
     (lxyuan/distilbert-base-multilingual-cased-sentiments-student)
     Supports English + major Indian languages.
  2. TextBlob (English fallback)
  3. Keyword-based (last resort)

Returns:
    {
        "label": "positive" | "negative" | "neutral",
        "score": float [-1.0, 1.0],
        "confidence": float [0.0, 1.0],
        "model_used": str
    }
"""

from __future__ import annotations
import logging
import re

logger = logging.getLogger(__name__)

# ── Model caching ─────────────────────────────────────────────────────────────
_sentiment_pipe = None

MULTILINGUAL_SENTIMENT_MODEL = "lxyuan/distilbert-base-multilingual-cased-sentiments-student"


def _get_sentiment_pipe():
    global _sentiment_pipe
    if _sentiment_pipe is None:
        try:
            import psutil
            free_ram_gb = psutil.virtual_memory().available / (1024 ** 3)
            # distilbert multilingual needs ~1.5GB RAM + virtual memory headroom
            # On Windows, paging file limits can cause OSError 1455 even with apparent free RAM
            if free_ram_gb < 3.0:
                logger.warning(
                    "Only %.1fGB RAM free — skipping transformer sentiment model "
                    "(need ~3GB headroom on Windows). Using keyword fallback.", free_ram_gb
                )
                _sentiment_pipe = False
                return None
            from transformers import pipeline
            device = 0 if __import__("torch").cuda.is_available() else -1
            _sentiment_pipe = pipeline(
                "text-classification",
                model=MULTILINGUAL_SENTIMENT_MODEL,
                device=device,
                top_k=None,
                truncation=True,
                max_length=512,
            )
            logger.info("Multilingual sentiment model loaded: %s", MULTILINGUAL_SENTIMENT_MODEL)
        except OSError as e:
            if "1455" in str(e) or "paging file" in str(e).lower():
                logger.warning(
                    "Sentiment model skipped: Windows paging file too small. "
                    "Increase virtual memory in System > Advanced > Performance Settings."
                )
            else:
                logger.warning("Could not load multilingual sentiment model: %s", e)
            _sentiment_pipe = False
        except Exception as e:
            logger.warning("Could not load multilingual sentiment model: %s", e)
            _sentiment_pipe = False
    return _sentiment_pipe if _sentiment_pipe else None


# ── Label normalization ───────────────────────────────────────────────────────
_LABEL_NORM = {
    "positive": "positive",
    "negative": "negative",
    "neutral": "neutral",
    "POSITIVE": "positive",
    "NEGATIVE": "negative",
    "NEUTRAL": "neutral",
    "LABEL_0": "negative",
    "LABEL_1": "neutral",
    "LABEL_2": "positive",
}


def _transformers_sentiment(text: str) -> dict | None:
    """Run multilingual transformer sentiment. Returns None on failure."""
    pipe = _get_sentiment_pipe()
    if not pipe:
        return None
    try:
        # Truncate to 512 chars for speed while keeping meaning
        results = pipe(text[:512])
        if not results:
            return None

        # results is a list of [{label: ..., score: ...}]
        label_scores = results[0] if isinstance(results[0], list) else results
        best = max(label_scores, key=lambda x: x["score"])
        label = _LABEL_NORM.get(best["label"], best["label"].lower())
        conf = round(float(best["score"]), 4)

        # Map to [-1, 1] polarity
        polarity_map = {"positive": conf, "negative": -conf, "neutral": 0.0}
        score = round(polarity_map.get(label, 0.0), 4)

        return {
            "label": label,
            "score": score,
            "confidence": conf,
            "model_used": "multilingual_transformers",
        }
    except Exception as e:
        logger.warning("Transformers sentiment failed: %s", e)
        return None


def _textblob_sentiment(text: str) -> dict | None:
    """TextBlob sentiment (English best, limited Indic support)."""
    try:
        from textblob import TextBlob
        score = round(TextBlob(text).sentiment.polarity, 4)
        if score > 0.05:
            label = "positive"
        elif score < -0.05:
            label = "negative"
        else:
            label = "neutral"
        return {
            "label": label,
            "score": score,
            "confidence": round(abs(score), 4),
            "model_used": "textblob",
        }
    except Exception as e:
        logger.warning("TextBlob sentiment failed: %s", e)
        return None


# ── Keyword-based fallback ───────────────────────────────────────────────────
_POSITIVE_WORDS = {
    "great", "good", "excellent", "profit", "gain", "return", "accha", "badhiya",
    "labh", "faida", "growth", "success", "savings", "recovered",
}
_NEGATIVE_WORDS = {
    "loss", "debt", "bad", "problem", "issue", "urgent", "critical",
    "overdue", "defaulted", "poor", "miss", "fail", "nuksan", "ghata",
}


def _keyword_sentiment(text: str) -> dict:
    """Simple keyword-based sentiment (always succeeds)."""
    lower = text.lower()
    pos = sum(1 for w in _POSITIVE_WORDS if w in lower)
    neg = sum(1 for w in _NEGATIVE_WORDS if w in lower)
    if pos > neg:
        return {"label": "positive", "score": 0.3, "confidence": 0.3, "model_used": "keyword"}
    elif neg > pos:
        return {"label": "negative", "score": -0.3, "confidence": 0.3, "model_used": "keyword"}
    return {"label": "neutral", "score": 0.0, "confidence": 0.3, "model_used": "keyword"}


def get_sentiment(text: str) -> dict:
    """
    Get sentiment for any text (English or Indic).

    Tries models in order:
      1. Multilingual Transformers
      2. TextBlob
      3. Keyword fallback
    """
    if not text or not text.strip():
        return {"label": "neutral", "score": 0.0, "confidence": 0.0, "model_used": "none"}

    result = _transformers_sentiment(text)
    if result:
        return result

    result = _textblob_sentiment(text)
    if result:
        return result

    return _keyword_sentiment(text)
