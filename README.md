<div align="center">

<br/>

```
   ▄████████    ▄████████   ▄▄▄▄███▄▄▄▄    ▄██████▄     ▄████████       ▄████████  ▄█
  ███    ███   ███    ███ ▄██▀▀▀███▀▀▀██▄ ███    ███   ███    ███      ███    ███ ███
  ███    ███   ███    ███ ███   ███   ███ ███    ███   ███    ███      ███    ███ ███
  ███    ███  ▄███▄▄▄▄██▀ ███   ███   ███ ███    ███  ▄███▄▄▄▄██▀     ███    ███ ███
▀███████████ ▀▀███▀▀▀▀▀   ███   ███   ███ ███    ███ ▀▀███▀▀▀▀▀▀     ▀███████████ ███
  ███    ███ ▀███████████ ███   ███   ███ ███    ███ ▀███████████       ███    ███ ███
  ███    ███   ███    ███ ███   ███   ███ ███    ███   ███    ███       ███    ███ ███▌▄
  ███    █▀    ███    ███  ▀█   ███   █▀   ▀██████▀    ███    ███       ███    █▀  █████▀
               ███    ███                              ███    ███
```

<br/>

<img src="https://img.shields.io/badge/Hackathon-HACK2FUTURE%202.0-1a1a2e?style=for-the-badge&logo=trophy&logoColor=lime" />
<img src="https://img.shields.io/badge/Team-Lazy%20Legends-0d1117?style=for-the-badge&logo=github&logoColor=lime" />
<img src="https://img.shields.io/badge/Status-Active%20Development-22c55e?style=for-the-badge" />
<img src="https://img.shields.io/badge/Platform-Flutter%20%2B%20React-0ea5e9?style=for-the-badge" />

<br/><br/>

### 🛡️ Multilingual Financial Intelligence Platform

**Record → Transcribe → Analyze → Protect**

*AI-powered financial conversation intelligence in Hindi, Hinglish, Gujarati & English*

<br/>

