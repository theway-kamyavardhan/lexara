# Lexara AI 🧠✨

**Lexara AI** is a specialized cognitive exam assistant designed explicitly for dyslexic students. It leverages Next.js, Framer Motion, and AI to transform overwhelming, dense exam questions into accessible, step-by-step conceptual breakdowns. 

The application is built with a premium "Apple Midnight Blue" aesthetic, focusing heavily on reducing visual noise, preventing cognitive overload, and gamifying the learning process.

---

## 🚀 Key Features

### 1. The "Dyslexic Form" Engine
*   **OpenDyslexic Font Integration:** Instantly toggles the entire content pane to use the clinically recommended OpenDyslexic font.
*   **Cognitive Spacing:** Automatically injects `0.05em` letter spacing, increased word spacing, and 2.0x line-height to reduce visual crowding.
*   **Multi-Language Support (Hindi!):** Dyslexia affects script reading too. Lexara applies specialized spacing algorithms to Devanagari (Hindi) text to maintain legibility without breaking character ligatures.

### 2. Cinema Focus Mode 🎬
*   Dyslexic individuals often struggle with tracking lines in large paragraphs. **Cinema Focus** darkens the entire screen (VisionOS style) and isolates **one step of the solution at a time**.
*   Users can navigate forwards and backwards using intuitive controls, eliminating the distraction of surrounding text.

### 3. Native Text-To-Speech (TTS) 🎧
*   **Auto-Language Detection:** The built-in TTS engine automatically detects if the text is English or Hindi and selects the highest-quality native OS AI voice available.
*   **Cognitive Pacing:** English text is read at an 85% reduced speed by default to allow for improved auditory processing and cognitive syncing.

### 4. The "Journey" Tab & Gamification 🏆
*   **Apple Health-Style Activity Tracking:** A beautiful, animated SVG progress ring tracks the student's "Daily Academic Goals" based on the number of concepts they complete.
*   **Celebration Feedback:** Upon completing a full concept breakdown in Focus Mode, users are rewarded with a burst of colored confetti, triggering positive dopamine loops.

### 5. Personal Wellbeing Module 🫁
*   Dyslexia causes severe academic fatigue. Lexara includes a fully animated **4-7-8 Breathing Exercise** integrated directly into the dashboard.
*   With smooth Framer Motion scaling and blur transitions, it guides the user to "Breathe In" (4s), "Hold" (7s), and "Breathe Out" (8s) to quickly reduce cognitive overload.

### 6. Lexara "Dynamics" (Settings) ⚙️
*   **Typography Control:** Adjust the global interface text size (Small / Medium / Large).
*   **Audio Pacing:** Slider to adjust the TTS reading speed from 0.5x to 1.5x.
*   **Global Midnight Theme:** A forced, deeply saturated Apple Midnight Blue UI that prevents the jarring brightness of traditional academic PDFs.

---

## 🛠 Tech Stack

**Frontend:**
*   **Next.js 14+** (App Router)
*   **React** (Hooks, Context)
*   **Tailwind CSS v4** (Utility-first styling, Glassmorphism)
*   **Framer Motion** (Fluid layout animations, Presence transitions)
*   **Lucide React** (Vector iconography)

**Backend (Prepared for Phase 2):**
*   **FastAPI** (Python async backend)
*   **Supabase** (Authentication & Database)
*   **PyTesseract / OpenCV** (OCR engine for parsing PDFs/Images)

---

## 💻 Getting Started (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/theway-kamyavardhan/lexara.git
cd lexara
```

### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
# Note: You may need to use --legacy-peer-deps depending on your Node.js version
```

Create your environment file:
```bash
# Create a .env.local file in the frontend/ directory
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### 3. Backend Setup (Phase 2 Prep)
Navigate to the backend directory:
```bash
cd backend
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Run the FastAPI server:
```bash
uvicorn main:app --reload --port 8000
```

---

## 🎨 UI/UX Design Philosophy

Lexara AI abandons the clinical, hospital-like aesthetic of traditional accessibility tools. Instead, it adopts a **Premium Consumer Software** look (inspired by Apple visionOS and modern SaaS platforms). 
We believe that accessible software should also look breathtaking. The use of glowing *Liquid Lens* backgrounds ensures the app feels dynamic, alive, and engaging, encouraging students to actively use the platform rather than dreading it.
