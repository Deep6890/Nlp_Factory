# AiModule — Full Architecture & Model Documentation

## What This System Does

Takes an audio file in any Indian language → outputs a structured JSON with transcript, English translation, and financial intelligence (intent, sentiment, entities, summary, etc.).

```
Audio File (.wav/.mp3/.flac)
        │
        ▼
┌─────────────────┐
│  Stage 1: STT   │  Speech → Text (Indian language)
└────────┬────────┘
         │
         ▼
┌──────────────────────┐
│  Stage 2: Translation│  Indian language → English
└────────┬─────────────┘
         │
         ▼
┌──────────────────────┐
│  Stage 3: Insights   │  English text → Financial JSON
└──────────────────────┘
```

---

## Stage 1 — Speech To Text (`SpeechToText/`)

**Entry point:** `SpeechToText/indic_stt.py` → `IndicSTT.transcribe(audio_path, language)`

### Model Priority (tries in order, uses first that works)

| Priority | Model | Size | RAM | Why Used |
|----------|-------|------|-----|----------|
| 1 | `openai/whisper-large-v3` | ~3GB | ~3GB | Best accuracy for all 22 Indian languages. Trained on massive multilingual data. Language is forced via generation kwargs — never auto-detects wrong language. |
| 2 | `Systran/faster-whisper-medium` | 1.4GB | ~900MB | CTranslate2-optimized Whisper. Much faster than transformers, int8 quantized. Used when large-v3 can't load (low RAM). |
| 3 | `Systran/faster-whisper-tiny` | 72MB | ~200MB | Emergency fallback. Always fits in RAM. Lower accuracy but never crashes. |

### Why whisper-large-v3 fails on your machine
Your system only has ~5.6GB free RAM. `whisper-large-v3` needs ~3GB to load in float32 on CPU. Windows also needs virtual memory (paging file) headroom for memory-mapped file loading — even with 5.6GB free, if the paging file is too small, `safe_open()` throws `OSError 1455`. So it falls to `faster-whisper-medium` which loads fine at ~900MB.

### Anti-Hallucination Settings (applied to all Whisper models)
```python
"no_repeat_ngram_size": 5          # prevents "ताए ताए ताए..." loops
"compression_ratio_threshold": 2.4 # rejects repetitive outputs
"logprob_threshold": -1.0          # rejects low-confidence hallucinations
"temperature": 0.0                 # greedy decoding, deterministic
"condition_on_prev_tokens": False  # prevents cascade errors across chunks
```

### Script-Anchoring Prompts (faster-whisper-medium)
Forces the model to output in the correct script (not romanized):
```python
"hi": "यह एक हिंदी वार्तालाप है।"
"ta": "இது தமிழ் உரையாடல்."
# ... etc for all 10 languages
```

### Other STT Engines (available but not used in main pipeline)

These live in `SpeechToText/models/` and are accessible via `get_stt_engine()` factory:

| Engine | Class | Model | Requires | Status |
|--------|-------|-------|----------|--------|
| IndicConformer | `IndicConformerSTT` | `ai4bharat/indic-conformer-600m-multilingual` | NVIDIA NeMo framework | Best accuracy if NeMo installed, else falls back to Whisper |
| IndicWav2Vec | `IndicWav2VecSTT` | `ai4bharat/indicwav2vec-hindi` (per language) | HF_TOKEN (gated model) | Falls back to Whisper if no token |
| IndicWhisper | `IndicWhisperSTT` | `openai/whisper-large-v3` | Nothing | Same as main pipeline |

### STT Output
```json
{
  "text": "5000 की SIP अपन करने हैं...",
  "language": "hi",
  "language_name": "hindi",
  "confidence": 1.0,
  "stt_model_used": "Systran/faster-whisper-medium",
  "stt_error": null,
  "audio_duration_sec": 17.88
}
```

---

## Stage 2 — Translation (`LangtextToEng/`)

**Entry point:** `LangtextToEng/translation_pipeline.py` → `translate(text, src_lang)`

### Model Priority

| Priority | Method | Model/Service | Quality | Needs Internet |
|----------|--------|---------------|---------|----------------|
| 1 | Google Translate | `deep-translator` → Google API | Best | Yes |
| 2 | Argostranslate | Local offline model | Medium | No |
| 3 | Passthrough | Returns original text | None | No |

### Why NOT Facebook NLLB anymore
Earlier versions used `facebook/nllb-200-distilled-600M` (a 2.4GB local model). It was replaced with Google Translate via `deep-translator` because:
- Google quality is significantly better for Hinglish/code-switched speech
- NLLB needed 2.4GB RAM which caused memory pressure after STT
- `deep-translator` is a thin HTTP wrapper — zero RAM footprint

