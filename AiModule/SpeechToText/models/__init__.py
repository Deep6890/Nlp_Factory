"""
models/__init__.py  –  Model factory: unified entry point for all STT backends.

Usage:
    from models import get_stt_engine
    stt = get_stt_engine("indicwhisper", language="hi")
    text = stt.transcribe(audio_array)
"""

from __future__ import annotations
import logging

logger = logging.getLogger(__name__)

_REGISTRY: dict[str, type] = {}


def _register():
    global _REGISTRY
    from models.indicwhisper    import IndicWhisperSTT
    from models.indicwav2vec    import IndicWav2VecSTT
    from models.indicconformer  import IndicConformerSTT
    _REGISTRY = {
        "indicwhisper":    IndicWhisperSTT,
        "indicwav2vec":    IndicWav2VecSTT,
        "indicconformer":  IndicConformerSTT,
        # Aliases
        "whisper":    IndicWhisperSTT,
        "wav2vec":    IndicWav2VecSTT,
        "conformer":  IndicConformerSTT,
    }


def get_stt_engine(
    model_name: str = "indicwhisper",
    language: str = "hi",
    **kwargs,
):
    """
    Factory function to instantiate any STT engine by name.

    Args:
        model_name : 'indicwhisper' | 'indicwav2vec' | 'indicconformer'
        language   : BCP-47 code ('hi', 'ta', 'bn', etc.) or 'multilingual'
        **kwargs   : Passed to the engine constructor.
    Returns:
        An STT engine with .transcribe(audio) and .transcribe_file(path) methods.
    """
    if not _REGISTRY:
        _register()

    key = model_name.lower().strip()
    if key not in _REGISTRY:
        available = list(_REGISTRY.keys())
        raise ValueError(
            f"Unknown model '{model_name}'. Available: {available}"
        )

    cls = _REGISTRY[key]
    logger.info(f"[Factory] Instantiating {cls.__name__} for language='{language}'")
    return cls(language=language, **kwargs)


__all__ = ["get_stt_engine"]
