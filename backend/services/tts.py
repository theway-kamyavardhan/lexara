import os
from gtts import gTTS

TTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

# Ensure static directory exists
os.makedirs(TTS_DIR, exist_ok=True)

def generate_audio(text: str, filename: str) -> str:
    """
    Generate MP3 from text using gTTS and return the saved path.
    """
    tts = gTTS(text=text, lang='en', slow=False)
    filepath = os.path.join(TTS_DIR, filename)
    tts.save(filepath)
    return f"/static/{filename}"
