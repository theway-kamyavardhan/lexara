import os
from gtts import gTTS
from dotenv import load_dotenv

try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

TTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "static")

# Ensure static directory exists
os.makedirs(TTS_DIR, exist_ok=True)

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

def generate_audio(text: str, filename: str) -> str:
    """
    Generate MP3 from text using OpenAI's premium TTS and return the saved path.
    Falls back to gTTS if OpenAI is unresponsive or unconfigured.
    """
    filepath = os.path.join(TTS_DIR, filename)

    if HAS_OPENAI and OPENAI_API_KEY and OPENAI_API_KEY != "your_openai_api_key_here":
        try:
            client = OpenAI(api_key=OPENAI_API_KEY)
            # `nova` provides a gentle, professional voice that works beautifully across languages.
            response = client.audio.speech.create(
                model="tts-1",
                voice="nova",
                input=text
            )
            response.stream_to_file(filepath)
            return f"/static/{filename}"
        except Exception as e:
            print(f"OpenAI TTS Error: {e}. Falling back to gTTS.")

    print("Using gTTS as fallback for Text-to-Speech.")
    # Simple heuristic for Hindi detection (check for Devanagari characters)
    is_hindi = any('\u0900' <= char <= '\u097F' for char in text)
    lang = 'hi' if is_hindi else 'en'
    
    # We use slow=True for Dyslexia-friendly cognitive pacing if it's English, 
    # but for Hindi slow=False often sounds more natural with gTTS.
    tts = gTTS(text=text, lang=lang, slow=not is_hindi)
    
    tts.save(filepath)
    return f"/static/{filename}"
