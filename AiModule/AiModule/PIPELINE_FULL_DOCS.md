# AiModule — Complete Pipeline Documentation
# Every file, every model, every limit, every cost

---

## SYSTEM OVERVIEW

```
Audio File (.wav/.mp3/.flac)
         │
         ▼
┌─────────────────────────────────────────────────────┐
│  api_server.py  (FastAPI — HTTP entry point)        │
│  POST /process-audio  →  full pipeline              │
│  POST /process        →  text only (skip STT)       │
│  GET  /health         →  ping                       │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────▼───────────┐
         │   STAGE 1: STT        │  SpeechToText/
         │   Audio → Hindi text  │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   STAGE 2: TRANSLATE  │  LangtextToEng/
         │   Hindi → English     │
         └───────────┬───────────┘
                     │
         ┌───────────▼───────────┐
         │   STAGE 3: INSIGHTS   │  insightsEngine/
         │   English → JSON      │
         └───────────────────────┘
```

---

## FILE MAP — WHAT EVERY FILE DOES

```
AiModule/
│
├── api_server.py               ← HTTP server, entry point for all requests
│
├── SpeechToText/
│   ├── indic_stt.py            ← Main STT engine (model loading + transcription)
│   ├── audio_pipeline.py       ← CLI runner: STT + Translation + Insights combined
│   ├── audio_utils.py          ← Audio loading helpers (librosa wrapper)
│   ├── config.py               ← All model IDs, language codes, env vars
│   ├── transcribe.py           ← Simple single-file transcription script
│   ├── quick_start.py          ← Demo/test script
│   ├── cli.py                  ← Command line interface
│   └── models/
│       ├── __init__.py         ← Factory: get_stt_engine("indicwhisper", lang="hi")
│       ├── indicwhisper.py     ← Whisper model class (full implementation)
│       ├── indicwav2vec.py     ← Wav2Vec2 CTC model class
│       └── indicconformer.py   ← IndicConformer NeMo model class
│
├── LangtextToEng/
│   └── translation_pipeline.py ← Google Translate + Argostranslate fallback
│
├── insightsEngine/
│   ├── pipeline.py             ← Orchestrates all 4 insight sub-components
│   ├── finance_detector.py     ← Keyword/regex finance filter (no model)
│   ├── sentiment_engine.py     ← DistilBERT → TextBlob → keyword fallback
│   ├── local_nlp.py            ← spaCy entity + keyword extraction
│   ├── llm_extractor.py        ← NVIDIA NIM API (LLaMA 3.1 8B)
│   ├── main.py                 ← Standalone test runner
│   └── .env                    ← API keys (NVIDIA_API_KEY, AI_API_KEY)
│
├── TextToLang/                 ← Language detection module
│   └── detectors/
│       ├── engine.py           ← Detection orchestrator
│       ├── fasttext_detector.py← FastText language ID model
│       ├── cld3_detector.py    ← Google CLD3 detector
│       └── base.py             ← Abstract base class
│
└── ARCHITECTURE.md             ← Previous architecture doc
```

---

## STAGE 1 — SPEECH TO TEXT

### Entry File: `SpeechToText/indic_stt.py`

This is the core STT engine. It tries 3 models in order and uses the first one that works.

---

### MODEL 1 — openai/whisper-large-v3

| Property | Detail |
|----------|--------|
| What it is | OpenAI's largest Whisper model, encoder-decoder transformer |
| Open Source | YES — MIT License |
| Free to use | YES — completely free, no API, runs locally |
| Where it runs | Your machine (CPU or GPU) |
| Model size | ~3GB on disk |
| RAM needed | ~3GB on CPU (float32) |
| Languages | 99 languages including all 22 Indian languages |
| Accuracy | Best available for Indian languages |
| Speed | Slow on CPU (~2-3x real-time) |
| Downloaded from | HuggingFace: `openai/whisper-large-v3` |
| Cost | $0 forever |
| Limit | Only your hardware RAM |

Why used: Highest accuracy for Hindi/Indic speech. Handles Hinglish (code-switched) natively. Language is forced via generation kwargs so it never auto-detects the wrong language.

Why it sometimes fails: Windows paging file too small to memory-map the 3GB file even when RAM shows as free. Fix: increase virtual memory to 8GB+ in Windows settings.

Anti-hallucination settings applied:
```
no_repeat_ngram_size: 5       → stops "ताए ताए ताए..." repetition loops
compression_ratio_threshold: 2.4 → rejects repetitive garbage output
logprob_threshold: -1.0       → rejects low-confidence hallucinations
temperature: 0.0              → greedy decoding, fully deterministic
condition_on_prev_tokens: False → prevents cascade errors between chunks
```

