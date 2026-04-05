import re
import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from langdetect import detect, LangDetectException

MODEL_NAME = "facebook/nllb-200-distilled-600M"

LANG_MAP = {
    "hi": "hin_Deva", "bn": "ben_Beng", "ta": "tam_Taml", "te": "tel_Telu",
    "mr": "mar_Deva", "gu": "guj_Gujr", "kn": "kan_Knda", "ml": "mal_Mlym",
    "pa": "pan_Guru", "or": "ory_Orya", "ur": "urd_Arab", "as": "asm_Beng",
    "mai": "mai_Deva", "sa": "san_Deva", "sd": "snd_Arab", "ne": "npi_Deva",
    "kok": "kok_Deva", "brx": "brx_Deva", "dgo": "dgo_Deva", "ks": "kas_Arab",
    "mni": "mni_Beng", "sat": "sat_Olck",
}

tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

if torch.cuda.is_available():
    translator = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_NAME, device_map="auto", load_in_8bit=True
    )
else:
    translator = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME)

DEVICE = next(translator.parameters()).device
ENG_TOKEN_ID = tokenizer.convert_tokens_to_ids("eng_Latn")


def _detect_lang(text: str) -> str:
    try:
        return LANG_MAP.get(detect(re.sub(r"[\r\n\t]", " ", text)), "eng_Latn")
    except LangDetectException:
        return "eng_Latn"


def translate(text: str) -> str:
    if not text.strip():
        return ""
    src_lang = _detect_lang(text)
    if src_lang == "eng_Latn":
        return text
    tokenizer.src_lang = src_lang
    inputs = tokenizer(text, return_tensors="pt").to(DEVICE)
    with torch.inference_mode():
        tokens = translator.generate(
            **inputs,
            forced_bos_token_id=ENG_TOKEN_ID,
            max_length=256,
            num_beams=4,
            repetition_penalty=3.0,
            no_repeat_ngram_size=4,
        )
    return tokenizer.batch_decode(tokens, skip_special_tokens=True)[0]


if __name__ == "__main__":
    print(translate(input()))
