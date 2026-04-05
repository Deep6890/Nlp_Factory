"""Base detector interface."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional


@dataclass
class DetectionResult:
    language: str      # ISO 639-1 code e.g. 'en', 'hi'
    confidence: float  # 0.0 – 1.0
    detector: str      # which detector produced this


class BaseDetector(ABC):
    name: str = "base"

    @abstractmethod
    def is_available(self) -> bool:
        """Return True if detector dependencies are ready."""
        ...

    @abstractmethod
    def detect(self, text: str) -> Optional[DetectionResult]:
        """Detect language of text. Never raises – returns None on failure."""
        ...

    def detect_batch(self, texts: list[str]) -> list[Optional[DetectionResult]]:
        return [self.detect(t) for t in texts]