---

### MODEL 2 — Systran/faster-whisper-medium

| Property | Detail |
|----------|--------|
| What it is | Whisper medium converted to CTranslate2 format (4x faster) |
| Open Source | YES — MIT License |
| Free to use | YES — completely free, runs locally |
| Where it runs | Your machine (CPU) |
| Model size | ~1.4GB on disk |
| RAM needed | ~900MB (int8 quantized) |
| Languages | Same 99 as Whisper |
| Accuracy | Good — slightly below large-v3 |
| Speed | ~4x faster than transformers Whisper |
| Downloaded from | HuggingFace: `Systran/faster-whisper-medium` |
| Cost | $0 forever |
| Limit | Only your hardware |

Why used: Falls back to this when large-v3 can't load due to low RAM. int8 quantization means it uses ~900MB instead of 3GB. This is what ran in your first test.

Script-anchoring prompts used (forces correct script output):
```
hi → "यह एक हिंदी वार्तालाप है।"
ta → "இது தமிழ் உரையாடல்."
te → "ఇది తెలుగు సంభాషణ."
... (all 10 major Indian languages)
```

---

### MODEL 3 — Systran/faster-whisper-tiny

| Property | Detail |
|----------|--------|
| What it is | Whisper tiny in CTranslate2 format |
| Open Source | YES — MIT License |
| Free to use | YES |
| Model size | 72MB |
| RAM needed | ~200MB |
| Accuracy | Low — emergency use only |
| Cost | $0 |

Why used: Last resort fallback. Always fits in RAM. Never crashes. Used only if both large-v3 and medium fail.

---

### OTHER STT ENGINES (available, not in main pipeline)

These are in `SpeechToText/models/` and accessible via `get_stt_engine()` factory but not used in the default `indic_stt.py` flow.

#### IndicConformer — `models/indicconformer.py`

| Property | Detail |
|----------|--------|
| What it is | Conformer architecture with hybrid CTC/RNNT decoding by AI4Bharat |
| Open Source | YES — MIT License |
| Free to use | YES |
| Model | `ai4bharat/indic-conformer-600m-multilingual` |
| Requires | NVIDIA NeMo framework (`pip install nemo_toolkit[asr]`) |
| Accuracy | Highest for Indian languages (purpose-built) |
| RAM needed | ~4GB |
| Cost | $0 |
| Limit | NeMo is heavy to install, GPU strongly recommended |

Why not default: NeMo is complex to install on Windows. Falls back to Whisper automatically if NeMo not installed.

#### IndicWav2Vec — `models/indicwav2vec.py`

| Property | Detail |
|----------|--------|
| What it is | Wav2Vec2-based CTC model pre-trained on 40 Indian languages by AI4Bharat |
| Open Source | YES — MIT License |
| Free to use | YES — but GATED on HuggingFace |
| Model | `ai4bharat/indicwav2vec-hindi` (separate model per language) |
| Requires | HF_TOKEN in .env (must accept terms at huggingface.co/ai4bharat) |
| Accuracy | Very high for specific languages |
| Cost | $0 after accepting terms |
| Limit | Must manually accept license on HuggingFace website per model |

Why not default: Gated model — needs HF token. Falls back to Whisper without it.

---

## STAGE 2 — TRANSLATION

### Entry File: `LangtextToEng/translation_pipeline.py`

Translates Indian language text to English. Tries methods in order.

---

### METHOD 1 — Google Translate via deep-translator

| Property | Detail |
|----------|--------|
| What it is | HTTP wrapper around Google Translate |
| Open Source | deep-translator is MIT. Google Translate itself is proprietary. |
| Free to use | YES for normal usage (no API key needed via deep-translator) |
| Where it runs | Google's servers (cloud) |
| RAM needed | ~0MB (HTTP call) |
| Quality | Best available — handles Hinglish perfectly |
| Speed | ~1-2 seconds |
| Cost | Free up to ~500k chars/day via unofficial endpoint |
| Limit | Rate limiting possible at very high volume. For production scale use Google Cloud Translation API ($20 per 1M chars) |
| Internet | Required |

Why used: Best quality, zero RAM cost. Previous version used Facebook NLLB locally (2.4GB RAM) — swapped to Google to save memory and improve quality.

---

### METHOD 2 — Argostranslate (offline fallback)

| Property | Detail |
|----------|--------|
| What it is | Open source offline neural translation |
| Open Source | YES — MIT License |
| Free to use | YES |
| Where it runs | Your machine |
| Quality | Medium — noticeably worse than Google for Hinglish |
| Cost | $0 |
| Internet | Not required |
| Limit | Language packs must be installed separately |

