from fastapi import FastAPI, File, Form, UploadFile
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

# Global dict to track extraction progress state percentages
progress_store = {}

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
    task_id: str | None = None

class TTSRequest(BaseModel):
    text: str
    language: str = "en"

class PDFExportRequest(BaseModel):
    data: dict
    language: str = "en"

@app.get("/health")
def health_check():
    return {"status": "backend running"}

@app.get("/")
def read_root():
    return {"message": "Lexara AI Backend is running"}


@app.post("/api/upload_and_process")
async def upload_and_process(file: UploadFile = File(...), task_id: str = Form(None)):
    if task_id:
        progress_store[task_id] = {"status": "Extracting Document Bytes...", "percent": 5}
        
    content = await file.read()
    filename = file.filename or "unknown"
    
    # 1. Extract Base64 Images quickly (150 DPI)
    images = extract_base64_from_file(content, filename)
    
    if task_id:
        progress_store[task_id] = {"status": "Analyzing Document Structure...", "percent": 15}
        
    # 2. Cognitively Process via GPT-4o
    result = generate_cognitive_steps(images, task_id)
    
    if task_id:
        progress_store[task_id] = {"status": "Completed Extraction", "percent": 100}
        
    # Fire and forget storage for demo purposes
    try:
        store_processed_paper(result)
    except Exception as e:
        print(f"Failed to store paper in background: {e}")
    return result

@app.get("/api/progress/{task_id}")
def get_progress(task_id: str):
    data = progress_store.get(task_id, {"status": "Initializing Engine...", "percent": 0})
    return JSONResponse(content=data)

@app.post("/api/tts")
async def generate_tts(request: TTSRequest):
    filename = f"{uuid.uuid4().hex}.mp3"
    audio_url = generate_audio(request.text, filename, request.language)
    return {"audio_url": audio_url}

@app.post("/api/export_pdf")
async def export_pdf(request: PDFExportRequest):
    filepath = generate_dyslexic_pdf(request.data, request.language)
    return FileResponse(path=filepath, filename="Lexara_Dyslexic_Document.pdf", media_type="application/pdf")

# ── Clean API aliases (used by Next.js gateway) ──────────────────────────────

@app.post("/process")
async def process(file: UploadFile = File(...), task_id: str = Form(None)):
    """Alias for /api/upload_and_process — proxied by Next.js /api/v1/process"""
    return await upload_and_process(file=file, task_id=task_id)

@app.post("/ocr")
async def ocr(file: UploadFile = File(...)):
    """Extract raw base64 images from an uploaded file — proxied by Next.js /api/v1/ocr"""
    content = await file.read()
    filename = file.filename or "unknown"
    images = extract_base64_from_file(content, filename)
    return {"images": images, "count": len(images)}

@app.post("/tts")
async def tts(request: TTSRequest):
    """Alias for /api/tts — proxied by Next.js /api/v1/tts"""
    return await generate_tts(request)
