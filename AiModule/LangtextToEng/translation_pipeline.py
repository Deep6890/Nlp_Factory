import re
import gc
import logging
from langdetect import detect, LangDetectException

logger = logging.getLogger(__name__)

LANG_MAP = {
    "hi": "hin_Deva", "bn": "ben_Beng", "ta": "tam_Taml", "te": "tel_Telu",
    "mr": "mar_Deva", "gu": "guj_Gujr", "kn": "kan_Knda", "ml": "mal_Mlym",
    "pa": "pan_Guru", "or": "ory_Orya", "ur": "urd_Arab", "as": "asm_Beng",
    "mai": "mai_Deva", "sa": "san_Deva", "sd": "snd_Arab", "ne": "npi_Deva",
    "kok": "kok_Deva", "brx": "brx_Deva", "dgo": "dgo_Deva", "ks": "kas_Arab",
    "mni": "mni_Beng", "sat": "sat_Olck",
}

ENG_LANGS = {"en", "english", "eng"}


def _google_translate(text: str, src_lang: str) -> str | None:
    """deep-translator via Google Translate — best quality, needs internet."""
    try:
        from deep_translator import GoogleTranslator
        result = GoogleTranslator(source=src_lang, target="en").translate(text[:4999])
        return result.strip() if result else None
    except Exception as e:
        logger.debug("Google translate failed: %s", e)
        return None


def _argos_translate(text: str, src_lang: str) -> str | None:
    """Argostranslate — offline fallback, lower quality."""
    try:
        import argostranslate.translate
        installed = argostranslate.translate.get_installed_languages()
        src_obj = next((l for l in installed if l.code == src_lang), None)
        eng_obj = next((l for l in installed if l.code == "en"), None)
        if src_obj and eng_obj:
            t = src_obj.get_translation(eng_obj)
            return t.translate(text).strip() if t else None
    except Exception as e:
        logger.debug("Argos translate failed: %s", e)
    return None


def translate(text: str, src_lang: str = None) -> str:
    """
    Translate Indian language text to English.

    Priority:
      1. Google Translate via deep-translator (best quality, needs internet)
      2. Argostranslate (offline fallback)
      3. Return original text unchanged (never crashes)
    """
    if not text or not text.strip():
        return text

    if not src_lang:
        try:
            src_lang = detect(re.sub(r"[\r\n\t]", " ", text))
        except Exception:
            src_lang = "hi"

    if src_lang.lower() in ENG_LANGS:
        return text

    # Primary: Google Translate
    result = _google_translate(text, src_lang)
    if result:
        logger.info("Google translation OK [%s->en]", src_lang)
        return result

    # Fallback: Argostranslate
    result = _argos_translate(text, src_lang)
    if result:
        logger.info("Argostranslate OK [%s->en]", src_lang)
        return result

    logger.warning("All translation methods failed — returning original text")
    return text


def free_ram():
    """No-op — lightweight translators use no persistent RAM."""
    gc.collect()


if __name__ == "__main__":
    print(translate(input()))
