"""
api_server.py
=============
FastAPI wrapper around the full AiModule pipeline.

Endpoints:
  POST /process       — text-only (translation + insights)
  POST /process-audio — audio file upload (STT + translation + insights)
  GET  /health        — liveness check

Run:
  uvicorn api_server:app --host 0.0.0.0 --port 8000
"""

from __future__ import annotations

import logging
import os
import sys
import tempfile
from pathlib import Path

# ── Path setup ────────────────────────────────────────────────────────────────
_ROOT = Path(__file__).parent.resolve()
for _p in [
    str(_ROOT / "SpeechToText"),
    str(_ROOT / "insightsEngine"),
    str(_ROOT / "LangtextToEng"),
]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

# Block HuggingFace HTTP — use only cached models
os.environ["TRANSFORMERS_OFFLINE"]            = "1"
os.environ["HF_DATASETS_OFFLINE"]             = "1"
os.environ["HF_HUB_OFFLINE"]                  = "1"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

from fastapi import FastAPI, Header, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv

load_dotenv(_ROOT / "insightsEngine" / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger(__name__)

# ── API key auth ──────────────────────────────────────────────────────────────
_API_KEY = os.environ.get("AI_API_KEY", "").strip()

def _check_key(x_api_key: str):
    if _API_KEY and x_api_key != _API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AiModule Pipeline API",
    description="Indian language audio/text → financial insights JSON",
    version="1.0.0",
)

# ── Request models ────────────────────────────────────────────────────────────
class TextRequest(BaseModel):
    text: str
    language: Optional[str] = "en"   # BCP-47 source language of the text
    already_english: Optional[bool] = False

# ── Lazy pipeline imports (loaded on first request, not at startup) ───────────
_audio_pipeline = None
_text_pipeline  = None

def _get_audio_pipeline():
    global _audio_pipeline
    if _audio_pipeline is None:
        from audio_pipeline import process_audio
        _audio_pipeline = process_audio
    return _audio_pipeline

def _get_text_pipeline():
    global _text_pipeline
    if _text_pipeline is None:
        from pipeline import process_text_pipeline
        _text_pipeline = process_text_pipeline
    return _text_pipeline

# ── Endpoints ─────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}


@app.post("/process")
def process_text(
    req: TextRequest,
    x_api_key: str = Header(default=""),
):
    """
    Process raw text (already transcribed or typed).

    - If already_english=false, translates first then runs insights.
    - If already_english=true, skips translation.

    Body:
        {
          "text": "5000 की SIP करनी है",
          "language": "hi",
          "already_english": false
        }
    """
    _check_key(x_api_key)

    if not req.text or not req.text.strip():
        raise HTTPException(status_code=400, detail="text field is empty")

    english_text = req.text
    translation_applied = False

    if not req.already_english and req.language not in ("en", "english", "eng"):
        try:
            from translation_pipeline import translate, free_ram as free_translation_ram
            translated = translate(req.text, src_lang=req.language)
            if translated and translated != req.text:
                english_text = translated
                translation_applied = True
            free_translation_ram()
        except Exception as e:
            log.warning("Translation failed: %s", e)

    pipeline = _get_text_pipeline()
    insights = pipeline(
        text=english_text,
        source_lang=req.language,
        original_text=req.text,
    )

    return JSONResponse({
        "original_text":        req.text,
        "english_text":         english_text,
        "translation_applied":  translation_applied,
        **insights,
    })


@app.post("/process-audio")
async def process_audio_file(
    file: UploadFile = File(...),
    language: Optional[str] = "hi",
    x_api_key: str = Header(default=""),
):
    """
    Full pipeline: audio file → STT → translation → insights JSON.

    Form fields:
        file     : audio file (.wav / .mp3 / .flac)
        language : BCP-47 language hint (hi, ta, te, bn, kn, ml, gu, pa, mr, ur)

    Returns the full 25-key pipeline JSON.
    """
    _check_key(x_api_key)

    allowed = {".wav", ".mp3", ".flac", ".ogg", ".m4a"}
    ext = Path(file.filename or "audio.wav").suffix.lower()
    if ext not in allowed:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save upload to temp file
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    try:
        pipeline = _get_audio_pipeline()
        result = pipeline(audio_path=tmp_path, language=language)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    return JSONResponse(result)
