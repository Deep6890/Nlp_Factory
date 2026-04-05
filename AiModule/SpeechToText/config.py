"""
config.py  –  Central configuration for all Indic STT models.
Edit the MODEL_CONFIGS dict or set env vars (via .env) to switch models/languages.
"""

from __future__ import annotations
import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# ── Project root ───────────────────────────────────────────────────────────────
BASE_DIR = Path(__file__).parent.resolve()
CACHE_DIR = BASE_DIR / "model_cache"
CACHE_DIR.mkdir(exist_ok=True)

# ── Audio settings (all Indic models need 16 kHz mono) ────────────────────────
SAMPLE_RATE = 16_000
CHANNELS    = 1
CHUNK_MS    = 30            # VAD frame size
SILENCE_TIMEOUT_SEC = 1.5   # seconds of silence → stop recording

# ── Available languages ────────────────────────────────────────────────────────
INDIC_LANGUAGES: dict[str, str] = {
    "hi": "Hindi",
    "bn": "Bengali",
    "ta": "Tamil",
    "te": "Telugu",
    "mr": "Marathi",
    "gu": "Gujarati",
    "kn": "Kannada",
    "ml": "Malayalam",
    "pa": "Punjabi",
    "or": "Odia",
    "as": "Assamese",
    "ur": "Urdu",
    "sa": "Sanskrit",
    "mai": "Maithili",
    "kok": "Konkani",
    "ne": "Nepali",
    "sd": "Sindhi",
    "ks": "Kashmiri",
    "doi": "Dogri",
    "mni": "Manipuri",
    "sat": "Santali",
    "brx": "Bodo",
}


# ── IndicConformer model IDs (NeMo / HuggingFace) ─────────────────────────────
INDICCONFORMER_MULTILINGUAL = "ai4bharat/indic-conformer-600m-multilingual"

INDICCONFORMER_MODELS: dict[str, str] = {
    "hi":  "ai4bharat/indicconformer_stt_hi_hybrid_ctc_rnnt_large",
    "bn":  "ai4bharat/indicconformer_stt_bn_hybrid_ctc_rnnt_large",
    "ta":  "ai4bharat/indicconformer_stt_ta_hybrid_ctc_rnnt_large",
    "te":  "ai4bharat/indicconformer_stt_te_hybrid_ctc_rnnt_large",
    "mr":  "ai4bharat/indicconformer_stt_mr_hybrid_ctc_rnnt_large",
    "gu":  "ai4bharat/indicconformer_stt_gu_hybrid_ctc_rnnt_large",
    "kn":  "ai4bharat/indicconformer_stt_kn_hybrid_ctc_rnnt_large",
    "ml":  "ai4bharat/indicconformer_stt_ml_hybrid_ctc_rnnt_large",
    "pa":  "ai4bharat/indicconformer_stt_pa_hybrid_ctc_rnnt_large",
    "or":  "ai4bharat/indicconformer_stt_or_hybrid_ctc_rnnt_large",
    "as":  "ai4bharat/indicconformer_stt_as_hybrid_ctc_rnnt_large",
    "ur":  "ai4bharat/indicconformer_stt_ur_hybrid_ctc_rnnt_large",
    "sa":  "ai4bharat/indicconformer_stt_sa_hybrid_ctc_rnnt_large",
    "mai": "ai4bharat/indicconformer_stt_mai_hybrid_ctc_rnnt_large",
    "kok": "ai4bharat/indicconformer_stt_kok_hybrid_ctc_rnnt_large",
    "ne":  "ai4bharat/indicconformer_stt_ne_hybrid_ctc_rnnt_large",
    "sd":  "ai4bharat/indicconformer_stt_sd_hybrid_ctc_rnnt_large",
    "ks":  "ai4bharat/indicconformer_stt_ks_hybrid_ctc_rnnt_large",
    "doi": "ai4bharat/indicconformer_stt_doi_hybrid_ctc_rnnt_large",
    "mni": "ai4bharat/indicconformer_stt_mni_hybrid_ctc_rnnt_large",
    "sat": "ai4bharat/indicconformer_stt_sat_hybrid_ctc_rnnt_large",
    "brx": "ai4bharat/indicconformer_stt_brx_hybrid_ctc_rnnt_large",
    # Multilingual fallback (single checkpoint for all 22)
    "multilingual": INDICCONFORMER_MULTILINGUAL,
}