### Language Code Mapping
```python
"hi" → "hin_Deva"  (Hindi, Devanagari)
"ta" → "tam_Taml"  (Tamil)
"te" → "tel_Telu"  (Telugu)
# ... all 22 Indian languages mapped
```

### RAM Management
After translation, `free_ram()` is called to run `gc.collect()` before the insights engine loads. This is critical on low-RAM machines.

---

## Stage 3 — Insights Engine (`insightsEngine/`)

**Entry point:** `insightsEngine/pipeline.py` → `process_text_pipeline(text, source_lang, original_text)`

The insights engine runs 4 sub-components in sequence:

### 3a. Finance Detector (`finance_detector.py`)

Fast keyword pre-filter. If text has no finance content, the pipeline returns early with `finance_detected: false` and skips all heavy processing.

Checks against:
- English finance keywords (`pay`, `loan`, `SIP`, `invest`, `EMI`, etc.)
- Hindi romanized (`paisa`, `udhar`, `karz`, `bachat`, etc.)
- Devanagari (`पैसा`, `ऋण`, `निवेश`, etc.)
- Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu scripts
- Currency regex (`₹5000`, `$50`, `5000 rupees`, etc.)

No model loaded — pure regex + set lookup. Runs in microseconds.

### 3b. Sentiment Engine (`sentiment_engine.py`)

| Priority | Model | Size | Why Used |
|----------|-------|------|----------|
| 1 | `lxyuan/distilbert-base-multilingual-cased-sentiments-student` | ~1.5GB | Multilingual DistilBERT fine-tuned for sentiment. Supports English + Indian languages natively. Returns positive/negative/neutral with confidence. |
| 2 | TextBlob | ~0MB | English-only, simple polarity scoring. Fast fallback. |
| 3 | Keyword matching | 0MB | Hardcoded positive/negative word lists. Always works. |

**Why it fails on your machine:** Same paging file issue. Even with 5.6GB free RAM, Windows can't memory-map the 1.5GB model file. The code already handles this gracefully — checks for `OSError 1455` and skips to keyword fallback. That's why you got `"negative"` with score `-0.3` (keyword matched "problem").

**Fix:** Increase Windows virtual memory (paging file) to 8GB+ in:
`System Properties → Advanced → Performance Settings → Advanced → Virtual Memory`

### 3c. Local NLP (`local_nlp.py`)

Uses **spaCy** for entity extraction and keyword extraction. No network calls.

| Model | Size | Why Used |
|-------|------|----------|
| `en_core_web_lg` | ~750MB | Tries first — better NER accuracy |
| `en_core_web_sm` | ~12MB | Fallback — always available |
| Regex fallback | 0MB | If spaCy not installed |

**Entity types extracted:** PERSON, ORG, GPE, MONEY, PERCENT, DATE, TIME, CARDINAL, QUANTITY

**Keyword extraction:** Nouns, proper nouns, and meaningful verbs — stop words and auxiliary verbs filtered out, lemmatized.

### 3d. LLM Extractor (`llm_extractor.py`)

**Model:** `meta/llama-3.1-8b-instruct` via NVIDIA NIM API (cloud, not local)

**Why NVIDIA NIM instead of local LLM:**
- Running LLaMA 8B locally needs ~16GB RAM — not feasible on this machine
- NVIDIA NIM provides free API access to hosted models
- Zero local RAM cost — just an HTTP call
- Returns structured JSON directly

