"""
audio_utils.py  –  Audio recording, resampling, and VAD helpers.

Features:
  - Microphone recording with WebRTC VAD (auto-stop on silence)
  - WAV file loading & resampling to 16 kHz mono
  - Chunk-based streaming for real-time inference
"""

from __future__ import annotations
import io
import struct
import time
import wave
from pathlib import Path
from typing import Generator

import numpy as np
import soundfile as sf
import librosa

try:
    import pyaudio
    PYAUDIO_AVAILABLE = True
except ImportError:
    PYAUDIO_AVAILABLE = False

try:
    import webrtcvad
    VAD_AVAILABLE = True
except ImportError:
    VAD_AVAILABLE = False

from config import SAMPLE_RATE, CHANNELS, CHUNK_MS, SILENCE_TIMEOUT_SEC


# ── Constants ──────────────────────────────────────────────────────────────────
FRAME_SIZE = int(SAMPLE_RATE * CHUNK_MS / 1000)   # samples per VAD frame
FRAME_BYTES = FRAME_SIZE * 2                        # 16-bit PCM → 2 bytes/sample


# ── Load & resample any audio file ────────────────────────────────────────────
def load_audio(path: str | Path, target_sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Load audio from file and resample to target_sr (mono, float32 in [-1, 1]).
    Supports WAV, MP3, FLAC, OGG, and more via librosa/soundfile.
    """
    path = str(path)
    try:
        audio, sr = sf.read(path, dtype="float32", always_2d=False)
    except Exception:
        audio, sr = librosa.load(path, sr=None, mono=True)

    # Mix down to mono
    if audio.ndim == 2:
        audio = audio.mean(axis=1)

    # Resample if needed
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)

    return audio.astype(np.float32)


def _guess_extension(data: bytes) -> str:
    """Guess audio file extension from magic bytes."""
    if data[:4] == b'RIFF':
        return '.wav'
    if data[:3] == b'ID3' or data[:2] == b'\xff\xfb' or data[:2] == b'\xff\xf3':
        return '.mp3'
    if data[:4] == b'fLaC':
        return '.flac'
    if data[:4] == b'OggS':
        return '.ogg'
    if data[4:8] == b'ftyp':
        return '.m4a'
    # WebM starts with 0x1A 0x45 0xDF 0xA3
    if data[:4] == b'\x1a\x45\xdf\xa3':
        return '.webm'
    return '.wav'   # safe default


def load_audio_bytes(audio_bytes: bytes, target_sr: int = SAMPLE_RATE) -> np.ndarray:
    """
    Load audio from raw bytes, handling any format: WAV, MP3, FLAC, OGG, WebM, M4A.
    The browser mic sends WebM/Opus — soundfile can't read it from a BytesIO,
    so we write to a named temp file and let torchaudio/librosa decode it.
    """
    import tempfile, os

    ext = _guess_extension(audio_bytes)

    # Write to a named temp file so decoders can identify the format
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        audio, sr = _load_any_format(tmp_path)
    finally:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

    # Mix down to mono
    if audio.ndim == 2:
        audio = audio.mean(axis=1 if audio.shape[1] < audio.shape[0] else 0)

    # Resample if needed
    if sr != target_sr:
        audio = librosa.resample(audio, orig_sr=sr, target_sr=target_sr)

    return audio.astype(np.float32)


def _load_any_format(path: str):
    """Try multiple backends to load audio. Returns (audio_array, sample_rate)."""
    # 1. Try torchaudio (handles WebM, MP3, FLAC, OGG, WAV natively)
    try:
        import torchaudio
        waveform, sr = torchaudio.load(path)
        audio = waveform.numpy()
        if audio.ndim == 2:
            audio = audio.mean(axis=0)  # channels → mono
        return audio, sr
    except Exception:
        pass

    # 2. Try librosa (uses audioread as fallback — handles most formats)
    try:
        audio, sr = librosa.load(path, sr=None, mono=True)
        return audio, sr
    except Exception:
        pass

    # 3. Try soundfile (WAV, FLAC, OGG – not WebM)
    try:
        audio, sr = sf.read(path, dtype='float32', always_2d=False)
        return audio, sr
    except Exception as e:
        raise RuntimeError(
            f"Could not decode audio file '{path}'. "
            "Supported formats: WAV, MP3, FLAC, OGG, WebM, M4A. "
            f"Underlying error: {e}"
        )



def save_audio(audio: np.ndarray, path: str | Path, sr: int = SAMPLE_RATE) -> None:
    """Save numpy float32 audio to WAV."""
    sf.write(str(path), audio, sr)


# ── Convert numpy → WAV bytes ─────────────────────────────────────────────────
def numpy_to_wav_bytes(audio: np.ndarray, sr: int = SAMPLE_RATE) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    return buf.getvalue()


# ── WebRTC VAD –– microphone recording that auto-stops on silence ──────────────
class MicrophoneRecorder:
    """
    Records from the default microphone until a period of silence is detected.
    Requires pyaudio and webrtcvad.
    """

    def __init__(
        self,
        aggressiveness: int = 2,          # 0-3 (3 = most aggressive VAD)
        silence_timeout: float = SILENCE_TIMEOUT_SEC,
        sample_rate: int = SAMPLE_RATE,
    ):
        if not PYAUDIO_AVAILABLE:
            raise RuntimeError("pyaudio is not installed. Run: pip install pyaudio")
        if not VAD_AVAILABLE:
            raise RuntimeError("webrtcvad is not installed. Run: pip install webrtcvad")

        self.sr             = sample_rate
        self.silence_timeout = silence_timeout
        self.vad            = webrtcvad.Vad(aggressiveness)

    def record(self, max_seconds: float = 30.0) -> np.ndarray:
        """
        Block until speech is detected, then record until silence.
        Returns float32 numpy array at self.sr.
        """
        pa = pyaudio.PyAudio()
        stream = pa.open(
            format=pyaudio.paInt16,
            channels=CHANNELS,
            rate=self.sr,
            input=True,
            frames_per_buffer=FRAME_SIZE,
        )

        print("🎙️  Listening… (speak now)")
        frames: list[bytes] = []
        silence_start: float | None = None
        recording = False
        start_time = time.time()

        try:
            while True:
                if time.time() - start_time > max_seconds:
                    break

                raw = stream.read(FRAME_SIZE, exception_on_overflow=False)
                is_speech = self.vad.is_speech(raw, self.sr)

                if is_speech:
                    if not recording:
                        print("🔴 Recording…")
                        recording = True
                    frames.append(raw)
                    silence_start = None
                else:
                    if recording:
                        frames.append(raw)
                        if silence_start is None:
                            silence_start = time.time()
                        elif time.time() - silence_start > self.silence_timeout:
                            print("⏹️  Silence detected — processing…")
                            break
        finally:
            stream.stop_stream()
            stream.close()
            pa.terminate()

        if not frames:
            return np.zeros(0, dtype=np.float32)

        # Decode PCM bytes → float32
        pcm = b"".join(frames)
        audio = np.frombuffer(pcm, dtype=np.int16).astype(np.float32) / 32768.0
        return audio

    def stream_chunks(
        self, chunk_duration_sec: float = 1.0
    ) -> Generator[np.ndarray, None, None]:
        """Generator that yields audio chunks (for streaming STT)."""
        pa = pyaudio.PyAudio()
        chunk_frames = int(self.sr * chunk_duration_sec)
        stream = pa.open(
            format=pyaudio.paInt16,
            channels=CHANNELS,
            rate=self.sr,
            input=True,
            frames_per_buffer=chunk_frames,
        )
        try:
            while True:
                raw = stream.read(chunk_frames, exception_on_overflow=False)
                audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
                yield audio
        finally:
            stream.stop_stream()
            stream.close()
            pa.terminate()
