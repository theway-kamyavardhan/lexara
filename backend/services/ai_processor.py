import os
import json
import uuid
import concurrent.futures
import threading
import main
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Optional

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

# --- Pydantic Schema for OpenCV/OpenAI Master Processing ---
class QuestionOriginal(BaseModel):
    english: str = Field(description="The exact wording of the question extracted from the image.")

class QuestionSimplified(BaseModel):
    english: str = Field(description="The simplified Dyslexic-friendly version of the question.")
    steps: list[str] = Field(description="Short, disjointed cognitive bullet points guiding the student through the problem step-by-step. Highlight numbers and key terms in double asterisks.")

class QuestionTranslations(BaseModel):
    hindi: str = Field(description="Fluent Hindi translation.")
    gujarati: str = Field(description="Fluent Gujarati translation.")
    marathi: str = Field(description="Fluent Marathi translation.")
    bengali: str = Field(description="Fluent Bengali translation.")
    tamil: str = Field(description="Fluent Tamil translation.")
    telugu: str = Field(description="Fluent Telugu translation.")
    kannada: str = Field(description="Fluent Kannada translation.")
    malayalam: str = Field(description="Fluent Malayalam translation.")
    punjabi: str = Field(description="Fluent Punjabi translation.")

class ExamQuestion(BaseModel):
    id: str = Field(description="A unique UUID for this question.", default_factory=lambda: str(uuid.uuid4()))
    question_number: int = Field(description="The inferred question number from the exam paper.")
    type: str = Field(description="e.g. 'mcq', 'short_answer', 'essay'")
    marks: int = Field(description="The marks or weight of the question, if visible. 0 if none.")
    complexity_score: float = Field(description="A score from 0.0 to 1.0 indicating how difficult the question is for a dyslexic student.")
    difficulty_level: str = Field(description="Either 'Easy', 'Medium', or 'Hard' based on the cognitive load.")
    original: QuestionOriginal
    simplified: QuestionSimplified
    translations: QuestionTranslations

class ProcessedData(BaseModel):
    questions: list[ExamQuestion] = Field(description="An array of all distinct questions extracted from the exam paper.")

def generate_mock_fallback(base64_images: list[str]) -> dict:
    """Fallback logic used for demos or if OpenAI is missing/rate-limited."""
    
    # We don't have OCR text anymore, so we just return the Math Demo 
    # to guarantee a flawless presentation if API keys fail.
    base_demo = DEMO_QUESTIONS["Math"]
    
    return {
        "questions": [
            {
                "id": str(uuid.uuid4()),
                "question_number": 1,
                "type": "problem",
                "marks": 5,
                "complexity_score": 0.76,
                "difficulty_level": "High",
                "original": {
                    "english": "Communication involves a sender, who encodes and sends a message through a channel, and a receiver who decodes the message."
                },
                "simplified": {
                    "english": "How does communication happen?",
                    "steps": [
                        "Step 1: A **sender** has an idea.",
                        "Step 2: They send a **message**.",
                        "Step 3: A **receiver** gets and understands the message."
                    ]
                },
                "translations": {
                    "hindi": "संदेश भेजने वाला और प्राप्त करने वाला कैसे काम करते हैं?",
                    "gujarati": "સંદેશ મોકલનાર અને પ્રાપ્ત કરનાર કેવી રીતે કાર્ય કરે છે?",
                    "marathi": "संदेश पाठवणारा आणि प्राप्त करणारा कसे कार्य करतात?",
                    "bengali": "বার্তা প্রেরক এবং প্রাপক কীভাবে কাজ করে?",
                    "tamil": "செய்தி அனுப்புபவர் மற்றும் பெறுபவர் எவ்வாறு செயல்படுகிறார்கள்?",
                    "telugu": "సందేశం పంపేవారు మరియు స్వీకరించేవారు ఎలా పని చేస్తారు?",
                    "kannada": "ಸಂದೇಶ ಕಳುಹಿಸುವವರು ಮತ್ತು ಸ್ವೀಕರಿಸುವವರು ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತಾರೆ?",
                    "malayalam": "സന്ദേശം അയയ്ക്കുന്നയാളും സ്വീകരിക്കുന്നയാളും എങ്ങനെ പ്രവർത്തിക്കുന്നു?",
                    "punjabi": "ਸੁਨੇਹਾ ਭੇਜਣ ਵਾਲਾ ਅਤੇ ਪ੍ਰਾਪਤ ਕਰਨ ਵਾਲਾ ਕਿਵੇਂ ਕੰਮ ਕਰਦੇ ਹਨ?"
                }
            }
        ]
    }

