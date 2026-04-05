"""
examples/demo.py  –  Quick demo script showing all three model families.

Run:
    python examples/demo.py --lang hi --audio path/to/speech.wav
    python examples/demo.py --lang ta   # Uses a synthetic test signal
"""

import sys, os, time
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import numpy as np
import click
from rich.console import Console
from rich.table import Table

console = Console()


def generate_test_tone(duration_sec: float = 2.0, sr: int = 16000) -> np.ndarray:
    """Generate a 440 Hz test tone (useful for checking model pipeline)."""
    t = np.linspace(0, duration_sec, int(sr * duration_sec))
    return (0.3 * np.sin(2 * np.pi * 440 * t)).astype(np.float32)


@click.command()
@click.option("--lang",  "-l", default="hi",   help="Language code.")
@click.option("--audio", "-a", default=None,   help="Path to audio file (optional).")
@click.option("--model", "-m", default="all",
              type=click.Choice(["all", "indicwhisper", "indicwav2vec", "indicconformer"]),
              help="Which model(s) to run.")
def demo(lang, audio, model):
    """
    Run all three AI4Bharat STT models on the same audio and compare results.
    """
    from models import get_stt_engine
    from audio_utils import load_audio

    console.rule(f"[bold orange1]Indic STT Demo[/] — language: [bold]{lang}[/]")

    # Prepare audio
    if audio:
        console.print(f"Loading audio: [bold]{audio}[/]")
        test_audio = load_audio(audio)
    else:
        console.print("[dim]No audio file provided — using synthetic 2-second 440 Hz tone.[/]")
        console.print("[yellow]ℹ[/] Transcription will be empty/nonsense for test tone. Supply --audio for real results.")
        test_audio = generate_test_tone()

    # Select models to test
    models_to_test = (
        ["indicwhisper", "indicwav2vec", "indicconformer"]
        if model == "all"
        else [model]
    )

    # Results table
    table = Table(title="Transcription Comparison", border_style="dim", show_lines=True)
    table.add_column("Model",       style="bold",        width=18)
    table.add_column("Transcript",  style="white",       min_width=40)
    table.add_column("Time (ms)",   style="dim",         width=12)
    table.add_column("Words",       style="dim",         width=8)

    for m in models_to_test:
        console.print(f"\n[dim]Loading {m}…[/]")
        try:
            engine = get_stt_engine(m, language=lang)
            t0     = time.perf_counter()
            text   = engine.transcribe(test_audio)
            ms     = (time.perf_counter() - t0) * 1000
            words  = len(text.split())
            table.add_row(m, text or "[dim](empty)[/]", f"{ms:.0f}", str(words))
        except Exception as e:
            table.add_row(m, f"[red]ERROR: {e}[/]", "—", "—")

    console.print()
    console.print(table)
    console.print("[dim]\nTip: Run 'python main.py api' then open http://localhost:8000/ui for the web UI.[/]")


if __name__ == "__main__":
    demo()
