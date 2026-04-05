@echo off
:: ─────────────────────────────────────────────────────────────────────────────
:: setup_nemo.bat  –  Install NeMo from AI4Bharat fork (for IndicConformer)
:: Run ONCE before using indicconformer backend.
:: ─────────────────────────────────────────────────────────────────────────────
echo.
echo  =========================================================
echo  Installing NVIDIA NeMo (AI4Bharat fork) for IndicConformer
echo  Requires: Git, Python 3.10+, CUDA-capable GPU recommended
echo  =========================================================
echo.

:: Check Python
python --version 2>nul || (echo ERROR: Python not found. Install Python 3.10+. & exit /b 1)

:: Install core requirements first
echo [1/4] Installing core Python packages...
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install transformers huggingface_hub soundfile librosa fastapi uvicorn[standard] python-multipart websockets rich click python-dotenv tqdm

:: Install NeMo toolkit
echo [2/4] Installing NVIDIA NeMo ASR toolkit...
pip install nemo_toolkit[asr]

:: Alternative: AI4Bharat's NeMo fork (for latest IndicConformer support)
echo [3/4] (Optional) Cloning AI4Bharat NeMo fork for latest models...
:: git clone --depth 1 https://github.com/AI4Bharat/NeMo.git nemo_fork
:: cd nemo_fork && bash reinstall.sh && cd ..

:: Install remaining deps
echo [4/4] Installing remaining dependencies...
pip install webrtcvad pyaudio sentencepiece protobuf openai-whisper datasets langdetect

echo.
echo  ✓ Setup complete!
echo  Run:  python main.py api --model indicconformer --lang hi
echo.
pause
