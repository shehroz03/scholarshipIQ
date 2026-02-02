# ScholarIQ - Intelligent Scholarship Finder

ScholarIQ is an advanced scholarship matching platform that leverages AI/NLP to provide personalized scholarship recommendations, fraud detection, and a seamless user experience for students.

## 🚀 Key Features

*   **Intelligent Search**: Advanced filtering by country, city, degree, and field.
*   **Urgency & Timeline**: Visual deadline tracking with red pulsing badges for expiring opportunities.
*   **University Matcher**: Interactive map-based university and scholarship finder.
*   **AI Recommendations**: Personalized profile-based scholarship engine.
*   **Fraud Detection**: Integrated system to flag and warn users about suspicious listings.
*   **Admin Dashboard**: Comprehensive control panel for user management, analytics, and system health monitoring.
*   **Chatbot Assistant**: NLP-powered assistant for instant scholarship queries.

## 📋 Technology Stack

*   **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Lucide React
*   **Backend**: FastAPI (Python), SQLAlchemy, SQLite
*   **Services**: Google Maps API (Integration), NLP (Chatbot/Recommendations)

## 🛠️ Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)

### 1. Backend Setup
```bash
cd backend
# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database (Populates demo data)
python seed.py

# Start the server
uvicorn app.main:app --reload
```
*Backend runs on: `http://localhost:8000`*

### 2. Frontend Setup
```bash
# In the root directory
npm install

# Start the development server
npm run dev
```
*Frontend runs on: `http://localhost:5173`*

## 🔑 Admin Access
*   **URL**: `http://localhost:5173/#admin` (or click "Admin Dashboard" in footer)
*   **Username**: `admin`
*   **Password**: `admin123`

## 🧪 Testing & Verification
The project includes automated verification scripts in the `backend/` directory:
*   `python verify_fr01_05.py`: Tests Account Creation, Login, Search, and Details.
*   `python verify_fr06_10.py`: Tests Chatbot, Fraud Flagging, Saving, and Dashboard.

## 📚 API Documentation
Once the backend is running, full API documentation is available at:
*   **Swagger UI**: `http://localhost:8000/docs`
*   **ReDoc**: `http://localhost:8000/redoc`

## 📁 Project Structure
```
ScholarIQ/
├── backend/
│   ├── app/
│   │   ├── api/          # API Endpoints (Auth, Scholarships, Admin)
│   │   ├── core/         # Config & Security
│   │   ├── db/           # Database Models & Schemas
│   │   └── services/     # NLP & Business Logic
│   ├── seed.py           # Data Seeding Script
│   └── verify_*.py       # Verification Scripts
├── src/
│   ├── components/       # UI Components (Pages, Cards, Admin)
│   ├── api.ts            # Frontend API Client
│   └── App.tsx           # Main Router
└── package.json
```

---
*Final Year Project 2026 - ScholarIQ Team*