import sys, os, traceback
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

print("=== Step 1: imports ===")
import numpy as np
import torch
print(f"torch: {torch.__version__}, cuda: {torch.cuda.is_available()}")

print("=== Step 2: load config ===")
from config import INDICWHISPER_MODELS, SAMPLE_RATE, CACHE_DIR
model_id = INDICWHISPER_MODELS.get("hi")
print(f"Model ID: {model_id}")
print(f"Cache dir: {CACHE_DIR}")

print("=== Step 3: load model ===")
try:
    from models.indicwhisper import IndicWhisperSTT
    stt = IndicWhisperSTT(language="hi")
    print(f"Model loaded: {stt}")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("=== Step 4: transcribe silence ===")
try:
    audio = np.zeros(SAMPLE_RATE * 2, dtype=np.float32)
    text  = stt.transcribe(audio)
    print(f"Result: {repr(text)}")
except Exception:
    traceback.print_exc()
    sys.exit(1)

print("=== ALL PASSED ===")
