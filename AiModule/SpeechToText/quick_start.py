#!/usr/bin/env python3
"""
quick_start.py  –  One-shot setup validator and model downloader.

Checks all dependencies, downloads the Whisper model (500MB for small),
runs a quick smoke test, and confirms the server is ready to launch.

Run this FIRST before starting the server:
    python quick_start.py

Optional: to test a specific audio file:
    python quick_start.py --audio path/to/audio.wav --lang hi
"""

import sys
import os
import time

# ── Make sure we run from the project root ─────────────────────────────────────
os.chdir(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ".")


def check(name, fn):
    try:
        result = fn()
        print(f"  ✓  {name}" + (f": {result}" if result else ""))
        return True
    except Exception as e:
        print(f"  ✗  {name}: {e}")
        return False


def main():
    print()
    print("=" * 60)
    print("  🇮🇳  Indic STT — Quick Setup Validator")
    print("=" * 60)

    # ── 1. Dependency checks ───────────────────────────────────────────────────
    print("\n[1/4] Checking dependencies…")
    ok = True
    ok &= check("torch",          lambda: __import__("torch").__version__)
    ok &= check("transformers",   lambda: __import__("transformers").__version__)
    ok &= check("soundfile",      lambda: __import__("soundfile").__version__)
    ok &= check("librosa",        lambda: __import__("librosa").__version__)
    ok &= check("fastapi",        lambda: __import__("fastapi").__version__)
    ok &= check("uvicorn",        lambda: __import__("uvicorn").__version__)
    ok &= check("python-dotenv",  lambda: __import__("importlib.metadata", fromlist=["version"]).version("python-dotenv"))

    if not ok:
        print("\n  ⚠  Some packages are missing. Run:")
        print("     pip install -r requirements.txt")
        sys.exit(1)

    # ── 2. Config ──────────────────────────────────────────────────────────────
    print("\n[2/4] Loading config…")
    from config import (
        INDICWHISPER_MODELS, SAMPLE_RATE, CACHE_DIR,
        DEFAULT_MODEL, DEFAULT_LANG
    )
    model_id = INDICWHISPER_MODELS.get(DEFAULT_LANG, "openai/whisper-large-v3")
    print(f"  ✓  Default model : {DEFAULT_MODEL}")
    print(f"  ✓  Default lang  : {DEFAULT_LANG}")
    print(f"  ✓  Model ID      : {model_id}")
    print(f"  ✓  Cache dir     : {CACHE_DIR}")

    # ── 3. Download / load model ───────────────────────────────────────────────
    print(f"\n[3/4] Loading model '{model_id}'…")
    print("      (First run downloads ~500MB for whisper-small — please wait)")

    try:
        from models.indicwhisper import IndicWhisperSTT
        stt = IndicWhisperSTT(language=DEFAULT_LANG)
        print(f"  ✓  Model loaded: {stt}")
    except Exception as e:
        print(f"  ✗  Model load failed: {e}")
        sys.exit(1)

    # ── 4. Smoke test ──────────────────────────────────────────────────────────
    print("\n[4/4] Running smoke test on silent audio…")
    import numpy as np
    silence = np.zeros(SAMPLE_RATE * 2, dtype=np.float32)   # 2s silence
    t0 = time.perf_counter()
    text = stt.transcribe(silence)
    ms   = (time.perf_counter() - t0) * 1000
    print(f"  ✓  Inference time: {ms:.0f} ms")
    print(f"  ✓  Output (silence → expected empty/noise): '{text}'")

    # ── Optional real audio test ─────────────────────────────────────────────
    audio_path = None
    audio_lang = DEFAULT_LANG
    for i, a in enumerate(sys.argv[1:]):
        if a == "--audio" and i + 1 < len(sys.argv) - 1:
            audio_path = sys.argv[i + 2]
        if a == "--lang" and i + 1 < len(sys.argv) - 1:
            audio_lang = sys.argv[i + 2]

    if audio_path:
        print(f"\n[BONUS] Transcribing: {audio_path} (lang={audio_lang})")
        stt2 = IndicWhisperSTT(language=audio_lang)
        t0   = time.perf_counter()
        text = stt2.transcribe_file(audio_path)
        ms   = (time.perf_counter() - t0) * 1000
        print(f"\n  ┌─ Transcript ({ms:.0f} ms) ─────────────────────────────────")
        print(f"  │  {text}")
        print(f"  └───────────────────────────────────────────────────────────")

    # ── All good ───────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print("  ✅  Setup complete! Start the server with:")
    print()
    print("      python main.py api")
    print()
    print("  Then open: http://localhost:8000/ui")
    print("=" * 60)
    print()


if __name__ == "__main__":
    main()
