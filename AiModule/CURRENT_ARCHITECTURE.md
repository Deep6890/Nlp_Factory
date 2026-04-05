# AiModule — Current Architecture (Live State)
# Last verified: April 2026

---

## SYSTEM FLOW

```
Teammate's Node.js Backend (10.0.20.14)
            │
            │  POST /process-audio
            │  Header: x-api-key: aimodule-secret-2026
            │  Body: audio file + language=hi
            ▼
┌─────────────────────────────────────────┐
│         api_server.py                   │
│         FastAPI on 10.0.20.228:8000     │
│                                         │
│  POST /process-audio  (audio → JSON)    │
│  POST /process        (text  → JSON)    │
│  GET  /health         (ping)            │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────┐
       │   STAGE 1      │
       │   STT          │  SpeechToText/indic_stt.py
       └───────┬────────┘
               │
       ┌───────▼────────┐
       │   STAGE 2      │
       │   TRANSLATE    │  LangtextToEng/translation_pipeline.py
       └───────┬────────┘
               │
       ┌───────▼────────┐
       │   STAGE 3      │
       │   INSIGHTS     │  insightsEngine/pipeline.py
       └───────┬────────┘
               │
               ▼
         25-key JSON
     returned to teammate
```

---

## CURRENTLY INSTALLED PACKAGES (venv)

| Package | Version | Purpose |
|---------|---------|---------|
| torch | 2.11.0+cpu | ML inference (CPU only) |
| transformers | 5.5.0 | Whisper large-v3 loading |
| faster-whisper | latest | faster-whisper-medium/tiny |
| spacy | latest | Entity + keyword extraction |
| deep-translator | latest | Google Translate wrapper |
| openai | latest | NVIDIA NIM API client |
| fastapi | 0.135.3 | HTTP API server |
| uvicorn | 0.43.0 | ASGI server |
| textblob | latest | Sentiment fallback |
| python-multipart | latest | File upload handling |
| python-dotenv | latest | .env loading |
| psutil | latest | RAM monitoring |
| librosa | latest | Audio loading |
| langdetect | latest | Language detection |

---

## LOCALLY CACHED MODELS (on disk right now)

| Model | Size on Disk | Used In Pipeline |
|-------|-------------|-----------------|
| openai/whisper-large-v3 | 2948 MB | STT — Priority 1 |
| Systran/faster-whisper-medium | 1460 MB | STT — Priority 2 (fallback) |
| Systran/faster-whisper-tiny | 75 MB | STT — Priority 3 (emergency) |
| lxyuan/distilbert-base-multilingual-cased-sentiments-student | 519 MB | Sentiment — Priority 1 |
| facebook/nllb-200-distilled-600M | 4709 MB | NOT USED (old, replaced by Google Translate) |
| vasista22/whisper-hindi-large-v2 | 11777 MB | NOT USED (Hindi-only, replaced by multilingual) |
| sentence-transformers/all-MiniLM-L6-v2 | 87 MB | NOT USED |
| Vamsi/T5_Paraphrase_Paws | 851 MB | NOT USED |

Note: `facebook/nllb-200-distilled-600M` and `vasista22/whisper-hindi-large-v2` are cached
but NOT active. You can delete them to free ~16GB disk space:
```bash
# safe to delete — not used anywhere in current pipeline
huggingface-cli delete-cache
```

---

## STAGE 1 — SPEECH TO TEXT

**File:** `SpeechToText/indic_stt.py`
**Class:** `IndicSTT`
**Singleton:** one instance shared across all requests

### Model Priority (tries top to bottom, uses first that works)

