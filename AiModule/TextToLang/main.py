"""
Language Detection CLI – fastText + CLD3 hybrid
Usage:
    python main.py
    python main.py --text "नमस्ते आप कैसे हैं"
"""

import argparse
import logging
import sys

from detectors import detect_language, detect_language_batch
from detectors.cld3_detector import CLD3Detector
from detectors.fasttext_detector import FastTextDetector


def _print_result(result) -> None:
    if result is None:
        print("  result : could not detect\n")
        return

    decision_icon = {"agreement": "✅", "fasttext": "⚡", "cld3": "🔵", "unknown": "❓"}
    icon = decision_icon.get(result.decision, "")

    print(f"  text     : {result.text[:80]!r}")
    print(f"  fasttext : {result.fasttext[0]}  ({result.fasttext[1]:.4f})")
    print(f"  cld3     : {result.cld3[0]}  ({result.cld3[1]:.4f})")
    print(f"  language : {result.final_language}")
    print(f"  confidence : {result.confidence:.4f}")
    print(f"  decision : {icon} {result.decision}\n")


def check_health() -> None:
    print("-" * 45)
    cld3 = CLD3Detector()
    ft = FastTextDetector()
    print(f"  CLD3     : {'ready' if cld3.is_available() else 'not available'}")
    print(f"  fastText : {'ready' if ft.is_available() else 'not available'}")
    if not cld3.is_available() and not ft.is_available():
        print("\n  No detectors available.")
        sys.exit(1)
    print("-" * 45 + "\n")


SAMPLE_TEXTS = [
    "Hello how are you",
    "Bonjour comment allez-vous",
    "Hola cómo estás",
    "नमस्ते आप कैसे हैं",
    "வணக்கம் எப்படி இருக்கிறீர்கள்",
    "こんにちは、お元気ですか",
    "Привет как дела",
    "مرحبا كيف حالك",
    "你好你好吗",
    "Kem cho tame",
]


def main():
    parser = argparse.ArgumentParser(description="fastText + CLD3 hybrid language detector")
    parser.add_argument("--text", "-t", type=str, default=None)
    parser.add_argument("--verbose", "-v", action="store_true")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.WARNING,
        format="%(name)s | %(levelname)s | %(message)s",
    )

    check_health()

    if args.text:
        result = detect_language(args.text)
        _print_result(result)
        return

    print("Hybrid Detection Demo (fastText + CLD3)\n")
    for text in SAMPLE_TEXTS:
        result = detect_language(text)
        _print_result(result)


if __name__ == "__main__":
    main()
