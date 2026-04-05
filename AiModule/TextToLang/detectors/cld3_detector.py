"""
CLD3 Detector module.

Uses 'lingua-language-detector' as the CLD3 backend.
(pycld3 requires protoc + C build tools, unavailable on Python 3.14/Windows)

pip install lingua-language-detector
"""

import logging
from typing import Optional

from detectors.base import BaseDetector, DetectionResult

logger = logging.getLogger(__name__)


class CLD3Detector(BaseDetector):
    """
    Primary language detector backed by Lingua (Rust-based, high accuracy).
    Acts as the CLD3 role in the pipeline.
    """

    name = "cld3"

    def __init__(self):
        self._available: Optional[bool] = None
        self._detector = None

    def _ensure_detector(self):
        if self._detector is not None:
            return
        from lingua import LanguageDetectorBuilder
        self._detector = (
            LanguageDetectorBuilder
            .from_all_languages()
            .with_preloaded_language_models()
            .build()
        )
        logger.info("Lingua (cld3 role) detector initialised")

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            import lingua  # noqa: F401
            self._available = True
        except ImportError:
            logger.warning("lingua not installed. Run: pip install lingua-language-detector")
            self._available = False
        return self._available

    def detect(self, text: str) -> Optional[DetectionResult]:
        if not self.is_available():
            return None
        try:
            self._ensure_detector()
            text = text.strip()
            if not text:
                return None

            values = self._detector.compute_language_confidence_values(text)
            if not values:
                return None

            top = values[0]
            iso = top.language.iso_code_639_1
            lang_code = iso.name.lower() if iso else top.language.name.lower()

            return DetectionResult(
                language=lang_code,
                confidence=round(top.value, 4),
                detector=self.name,
            )
        except Exception as exc:
            logger.error("CLD3 (lingua) detection failed: %s", exc)
            return None

    def detect_batch(self, texts: list[str]) -> list[Optional[DetectionResult]]:
        return [self.detect(t) for t in texts]
