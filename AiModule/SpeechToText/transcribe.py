"""
transcribe.py  –  Core Engine for File-Based Transcription

This is the pure module-based engine. 
Give it any audio file (WAV, MP3, M4A, FLAC, OGG, WebM, etc.), 
and it will return the text.

How it works:
1. 'audio_utils.load_audio' safely loads and converts any audio format to 16kHz mono.
2. 'models.indicwhisper.IndicWhisperSTT' processes the audio and returns text.
"""

import time
import sys
import argparse
from audio_utils import load_audio
from models.indicwhisper import IndicWhisperSTT

from models import get_stt_engine

def transcribe_audio_file(file_path: str, model: str = "indicwhisper", language: str = "hi"):
    """
    Core function to process an audio file and return text.
    You can choose the exact models used in the UI:
    - 'indicwhisper' (default)
    - 'indicwav2vec' 
    - 'indicconformer'
    """
    print(f"Loading '{model}' model for language '{language}'...")
    
    # This is exactly how the UI loaded the models!
    stt = get_stt_engine(model, language=language)
    
    print(f"Loading and processing audio file: '{file_path}'...")
    audio_array = load_audio(file_path)
    
    print("Transcribing (this may take a moment based on file length)...")
    t0 = time.perf_counter()
    transcript = stt.transcribe(audio_array)
    ms = (time.perf_counter() - t0) * 1000

    print(f"\n--- SUCCESS ({ms:.0f} ms) ---")
    print(f"Output Text:\n{transcript}\n---------------------------\n")
    return transcript

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Transcribe an audio file to text.")
    parser.add_argument("file", help="Path to your audio file")
    parser.add_argument("--model", default="indicwhisper", choices=["indicwhisper", "indicwav2vec", "indicconformer"], help="Which AI4Bharat model to use")
    parser.add_argument("--lang", default="hi", help="Target language code (e.g., hi, bn, ta)")
    
    if len(sys.argv) == 1:
        print("Usage Example:")
        print("    python transcribe.py meeting.wav --model indicwav2vec --lang hi")
        sys.exit(0)
        
    args = parser.parse_args()
    transcribe_audio_file(args.file, args.model, args.lang)
