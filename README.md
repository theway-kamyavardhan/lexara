# Lexara Air - AI Accessibility Engineering for Dyslexic Cognitive Scaffolding 🌌
Lexara Air is a cutting-edge, visually stunning educational platform designed specifically to aid students with Dyslexia and Cognitive processing disorders. Leveraging state-of-the-art Generative AI (GPT-4o Vision & Audio), Lexara automatically parses complex examination papers (like the CBSE Board exams or SATs) and seamlessly breaks them down into hyper-simplified cognitive checkpoints.

### Key Features
1. **Dynamic PDF parsing**: Upload entire CBSE exams and instantly receive cognitively chunked JSON data isolating distinct questions and MCQ options.
2. **Simplified Context**: Bypasses the complex grammatical jargon of exams and re-writes the question in high-legibility syntax without giving away the answer.
3. **Lexara Audio Pipeline**: Every single word is dynamically narrated using advanced AI Text-To-Speech. The speed is globally controllable to aid in processing delays.
4. **Instant Translation Engine**: Lexara handles complex cognitive loads across languages effortlessly. Click the globe icon and instantly translate the entire examination paper into 15+ rich dialects (Hindi, Marathi, Urdu, French, Spanish, Mandarin, etc.) without losing context.
5. **Certified Dyslexic Typography Engine**: With the toggle of a button, the entire beautiful UI morphs into a High-Contrast `OpenDyslexic` font layout. The letter-spacing and line-heights mathematically adjust to maximize saccadic eye movement legibility.
6. **Dyslexic PDF Auto-Generation**: Hate screens? Click *Export as Dyslexic PDF* on any uploaded exam, and a custom Python backend engine redraws the entire unstructured document into a beautifully aligned, Dyslexic-Font-embedded PDF file for instant offline download and printing.
7. **Breathtaking UI**: Who said accessible tech has to be ugly? Lexara Air is heavily inspired by Apple Intelligence and VisionOS, featuring smooth Framer Motion spring physics, "Cinema Focus" study environments, and live Aurora background blobs.

---

## 🚀 Running Lexara Locally

Lexara Air is a Monorepo composed of a **Next.js 15 Frontend** and a **Python FastAPI Backend**.

### 1. Backend Setup (FastAPI + OpenAI)
You will need an OpenAI developer account and API key to power the Vision, Translation, and Audio models.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file inside the `/backend` folder. **Do not commit this file!**
```env
OPENAI_API_KEY=sk-proj-your-api-key-here
```

Start the Python Server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Note: The backend will run on `http://localhost:8000`.*

### 2. Frontend Setup (Next.js 15 + Tailwind 4)
Open a new terminal window side-by-side with your running backend.

```bash
cd frontend
npm install
```

Create a `.env.local` file inside the `/frontend` folder:
```env
NEXT_PUBLIC_AI_API_URL=http://localhost:8000
```

Start the Frontend Server:
```bash
npm run dev
```
*Navigate to `http://localhost:3000` to interact with Lexara Air!*

---

## 🌍 Steps to Deploy for Production (Hackathon/Public)

When moving this project from your Local Computer to the public internet, follow these deployment steps:

### 1. Pushing to GitHub
You must first push your code to a secure GitHub repository. **Ensure your `.gitignore` is active so you do not leak your OpenAI keys!**
```bash
git init
git add .
git commit -m "Initial Launch of Lexara Air"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Deploying the Backend (Render.com)
The Python API must be hosted on a persistent server so the Frontend can talk to it remotely.
1. Create a free account at [Render.com](https://render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub account and select your Lexara repository.
4. Set the **Root Directory** to `backend`.
5. Set the **Build Command** to: `pip install -r requirements.txt`
6. Set the **Start Command** to: `uvicorn main:app --host 0.0.0.0 --port $PORT`
7. Expand the **Environment Variables** section and meticulously add: `OPENAI_API_KEY` with your secret key.
8. Click Deploy. Once it finishes building, Render will give you a public URL (e.g. `https://lexara-backend.onrender.com`).

### 3. Deploying the Frontend (Vercel.com)
1. Create a free account at [Vercel.com](https://vercel.com).
2. Click **Add New Project** and import the exact same Lexara GitHub repository.
3. Vercel will auto-detect Next.js. Set the **Root Directory** to `frontend`.
4. Open the **Environment Variables** tab.
5. Add `NEXT_PUBLIC_AI_API_URL` and paste the public URL you got from Render! *(e.g. `https://lexara-backend.onrender.com`)*
6. Click Deploy. Vercel will build the frontend and give you a beautiful public website link!

*(Note: Whenever you push new code to GitHub `main`, Vercel and Render will automatically re-build and update your live website!)*

---
*Built with ❤️ for accessible education.*