[📱 Mobile App](#-mobile-app-flutter) · [🌐 Web Dashboard](#-web-dashboard-react) · [⚙️ Backend](#%EF%B8%8F-backend-server) · [🚀 Quick Start](#-quick-start) · [📋 Roadmap](#-roadmap)

</div>

---

## 🧠 What is Armor.ai?

Armor.ai is a **multilingual financial intelligence system** that works silently in the background — recording conversations, detecting financial keywords, extracting key entities, and surfacing risk signals in real time.

Built for users who operate in mixed-language environments (Hindi, Hinglish, Gujarati, English), Armor.ai bridges the gap between casual financial discussions and structured financial data.

> **Built for HACK2FUTURE 2.0 @ CHARUSAT University by Team Lazy Legends**

---

## ✨ Core Capabilities

| Feature | Description |
|---|---|
| 🎙️ **Background Recording** | Continuous low-power audio capture on mobile |
| 🌐 **Multilingual NLP** | Understands Hindi, Hinglish, Gujarati, and English |
| 🔍 **Financial Keyword Detection** | Identifies investment, loan, risk, and transaction terms |
| 🧩 **Entity Extraction** | Pulls out amounts, dates, parties, and instruments |
| 📈 **Decision Tracking** | Tracks financial decisions made over time |
| ⚠️ **Risk Analysis** | Flags anomalous or high-risk financial patterns |
| 📊 **Analytics Dashboard** | Visual insights via a clean React web interface |
| ☁️ **Cloud Sync** | Auto-upload when connected, offline-first architecture |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ARMOR.AI SYSTEM                          │
│                                                                 │
│   ┌──────────────────┐          ┌──────────────────────────┐   │
│   │   📱 MOBILE APP   │          │     🌐 WEB DASHBOARD      │   │
│   │   Flutter 3.11+   │  ──────▶ │     React 18 + Recharts  │   │
│   │                   │   REST   │                          │   │
│   │ • Audio Capture   │   API    │ • Analytics & Charts     │   │
│   │ • Local SQLite    │          │ • Recording Management   │   │
│   │ • BG Service      │          │ • Risk Intelligence      │   │
│   │ • Auto Upload     │          │ • Entity Explorer        │   │
│   └──────────────────┘          └──────────────────────────┘   │
│             │                                ▲                  │
│             ▼                                │                  │
│   ┌──────────────────────────────────────────┘                  │
│   │           ⚙️ NODE.JS BACKEND (Express)                      │
│   │                                                             │
│   │   • Audio processing & transcription pipeline              │
│   │   • Multilingual NLP engine                                │
│   │   • Financial keyword & entity extraction                  │
│   │   • Risk scoring engine                                    │
│   │   • SQLite persistence layer                               │
│   └─────────────────────────────────────────────────────────── ┘
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
lazy-legends/
│
├── 📱 my_app/                          # Flutter Mobile Application
│   ├── lib/
│   │   ├── main.dart                   # App entry point & initialization
│   │   ├── models/                     # Data models (Recording, Entity, etc.)
│   │   ├── services/
│   │   │   ├── audio_service.dart      # Background audio capture engine
│   │   │   ├── upload_queue.dart       # Offline-first upload queue
│   │   │   └── schedule_service.dart   # Smart recording scheduler
│   │   └── ui/
│   │       ├── recordings_page.dart    # Recording list & playback
│   │       ├── settings_page.dart      # User preferences & config
│   │       └── setup_page.dart         # Onboarding & permissions
│   ├── android/                        # Android build config
│   ├── ios/                            # iOS build config
│   └── server/                         # Embedded Node.js backend
│       ├── index.js                    # Express server entry point
│       └── package.json
│
├── 🌐 armor-project/                   # React Web Dashboard
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── Dashboard/              # Main analytics view
│   │   │   ├── Recordings/             # Recording browser & player
│   │   │   ├── RiskAnalysis/           # Risk scoring visualizations
│   │   │   └── EntityExplorer/         # Extracted entity viewer
│   │   ├── assets/                     # Static assets & icons
│   │   ├── App.js                      # Root component & routing
│   │   └── index.js                    # React DOM entry point
│   ├── public/                         # Public assets
│   └── build/                          # Production build output
│
└── 📄 README.md                        # You are here
```

---

## 🛠️ Tech Stack

### 📱 Mobile App — Flutter

| Layer | Technology |
|---|---|
| Framework | Flutter 3.11.4+ / Dart |
| Background Processing | `flutter_background_service` |
| Audio Recording | `record` package |
| Local Storage | `sqflite` (SQLite) |
| HTTP Client | `http` |
| Permissions | `permission_handler` |

### 🌐 Web Dashboard — React

| Layer | Technology |
|---|---|
| Framework | React 18 |
| Routing | React Router v6 |
| Charts & Viz | Recharts |
| Icons | Lucide React |
| Styling | Tailwind CSS |
| UI Theme | Mint/Cream palette with Lime accent |

### ⚙️ Backend Server — Node.js

| Layer | Technology |
|---|---|
| Runtime | Node.js 16+ |
| Framework | Express.js |
| Database | SQLite |
| Audio Pipeline | Custom multilingual NLP engine |
| AI Analysis | Financial keyword & entity extraction |

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have:

- [Flutter SDK](https://flutter.dev/docs/get-started/install) (3.11.4+)
- [Node.js](https://nodejs.org/) (16+)
- [Android Studio](https://developer.android.com/studio) or [Xcode](https://developer.apple.com/xcode/) (for mobile)
- Git

---

### 📱 Flutter Mobile App

```bash
# 1. Navigate to the Flutter project
cd my_app

# 2. Install all Flutter dependencies
flutter pub get

# 3. Check that your device/emulator is connected
flutter devices

# 4. Run in debug mode
flutter run

# 5. Build release APK (Android)
flutter build apk --release

# 6. Build for iOS
flutter build ios --release
```

> **Note:** Make sure to grant microphone and background service permissions when prompted on first launch.

---

### 🌐 React Web Dashboard

```bash
# 1. Navigate to the web project
cd armor-project

# 2. Install dependencies
npm install

# 3. Start development server
npm start
# → Opens at http://localhost:3000

# 4. Build for production
npm run build
```

---

### ⚙️ Backend Server

```bash
# 1. Navigate to the server directory
cd my_app/server

# 2. Install server dependencies
npm install

# 3. Start the backend
node index.js
# → Runs on configured port (default: 3001)
```

---

## 🌍 Multilingual Intelligence

Armor.ai is purpose-built for India's mixed-language financial communication reality:

```
Supported Languages
├── 🇮🇳  Hindi          — Full financial vocabulary coverage
├── 🔀  Hinglish        — Code-switched detection & normalization
├── 🏛️  Gujarati        — Regional financial terminology
└── 🇬🇧  English         — Standard financial term recognition

Financial Domains Covered
├── 💰  Investments       — Mutual funds, stocks, SIPs, bonds
├── 🏦  Banking           — Loans, EMIs, FDs, accounts
├── ⚠️  Risk Signals      — Fraud indicators, anomaly patterns
├── 📅  Temporal Entities — Dates, durations, deadlines
└── 👤  Party Extraction  — Names, roles, organizations
```

---

## 📊 Dashboard Features

The React web dashboard provides:

- **📈 Analytics Overview** — Recording trends, keyword frequency, risk heatmaps
- **🎵 Recording Browser** — Search, filter, and playback all recordings
- **🔍 Entity Explorer** — Browse extracted financial entities with timeline
- **⚠️ Risk Intelligence** — Visual risk scoring with flagged segments
- **📅 Decision Tracker** — Timeline of tracked financial decisions
- **⚙️ Remote Config** — Manage mobile app recording settings from the web

---

## 🔁 Development Workflow

### Branch Strategy

```
main           ← Production-ready, stable releases
  └── Frontend ← Active development (current)
       └── feature/* ← Individual feature branches
```

### Workflow

```bash
# Clone the repo
git clone https://github.com/Hack2Future2-0/lazy-legends.git
cd lazy-legends

# Switch to development branch
git checkout Frontend

# Create a feature branch
git checkout -b feature/your-feature-name

# Commit and push
git add .
git commit -m "feat: describe your change"
git push origin feature/your-feature-name

# Open a Pull Request → Frontend → then → main
```

---

## 📋 Roadmap

### Phase 1 — Core Foundation ✅
- [x] Flutter app basic structure & UI
- [x] Background audio recording service
- [x] Local SQLite storage
- [x] React dashboard foundation
- [x] Node.js backend server

### Phase 2 — Intelligence Layer 🔄
- [ ] Multilingual transcription pipeline
- [ ] Financial keyword detection engine
- [ ] Named entity recognition (NER) for financial terms
- [ ] REST API integration between mobile ↔ web
- [ ] Real-time data sync

### Phase 3 — Advanced Features 📋
- [ ] Risk scoring engine with explainability
- [ ] Decision timeline tracker
- [ ] User authentication & multi-device support
- [ ] Cloud storage integration
- [ ] Export to PDF / CSV reports
- [ ] Smart scheduling based on calendar events

---

## 👥 Team — Lazy Legends

<div align="center">

| Member | Role |
|---|---|
| **Dhairya** | Full Stack & AI Integration |
| **Krish** | Frontend & UI/UX |
| **Mayur** | Mobile (Flutter) Development |
| **Deep** | Backend & NLP Pipeline |

<br/>

*Built with ❤️ at HACK2FUTURE 2.0 — CHARUSAT University*

</div>

---

## 📄 License

This project was developed for HACK2FUTURE 2.0. All rights reserved by Team Lazy Legends.

---

<div align="center">

<br/>

**🛡️ Armor.ai — Protecting every financial conversation**

*Because what you say about money matters.*

<br/>

⭐ Star this repo if Armor.ai impresses you!

</div>