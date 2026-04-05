"""Download fastText language identification model (lid.176.bin)."""

import pathlib
import urllib.request

MODEL_URL = "https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin"
MODEL_PATH = pathlib.Path("models/lid.176.bin")


def download():
    MODEL_PATH.parent.mkdir(exist_ok=True)
    if MODEL_PATH.exists():
        print(f"Model already exists at {MODEL_PATH}")
        return
    print(f"Downloading {MODEL_URL} ...")
    urllib.request.urlretrieve(MODEL_URL, MODEL_PATH)
    print(f"Saved to {MODEL_PATH}")


if __name__ == "__main__":
    download()
