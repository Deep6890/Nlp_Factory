# Indic-to-English Offline Translation Pipeline

Offline, cost-efficient translation for 22+ Indian languages → English using NLLB-200 + FastText LID.

## Setup

```bash
pip install -r requirements.txt
```

### Download FastText LID model (one-time, offline after this)
```bash
curl -o lid.176.ftz https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.ftz
```

### Download NLLB model for fully offline use (optional)
```python
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
AutoTokenizer.from_pretrained("facebook/nllb-200-distilled-600M").save_pretrained("./nllb_model")
AutoModelForSeq2SeqLM.from_pretrained("facebook/nllb-200-distilled-600M").save_pretrained("./nllb_model")
```
Then set `MODEL_NAME = "./nllb_model"` in `translation_pipeline.py`.

## Run

```bash
uvicorn translation_pipeline:app --host 0.0.0.0 --port 8000
```

## API Usage

```bash
curl -X POST "http://localhost:8000/translate" \
     -H "Content-Type: application/json" \
     -d '{"text": "नमस्ते, आप कैसे हैं?"}'
```

## Supported Languages (FastText → NLLB code)

| Language   | FastText | NLLB Code  |
|------------|----------|------------|
| Hindi      | hi       | hin_Deva   |
| Bengali    | bn       | ben_Beng   |
| Tamil      | ta       | tam_Taml   |
| Telugu     | te       | tel_Telu   |
| Marathi    | mr       | mar_Deva   |
| Gujarati   | gu       | guj_Gujr   |
| Kannada    | kn       | kan_Knda   |
| Malayalam  | ml       | mal_Mlym   |
| Punjabi    | pa       | pan_Guru   |
| Odia       | or       | ory_Orya   |
| Urdu       | ur       | urd_Arab   |
| Assamese   | as       | asm_Beng   |
| Maithili   | mai      | mai_Deva   |
| Sanskrit   | sa       | san_Deva   |
| Sindhi     | sd       | snd_Arab   |
| Nepali     | ne       | npi_Deva   |
| Konkani    | kok      | kok_Deva   |
| Bodo       | brx      | brx_Deva   |
| Dogri      | dgo      | dgo_Deva   |
| Kashmiri   | ks       | kas_Arab   |
| Manipuri   | mni      | mni_Beng   |
| Santali    | sat      | sat_Olck   |

## Optimization Notes

- `load_in_8bit=True` halves VRAM (~1.2 GB vs ~2.4 GB) — runs on T4 or CPU
- `num_beams=4` improves grammar at minor latency cost
- For batch processing, pass lists of strings to the tokenizer
- For domain fine-tuning, use LoRA via `peft` library on your domain corpus