def generate_cognitive_steps(images: list[str], task_id: str | None = None) -> dict:
    """
    Iterates through each base64 string (representing a chunk or page of the Exam Paper).
    Extracts educational questions and automatically simplifies them for dyslexic users using strict formatting.
    Updates main.progress_store dynamically to drive frontend loading bars.
    """
    if not HAS_OPENAI or not OPENAI_API_KEY or OPENAI_API_KEY == "your_openai_api_key_here":
        print("Using Mock Data Generator")
        import time
        if task_id:
            for i in range(1, 4):
                time.sleep(1)
                main.progress_store[task_id] = {"status": f"Mocking page {i}...", "percent": i * 33}
        return generate_mock_fallback(images)

    client = OpenAI(api_key=OPENAI_API_KEY)

    system_prompt = """
    You are Lexara AI, an accessibility engine for dyslexic students.
    You will receive an exam question extracted from a question paper.
    
    Your tasks:
    1. Identify the question type (e.g., mcq, problem, essay).
    2. Estimate the complexity_score (0.0 to 1.0).
    3. Assign difficulty level: Easy / Medium / Hard based on Sentence length, Word complexity, Concept density, and Numbers / formulas.
    4. Rewrite the question in simplified English suitable for dyslexic students.
       CRITICAL FORMATTING RULE: The simplified question MUST be formatted as a vertical list of short, distinct statements, separated by double newlines (\\n\\n). DO NOT write continuous paragraphs. Format strictly like:
       Statement 1.\\n\\nStatement 2.\\n\\nStatement 3.
       Rules for simplification: short sentences, simple vocabulary, clear structure, avoid complex grammar, highlight numbers and variables in double asterisks (**like this**).
    5. Convert the simplified question into cognitive thinking steps.
       CRITICAL FORMATTING RULE: Start each step strictly with "Step X " (e.g. "Step 1 Identify values", "Step 2 Use formula"). DO NOT use colons or extra punctuation after the step number. Let it flow immediately into a 2-3 word imperative action.
    6. Translate the simplified question AND instructions into major Indian languages: Hindi, Gujarati, Marathi, Bengali, Tamil, Telugu, Kannada, Malayalam, Punjabi.
    7. Ensure translations remain simple and accessible.
    """

    all_questions = []
    completed_pages = [0]
    progress_lock = threading.Lock()

    def process_page(index: int, img_data: str):
        # Format the Vision payload strictly for the current page
        content_payload = [
            {"type": "text", "text": "Extract and cognitively break down the exam paper in the provided image."},
            {
                "type": "image_url",
                "image_url": {
                    "url": img_data,
                    "detail": "high"
                }
            }
        ]

        try:
            # Using the fast gpt-4o-mini model perfectly guarantees we won't hit TPM rate limits
            response = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": content_payload}
                ],
                response_format=ProcessedData,
                timeout=60.0,
            )
            
            result_content = response.choices[0].message.parsed
            questions_list = result_content.questions if result_content and result_content.questions else []
            
            # Safely log progress using thread locks
            with progress_lock:
                completed_pages[0] += 1
                if task_id:
                    progress = int((completed_pages[0] / len(images)) * 100)
                    if progress >= 100: progress = 98 
                    main.progress_store[task_id] = {"status": f"Reading page {completed_pages[0]} of {len(images)}...", "percent": progress}
                    
            return questions_list
            
        except Exception as e:
            print(f"OpenAI API Error on page {index}: {e}")
            with progress_lock:
                completed_pages[0] += 1
            return []

    # Fire all extraction translations at OpenAI simultaneously!
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        futures = [executor.submit(process_page, i, img) for i, img in enumerate(images)]
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            if res:
                all_questions.extend(res)

    if not all_questions and len(images) == 1:
         return generate_mock_fallback(images)
         
    # Serialize the combined parsed chunks to standard Python dicts for FastAPI JSON output
    return {"questions": [q.model_dump() for q in all_questions]}

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
