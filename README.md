# 777c8 Career OS — Professional Career CRM & Automation Suite

777c8 Career OS is a local-first, automation-centric career management console and resume engineering workspace. By combining automated ATS tailoring pipelines, multi-LLM failover architectures, and interactive mock interview simulators, the platform helps candidates manage their job search, tailors resumes with 100% truth enforcement, and prepares them to clear their interviews.

---

## 🌟 Key Features

1. **Career Command Center (Cockpit)**: circular dials reporting interview readiness scores, activity timelines, skill gap analyzers, and outstanding follow-ups.
2. **Zero-Click Job Tailoring Pipeline**: Paste a Job Description to automatically generate application logs, extract company details, tailor resume content, compute ATS scores, compile PDF/TEX documents, write cover letters, compose recruiter LinkedIn messages, and schedule tasks.
3. **777c8 Interview Intelligence Suite**: Automatic preparation pack compiler producing:
   - Expandable core question banks with ideal response flows.
   - Scenario-based monospaced CLI troubleshooting guides.
   - Flippable study flashcards.
   - Interactive **AI Interview Coach** chatbot providing instant scoring (1-100) and actionable bulleted advice.
4. **Interactive PDF Workspace**: Side-by-side editing pane for resumes, markdown layouts, and hot reloading PDF previews.
5. **Secure Backup & Recovery**: Download or upload database backups protected by AES-256-GCM symmetric encryption.
6. **Multi-AI Engine with Prompt Caching**: Native load-balancing and automated failover support for OpenAI, Anthropic, Gemini, OpenRouter, Groq, DeepSeek, Mistral, and local Ollama models.

---

## 🏗️ Architecture & Security

- **Database**: Async SQLAlchemy engine running SQLite (extensible to PostgreSQL). Dynamic column migrations occur automatically on backend startup.
- **Security & Lock System**: Sensitive API keys and document files are encrypted on disk via **AES-256-GCM**. Encryption keys are derived using PBKDF2-HMAC-SHA256 with 100,000 iterations and a random salt, stored purely in-memory. The app automatically locks and clears credentials on lock triggers.
- **ATS Integrity**: Strictly reads master resume fields as the absolute ground-truth, preventing AI hallucinations.

---

## 🚀 Local Installation Guide

### Option 1: Docker Compose (Quickest)

1. Make sure Docker Desktop and Docker Compose are installed.
2. Clone the repository and navigate to the root directory.
3. Start the services:
   ```bash
   docker-compose up -d
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser. The backend API is available at [http://localhost:8000](http://localhost:8000).

---

### Option 2: Local Manual Setup

#### Prerequisites
- **Python**: 3.12+ installed.
- **Node.js**: 20+ installed.
- **LaTeX (Optional but recommended for PDF compilation)**:
  - Windows: Install [MiKTeX](https://miktex.org/).
  - Linux/Ubuntu: `sudo apt-get install texlive-latex-base texlive-fonts-recommended texlive-latex-extra`

#### 1. Backend Setup
1. Open a terminal and navigate to `/backend`.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy `.env.example` in the root to `.env` inside `/backend` and update keys.
4. Launch the Uvicorn server:
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

#### 2. Frontend Setup
1. Open a new terminal and navigate to `/frontend`.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🛠️ User Workflow Guide

1. **Setup & Unlock**: Create or input your Master Password on first load to unlock the workspace and enable credential access.
2. **Configure API Keys**: Navigate to Settings and input keys for your preferred AI providers (e.g. OpenAI, Gemini, or Groq).
3. **Upload Master Resume**: Upload your main CV document. The system will extract your skills, companies, and roles to serve as the immutable source of truth.
4. **Analyze & Tailor**: Paste a target Job Description. Click **Generate** to trigger the 20+ step automation pipeline.
5. **Study & Prep**: Visit the newly generated Interview Prep page for the application to practice with the AI Coach and review revision cards.
6. **Download / Export**: Download your customized LaTeX resume source, ATS reports, cover letters, or download an encrypted system backup file.
