import os
from gtts import gTTS

TTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

# Ensure static directory exists
os.makedirs(TTS_DIR, exist_ok=True)

def generate_audio(text: str, filename: str) -> str:
    """
    Generate MP3 from text using gTTS and return the saved path.
    Supports basic language detection (Hindi vs English) and uses slow pacing for accessibility.
    """
    # Simple heuristic for Hindi detection (check for Devanagari characters)
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    lang = 'hi' if is_hindi else 'en'
    
    # We use slow=True for Dyslexia-friendly cognitive pacing if it's English, 
    # but for Hindi slow=False often sounds more natural with gTTS.
    tts = gTTS(text=text, lang=lang, slow=not is_hindi)
    
    filepath = os.path.join(TTS_DIR, filename)
    tts.save(filepath)
    return f"/static/{filename}"
