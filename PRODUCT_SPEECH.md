# Armor.ai — Product Speech
### Full Product Presentation | Every Feature, Every Model, Every Page

---

## OPENING

Good [morning/afternoon/evening] everyone.

Today I want to walk you through **Armor.ai** — also known as **FinSentiq** — a product I built from the ground up to solve a very real problem in India's financial ecosystem.

India has over 500 million people who discuss money, investments, loans, and financial decisions every single day — in Hindi, Gujarati, Tamil, Telugu, Bengali, and 18 other languages. But the tools that analyze those conversations? They only understand English.

Armor.ai changes that.

---

## WHAT IS ARMOR.AI?

Armor.ai is an **AI-powered financial conversation intelligence platform**.

You speak in your language — Hindi, Gujarati, Tamil, whatever — and Armor.ai listens, transcribes, translates, and extracts deep financial insights from what you said. It tells you the intent behind the conversation, the risk level, the sentiment, the urgency, the amounts mentioned, the parties involved, and gives you a one-line summary of the entire financial meaning.

Think of it as a financial analyst that understands every Indian language, works 24/7, costs nothing to run, and never misses a detail.

---

## THE PROBLEM WE SOLVE

When a customer calls their bank and says — in Gujarati — "mutual fund ma SIP sharu karvu chhe, pan portfolio thodu sudharvanu chhe" — that conversation is recorded, stored, and forgotten. No one extracts the intent. No one flags the risk. No one follows up.

Armor.ai processes that conversation and tells you:
- Intent: Investment advice
- Domain: Personal finance
- Emotion: Hopeful
- Risk: Low
- Summary: "Customer wants to start a SIP in mutual funds and improve their portfolio"
- Keywords: mutual fund, SIP, portfolio

That's the value. Let me show you how it works.

---

## THE PIPELINE — HOW IT WORKS

Every audio file goes through a **three-stage AI pipeline**:

### Stage 1 — Speech to Text

The audio is transcribed using **OpenAI Whisper Large V3** — the most accurate open-source speech recognition model available today. It supports all 22 scheduled Indian languages plus Hinglish — code-switched Hindi-English that most models completely fail on.

We run Whisper on a **NVIDIA GPU** — specifically an RTX 3050 — using CUDA float16 precision. This gives us roughly 5 to 10 times faster transcription compared to CPU. For a 36-second audio clip, transcription completes in under 2 minutes including model load time.

We've built a **three-tier fallback system**:
- First, we try **Whisper Large V3** — 3GB model, best accuracy
- If RAM is tight, we fall back to **Faster-Whisper Medium** — 1.4GB, CTranslate2 optimized, 4x faster
- Emergency fallback: **Faster-Whisper Tiny** — 72MB, always fits in memory, never crashes

We also apply **anti-hallucination settings** — no-repeat n-gram size of 5, compression ratio threshold, log probability threshold, and greedy decoding at temperature zero. This prevents the model from generating repetitive garbage output like "ताए ताए ताए" which is a known Whisper failure mode on Indian languages.

For long recordings — anything over 5 minutes — we use **adaptive chunking**: 60-second windows with 10-second overlap, processed in batches of 8 on GPU. This makes the system scalable to hour-long recordings without running out of memory.

We also support **pydub-based audio conversion** — so .webm files from browser recordings, .m4a from iPhones, .ogg, .aac — all get converted to 16kHz mono WAV before processing. No more broken transcriptions from unsupported formats.

### Stage 2 — Translation

Once we have the Indian language transcript, we translate it to English using **Google Translate via the deep-translator library**. This gives us the best quality translation for Hinglish and code-switched speech — something local models struggle with.

If Google Translate is unavailable, we fall back to **Argostranslate** — a fully offline neural translation engine. And if that fails too, we pass the original text through unchanged. The pipeline never crashes.

### Stage 3 — Insights Engine

This is where the real intelligence happens. The English text goes through four sub-components:

