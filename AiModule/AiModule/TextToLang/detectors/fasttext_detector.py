"""
fastText language detector module.
Uses Meta's fastText lid.176.bin model (176 languages).

pip install fasttext-wheel
Model: models/lid.176.bin  (download via download_model.py)
"""

import logging
import os
from typing import Optional

from detectors.base import BaseDetector, DetectionResult

logger = logging.getLogger(__name__)

DEFAULT_MODEL_PATH = os.environ.get("FASTTEXT_MODEL_PATH", "models/lid.176.bin")


class FastTextDetector(BaseDetector):
    """Language detector powered by Meta's fastText lid.176 model."""

    name = "fasttext"

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH):
        self._model_path = model_path
        self._model = None
        self._available: Optional[bool] = None

    def _load_model(self):
        if self._model is not None:
            return
        import fasttext
        fasttext.FastText.eprint = lambda *a, **k: None  # suppress stderr
        self._model = fasttext.load_model(self._model_path)
        logger.info("fastText model loaded from %s", self._model_path)

    def is_available(self) -> bool:
        if self._available is not None:
            return self._available
        try:
            import fasttext  # noqa: F401
            if not os.path.exists(self._model_path):
                logger.warning("fastText model not found at '%s'. Run: python download_model.py", self._model_path)
                self._available = False
            else:
                self._available = True
        except ImportError:
            logger.warning("fasttext not installed. Run: pip install fasttext-wheel")
            self._available = False
        return self._available

    def detect(self, text: str) -> Optional[DetectionResult]:
        if not self.is_available():
            return None
        try:
            self._load_model()
            text = text.strip().replace("\n", " ")
            if not text:
                return None

            labels, confs = self._model.predict(text, k=1)
            lang = labels[0].replace("__label__", "")
            confidence = float(confs[0])

            return DetectionResult(
                language=lang,
                confidence=round(confidence, 4),
                detector=self.name,
            )
        except Exception as exc:
            logger.error("fastText detection failed: %s", exc)
            return None

    def detect_batch(self, texts: list[str]) -> list[Optional[DetectionResult]]:
        if not self.is_available():
            return [None] * len(texts)
        try:
            self._load_model()
            cleaned = [t.strip().replace("\n", " ") for t in texts]
            labels_list, confs_list = self._model.predict(cleaned, k=1)
            return [
                DetectionResult(
                    language=labels[0].replace("__label__", ""),
                    confidence=round(float(confs[0]), 4),
                    detector=self.name,
                )
                for labels, confs in zip(labels_list, confs_list)
            ]
        except Exception as exc:
            logger.error("fastText batch failed: %s", exc)
            return [self.detect(t) for t in texts]
