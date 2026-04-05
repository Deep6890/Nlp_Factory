#!/usr/bin/env python3
"""
transcribe_bridge.py  -  Clean JSON stdout bridge for Node.js integration.

Usage:
    python transcribe_bridge.py <audio_file> [--model indicwhisper] [--lang hi]

Output (stdout, always valid JSON):
    {"ok": true,  "transcript": "...", "duration_ms": 1234, "model": "...", "lang": "..."}
    {"ok": false, "error": "...", "traceback": "..."}

IMPORTANT:
  - stderr is used for debug logs (visible in Node.js via py.stderr)
  - stdout ONLY contains the final JSON result
  - This design keeps Node.js child_process stdout parsing simple and reliable
"""

import sys
import json
import time
import traceback
import argparse
import logging
import os

# ── Redirect ALL logging + print to stderr so stdout stays clean ──────────────
logging.basicConfig(
    stream=sys.stderr,
    level=logging.INFO,
    format='[PY %(levelname)s] %(message)s'
)

def main():
    parser = argparse.ArgumentParser(
        description="Armor.ai STT Bridge — outputs clean JSON to stdout"
    )
    parser.add_argument("file", help="Absolute path to audio file (wav/webm/mp3/m4a/ogg)")
    parser.add_argument(
        "--model", default="indicwhisper",
        choices=["indicwhisper", "indicwav2vec", "indicconformer"],
        help="STT model to use (default: indicwhisper)"
    )
    parser.add_argument(
        "--lang", default="hi",
        help="Language code, e.g. hi bn ta te mr (default: hi)"
    )
    args = parser.parse_args()

    # ── Validate file exists ──────────────────────────────────────────────────
    if not os.path.isfile(args.file):
        result = {
            "ok": False,
            "error": f"Audio file not found: {args.file}",
            "traceback": "",
        }
        print(json.dumps(result, ensure_ascii=False), flush=True)
        sys.exit(1)

    try:
        logging.info(f"Starting transcription pipeline")
        logging.info(f"  File  : {args.file}")
        logging.info(f"  Model : {args.model}")
        logging.info(f"  Lang  : {args.lang}")

        # Make sure imports resolve relative to this script's folder
        script_dir = os.path.dirname(os.path.abspath(__file__))
        if script_dir not in sys.path:
            sys.path.insert(0, script_dir)

        from audio_utils import load_audio
        from models import get_stt_engine

        logging.info("Loading STT engine...")
        stt = get_stt_engine(args.model, language=args.lang)

        logging.info("Loading and converting audio (16kHz mono)...")
        audio_array = load_audio(args.file)

        logging.info("Running inference...")
        t0 = time.perf_counter()
        transcript = stt.transcribe(audio_array)
        duration_ms = int((time.perf_counter() - t0) * 1000)

        word_count = len(transcript.split()) if transcript else 0
        logging.info(f"Transcription complete in {duration_ms}ms — {word_count} words")

        result = {
            "ok":          True,
            "transcript":  transcript,
            "duration_ms": duration_ms,
            "word_count":  word_count,
            "model":       args.model,
            "lang":        args.lang,
        }

    except ImportError as e:
        tb = traceback.format_exc()
        logging.error(f"Import error (check Python env / dependencies): {e}")
        result = {
            "ok":        False,
            "error":     f"Import error: {e}. Make sure all requirements are installed.",
            "traceback": tb,
        }

    except Exception as e:
        tb = traceback.format_exc()
        logging.error(f"Transcription failed: {e}")
        logging.error(tb)
        result = {
            "ok":        False,
            "error":     str(e),
            "traceback": tb,
        }

    # ── Write ONLY the JSON result to stdout ──────────────────────────────────
    print(json.dumps(result, ensure_ascii=False), flush=True)
    sys.exit(0 if result["ok"] else 2)


if __name__ == "__main__":
    main()