**Finance Detector** — A pure keyword and regex filter. No machine learning. It checks the text against over 50 English finance keywords, Hindi romanized terms, Devanagari script, and keywords in Tamil, Telugu, Bengali, Gujarati, Kannada, Malayalam, Punjabi, and Urdu. Currency patterns like ₹5000 or "5000 rupees" are caught by regex. This runs in microseconds and if no finance content is found, we skip all the heavy models — saving significant compute time.

**Sentiment Engine** — We use **DistilBERT multilingual** — specifically the `lxyuan/distilbert-base-multilingual-cased-sentiments-student` model — fine-tuned for sentiment across English and Indian languages. It returns positive, negative, or neutral with a confidence score. If the model can't load due to memory constraints, we fall back to TextBlob, and then to a keyword-based fallback. The system always produces a result.

**Local NLP** — We use **spaCy** for named entity recognition and keyword extraction. It identifies PERSON, ORG, MONEY, DATE, CARDINAL, and GPE entities. Keywords are extracted as lemmatized nouns and meaningful verbs with stop words filtered out. We try the large English model first — 750MB — and fall back to the small 12MB model.

**LLM Extractor** — The deepest layer. We call **Meta's LLaMA 3.1 8B Instruct** model via the **NVIDIA NIM API**. This is a cloud-hosted inference endpoint — zero local RAM cost, just an HTTP call. The LLM extracts things that no local model can: the financial intent — whether it's investment advice, a loan query, a payment request, or a fraud alert. The domain — personal finance, banking, insurance, tax. A one-sentence English summary of the entire conversation. The emotion — worried, stressed, hopeful, urgent, satisfied. The urgency level. The risk level. The monetary amount mentioned. The parties involved — banks, UPI apps, people. And the deadline if one was mentioned.

The full output is a **25-key JSON** that gets stored in our database and drives every feature in the product.

---

## THE TECH STACK

On the **frontend**, we use React 19 with React Router, Tailwind CSS, and Recharts for data visualization. The UI supports full light and dark themes.

On the **backend**, we use Node.js with Express, connected to **Supabase** — a managed PostgreSQL database with built-in storage. Audio files are uploaded to Supabase Storage and served via public URLs. The AI pipeline runs as a Python subprocess spawned by Node.js — completely decoupled, so a slow transcription never blocks the API.

The **AI module** is Python 3.12 with PyTorch 2.5.1 CUDA 12.1, Transformers, faster-whisper, spaCy, and the NVIDIA NIM API client.

The database has three tables: **users**, **recordings**, and **transcripts**. Every transcript stores the full 25-key insights JSON in a JSONB column, making it queryable and aggregatable.

---

## THE PAGES — WHAT USERS SEE

Let me walk you through every page of the product.

**Landing Page** — The public marketing page. Clean, minimal, communicates the value proposition.

**Login and Signup** — Standard JWT authentication backed by Supabase Auth.

**Dashboard Home** — The first thing you see after login. An animated orb with a microphone — tap it and it navigates to Live Detection with a waveform animation. Live stats: total sessions analyzed, finance detected percentage, high-risk flags. Quick access to reports, insights, and settings.

**Live Detection** — The core recording page. You can record directly from your microphone or upload an audio file. You choose the transcription mode: **Fast** uses Sarvam AI's cloud API — about 5 seconds, supports 11 Indian languages, limited to one use per day. **Accurate** uses local Whisper on your GPU — 1 to 5 minutes, unlimited, fully offline, GPU accelerated. You also select the language — Hindi, Gujarati, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, Punjabi, Urdu, English, or Auto-detect. The recording list shows all your sessions with confidence scores, status badges, risk levels, and language — but language only appears once processing is complete, not before.

**Sessions / History** — A paginated list of all your recordings. Each row shows the filename, date, size, pipeline mode, confidence, status, risk level, and language. You can view, edit insights, retry failed transcriptions, or delete.

**Session Detail** — The full view of a single session. Shows the original transcript in the source language, the English translation, all extracted insights — intent, domain, summary, emotion, urgency, risk level, amount, entities, keywords — and the full raw JSON for developers.

**Insights Editor** — A form-based editor where you can manually correct any AI-extracted field. Supports both a structured form view and a raw JSON editor that syncs bidirectionally. Useful for correcting misdetections or adding context the AI missed.