**What it extracts (that local NLP can't):**
```
intent      → payment_request | loan_query | investment_advice | ...
domain      → personal_finance | banking | investment | ...
summary     → one English sentence capturing the financial meaning
emotion     → neutral | urgent | worried | stressed | hopeful | ...
urgency     → low | medium | high
action_items→ ["Start SIP of Rs 5000 after resolving investment issue"]
risk_level  → low | medium | high
amount      → "Rs 5000"
parties     → ["HDFC Bank", "PhonePe"]
deadline    → "two years"
code_switched → true (Hinglish detected)
```

**Current status:** FAILING with 401 because `insightsEngine/.env` has placeholder key `your_nvidia_api_key_here`. All LLM fields default to `"unknown"` / `""` / `"low"`.

**Fix:** Get a free key at https://build.nvidia.com and set:
```
NVIDIA_API_KEY=nvapi-xxxxxxxxxxxxxxxxxxxx
```

---

## Full Data Flow (your actual run)

```
dummyTalk.wav (17.88s, Hindi)
    │
    ├─ whisper-large-v3 → FAILED (paging file too small)
    ├─ faster-whisper-medium → OK ✓
    │   text: "5000 की SIP अपन करने हैं, दो यहर के लिए..."
    │   lang: hi, conf: 1.00
    │
    ├─ STT RAM freed (gc.collect)
    │
    ├─ Google Translate → hi → English ✓
    │   "The SIP of 5000 is to be adopted, for two years..."
    │
    ├─ Finance Detector → TRUE ✓ (matched: SIP, investment, problem)
    │
    ├─ Sentiment (DistilBERT) → FAILED (paging file)
    ├─ Sentiment (TextBlob) → FAILED (not installed)
    ├─ Sentiment (Keyword) → "negative", -0.3 ✓ (matched: "problem")
    │
    ├─ spaCy NER → entities: [5000/CARDINAL, two years/DATE, SIP/ORG] ✓
    ├─ spaCy Keywords → [adopt, begin, investment, problem, schedule, sip, year] ✓
    │
    └─ LLM (NVIDIA NIM) → FAILED (401 Unauthorized — bad API key)
        intent: "unknown", summary: "", emotion: "neutral" ← all defaults
```

---

## Output JSON — All 25 Keys Explained

| Key | Source | Example |
|-----|--------|---------|
| `original_transcript` | STT | `"5000 की SIP अपन करने हैं..."` |
| `detected_language` | STT | `"hi"` |
| `language_name` | STT | `"hindi"` |
| `stt_confidence` | STT | `1.0` |
| `stt_model_used` | STT | `"Systran/faster-whisper-medium"` |
| `audio_duration_sec` | STT | `17.88` |
| `stt_error` | STT | `null` |
| `english_text` | Translation | `"The SIP of 5000 is to be adopted..."` |
| `translation_applied` | Translation | `true` |
| `finance_detected` | Finance Detector | `true` |
| `sentiment_label` | Sentiment Engine | `"negative"` |
| `sentiment_score` | Sentiment Engine | `-0.3` |
| `intent` | LLM | `"unknown"` ← needs API key |
| `domain` | LLM | `"finance"` |
| `summary` | LLM | `""` ← needs API key |
| `emotion` | LLM | `"neutral"` ← needs API key |
| `urgency` | LLM | `"low"` ← needs API key |
| `risk_level` | LLM | `"low"` ← needs API key |
| `amount` | LLM | `null` ← needs API key |
| `entities` | spaCy | `[{text: "5000", type: "CARDINAL"}, ...]` |
| `keywords` | spaCy | `["invest", "problem", "sip", ...]` |
| `pipeline_version` | Hardcoded | `"3.0-ai4bharat"` |
| `processed_at` | System | `"2026-04-05T09:31:21"` |
| `total_time_sec` | Timer | `49.62` |

---

## What's Broken & How To Fix

### 1. LLM insights empty (intent, summary, emotion, urgency, amount)
**Cause:** `NVIDIA_API_KEY=your_nvidia_api_key_here` in `insightsEngine/.env`
**Fix:** Replace with real key from https://build.nvidia.com (free tier available)

### 2. Sentiment using keyword fallback (low accuracy)
**Cause:** Windows paging file too small to memory-map the 1.5GB DistilBERT model
**Fix:** Increase virtual memory to 8GB+ in Windows Performance Settings

### 3. whisper-large-v3 not loading (using medium instead)
**Cause:** Same paging file issue — needs ~3GB contiguous virtual memory
**Fix:** Same as above — increase paging file size

### 4. TextBlob not installed
**Fix:** `pip install textblob` (minor — keyword fallback works fine)

---

## RAM Budget (your machine ~5.6GB free)

| Component | RAM Used | When |
|-----------|----------|------|
| faster-whisper-medium | ~900MB | Stage 1, freed after |
| Google Translate | ~0MB | Stage 2 (HTTP call) |
| spaCy en_core_web_sm | ~50MB | Stage 3, stays loaded |
| DistilBERT sentiment | ~1.5GB | Stage 3 (fails on your machine) |
| NVIDIA NIM LLM | ~0MB | Stage 3 (HTTP call) |
| **Total working** | **~950MB** | With current fallbacks |
| **Total ideal** | **~2.5GB** | With all models loaded |

---

## Supported Languages

All 22 scheduled Indian languages: Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, Urdu, Sanskrit, Maithili, Konkani, Nepali, Sindhi, Kashmiri, Dogri, Manipuri, Santali, Bodo

Plus Hinglish (code-switched Hindi+English) — handled natively by Whisper.