```
┌─────────────────────────────────────────────────────────────────┐
│ Priority 1: openai/whisper-large-v3                             │
│   Size: 2948MB cached   RAM: ~3GB   Accuracy: BEST             │
│   Fails when: Windows paging file too small (OSError 1455)      │
│   License: MIT   Cost: $0   Runs: locally                       │
├─────────────────────────────────────────────────────────────────┤
│ Priority 2: Systran/faster-whisper-medium          ← ACTIVE NOW │
│   Size: 1460MB cached   RAM: ~900MB   Accuracy: GOOD            │
│   int8 quantized via CTranslate2 — 4x faster than transformers  │
│   License: MIT   Cost: $0   Runs: locally                       │
├─────────────────────────────────────────────────────────────────┤
│ Priority 3: Systran/faster-whisper-tiny                         │
│   Size: 75MB cached   RAM: ~200MB   Accuracy: LOW               │
│   Emergency only — always fits in RAM                           │
│   License: MIT   Cost: $0   Runs: locally                       │
└─────────────────────────────────────────────────────────────────┘
```

### Why whisper-large-v3 is Priority 1
Only free model covering all 22 Indian languages + Hinglish in one checkpoint.
Trained on 680,000 hours of multilingual audio. Language is forced via generation
kwargs — never auto-detects wrong language.

### Why faster-whisper-medium is the actual active model
Your machine has ~3.6GB free RAM. whisper-large-v3 needs ~3GB + Windows virtual
memory buffer for memory-mapped loading. When paging file is too small, it throws
OSError 1455 and falls to medium. Medium uses int8 quantization = 900MB RAM.

### Anti-hallucination settings (both models)
```python
no_repeat_ngram_size      = 5      # stops repetition loops
compression_ratio_threshold = 2.4  # rejects repetitive output
logprob_threshold         = -1.0   # rejects low-confidence output
temperature               = 0.0    # greedy, deterministic
condition_on_prev_tokens  = False  # no cascade errors
```

### Script-anchoring prompts (faster-whisper-medium only)
Forces correct script output, prevents romanization:
```
hi → "यह एक हिंदी वार्तालाप है।"
ta → "இது தமிழ் உரையாடல்."
te → "ఇది తెలుగు సంభాషణ."
bn → "এটি একটি বাংলা কথোপকথন।"
kn → "ಇದು ಕನ್ನಡ ಸಂಭಾಷಣೆ."
ml → "ഇത് ഒരു മലയാളം സംഭാഷണമാണ്."
gu → "આ એક ગુજરાતી વાર્તાલાપ છે."
pa → "ਇਹ ਇੱਕ ਪੰਜਾਬੀ ਗੱਲਬਾਤ ਹੈ।"
mr → "हे एक मराठी संभाषण आहे."
ur → "یہ ایک اردو گفتگو ہے۔"
```

### STT Output (passed to Stage 2)
```json
{
  "text": "5000 की SIP करनी है...",
  "language": "hi",
  "language_name": "hindi",
  "confidence": 1.0,
  "stt_model_used": "Systran/faster-whisper-medium",
  "stt_error": null,
  "audio_duration_sec": 17.88
}
```

---

## STAGE 2 — TRANSLATION

**File:** `LangtextToEng/translation_pipeline.py`

### Method Priority

```
┌─────────────────────────────────────────────────────────────────┐
│ Priority 1: Google Translate via deep-translator   ← ACTIVE NOW │
│   RAM: 0MB (HTTP call)   Quality: BEST                          │
│   Handles Hinglish perfectly                                    │
│   Free: ~500k chars/day (no API key needed)                     │
│   Needs: internet                                               │
├─────────────────────────────────────────────────────────────────┤
│ Priority 2: Argostranslate (offline)                            │
│   RAM: small   Quality: MEDIUM                                  │
│   Used when: no internet                                        │
│   License: MIT   Cost: $0                                       │
├─────────────────────────────────────────────────────────────────┤
│ Priority 3: Passthrough                                         │
│   Returns original text unchanged. Never crashes.              │
└─────────────────────────────────────────────────────────────────┘
```

### Why Google Translate replaced Facebook NLLB
Previous version loaded `facebook/nllb-200-distilled-600M` locally (4.7GB cached,
2.4GB RAM). After STT used 900MB, loading NLLB caused memory pressure and crashes.
Google Translate = 0MB RAM, better Hinglish quality, same speed.
NLLB model is still cached on disk but no longer used.