**Insights Page** — Aggregated intelligence across all your sessions. A hero banner with live stats. An AI-generated summary paragraph. KPI cards for total sessions, AI coverage, finance detected, high urgency, high risk, and low risk. Charts for risk distribution, emotional tone, sentiment timeline, domain breakdown, user intent, financial keywords, and urgency analysis. A financial content coverage section showing exactly how much of your data has been analyzed.

**Analytics Page** — Deep dive analytics with three tabs: Dashboard, Transcripts, and Deep Dive. The dashboard shows sentiment trend over time as an area chart, sentiment split as a donut chart, top financial keywords as a bar chart, a risk score gauge, domain distribution, emotion breakdown, risk distribution tiles, speaker breakdown table, and active reminders panel.

**Reports Page** — Generate professional markdown reports from your conversation data powered by NVIDIA NIM. Select a time range — 7, 10, 14, or 30 days. Choose which sections to include: Overview, Risk Analysis, Sentiment Trends, Intent Breakdown, Key Financial Terms, and Recommendations. The report renders with proper markdown formatting — headers, bullet points, bold text — not raw text. Generated reports are saved in history and can be downloaded as markdown files.

**Alerts Page** — High-risk financial events flagged by the AI. Configurable thresholds. In-app notifications for things like hidden charges, missed EMIs, or mis-selling patterns detected in conversations.

**Reminders Page** — Action items extracted by the LLM from conversations. Things like "Transfer Rs 5000 to Rahul by tomorrow" or "Start SIP after resolving investment issue." Reminders can be resolved once acted upon.

**Profile Page** — User profile with name, email, mobile number, location, monthly salary, EMI status, and total assets. Financial snapshot view. AI Shield status indicator. Sign out.

**Settings Page** — App preferences and configuration.

---

## THE MODELS — COMPLETE LIST

Let me give you the complete model inventory:

| Model | Purpose | Size | Cost |
|-------|---------|------|------|
| OpenAI Whisper Large V3 | Primary STT | 3GB | Free |
| Systran Faster-Whisper Medium | STT fallback | 1.4GB | Free |
| Systran Faster-Whisper Tiny | Emergency STT | 72MB | Free |
| Google Translate (deep-translator) | Translation | 0MB (API) | Free |
| Argostranslate | Offline translation | ~200MB | Free |
| DistilBERT Multilingual Sentiment | Sentiment analysis | 1.5GB | Free |
| spaCy en_core_web_sm/lg | NER + keywords | 12MB–750MB | Free |
| Meta LLaMA 3.1 8B (NVIDIA NIM) | Deep insights | 0MB local | Free tier |

Total local cost: zero dollars. Total cloud cost: zero dollars within free tier limits.

---

## WHAT MAKES THIS DIFFERENT

Three things set Armor.ai apart.

**First — Indian language first.** This isn't an English product with translation bolted on. The entire pipeline is designed around Indian languages. The STT models are tuned with script-anchoring prompts. The finance detector has keywords in 10 Indian scripts. The LLM prompt is specifically designed for Indian financial conversations including UPI, SIP, EMI, and Hinglish.

**Second — Zero cost, fully local.** Every model except the LLM runs on your own hardware. No per-minute transcription fees. No API costs for sentiment or NLP. The only cloud call is the LLM, which is free within NVIDIA NIM's daily limit. For a small financial advisory firm processing 50 conversations a day, the cost is literally zero.

**Third — GPU accelerated and scalable.** With CUDA float16 and batch size 8 on an RTX 3050, we process a 36-second audio clip in under 2 minutes including model load. For longer recordings, adaptive chunking handles hours of audio without memory issues. The system is designed to scale.

---

## CLOSING

Armor.ai is a complete, production-ready financial intelligence platform. It takes audio in any Indian language, runs it through a multi-stage AI pipeline, and produces structured financial insights that drive real decisions.

Every page is functional. Every model is integrated. Every feature works end to end.

This is not a prototype. This is a product.

Thank you.

---

*Built with: React 19 · Node.js · Express · Supabase · Python 3.12 · PyTorch CUDA · Whisper · spaCy · LLaMA 3.1 · NVIDIA NIM*