# ── IndicWav2Vec model IDs (Transformers CTC) ─────────────────────────────────
# NOTE: All ai4bharat/indicwav2vec-* models are GATED on HuggingFace —
# you must accept terms at https://huggingface.co/ai4bharat/indicwav2vec-hindi
# and set HF_TOKEN in your .env file.
# Without a token the system falls back to openai/whisper-large-v3.
INDICWAV2VEC_MODELS: dict[str, str] = {
    "hi":  "ai4bharat/indicwav2vec-hindi",
    "bn":  "ai4bharat/indicwav2vec_v1_bengali",
    "ta":  "ai4bharat/indicwav2vec-tamil",
    "te":  "ai4bharat/indicwav2vec-telugu",
    "mr":  "ai4bharat/indicwav2vec-marathi",
    "gu":  "ai4bharat/indicwav2vec-gujarati",
    "kn":  "ai4bharat/indicwav2vec-kannada",
    "ml":  "ai4bharat/indicwav2vec-malayalam",
    "pa":  "ai4bharat/indicwav2vec-punjabi",
    "or":  "ai4bharat/indicwav2vec-odia",
    "as":  "ai4bharat/indicwav2vec-assamese",
    # multilingual pre-trained backbone
    "multilingual": "ai4bharat/IndicWav2Vec",
}


# ── IndicWhisper / Whisper model IDs ──────────────────────────────────────────
# AI4Bharat published IndicWhisper results but the models are available as:
#   - openai/whisper-large-v3  (best multilingual, free, public, supports all Indian languages)
#   - openai/whisper-medium    (lighter, still multilingual)
#   - openai/whisper-small     (fastest, CPU-friendly)
# Language is passed as a generation kwarg — the model auto-detects/uses it.
INDICWHISPER_MODELS: dict[str, str] = {
    # All Indian languages → use the powerful multilingual whisper-large-v3
    # It was trained on massive multilingual data and handles all 22 Indic languages.
    "hi":  "openai/whisper-large-v3",
    "bn":  "openai/whisper-large-v3",
    "ta":  "openai/whisper-large-v3",
    "te":  "openai/whisper-large-v3",
    "mr":  "openai/whisper-large-v3",
    "gu":  "openai/whisper-large-v3",
    "kn":  "openai/whisper-large-v3",
    "ml":  "openai/whisper-large-v3",
    "pa":  "openai/whisper-large-v3",
    "or":  "openai/whisper-large-v3",
    "as":  "openai/whisper-large-v3",
    "ur":  "openai/whisper-large-v3",
    "sa":  "openai/whisper-large-v3",
    "mai": "openai/whisper-large-v3",
    "kok": "openai/whisper-large-v3",
    "ne":  "openai/whisper-large-v3",
    # Lighter alternatives — set STT_WHISPER_SIZE=medium or small in .env
    "multilingual": "openai/whisper-large-v3",
}

# Whisper model size alternatives (set via .env STT_WHISPER_SIZE)
WHISPER_SIZES: dict[str, str] = {
    "large":  "openai/whisper-large-v3",    # Best accuracy,  ~3GB VRAM
    "medium": "openai/whisper-medium",       # Good balance,   ~1.5GB
    "small":  "openai/whisper-small",        # Fast, CPU OK,   ~500MB
    "tiny":   "openai/whisper-tiny",         # Fastest,        ~150MB
}

# Active whisper size (override per-language models if set)
_whisper_size = os.getenv("STT_WHISPER_SIZE", "large")
if _whisper_size in WHISPER_SIZES and _whisper_size != "large":
    for _k in list(INDICWHISPER_MODELS):
        INDICWHISPER_MODELS[_k] = WHISPER_SIZES[_whisper_size]


# ── Default active model / language ───────────────────────────────────────────
# indicwhisper = openai/whisper-large-v3 (works immediately, no token needed)
# indicwav2vec = needs HF_TOKEN (gated) — set in .env
# indicconformer = needs NeMo installed — run setup_nemo.bat first
DEFAULT_MODEL   = os.getenv("STT_MODEL",    "indicwhisper")   # indicconformer | indicwav2vec | indicwhisper
DEFAULT_LANG    = os.getenv("STT_LANGUAGE", "hi")
DEFAULT_DECODER = os.getenv("STT_DECODER",  "ctc")            # ctc | rnnt  (conformer only)

# ── API server ────────────────────────────────────────────────────────────────
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))

# ── Hugging Face token (optional, for gated models) ───────────────────────────
HF_TOKEN = os.getenv("HF_TOKEN", None)