Why used: Fallback when Google Translate fails or no internet.

---

### METHOD 3 — Passthrough

If both fail, returns original text unchanged. Pipeline never crashes.

---

## STAGE 3 — INSIGHTS ENGINE

### Entry File: `insightsEngine/pipeline.py`

Orchestrates 4 sub-components. Always returns a fixed 15-key dict.

---

### COMPONENT 1 — Finance Detector (`finance_detector.py`)

| Property | Detail |
|----------|--------|
| What it is | Pure Python keyword + regex filter |
| Model | None — zero ML |
| Open Source | YES — your own code |
| Free | YES |
| Speed | Microseconds |
| RAM | 0MB |
| Cost | $0 |

Checks text against:
- 50+ English finance keywords (pay, loan, SIP, EMI, invest, bank...)
- Hindi romanized (paisa, udhar, karz, bachat...)
- Devanagari script (पैसा, ऋण, निवेश...)
- Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, Urdu keywords
- Currency regex (₹5000, $50, 5000 rupees...)

If no finance content found → returns early, skips all heavy models. This saves significant processing time for non-finance audio.

---

### COMPONENT 2 — Sentiment Engine (`sentiment_engine.py`)

Tries 3 methods in order:

#### Method 1 — lxyuan/distilbert-base-multilingual-cased-sentiments-student

| Property | Detail |
|----------|--------|
| What it is | DistilBERT fine-tuned for multilingual sentiment (positive/negative/neutral) |
| Open Source | YES — MIT License |
| Free to use | YES — runs locally |
| Model size | ~1.5GB |
| RAM needed | ~1.5GB + Windows virtual memory headroom |
| Languages | English + major Indian languages |
| Accuracy | High — purpose-trained for multilingual sentiment |
| Downloaded from | HuggingFace: `lxyuan/distilbert-base-multilingual-cased-sentiments-student` |
| Cost | $0 |
| Limit | Fails on Windows when paging file is too small (OSError 1455) |

Why it fails on your machine: After whisper-large-v3 uses ~3GB, only ~2.6GB RAM is free. The model needs ~1.5GB + Windows virtual memory buffer. The code checks for this and skips gracefully.

#### Method 2 — TextBlob

| Property | Detail |
|----------|--------|
| What it is | Simple English NLP library |
| Open Source | YES — MIT License |
| Free | YES |
| RAM | ~0MB |
| Accuracy | Low — English only, basic polarity |
| Cost | $0 |
| Status | Not installed in your venv (`pip install textblob` to fix) |

#### Method 3 — Keyword fallback

Hardcoded positive/negative word lists. Always works. Returns score of ±0.3.
Currently what runs on your machine.

---

### COMPONENT 3 — Local NLP (`local_nlp.py`)

#### spaCy en_core_web_sm / en_core_web_lg

| Property | Detail |
|----------|--------|
| What it is | Industrial NLP library for entity recognition and keyword extraction |
| Open Source | YES — MIT License |
| Free to use | YES — runs locally |
| Model sizes | sm: ~12MB, lg: ~750MB |
| RAM needed | sm: ~50MB, lg: ~200MB |
| What it extracts | PERSON, ORG, MONEY, DATE, CARDINAL, GPE, PERCENT entities + keywords |
| Speed | Fast (~50ms) |
| Cost | $0 |
| Limit | English only (your text is already translated to English at this point) |

Tries `en_core_web_lg` first (better NER), falls back to `en_core_web_sm`. Currently `en_core_web_sm` is what loads on your machine.

---

### COMPONENT 4 — LLM Extractor (`llm_extractor.py`)

#### meta/llama-3.1-8b-instruct via NVIDIA NIM API

| Property | Detail |
|----------|--------|
| What it is | Meta's LLaMA 3.1 8B instruction-tuned model |
| Open Source | YES — LLaMA 3.1 Community License (free for most uses) |
| Free to use | YES via NVIDIA NIM free tier |
| Where it runs | NVIDIA's cloud servers (not your machine) |
| RAM needed | 0MB locally (HTTP API call) |
| Free tier limit | 40 requests/minute, 1000 requests/day on NVIDIA NIM free tier |
| Paid tier | NVIDIA NIM credits (pay per token) |
| API key | Required — get free at build.nvidia.com |
| Internet | Required |
| Cost | Free within limits |
| Latency | ~2-5 seconds per call |

What it extracts that no local model can:
```
intent      → investment_advice, loan_query, payment_request, etc.
domain      → personal_finance, banking, investment, etc.
summary     → one clear English sentence of the financial meaning
emotion     → worried, stressed, hopeful, urgent, neutral, etc.
urgency     → low / medium / high
action_items→ ["Start SIP of Rs 5000 after resolving investment issue"]
risk_level  → low / medium / high
amount      → "Rs 5000"
parties     → ["HDFC Bank", "PhonePe"]
deadline    → "two years"
code_switched → true (Hinglish detected)
```

