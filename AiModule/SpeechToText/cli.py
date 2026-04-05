#!/usr/bin/env python3
"""
cli.py  –  Command-line tool for Indic STT.

Commands:
  transcribe   Transcribe an audio file.
  mic          Live microphone transcription.
  benchmark    Run WER benchmark on a folder.
  list-models  List all available models and languages.

Examples:
  python cli.py transcribe audio.wav --model indicwhisper --lang hi
  python cli.py transcribe audio.wav --model indicwav2vec --lang ta
  python cli.py transcribe audio.wav --model indicconformer --lang bn --decoder rnnt
  python cli.py mic --model indicwhisper --lang hi
  python cli.py list-models
"""

import sys
import time
import logging
from pathlib import Path

import click
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn, TimeElapsedColumn
from rich import print as rprint

from config import INDIC_LANGUAGES, INDICWHISPER_MODELS, INDICWAV2VEC_MODELS, INDICCONFORMER_MODELS

console = Console()
logging.basicConfig(level=logging.WARNING)


def _get_engine(model, language, decoder="ctc", **kwargs):
    from models import get_stt_engine
    extra = {}
    if model == "indicconformer":
        extra["decoder"] = decoder
    return get_stt_engine(model, language=language, **extra, **kwargs)


# ── CLI Group ──────────────────────────────────────────────────────────────────
@click.group()
def cli():
    """🇮🇳  Indic Speech-to-Text CLI — AI4Bharat Models"""
    pass


# ── transcribe ─────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("audio_file", type=click.Path(exists=True))
@click.option("--model",    "-m", default="indicwhisper", show_default=True,
              type=click.Choice(["indicwhisper", "indicwav2vec", "indicconformer"]),
              help="STT model to use.")
@click.option("--lang",     "-l", default="hi", show_default=True,
              help="Language code (hi, ta, bn, te, …)")
@click.option("--decoder",  "-d", default="ctc", show_default=True,
              type=click.Choice(["ctc", "rnnt"]),
              help="Decoder (conformer only).")
@click.option("--output",   "-o", default=None,
              help="Save transcript to file.")
@click.option("--timestamps", is_flag=True, default=False,
              help="Return word-level timestamps (whisper only).")
def transcribe(audio_file, model, lang, decoder, output, timestamps):
    """Transcribe an audio file to text."""
    console.rule(f"[bold orange1]Indic STT[/] — {model} · {INDIC_LANGUAGES.get(lang, lang)}")

    with Progress(
        SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
        TimeElapsedColumn(), console=console
    ) as progress:
        t = progress.add_task(f"Loading [bold]{model}[/]…", total=None)
        engine = _get_engine(model, lang, decoder)
        progress.update(t, description="Transcribing…")

        t0 = time.perf_counter()
        if timestamps and model == "indicwhisper":
            result = engine.transcribe_with_timestamps(
                __import__("audio_utils").load_audio(audio_file)
            )
            transcript = result["text"]
        else:
            transcript = engine.transcribe_file(audio_file)
        elapsed = (time.perf_counter() - t0) * 1000
        progress.update(t, description="Done ✓")

    console.print(Panel(
        f"[white]{transcript}[/]",
        title="[bold green]Transcript[/]",
        border_style="orange1",
        padding=(1, 2),
    ))

    words = len(transcript.split())
    console.print(
        f"[dim]Words: {words} · Chars: {len(transcript)} · "
        f"Inference: {elapsed:.0f} ms · Model: {model} · Language: {lang}[/]"
    )

    if output:
        Path(output).write_text(transcript, encoding="utf-8")
        console.print(f"[green]✓[/] Saved to [bold]{output}[/]")


# ── mic ────────────────────────────────────────────────────────────────────────
@cli.command()
@click.option("--model",   "-m", default="indicwhisper", show_default=True,
              type=click.Choice(["indicwhisper", "indicwav2vec", "indicconformer"]))
@click.option("--lang",    "-l", default="hi", show_default=True)
@click.option("--decoder", "-d", default="ctc", show_default=True,
              type=click.Choice(["ctc", "rnnt"]))
@click.option("--continuous", is_flag=True, default=False,
              help="Keep recording until Ctrl+C.")
