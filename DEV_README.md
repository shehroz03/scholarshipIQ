# ScholarIQ Development Guide

## Backend Setup (Windows)

### 1. Virtual Environment
Backend uses a virtual environment in `backend/.venv`.

### 2. Run Backend
```powershell
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### 3. Database Management
- **Archive Expired Scholarships**:
```powershell
cd backend
.\.venv\Scripts\python.exe scripts/archive_expired_scholarships.py
```
- **Run Migrations**:
```powershell
cd backend
.\.venv\Scripts\python.exe scripts/migrate_archive_fields.py
```

## Frontend Setup
```powershell
cd frontend
npm install
npm run dev
```

## VS Code Configuration
If you see import errors (red squiggly lines):
1. Press `Ctrl+Shift+P`
2. Select **Python: Select Interpreter**
3. Choose `backend/.venv/Scripts/python.exe`
4. If still present, **Developer: Reload Window**

## Project Structure
- `backend/app/api/`: API Routes
- `backend/app/db/`: Database Models & Session
- `backend/app/services/`: Business Logic & Scrapers
- `backend/scripts/`: Maintenance & Migration Scripts

## Final Regression Checklist (Roman Urdu)
Ye list check karein project final karne se pehle:
- [ ] Backend run ho raha hai? (`uvicorn` command check karein)
- [ ] Frontend run ho raha hai? (`npm run dev` check karein)
- [ ] `/admin/api-health` green hai? (Backend health endpoint)
- [ ] Search se results aa rahe hain? (Frontend home page search)
- [ ] Archive script run karne ke baad expired hide ho gaye? (`scripts/archive_expired_scholarships.py`)
- [ ] Staging me pending/blocked items dikh rahe hain? (Admin Dashboard)
- [ ] Fraud detection center me logs aa rahe hain? (Admin Dashboard / Logs)

## 5 Minute Live Demo (Roman Urdu Guide)
Demo ke liye ye steps follow karein:

1. **Admin Side Presentation:**
   - Admin login dikhayein (Admin credentials use karein).
   - **Data Pipeline:** `scripts/scrape_uk_scholarships.py` trigger karke dikhayein ke naya data aa raha hai.
   - **Staging Area:** Dikhaein ke data direct production me nahi jata, pehle Staging me ata hai (`pending` status).
   - **Approval:** Ek record ko admin se approve karke production me promote karein.
   - **Fraud Detection:** Koi "blocked" ya high risk score wala item dikhayein (Isolation Forest model).

2. **User Side Presentation:**
   - Naya user register karein ya login karein.
   - **Profile Wizard:** User ki academic details fill karein (CGPA, IELTS, Degree).
   - **Smart Match:** Home page par "Best Matches" section dikhayein jo profile se match karta hai.
   - **Search & Filter:** Country aur Funding ke hisab se scholarships filter karein.
   - **Detail Page:** Apply link aur scholarship details (tuition fees, benefits) dikhayein.

3. **Maintenance & Safety:**
   - **Archive System:** Dikhaein ke expired scholarships automatically "Archived" mark ho jati hain.
   - **Health Check:** `scripts/health_check_summary.py` run karke JSON summary dikhayein.

