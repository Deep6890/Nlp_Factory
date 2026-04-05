# Indic Speech-to-Text — AI4Bharat Models
# ===========================================

A **production-ready**, open-source Speech-to-Text system for all 22 official Indian languages,
powered by three state-of-the-art model families from **AI4Bharat / IIT Madras**.

---

## 🤖 Models Included

| Model | Architecture | Languages | Backend | Accuracy |
|-------|-------------|-----------|---------|----------|
| **IndicWhisper** | Whisper (fine-tuned) | 11+ | 🤗 Transformers | ⭐⭐⭐⭐ |
| **IndicWav2Vec** | Wav2Vec2 + CTC | 40+ | 🤗 Transformers | ⭐⭐⭐ |
| **IndicConformer** | Conformer CTC/RNNT | 22 | NVIDIA NeMo | ⭐⭐⭐⭐⭐ |

---

## 🌍 Supported Languages (22 Official)

`hi` Hindi · `bn` Bengali · `ta` Tamil · `te` Telugu · `mr` Marathi ·  
`gu` Gujarati · `kn` Kannada · `ml` Malayalam · `pa` Punjabi · `or` Odia ·  
`as` Assamese · `ur` Urdu · `sa` Sanskrit · `mai` Maithili · `kok` Konkani ·  
`ne` Nepali · `sd` Sindhi · `ks` Kashmiri · `doi` Dogri · `mni` Manipuri ·  
`sat` Santali · `brx` Bodo

---

## 📦 Installation

### 1. Core (IndicWhisper + IndicWav2Vec — No NeMo required)
```bash
pip install torch torchaudio transformers huggingface_hub soundfile librosa
pip install fastapi uvicorn[standard] python-multipart websockets
pip install rich click python-dotenv openai-whisper
```

### 2. IndicConformer (Requires NeMo)
```bash
# Windows quick install:
setup_nemo.bat

# Or manually:
pip install nemo_toolkit[asr]
```

### 3. Microphone input (optional)
```bash
pip install pyaudio webrtcvad
```

---

## 🚀 Quick Start

### Start the API + Web UI
```bash
python main.py api --model indicwhisper --lang hi
# Open: http://localhost:8000/ui
```

### Transcribe a file (CLI)
```bash
# IndicWhisper (easiest, no NeMo)
python cli.py transcribe audio.wav --model indicwhisper --lang hi

# IndicWav2Vec (lightweight, CPU-friendly)
python cli.py transcribe audio.wav --model indicwav2vec --lang ta

# IndicConformer (best accuracy, needs NeMo)
python cli.py transcribe audio.wav --model indicconformer --lang bn --decoder rnnt
```

### Live Microphone
```bash
python cli.py mic --model indicwhisper --lang hi --continuous
```

### Python SDK
```python
from models import get_stt_engine

# IndicWhisper
stt = get_stt_engine("indicwhisper", language="hi")
text = stt.transcribe_file("speech.wav")
print(text)

# IndicWav2Vec
stt = get_stt_engine("indicwav2vec", language="ta")
text = stt.transcribe_file("speech.wav")

# IndicConformer (NeMo required)
stt = get_stt_engine("indicconformer", language="bn", decoder="rnnt")
text = stt.transcribe_file("speech.wav")
```

### REST API
```bash
# Transcribe via HTTP
curl -X POST http://localhost:8000/transcribe \
  -F "file=@audio.wav" \
  -F "model=indicwhisper" \
  -F "language=hi"

# List models
curl http://localhost:8000/models
```

### Compare all models side-by-side
```bash
python examples/demo.py --lang hi --audio speech.wav
```

---

## 📁 Project Structure

```
SpeechToText/
├── main.py              # Unified launcher (API + CLI)
├── cli.py               # CLI: transcribe | mic | benchmark | list-models
├── config.py            # All model IDs, language codes, settings
├── audio_utils.py       # Audio loading, resampling, microphone + VAD
├── requirements.txt     # Python dependencies
├── setup_nemo.bat       # Windows NeMo installer
│
├── models/
│   ├── __init__.py      # Factory: get_stt_engine(name, language)
│   ├── indicwhisper.py  # IndicWhisper engine
│   ├── indicwav2vec.py  # IndicWav2Vec CTC engine
│   └── indicconformer.py # IndicConformer (NeMo + Transformers fallback)
│
├── api/
│   └── server.py        # FastAPI server (REST + WebSocket streaming)
│
├── static/
│   └── index.html       # Beautiful dark-mode web UI
│
└── examples/
    └── demo.py          # Side-by-side model comparison
```

---

## ⚙️ Configuration

Edit `.env` or set environment variables:

```env
STT_MODEL=indicwhisper        # Default model
STT_LANGUAGE=hi               # Default language
STT_DECODER=ctc               # ctc | rnnt (conformer only)
HF_TOKEN=hf_xxx               # HuggingFace token (for gated models)
API_HOST=0.0.0.0
API_PORT=8000
```

---

## 🎯 Model Selection Guide

| Use Case | Recommended Model |
|----------|------------------|
| General purpose, multilingual | IndicWhisper |
| CPU / edge deployment | IndicWav2Vec |
| Maximum accuracy (GPU) | IndicConformer (RNNT) |
| Noisy audio | IndicWhisper |
| Long audio (>30s) | IndicWav2Vec (chunked) |
| Real-time streaming | IndicWav2Vec / IndicConformer CTC |

---

## 🔊 Audio Requirements

All models expect **16 kHz mono** audio. The pipeline auto-resamples any format.
Supported input: WAV, MP3, FLAC, OGG, M4A, WebM, and more (via librosa/soundfile).

---

## 📜 License & Credits

- Models: [AI4Bharat](https://ai4bharat.iitm.ac.in/) / IIT Madras — MIT / CC-BY-4.0
- Whisper base: [OpenAI](https://github.com/openai/whisper) — MIT
- Wav2Vec2: [Meta AI](https://ai.facebook.com/research/wav-to-vec) — MIT
- NeMo framework: [NVIDIA](https://github.com/NVIDIA/NeMo) — Apache-2.0
- HuggingFace Transformers: Apache-2.0
