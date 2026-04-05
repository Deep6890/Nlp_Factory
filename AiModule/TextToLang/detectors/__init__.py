"""
Language Detection Module
=========================
fastText + CLD3 hybrid language detection.

Usage:
    from detectors import detect_language

    result = detect_language("नमस्ते आप कैसे हैं")
    # HybridResult(lang='hi', conf=0.9650, decision='agreement')
"""

from detectors.engine import detect_language, detect_language_batch, HybridResult

__all__ = ["detect_language", "detect_language_batch", "HybridResult"]
