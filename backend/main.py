from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import os
import uuid

from services.ocr import extract_base64_from_file
from services.ai_processor import generate_cognitive_steps, translate_cognitive_data
from services.tts import generate_audio, TTS_DIR
from services.database import store_processed_paper
from services.pdf_generator import generate_dyslexic_pdf

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
    images: list[str]

class TranslateRequest(BaseModel):
    data: dict
    target_language: str

class TTSRequest(BaseModel):
    text: str

class PDFExportRequest(BaseModel):
    data: dict
    language: str = "en"

@app.get("/")
def read_root():
    return {"message": "Lexara AI Backend is running"}

@app.post("/api/upload")
async def upload_exam_paper(file: UploadFile = File(...)):
    content = await file.read()
    filename = file.filename or "unknown"
    images = extract_base64_from_file(content, filename)
    return {"images": images}

@app.post("/api/process")
async def process_question(request: SimplifyRequest):
    result = generate_cognitive_steps(request.images)
    # Fire and forget storage for demo purposes
    try:
        store_processed_paper(result)
    except Exception as e:
        print(f"Failed to store paper in background: {e}")
    return result

@app.post("/api/translate")
async def translate_content(request: TranslateRequest):
    result = translate_cognitive_data(request.data, request.target_language)
    return result

@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    filename = f"{uuid.uuid4().hex}.mp3"
    audio_url = generate_audio(request.text, filename)
    return {"audio_url": audio_url}

@app.post("/api/export_pdf")
async def export_pdf(request: PDFExportRequest):
    filepath = generate_dyslexic_pdf(request.data, request.language)
    return FileResponse(path=filepath, filename="Lexara_Dyslexic_Document.pdf", media_type="application/pdf")
