<div align="center">

<br/>

<img src="https://img.shields.io/badge/Armor.ai-Financial%20Intelligence-4A7C3F?style=for-the-badge&logo=shield&logoColor=white" />

<br/><br/>

```
  █████╗ ██████╗ ███╗   ███╗ ██████╗ ██████╗      █████╗ ██╗
 ██╔══██╗██╔══██╗████╗ ████║██╔═══██╗██╔══██╗    ██╔══██╗██║
 ███████║██████╔╝██╔████╔██║██║   ██║██████╔╝    ███████║██║
 ██╔══██║██╔══██╗██║╚██╔╝██║██║   ██║██╔══██╗    ██╔══██║██║
 ██║  ██║██║  ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║    ██║  ██║██║
 ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝╚═╝
```

<br/>

**Trade Smarter. Protect More.**

*AI-powered financial conversation intelligence for every Indian language*

<br/>

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![PyTorch](https://img.shields.io/badge/PyTorch-CUDA-EE4C2C?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-7DC842?style=flat-square)](LICENSE)

<br/>

[Overview](#-overview) · [Features](#-features) · [Architecture](#-architecture) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [AI Pipeline](#-ai-pipeline) · [Pages](#-pages) · [Team](#-team)

</div>

---

## Overview

**Armor.ai** is a full-stack, multilingual financial conversation intelligence platform. It records audio in any Indian language — Hindi, Gujarati, Tamil, Telugu, Bengali, and more — transcribes it using state-of-the-art speech models, translates it to English, and extracts deep financial insights: intent, sentiment, risk level, entities, keywords, and a one-line summary.

Built for financial advisors, banks, and individuals who operate in India's mixed-language reality, Armor.ai bridges the gap between casual financial conversations and structured, actionable intelligence.

> Built for **HACK2FUTURE 2.0** at CHARUSAT University by **Team Lazy Legends**

---

## Features

| Capability | Description |
|---|---|
| 🎙️ **Multilingual STT** | Whisper Large V3 — supports all 22 scheduled Indian languages + Hinglish |
| 🌐 **Auto Translation** | Google Translate + Argostranslate offline fallback |
| 🔍 **Finance Detection** | 50+ keywords across 10 Indian scripts with regex currency patterns |
| 🧠 **LLM Insights** | LLaMA 3.1 8B via NVIDIA NIM — intent, domain, summary, emotion, risk |
| 📊 **Sentiment Analysis** | DistilBERT multilingual — positive / negative / neutral with confidence |
| 🏷️ **Named Entity Recognition** | spaCy — persons, orgs, amounts, dates, locations |
| ⚠️ **Risk Intelligence** | Automated risk scoring with configurable alert thresholds |
| 📈 **Analytics Dashboard** | Charts, trends, KPIs, and deep-dive analytics across all sessions |
| 📝 **AI Report Generation** | Markdown reports powered by NVIDIA NIM with downloadable output |
| 🔔 **Smart Reminders** | LLM-extracted action items from financial conversations |
| 🌙 **Dark / Light Theme** | Full theme support across all pages |
| 🔒 **Auth & Profiles** | JWT authentication backed by Supabase Auth |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          ARMOR.AI PLATFORM                          │
│                                                                     │
│  ┌─────────────────────┐          ┌──────────────────────────────┐  │
│  │   🌐 REACT FRONTEND  │  ──────▶  │     ⚙️ NODE.JS BACKEND       │  │
│  │   React 19 + Router  │   REST   │     Express + Supabase       │  │
│  │   Tailwind + Recharts│   API    │                              │  │
│  │                      │          │  • Auth & JWT middleware      │  │
│  │  • Landing Page      │          │  • Recording management      │  │
│  │  • Live Detection    │          │  • Transcript storage        │  │
│  │  • Analytics         │          │  • Report generation         │  │
│  │  • Reports           │          │  • AI subprocess spawner     │  │
│  │  • Insights Editor   │          └──────────────┬───────────────┘  │
│  └─────────────────────┘                         │                  │
│                                                   ▼                  │
│                              ┌──────────────────────────────────┐   │
│                              │       🤖 PYTHON AI MODULE         │   │
│                              │       PyTorch CUDA + Whisper      │   │
│                              │                                   │   │
│                              │  Stage 1 → Speech to Text         │   │
│                              │    • Whisper Large V3 (GPU)       │   │
│                              │    • Faster-Whisper Medium        │   │
│                              │    • Faster-Whisper Tiny          │   │
│                              │                                   │   │
│                              │  Stage 2 → Translation            │   │
│                              │    • Google Translate             │   │
│                              │    • Argostranslate (offline)     │   │
│                              │                                   │   │
│                              │  Stage 3 → Insights Engine        │   │
│                              │    • Finance Detector             │   │
│                              │    • DistilBERT Sentiment         │   │
│                              │    • spaCy NER                    │   │
│                              │    • LLaMA 3.1 8B (NVIDIA NIM)   │   │
│                              └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Nlp_Factory/
│
├── 🌐 frontEndApp/
│   └── armor-project/              # React Web Application
│       ├── public/
│       │   └── index.html          # Armor.ai favicon + meta tags
│       └── src/
│           ├── pages/              # Full-page route components
│           │   ├── LandingPage.jsx
│           │   ├── LoginPage.jsx
│           │   ├── SignupPage.jsx
│           │   ├── DashboardHome.jsx
│           │   ├── LiveDetectionPage.jsx
│           │   ├── InsightsPage.jsx
│           │   ├── AnalyticsPage.jsx
│           │   ├── ReportsPage.jsx
│           │   ├── AlertsPage.jsx
│           │   └── ...
│           ├── components/         # Reusable UI components
│           ├── context/            # React context (Auth, Theme, Insights)
│           ├── api/                # API client functions
│           └── lib/                # Supabase client
│
├── ⚙️ Backend/
│   └── src/
│       ├── controllers/            # Route handlers
│       ├── services/               # Business logic
│       ├── routes/                 # Express route definitions
│       ├── middlewares/            # Auth, rate limiting
│       └── config/
│           └── supabase.js         # Supabase client config
│
├── 🤖 AiModule/
│   ├── process_audio.py            # CLI entry point for AI pipeline
│   ├── fast_pipeline.py            # Fast mode pipeline
│   ├── SpeechToText/
│   │   ├── indic_stt.py            # Whisper STT with 3-tier fallback
│   │   ├── audio_pipeline.py       # Full STT → Translation → Insights
│   │   └── sarvam_stt.py           # Sarvam AI cloud STT (fast mode)
│   ├── LangtextToEng/
│   │   └── translation_pipeline.py # Translation engine
│   ├── insightsEngine/
│   │   ├── pipeline.py             # Insights orchestrator
│   │   ├── finance_detector.py     # Keyword + regex finance filter
│   │   ├── sentiment_engine.py     # DistilBERT sentiment
│   │   ├── local_nlp.py            # spaCy NER + keywords
│   │   └── llm_extractor.py        # LLaMA 3.1 via NVIDIA NIM
│   └── TextToLang/
│       └── detectors/              # Language detection engines
│
├── 📱 my_app/
│   └── server/                     # Embedded Node.js server
│
├── .gitignore                      # Root gitignore
└── README.md                       # This file
```

---

## Tech Stack

### Frontend

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Routing | React Router v7 |
| Styling | Tailwind CSS 3 |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| Auth Client | Supabase JS |

### Backend

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | Supabase (PostgreSQL) |
| Storage | Supabase Storage |
| Auth | JWT + Supabase Auth |
| AI Bridge | Python subprocess |

### AI Module

| Model | Purpose | Size |
|---|---|---|
| OpenAI Whisper Large V3 | Primary STT | 3 GB |
| Systran Faster-Whisper Medium | STT fallback | 1.4 GB |
| Systran Faster-Whisper Tiny | Emergency fallback | 72 MB |
| Sarvam AI (cloud) | Fast mode STT | — |
| Google Translate | Translation | — |
| Argostranslate | Offline translation | ~200 MB |
| DistilBERT Multilingual | Sentiment analysis | 1.5 GB |
| spaCy en_core_web_lg | NER + keywords | 750 MB |
| Meta LLaMA 3.1 8B (NVIDIA NIM) | Deep insights | — |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12
- CUDA-capable GPU (recommended — RTX 3050 or better)
- Supabase account

---

### 1. Clone the Repository

```bash
git clone https://github.com/24AIMl018-DEEP/Nlp_Factory.git
cd Nlp_Factory
```

---

### 2. Backend Setup

```bash
cd Backend
npm install

# Create your environment file
cp .env.example .env
# Fill in your Supabase URL, anon key, and JWT secret
```

```bash
# Start the backend server
npm run dev
# → Runs on http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontEndApp/armor-project
npm install

# Create your environment file
echo "REACT_APP_API_URL=http://localhost:5000" > .env
```

```bash
# Start the development server
npm start
# → Opens at http://localhost:3000
```

---

### 4. AI Module Setup

```bash
cd AiModule

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r SpeechToText/requirements_stt.txt
pip install -r insightsEngine/requirements.txt
pip install -r LangtextToEng/requirements.txt

# Download spaCy model
python -m spacy download en_core_web_lg
```

```bash
# Test the pipeline directly
python process_audio.py path/to/audio.wav --mode slow
```

---

## AI Pipeline

Every audio file flows through a three-stage pipeline producing a **25-key JSON** output.

```
Audio File (.wav / .webm / .m4a / .mp3)
        │
        ▼
┌───────────────────────────────────┐
│  STAGE 1 — Speech to Text         │
│                                   │
│  1. Whisper Large V3 (GPU fp16)   │
│     └─ fallback: FW Medium        │
│         └─ fallback: FW Tiny      │
│                                   │
│  Anti-hallucination settings:     │
│  • temperature = 0 (greedy)       │
│  • compression_ratio_threshold    │
│  • logprob_threshold              │
│  • batch_size = 1 (stable CUDA)   │
└──────────────┬────────────────────┘
               │  raw transcript (Indian language)
               ▼
┌───────────────────────────────────┐
│  STAGE 2 — Translation            │
│                                   │
│  Google Translate → English       │
│  └─ fallback: Argostranslate      │
│      └─ fallback: pass-through    │
└──────────────┬────────────────────┘
               │  english text
               ▼
┌───────────────────────────────────┐
│  STAGE 3 — Insights Engine        │
│                                   │
│  • Finance Detector               │
│    50+ keywords, 10 scripts       │
│    Currency regex (₹, Rs, INR)    │
│                                   │
│  • Sentiment Engine               │
│    DistilBERT multilingual        │
│    → positive / negative / neutral│
│                                   │
│  • Local NLP (spaCy)              │
│    → entities, keywords           │
│                                   │
│  • LLM Extractor (LLaMA 3.1 8B)  │
│    → intent, domain, summary      │
│    → emotion, urgency, risk       │
│    → amount, parties, deadline    │
└──────────────┬────────────────────┘
               │
               ▼
        25-key JSON output
```

### Output Schema

```json
{
  "original_transcript": "...",
  "detected_language": "gu",
  "language_name": "gujarati",
  "stt_confidence": 0.85,
  "stt_model_used": "openai/whisper-large-v3",
  "audio_duration_sec": 46.1,
  "english_text": "...",
  "translation_applied": true,
  "finance_detected": true,
  "sentiment_label": "positive",
  "sentiment_score": 0.91,
  "intent": "investment_advice",
  "domain": "personal_finance",
  "summary": "Customer wants to start a SIP in mutual funds.",
  "emotion": "hopeful",
  "urgency": "low",
  "risk_level": "low",
  "amount": "5000",
  "entities": [{"text": "SBI", "type": "ORG"}, ...],
  "keywords": ["SIP", "mutual fund", "portfolio"],
  "mode": "slow",
  "pipeline_version": "3.1-sarvam+ai4bharat",
  "processed_at": "2026-04-10T00:00:00",
  "total_time_sec": 294.05
}
```

---

## Pages

| Page | Route | Description |
|---|---|---|
| Landing | `/` | Marketing page with hero, features, pricing |
| Login | `/login` | JWT authentication |
| Signup | `/signup` | New account registration |
| Dashboard | `/dashboard` | Overview with live stats and quick actions |
| Live Detection | `/dashboard/live` | Record or upload audio for analysis |
| History | `/dashboard/history` | Paginated session list with filters |
| Session Detail | `/dashboard/sessions/:id` | Full transcript + insights view |
| Insights Editor | `/dashboard/insights-editor/:id` | Manually correct AI-extracted fields |
| Insights | `/dashboard/insights` | Aggregated intelligence across all sessions |
| Analytics | `/dashboard/analytics` | Deep-dive charts and trend analysis |
| Reports | `/dashboard/reports` | AI-generated markdown reports |
| Alerts | `/dashboard/alerts` | High-risk event notifications |
| Reminders | `/dashboard/reminders` | LLM-extracted action items |
| Profile | `/dashboard/profile` | User profile and financial snapshot |
| Settings | `/dashboard/settings` | App preferences |

---

## Supported Languages

```
Indian Languages
├── Hindi (hi)          ├── Tamil (ta)
├── Gujarati (gu)       ├── Telugu (te)
├── Bengali (bn)        ├── Kannada (kn)
├── Malayalam (ml)      ├── Punjabi (pa)
├── Marathi (mr)        ├── Urdu (ur)
├── Assamese (as)       ├── Odia (or)
└── Hinglish            └── English (en)

Financial Domains
├── Investments — Mutual funds, SIP, stocks, bonds
├── Banking     — Loans, EMI, FD, accounts, UPI
├── Insurance   — Policies, premiums, claims
├── Tax         — ITR, GST, deductions
└── Risk        — Fraud signals, anomaly patterns
```

---

## Environment Variables

### Backend (`Backend/.env`)

```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
```

### Frontend (`frontEndApp/armor-project/.env`)

```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### AI Module (`AiModule/.env`)

```env
NVIDIA_API_KEY=your_nvidia_nim_api_key
```

---

## Team

<div align="center">

| Member | Role |
|---|---|
| **Deep** | AI Pipeline · Backend · NLP Architecture |
| **Dhairya** | Full Stack · System Integration |
| **Krish** | Frontend · UI/UX Design |
| **Mayur** | Mobile · Flutter Development |

<br/>

*Built with ❤️ at HACK2FUTURE 2.0 — CHARUSAT University*

</div>

---

## License

This project was developed for HACK2FUTURE 2.0. All rights reserved by Team Lazy Legends.

---

<div align="center">

<br/>

**🛡️ Armor.ai — Protecting every financial conversation**

*Because what you say about money matters.*

<br/>

Must ⭐ Star this repo if Armor.ai impresses you

</div>


