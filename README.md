<div align="center">

# 🎓 ScholarIQ

### AI-Powered Scholarship Discovery & Guidance Platform for Pakistani Students

[![Frontend](https://img.shields.io/badge/Frontend-React%2018%20%2B%20TypeScript-61DAFB)]()
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20SQLAlchemy-009688)]()
[![AI](https://img.shields.io/badge/AI-GPT--4o%20%2B%20RAG%20%2B%20RandomForest-FF6F00)]()
[![Status](https://img.shields.io/badge/Status-FYP%202026-success)]()

</div>

---

## 📖 Overview

**ScholarIQ** is a full-stack platform that helps Pakistani students discover, evaluate, and apply for international scholarships. It combines a verified scholarship database with three independent AI/ML systems — a Retrieval-Augmented chatbot, a hybrid recommendation engine, and a fraud-detection pipeline — alongside an autonomous bot that keeps scholarship data fresh and a teacher-led test-prep marketplace.

The platform currently ships with a seeded database of **189 scholarships** across **158 universities**.

---

## ✨ Key Features

| Module | Description |
|---|---|
| 🔍 **Smart Search** | Multi-filter discovery by country, degree, field, funding, CGPA & IELTS |
| 🤖 **AI Chatbot (RAG)** | AI assistant in professional English with verified-data grounding, document analysis & university comparison |
| 🎯 **Recommendation Engine** | Hybrid 60% rule-based + 40% ML matching with cold-start fallback |
| 🛡️ **Fraud Detection** | Multi-layer rule + ML pipeline that flags scam listings |
| 🔄 **Auto-Update Bot** | GPT-4o + Serper agent that verifies & refreshes scholarship data every 4 days |
| ✅ **Auto-Verify Bot** | Confidence-gated pipeline that auto-approves safe scholarships with duplicate / URL / deadline guards |
| 🛂 **Visa Guidance** | Personalized readiness checklists for the UK, Germany & Australia |
| 👨‍🏫 **Teacher Marketplace** | Courses, quizzes, live classes & enrollments for IELTS/TOEFL/GRE prep |
| 🗂️ **Admin Dashboard** | Analytics, fraud manager, staged-review queue, pipeline & bot monitoring |

---

## 🏗️ Tech Stack

**Frontend** — React 18, TypeScript, Vite, Tailwind CSS, Radix UI, React Router 7, Recharts, Framer Motion, React Leaflet

**Backend** — FastAPI, SQLAlchemy, SQLite, JWT (python-jose), bcrypt, APScheduler, SlowAPI

**AI / ML** — OpenAI GPT-4o / GPT-4o-mini, `sentence-transformers` (all-MiniLM-L6-v2) for RAG, scikit-learn (RandomForest), imbalanced-learn (SMOTE), Serper (Google Search)

> A deeper design walkthrough — including the AI/ML pipeline internals — lives in [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+
- **Python** 3.10+

### 1 — Backend

```bash
cd backend

# (recommended) create & activate a virtual environment
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate    # macOS / Linux

# install dependencies
pip install -r requirements.txt

# run the API (tables auto-initialise on startup; DB ships pre-seeded)
uvicorn app.main:app --reload
```

Backend → **http://localhost:8000**
API docs → **http://localhost:8000/api/docs** (Swagger) · **/api/redoc**

### 2 — Frontend

```bash
# from the project root
npm install
npm run dev
```

Frontend → **http://localhost:5173**

### 3 — Environment variables

Copy `backend/.env.example` to `backend/.env` and fill it in. The backend will
not start unless the **required** keys are set:

```ini
SECRET_KEY=...               # (required) JWT signing
ADMIN_USERNAME=admin         # (required) admin dashboard login
ADMIN_PASSWORD=...           # (required) admin dashboard login
OPENAI_API_KEY=sk-...        # (optional) chatbot, SOP writer, auto-updater
SERPER_API_KEY=...           # (optional) scholarship auto-update web search
```

> The app degrades gracefully without the **optional** keys — the chatbot falls back to a SQL-based context layer, and the auto-update bot skips runs when keys are absent.

---

## 🧠 Training the ML Models

Models, feature lists and evaluation reports are committed under `backend/ml/`. To regenerate them from the live database:

```bash
cd backend
python -m ml.train_fraud_model            # → fraud_model.pkl + fraud_model_report.txt
python -m ml.train_recommendation_model   # → scholar_match.pkl + feature_names.json + rec_model_report.txt
```

Each run writes a `*_report.txt` containing the cross-validation metrics, confusion matrix, ROC-AUC, feature importances and an honest evaluation note.

---

## 👤 Admin Access

The admin dashboard lives at **`/admin`**. Admin authentication is **environment-based** — set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in `backend/.env`, then log in with those credentials. (There is no hard-coded default; credentials must be configured before the demo.)

---

## 📁 Project Structure

```
ScholarIQ/
├── backend/
│   ├── app/
│   │   ├── api/              # REST routers (auth, scholarships, admin, chatbot, visa…)
│   │   ├── core/            # config & security
│   │   ├── db/              # SQLAlchemy models, schemas, session
│   │   ├── services/        # business logic (chatbot RAG, fraud, auto-update, embeddings…)
│   │   ├── recommendation/  # hybrid recommendation engine
│   │   └── tasks/           # APScheduler jobs (deadlines, fraud scan, bots, cache refresh)
│   ├── ml/                  # trainers, models (*.pkl), feature config, evaluation reports
│   ├── data/                # seed CSVs & runtime bot logs
│   ├── requirements.txt
│   └── scholariq.db         # pre-seeded SQLite database
├── src/
│   ├── components/          # UI components & pages
│   ├── pages/               # routed pages
│   ├── context/             # React contexts (user, theme, currency)
│   └── App.tsx              # router
├── ARCHITECTURE.md          # system & AI/ML design
└── README.md
```

---

<div align="center">

**Final Year Project · 2026 · ScholarIQ Team**

</div>