def mic(model, lang, decoder, continuous):
    """Live microphone transcription with VAD."""
    try:
        from audio_utils import MicrophoneRecorder
    except ImportError as e:
        console.print(f"[red]✗[/] {e}")
        sys.exit(1)

    console.rule(f"[bold orange1]Live Mic STT[/] — {model} · {INDIC_LANGUAGES.get(lang, lang)}")

    with Progress(SpinnerColumn(), TextColumn("[progress.description]{task.description}"),
                  console=console) as p:
        t = p.add_task(f"Loading [bold]{model}[/]…", total=None)
        engine   = _get_engine(model, lang, decoder)
        recorder = MicrophoneRecorder()
        p.update(t, description="Model ready ✓")

    session_num = 0
    try:
        while True:
            session_num += 1
            console.print(f"\n[dim]Session #{session_num}  ·  Press Ctrl+C to quit[/]")
            audio = recorder.record()

            if len(audio) < 1000:
                console.print("[yellow]⚠[/] No speech detected.")
                if not continuous: break
                continue

            with Progress(SpinnerColumn(), TextColumn("Transcribing…"), console=console) as p:
                t = p.add_task("", total=None)
                t0 = time.perf_counter()
                text = engine.transcribe(audio)
                ms   = (time.perf_counter() - t0) * 1000

            console.print(Panel(
                f"[white]{text}[/]",
                title=f"[green]Session #{session_num}[/] — [dim]{ms:.0f} ms[/]",
                border_style="orange1",
            ))

            if not continuous: break

    except KeyboardInterrupt:
        console.print("\n[dim]Stopped.[/]")


# ── list-models ────────────────────────────────────────────────────────────────
@cli.command("list-models")
def list_models():
    """List all available models and their language coverage."""
    console.rule("[bold orange1]Available Indic STT Models[/]")

    def make_table(name, model_dict, color):
        t = Table(title=f"[bold {color}]{name}[/]", border_style="dim", show_lines=True)
        t.add_column("Code",      style="dim",  width=6)
        t.add_column("Language",  style="white")
        t.add_column("Model ID",  style=color)
        for code, lang in INDIC_LANGUAGES.items():
            mid = model_dict.get(code, "[dim]—[/]")
            t.add_row(code, lang, mid)
        return t

    console.print(make_table("IndicWhisper",   INDICWHISPER_MODELS,   "orange1"))
    console.print()
    console.print(make_table("IndicWav2Vec",   INDICWAV2VEC_MODELS,   "violet"))
    console.print()
    console.print(make_table("IndicConformer", INDICCONFORMER_MODELS, "cyan"))


# ── benchmark ─────────────────────────────────────────────────────────────────
@cli.command()
@click.argument("audio_dir",  type=click.Path(exists=True))
@click.argument("ref_file",   type=click.Path(exists=True),
                help="Text file with reference transcripts (one per line).")
@click.option("--model",  "-m", default="indicwhisper")
@click.option("--lang",   "-l", default="hi")
@click.option("--output", "-o", default="benchmark_results.json")
def benchmark(audio_dir, ref_file, model, lang, output):
    """Compute WER on a directory of audio files vs reference transcripts."""
    import json, difflib
    from pathlib import Path

    audio_files = sorted(Path(audio_dir).glob("*.wav")) + \
                  sorted(Path(audio_dir).glob("*.mp3")) + \
                  sorted(Path(audio_dir).glob("*.flac"))
    refs = Path(ref_file).read_text(encoding="utf-8").splitlines()

    if len(audio_files) != len(refs):
        console.print(f"[red]✗[/] {len(audio_files)} files vs {len(refs)} references — mismatch!")
        sys.exit(1)

    engine  = _get_engine(model, lang)
    results = []
    total_wer = 0

    with Progress(console=console) as p:
        task = p.add_task("Benchmarking…", total=len(audio_files))
        for audio_f, ref in zip(audio_files, refs):
            hyp = engine.transcribe_file(str(audio_f))
            ref_words = ref.split()
            hyp_words = hyp.split()
            # simple token-level WER
            matcher = difflib.SequenceMatcher(None, ref_words, hyp_words)
            wer = 1 - matcher.ratio()
            results.append({"file": str(audio_f), "ref": ref, "hyp": hyp, "wer": round(wer, 4)})
            total_wer += wer
            p.advance(task)

    avg_wer = total_wer / len(results) if results else 0
    Path(output).write_text(json.dumps({"avg_wer": round(avg_wer, 4), "results": results}, ensure_ascii=False, indent=2))

    console.print(f"[green]✓[/] Avg WER: [bold]{avg_wer:.2%}[/] — saved to [bold]{output}[/]")


if __name__ == "__main__":
    cli()
