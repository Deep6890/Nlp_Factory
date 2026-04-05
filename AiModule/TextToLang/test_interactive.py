"""
Interactive language detection — type any text, get instant results.
Run: python test_interactive.py
"""

from detectors import detect_language


def print_result(result):
    if result is None:
        print("  result : could not detect\n")
        return

    icons = {"agreement": "✅", "fasttext": "⚡", "cld3": "🔵", "unknown": "❓"}
    icon = icons.get(result.decision, "")

    print(f"  language   : {result.final_language}")
    print(f"  confidence : {result.confidence:.4f}")
    print(f"  decision   : {icon} {result.decision}")
    print(f"  fasttext   : {result.fasttext[0]}  ({result.fasttext[1]:.4f})")
    print(f"  cld3       : {result.cld3[0]}  ({result.cld3[1]:.4f})")
    print()


print("=" * 45)
print("  Language Detector — Interactive Mode")
print("  Type any text to detect its language")
print("  Type 'exit' or 'q' to quit")
print("=" * 45 + "\n")

while True:
    try:
        text = input(">> ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nBye!")
        break

    if not text:
        continue

    if text.lower() in ("exit", "q", "quit"):
        print("Bye!")
        break

    result = detect_language(text)
    print_result(result)
