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


# ── Text Simplifier (used by Next.js /api/v1/simplify) ───────────────────────

import re

class TextSimplifyRequest(BaseModel):
    text: str

# Complex → simple word substitution table
_WORD_MAP = {
    "obtain": "get", "utilize": "use", "demonstrate": "show",
    "indicate": "show", "sufficient": "enough", "approximately": "about",
    "commence": "start", "terminate": "end", "subsequently": "then",
    "therefore": "so", "however": "but", "nevertheless": "still",
    "furthermore": "also", "consequently": "so", "regarding": "about",
    "implement": "do", "determine": "find", "calculate": "work out",
    "explain": "describe", "identify": "find", "describe": "explain",
    "illustrate": "draw", "perpendicular": "at a right angle",
    "hypotenuse": "the longest side", "adjacent": "next to",
    "equivalent": "equal to", "magnitude": "size", "velocity": "speed",
    "acceleration": "how fast speed changes", "momentum": "force of motion",
    "photosynthesis": "the way plants make food using sunlight",
    "osmosis": "water moving through a thin layer",
}

def _rule_based_simplify(text: str) -> str:
    """
    A solid rule-based simplifier:
      1. Word substitution (complex → simple)
      2. Split long sentences at conjunctions / semicolons
      3. Remove excessive parenthetical clauses
      4. Flatten passive voice patterns where trivially detectable
    """
    # 1. Word substitution (case-insensitive, whole-word)
    for complex_w, simple_w in _WORD_MAP.items():
        text = re.sub(rf'\b{re.escape(complex_w)}\b', simple_w, text, flags=re.IGNORECASE)

    # 2. Split on "; " and " and " / " but " / " which " when sentence is long
    fragments = re.split(r'\s*[;]\s*', text)
    expanded = []
    for frag in fragments:
        # Split on coordinating conjunctions only if sentence > 80 chars
        if len(frag) > 80:
            sub = re.split(r'(?<=\w),\s+(?:and|but|so|yet|for|nor)\s+', frag, flags=re.IGNORECASE)
            expanded.extend(sub)
        else:
            expanded.append(frag)

    # 3. Strip parenthetical asides  (text inside brackets)
    cleaned = [re.sub(r'\s*\([^)]{10,}\)', '', f).strip() for f in expanded]

    # 4. Remove empty fragments and capitalise each sentence
    sentences = []
    for s in cleaned:
        s = s.strip(' .,')
        if len(s) > 4:
            sentences.append(s[0].upper() + s[1:] + '.')

    return '  '.join(sentences)


def _openai_simplify(text: str) -> str | None:
    """
    Use GPT-4o-mini to simplify the text if OPENAI_API_KEY is available.
    Returns None on any failure so we can fall back to rule-based.
    """
    try:
        from openai import OpenAI
        client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
        if not client.api_key:
            return None
        resp = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": (
                    "You are a dyslexia accessibility assistant. "
                    "Rewrite the following exam question in very simple, short English. "
                    "Use short sentences (max 15 words each). "
                    "Keep all important facts. "
                    "Do NOT give the answer. "
                    "Output only the rewritten text, nothing else."
                )},
                {"role": "user", "content": text},
            ],
            max_tokens=400,
            temperature=0.3,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        print(f"[/simplify] OpenAI unavailable, using rule-based: {e}")
        return None


def simplify_text(text: str) -> str:
    """Main entry point: try OpenAI first, fall back to rule-based."""
    if not text or not text.strip():
        return ""
    text = text.strip()[:2000]          # enforce limit
    result = _openai_simplify(text)
    if not result:
        result = _rule_based_simplify(text)
    return result


@app.post("/simplify")
async def simplify(request: TextSimplifyRequest):
    """Simplify exam question text — proxied by Next.js /api/v1/simplify"""
    if not request.text or not request.text.strip():
        return JSONResponse({"error": "text is required"}, status_code=400)
    if len(request.text) > 2000:
        return JSONResponse({"error": "Text too long (max 2000 chars)"}, status_code=413)
    simplified = simplify_text(request.text)
    return {"simplified_text": simplified, "original_text": request.text.strip()}

