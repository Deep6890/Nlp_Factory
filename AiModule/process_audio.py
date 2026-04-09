"""
process_audio.py  —  Armor.ai Audio Pipeline CLI
=================================================
Usage:
    python process_audio.py <audio_path_or_url> [language] [--mode fast|slow]

    --mode fast   Sarvam AI cloud STT  (~3s,  1 per day limit, needs internet)
    --mode slow   Local Whisper models (~1-5min, unlimited, fully offline)

    If fast limit is hit, automatically falls back to slow.

Output: single JSON to stdout. All logs to stderr.

Examples:
    python process_audio.py recording.wav hi --mode fast
    python process_audio.py https://storage.example.com/audio.wav --mode slow
    python process_audio.py recording.m4a ta
"""

from __future__ import annotations

import os

# ── Force NVIDIA GPU before any torch/CUDA import ────────────────────────────
# CUDA only enumerates NVIDIA devices — device 0 = RTX 3050 (Intel UHD is invisible to CUDA)
os.environ.setdefault("CUDA_VISIBLE_DEVICES", "0")

import argparse
import json
import logging
import sys
import tempfile
import urllib.request
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    stream=sys.stderr,
)
log = logging.getLogger(__name__)

_ROOT = Path(__file__).parent

for _p in [
    str(_ROOT / "SpeechToText"),
    str(_ROOT / "insightsEngine"),
    str(_ROOT / "LangtextToEng"),
]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

os.environ.setdefault("TRANSFORMERS_OFFLINE",            "1")
os.environ.setdefault("HF_DATASETS_OFFLINE",             "1")
os.environ.setdefault("HF_HUB_OFFLINE",                  "1")
os.environ.setdefault("HF_HUB_DISABLE_SYMLINKS_WARNING", "1")

# ── GPU optimizations ─────────────────────────────────────────────────────────
try:
    import torch
    if torch.cuda.is_available():
        torch.backends.cudnn.benchmark = True   # auto-tune convolution kernels
        torch.backends.cuda.matmul.allow_tf32 = True  # faster matmul on Ampere+
        log.info("[GPU] CUDA available: %s  VRAM: %.1fGB  cuDNN benchmark ON",
                 torch.cuda.get_device_name(0),
                 torch.cuda.get_device_properties(0).total_memory / (1024**3))
    else:
        log.info("[GPU] No CUDA — running on CPU")
except Exception as e:
    log.warning("[GPU] torch check failed: %s", e)

from dotenv import load_dotenv
load_dotenv(_ROOT / ".env", override=False)
load_dotenv(_ROOT / ".." / ".env", override=False)


def _download(url: str) -> str:
    ext = Path(url.split("?")[0]).suffix or ".wav"
    if ext not in {".wav", ".mp3", ".flac", ".ogg", ".m4a", ".webm", ".aac"}:
        ext = ".wav"
    tmp = tempfile.NamedTemporaryFile(suffix=ext, delete=False)
    log.info("Downloading %s", url[:80])
    urllib.request.urlretrieve(url, tmp.name)
    log.info("Saved to %s  (%d bytes)", tmp.name, os.path.getsize(tmp.name))
    return tmp.name


def main():
    parser = argparse.ArgumentParser(description="Armor.ai Audio Pipeline")
    parser.add_argument("source",   help="Audio file path or URL")
    parser.add_argument("language", nargs="?", default=None,
                        help="BCP-47 language code: hi ta te bn kn ml gu pa mr ur en")
    parser.add_argument("--mode", choices=["fast", "slow"], default="slow",
                        help="fast=Sarvam AI (1/day), slow=local Whisper (unlimited)")
    args = parser.parse_args()

    tmp_path = None
    try:
        if args.source.startswith("http://") or args.source.startswith("https://"):
            tmp_path   = _download(args.source)
            audio_path = tmp_path
        else:
            audio_path = args.source
            if not os.path.isfile(audio_path):
                print(json.dumps({"error": f"File not found: {audio_path}"}))
                sys.exit(1)

        log.info("mode=%s  file=%s  lang=%s", args.mode, audio_path, args.language or "auto")

        from audio_pipeline import process_audio
        result = process_audio(audio_path=audio_path, language=args.language, mode=args.mode)
        print(json.dumps(result, ensure_ascii=False))
        sys.exit(0)

    except Exception as e:
        log.error("Pipeline failed: %s", e)
        print(json.dumps({"error": str(e)}))
        sys.exit(1)

    finally:
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except Exception:
                pass


if __name__ == "__main__":
    main()
