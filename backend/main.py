from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import uuid

from services.ocr import extract_text_from_image
from services.ai_processor import generate_cognitive_steps
from services.tts import generate_audio, TTS_DIR

app = FastAPI(title="Lexara AI Backend")

# Mount static directory for audio files
app.mount("/static", StaticFiles(directory=TTS_DIR), name="static")

# Standard CORS setup for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SimplifyRequest(BaseModel):
    text: str

class TTSRequest(BaseModel):
    text: str

@app.get("/")
def read_root():
    return {"message": "Lexara AI Backend is running"}

@app.post("/api/upload")
async def upload_exam_paper(file: UploadFile = File(...)):
    content = await file.read()
    text = extract_text_from_image(content)
    return {"text": text}

@app.post("/api/process")
async def process_question(request: SimplifyRequest):
    result = generate_cognitive_steps(request.text)
    return result

@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    filename = f"{uuid.uuid4().hex}.mp3"
    audio_url = generate_audio(request.text, filename)
    return {"audio_url": audio_url}
