"""FastAPI server for model and zkml proving."""

import logging
import os

from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import scipy.io.wavfile

import utils


logger = logging.getLogger(__name__)


app = FastAPI()
app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


UPLOAD_DIR = './uploads'

if not os.path.exists(UPLOAD_DIR):
    print('Creating uploads directory...')
    os.makedirs(UPLOAD_DIR)


@app.get("/")
async def get_root():
    """Root path."""
    return {"message": "Hello World"}


@app.post('/auth')
async def auth(file: UploadFile):
    """Authenticate user voice."""
    rate, signal = scipy.io.wavfile.read(file.file)
    features = utils.get_features(rate, signal)
    return features.tolist()[0]