Why NVIDIA NIM instead of running LLaMA locally: Running 8B model locally needs ~16GB RAM. Your machine has ~5.6GB free. NVIDIA NIM hosts it for free.

Alternative free LLM APIs you could swap in:
- Groq (llama-3.1-8b-instant) — faster, 14,400 req/day free
- Together AI — $0.20/1M tokens
- Ollama — fully local if you had 16GB+ RAM

---

## FULL OUTPUT JSON — ALL 25 KEYS

```json
{
  "original_transcript":  "5000 की SIP करनी है...",   ← raw STT output (Indian language)
  "detected_language":    "hi",                        ← BCP-47 language code
  "language_name":        "hindi",                     ← human readable
  "stt_confidence":       1.0,                         ← 0.0 to 1.0
  "stt_model_used":       "Systran/faster-whisper-medium",
  "audio_duration_sec":   17.88,
  "stt_error":            null,                        ← error message or null

  "english_text":         "The SIP of 5000...",        ← translated English
  "translation_applied":  true,

  "finance_detected":     true,                        ← keyword filter result
  "sentiment_label":      "negative",                  ← positive/negative/neutral
  "sentiment_score":      -0.3,                        ← -1.0 to 1.0
  "intent":               "investment_advice",         ← from LLM
  "domain":               "personal_finance",          ← from LLM
  "summary":              "User wants to start...",    ← from LLM
  "emotion":              "worried",                   ← from LLM
  "urgency":              "low",                       ← from LLM
  "risk_level":           "low",                       ← from LLM
  "amount":               "Rs 5000",                   ← from LLM
  "entities":             [{"text":"5000","type":"CARDINAL",...}], ← spaCy
  "keywords":             ["invest","sip","problem"],  ← spaCy

  "pipeline_version":     "3.0-ai4bharat",
  "processed_at":         "2026-04-05T11:28:13",
  "total_time_sec":       49.62
}
```

---

## COST SUMMARY

| Component | Model | Cost | Limit |
|-----------|-------|------|-------|
| STT | whisper-large-v3 | $0 forever | Your RAM |
| STT fallback | faster-whisper-medium | $0 forever | Your RAM |
| Translation | Google Translate (deep-translator) | $0 | ~500k chars/day informal limit |
| Finance filter | Keyword/regex | $0 forever | None |
| Sentiment | DistilBERT multilingual | $0 forever | Your RAM |
| NER/Keywords | spaCy | $0 forever | None |
| LLM insights | LLaMA 3.1 8B via NVIDIA NIM | $0 free tier | 1000 req/day, 40 req/min |
| API server | FastAPI/uvicorn | $0 forever | Your CPU/network |

Total cost to run: $0 for normal usage.

---

## KNOWN LIMITS ON YOUR MACHINE

| Issue | Cause | Fix |
|-------|-------|-----|
| whisper-large-v3 sometimes fails | Windows paging file too small | Increase virtual memory to 8GB+ |
| DistilBERT sentiment skipped | Only 2.6GB free after STT | Same fix above |
| Audio loading warnings | ffmpeg not installed | `winget install ffmpeg` |
| TextBlob not available | Not installed | `venv\Scripts\pip install textblob` |
| NVIDIA NIM 1000 req/day limit | Free tier | Switch to Groq free tier (14,400/day) |

---

## SUPPORTED LANGUAGES (22 Indian + English)

| Code | Language | Script |
|------|----------|--------|
| hi | Hindi | Devanagari |
| bn | Bengali | Bengali |
| ta | Tamil | Tamil |
| te | Telugu | Telugu |
| mr | Marathi | Devanagari |
| gu | Gujarati | Gujarati |
| kn | Kannada | Kannada |
| ml | Malayalam | Malayalam |
| pa | Punjabi | Gurmukhi |
| or | Odia | Odia |
| as | Assamese | Bengali |
| ur | Urdu | Arabic |
| sa | Sanskrit | Devanagari |
| mai | Maithili | Devanagari |
| kok | Konkani | Devanagari |
| ne | Nepali | Devanagari |
| sd | Sindhi | Arabic |
| ks | Kashmiri | Arabic |
| doi | Dogri | Devanagari |
| mni | Manipuri | Bengali |
| sat | Santali | Ol Chiki |
| brx | Bodo | Devanagari |
| en | English | Latin |
| hi+en | Hinglish | Mixed | ← handled natively by Whisper |