---

## STAGE 3 — INSIGHTS ENGINE

**File:** `insightsEngine/pipeline.py`
Runs 4 components in sequence. Always returns fixed 15-key dict.

---

### COMPONENT 1 — Finance Detector

**File:** `insightsEngine/finance_detector.py`
**Model:** None — pure Python regex + keyword sets
**RAM:** 0MB   **Speed:** microseconds   **Cost:** $0

Checks text against 200+ keywords across 10 languages + currency regex.
If no finance content → exits immediately, skips all ML models.
This saves ~15 seconds per non-finance request.

---

### COMPONENT 2 — Sentiment Engine

**File:** `insightsEngine/sentiment_engine.py`

```
┌─────────────────────────────────────────────────────────────────┐
│ Priority 1: lxyuan/distilbert-base-multilingual-cased-sentiments│
│   Size: 519MB cached   RAM: ~1.5GB needed                       │
│   Multilingual DistilBERT — understands Indian language context │
│   Returns: positive / negative / neutral + confidence score     │
│   License: MIT   Cost: $0   Runs: locally                       │
│   Status: SKIPPED when RAM < 3GB after STT                      │
├─────────────────────────────────────────────────────────────────┤
│ Priority 2: TextBlob                    ← ACTIVE (low RAM)      │
│   RAM: ~0MB   English only   Basic polarity scoring             │
│   Installed: YES (textblob OK confirmed)                        │
│   License: MIT   Cost: $0                                       │
├─────────────────────────────────────────────────────────────────┤
│ Priority 3: Keyword fallback                                     │
│   Hardcoded word lists. Always works. Score: ±0.3               │
└─────────────────────────────────────────────────────────────────┘
```

Why DistilBERT multilingual: TextBlob only does English. Your audio is Hindi/Hinglish.
Even after translation, the English is awkward and TextBlob misreads it. DistilBERT
was fine-tuned on multilingual sentiment data and understands financial frustration,
urgency, and worry in context.

---

### COMPONENT 3 — Local NLP

**File:** `insightsEngine/local_nlp.py`
**Model:** spaCy `en_core_web_sm` (en_core_web_lg tried first, not installed)
**RAM:** ~50MB   **Speed:** ~50ms   **Cost:** $0   **License:** MIT

Extracts:
- Named entities: PERSON, ORG, MONEY, DATE, CARDINAL, GPE, PERCENT
- Keywords: nouns, proper nouns, meaningful verbs (lemmatized, stop words removed)

Why spaCy not LLM for this: spaCy does entity extraction in 50ms locally for free.
Asking LLM to do it wastes API quota and adds 2-5 seconds.

---

### COMPONENT 4 — LLM Extractor

**File:** `insightsEngine/llm_extractor.py`
**Model:** `meta/llama-3.1-8b-instruct` via NVIDIA NIM API
**RAM:** 0MB locally (HTTP call)   **Latency:** ~2-5 seconds

```
Your machine  ──POST──▶  NVIDIA NIM API  ──▶  LLaMA 3.1 8B
                         integrate.api.nvidia.com
              ◀──JSON──  response
```

**Status: ACTIVE** — confirmed working (HTTP 200 OK in logs)
**API Key:** set in `insightsEngine/.env` as `NVIDIA_API_KEY`
**Free tier:** 1000 requests/day, 40 requests/minute
**Cost:** $0 within free tier
**License:** LLaMA 3.1 Community License (free for most uses)

Why LLM for this and not a local model: Understanding financial intent from speech
requires reasoning. "SIP करनी है पर investment में problem है" — a keyword model
sees "SIP" and "problem" but can't understand intent=investment_advice,
emotion=worried, urgency=low (future plan, not crisis). Only LLM can reason this.
Running 8B locally needs 16GB RAM. Your machine has 3.6GB free. Cloud is the only option.

