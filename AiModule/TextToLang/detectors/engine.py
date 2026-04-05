"""
Detection Engine – fastText + CLD3 hybrid decision.

Both detectors always run. Decision logic:
  - agreement  → both agree, average confidence
  - fasttext   → disagreement, trust fastText
  - unknown    → confidence below threshold

Usage:
    from detectors import detect_language

    result = detect_language("नमस्ते आप कैसे हैं")
    print(result)
"""

import logging
from dataclasses import dataclass
from typing import Optional

from detectors.base import DetectionResult
from detectors.cld3_detector import CLD3Detector
from detectors.fasttext_detector import FastTextDetector

logger = logging.getLogger(__name__)

MIN_CONFIDENCE = 0.70

_cld3: Optional[CLD3Detector] = None
_fasttext: Optional[FastTextDetector] = None


def _get_cld3() -> CLD3Detector:
    global _cld3
    if _cld3 is None:
        _cld3 = CLD3Detector()
    return _cld3


def _get_fasttext() -> FastTextDetector:
    global _fasttext
    if _fasttext is None:
        _fasttext = FastTextDetector()
    return _fasttext


@dataclass
class HybridResult:
    text: str
    fasttext: tuple        # (lang, confidence)
    cld3: tuple            # (lang, confidence)
    final_language: str
    confidence: float
    decision: str          # 'agreement' | 'fasttext' | 'unknown'

    def __repr__(self):
        return (
            f"HybridResult(lang={self.final_language!r}, "
            f"conf={self.confidence:.4f}, decision={self.decision!r})"
        )


def detect_language(
    text: str,
    *,
    min_confidence: float = MIN_CONFIDENCE,
) -> Optional[HybridResult]:
    """
    Hybrid fastText + CLD3 language detection.

    Both models always run. Decision:
      - Both agree      → average confidence, decision='agreement'
      - Disagree        → trust fastText, decision='fasttext'
      - Low confidence  → decision='unknown'
      - Too short (<3)  → returns None
    """
    if not text or not text.strip():
        return None
    if len(text.strip()) < 3:
        return HybridResult(
            text=text,
            fasttext=(None, 0.0),
            cld3=(None, 0.0),
            final_language="unknown",
            confidence=0.0,
            decision="unknown",
        )

    ft_result = _get_fasttext().detect(text)
    cld3_result = _get_cld3().detect(text)

    ft_lang = ft_result.language if ft_result else None
    ft_conf = ft_result.confidence if ft_result else 0.0
    cld3_lang = cld3_result.language if cld3_result else None
    cld3_conf = cld3_result.confidence if cld3_result else 0.0

    # Decision logic
    if ft_lang and cld3_lang and ft_lang == cld3_lang:
        final_lang = ft_lang
        confidence = round((ft_conf + cld3_conf) / 2, 4)
        decision = "agreement"
    elif ft_lang:
        final_lang = ft_lang
        confidence = round(ft_conf, 4)
        decision = "fasttext"
    elif cld3_lang:
        final_lang = cld3_lang
        confidence = round(cld3_conf, 4)
        decision = "cld3"
    else:
        return None

    if confidence < min_confidence:
        decision = "unknown"

    logger.debug(
        "ft=%s@%.4f cld3=%s@%.4f → %s@%.4f [%s]",
        ft_lang, ft_conf, cld3_lang, cld3_conf, final_lang, confidence, decision,
    )

    return HybridResult(
        text=text,
        fasttext=(ft_lang, ft_conf),
        cld3=(cld3_lang, cld3_conf),
        final_language=final_lang,
        confidence=confidence,
        decision=decision,
    )


def detect_language_batch(
    texts: list[str],
    *,
    min_confidence: float = MIN_CONFIDENCE,
) -> list[Optional[HybridResult]]:
    """Batch hybrid language detection."""
    return [detect_language(t, min_confidence=min_confidence) for t in texts]
