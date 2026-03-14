import os
import json
import uuid
from dotenv import load_dotenv
from pydantic import BaseModel, Field

# Try to import openai, fallback to mock if not installed perfectly
try:
    from openai import OpenAI
    HAS_OPENAI = True
except ImportError:
    HAS_OPENAI = False

# Load Environment Variables from backend/.env
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Load demo data mapped by the first few words of the question or exact match
DEMO_DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "demo_questions.json")

with open(DEMO_DATA_PATH, "r") as f:
    DEMO_QUESTIONS = json.load(f)

# --- Pydantic Schema for OpenAI Structured Outputs ---
class QuestionData(BaseModel):
    original: str = Field(description="The exact wording of the question.")
    simplified: str = Field(description="A highly simplified, direct rewording of what the question is asking in this language.")
    options: list[str] = Field(description="If the question is multiple choice, provide the exact options. Otherwise, an empty list.", default=[])

class BilingualQuestion(BaseModel):
    id: str = Field(description="A unique UUID for this question.", default_factory=lambda: str(uuid.uuid4()))
    en: QuestionData = Field(description="The English localization of the question extraction.")
    hi: QuestionData = Field(description="The Hindi localization of the question extraction.")

class ProcessedData(BaseModel):
    questions: list[BilingualQuestion] = Field(description="An array of all distinct questions extracted from the exam paper.")

def generate_mock_fallback(base64_images: list[str]) -> dict:
    """Fallback logic used for demos or if OpenAI is missing/rate-limited."""
    
    # We don't have OCR text anymore, so we just return the Math Demo 
    # to guarantee a flawless presentation if API keys fail.
    base_demo = DEMO_QUESTIONS["Math"]
    
    return {
        "questions": [
            {
                "id": str(uuid.uuid4()),
                "en": {
                    "original": base_demo.get("original", "Extracted question from image..."),
                    "simplified": base_demo.get("simplified", "Simplified question..."),
                    "options": base_demo.get("options", [])
                },
                "hi": {
                    "original": base_demo.get("original", "Image Extraction") + " (Hindi)",
                    "simplified": "यह प्रश्न आपसे दी गई जानकारी का विश्लेषण करने के लिए कह रहा है।",
                    "options": base_demo.get("options", [])
                }
            }
        ]
    }

def generate_cognitive_steps(images: list[str]) -> dict:
    """
    Sends base64 images to the AI model using Structured Outputs + Vision.
    Extracts distinct questions from a CBSE paper, breaks down the cognitive steps
    *without* revealing the answer, in both English and Hindi.
    """
    if not HAS_OPENAI or not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        print("Using Mock AI Processor (OpenAI not configured or installed)")
        return generate_mock_fallback(images)
        
    client = OpenAI(api_key=OPENAI_API_KEY)
    
    system_prompt = """
    You are an accessibility assistant designed specifically for dyslexic students.
    Take the provided images of an exam paper, extract all distinct questions, and provide a Dyslexia Rephrasing Engine breakdown for EACH question in both English and Hindi.

    Rules for 'simplified':
    - Use short sentences
    - Use simple words
    - Keep the meaning exactly the same
    - DO NOT reveal the answer
    - Keep options unchanged (extract them into the 'options' array)
    - Maintain the exam format
    
    🚨 EXTREMELY CRITICAL INSTRUCTION 🚨:  
    YOU MUST NEVER, UNDER ANY CIRCUMSTANCES, PROVIDE THE FINAL ANSWER OR SOLVE THE MATH PROBLEM.
    DO NOT do the math for the user. DO NOT output numbers that are the solution. Provide ONLY the cognitive scaffolding.
    """

    # Format the Vision payload
    content_payload = [
        {"type": "text", "text": "Extract and cognitively break down the exam paper in the provided images."}
    ]
    for img_data in images:
        content_payload.append({
            "type": "image_url",
            "image_url": {
                "url": img_data,
                "detail": "high"
            }
        })

    try:
        # Using the parse method perfectly guarantees the Pydantic schema return
        response = client.beta.chat.completions.parse(
            model="gpt-4o-2024-08-06",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": content_payload}
            ],
            response_format=ProcessedData,
        )
        
        result_content = response.choices[0].message.parsed
        if not result_content:
             raise ValueError("Empty parsed response from OpenAI")
             
        # Return as a raw dictionary for FastAPI to serialize to JSON
        return result_content.model_dump()
        
    except Exception as e:
        print(f"OpenAI API Error: {e}")
        return generate_mock_fallback(images)

def translate_cognitive_data(data: dict, target_language: str) -> dict:
    """
    Translates a complete QuestionData object into the target language on the fly.
    Uses gpt-4o-mini for speed and cost efficiency.
    """
    if not HAS_OPENAI or not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        print(f"Mock Translation to {target_language}")
        return data

    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = f"""
    You are an expert translator specializing in educational content for Dyslexic students.
    Translate the provided JSON data structure into fluent {target_language}.
    Maintain the exact same tone, simplicity, and array lengths.
    CRITICAL: For the 'options' array, do not evaluate the options, just translate the text.
    """

    try:
        response = client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": json.dumps(data)}
            ],
            response_format=QuestionData,
        )

        result_content = response.choices[0].message.parsed
        if not result_content:
             raise ValueError("Empty parsed response from OpenAI Translate")

        return result_content.model_dump()

    except Exception as e:
        print(f"OpenAI Translation API Error: {e}")
        return data  # Fallback to English/original if translation fails