Extracts:
```
intent       → investment_advice, loan_query, payment_request, etc.
domain       → personal_finance, banking, investment, etc.
summary      → one English sentence of the financial meaning
emotion      → worried / stressed / hopeful / urgent / neutral
urgency      → low / medium / high
action_items → ["Start SIP of Rs 5000 after resolving investment issue"]
risk_level   → low / medium / high
amount       → "Rs 5000"
parties      → ["HDFC Bank", "PhonePe"]
deadline     → "two years"
code_switched→ true (Hinglish detected)
```

---

## API SERVER

**File:** `api_server.py`
**Running on:** `http://10.0.20.228:8000`
**Framework:** FastAPI 0.135.3 + uvicorn 0.43.0
**Auth:** `x-api-key` header checked against `AI_API_KEY` in .env

### Endpoints

| Method | URL | What it does |
|--------|-----|-------------|
| GET | /health | Ping — returns `{"status":"ok"}` |
| POST | /process | Text in → insights JSON out (skips STT) |
| POST | /process-audio | Audio file in → full 25-key JSON out |

### Security
```
x-api-key: aimodule-secret-2026   ← teammate must send this header
```
Without correct key → 401 Unauthorized returned immediately.

---

## FINAL OUTPUT JSON (25 keys)

```json
{
  "original_transcript":  "5000 की SIP करनी है...",
  "detected_language":    "hi",
  "language_name":        "hindi",
  "stt_confidence":       1.0,
  "stt_model_used":       "Systran/faster-whisper-medium",
  "audio_duration_sec":   17.88,
  "stt_error":            null,

  "english_text":         "Have to do SIP of Rs 5000",
  "translation_applied":  true,

  "finance_detected":     true,
  "sentiment_label":      "neutral",
  "sentiment_score":      0.0,
  "intent":               "investment_advice",
  "domain":               "personal_finance",
  "summary":              "The speaker intends to invest Rs 5000 through a SIP.",
  "emotion":              "neutral",
  "urgency":              "low",
  "risk_level":           "low",
  "amount":               "Rs 5000",
  "entities":             [{"text":"5000","type":"CARDINAL","start":21,"end":25}],
  "keywords":             ["sip","invest"],

  "pipeline_version":     "3.0-ai4bharat",
  "processed_at":         "2026-04-05T11:28:13",
  "total_time_sec":       49.62
}
```

---

## CURRENT STATUS SUMMARY

| Component | Model | Status | Why |
|-----------|-------|--------|-----|
| STT | faster-whisper-medium | ACTIVE | large-v3 fails due to paging file |
| Translation | Google Translate | ACTIVE | working, internet available |
| Finance filter | keyword/regex | ACTIVE | always works |
| Sentiment | TextBlob | ACTIVE | DistilBERT skipped (low RAM after STT) |
| NER + Keywords | spaCy en_core_web_sm | ACTIVE | working |
| LLM insights | LLaMA 3.1 8B / NVIDIA NIM | ACTIVE | confirmed HTTP 200 OK |
| API server | FastAPI 0.135.3 | RUNNING | http://10.0.20.228:8000 |
| Teammate connection | Node.js 10.0.20.14 | CONNECTED | confirmed in logs |

---

## WHAT CAN BE IMPROVED

| Issue | Fix | Impact |
|-------|-----|--------|
| Paging file too small | Windows → System → Advanced → Virtual Memory → set to 8GB | Enables whisper-large-v3 + DistilBERT sentiment |
| Audio loading warnings | `winget install ffmpeg` | Cleaner logs, faster audio loading |
| NLLB + old models wasting 16GB disk | `huggingface-cli delete-cache` → select unused models | Free up disk space |
| NVIDIA NIM 1000 req/day limit | Switch to Groq API (14,400/day free, faster) | Higher throughput |

---

## SUPPORTED LANGUAGES

22 Indian languages + English + Hinglish (code-switched):
Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam,
Punjabi, Odia, Assamese, Urdu, Sanskrit, Maithili, Konkani, Nepali,
Sindhi, Kashmiri, Dogri, Manipuri, Santali, Bodo, English, Hinglish
