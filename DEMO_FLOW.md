# ScholarIQ: 5 Minute Live Demo Guide (Roman Urdu)

Ye guide aapko live presentation ya demo ke waqt help karegi. Isme steps is tarah hain ke examiner ko project ki depth aur stability dono nazar ayein.

---

## 1. Introduction (30 Seconds)
"ScholarIQ ek AI-powered scholarship aggregator hai jo sirf data scrape nahi karta, balki fraud detection aur smart matching ke zariye students ko verified opportunities dikhata hai."

## 2. Admin Side & Data Pipeline (2 Minutes)
*Goal: Show backend robustness (Ingestion + Staging + Fraud).*

1.  **Admin Login:** `/admin` dashboard par login karein.
2.  **Trigger Pipeline:** `backend/scripts/scrape_uk_scholarships.py` run karke dikhayein (ya agar UI button hai toh wo click karein).
3.  **Staging Review:** Dikhaein ke naya data **Staging Area** me ata hai. 
    *   Explain karein: "Hum data direct live nahi karte takay quality maintain rahe."
4.  **Fraud Detection:** Dikhaein ke AI ne kisi record ko `HIGH RISK` mark kiya hai ya nahi (Isolation Forest score).
5.  **Promotion:** Ek pending record ko `Approve` karke Live Scholarships me transfer karein.

## 3. User Side & Smart Match (2 Minutes)
*Goal: Show personalization and UI/UX.*

1.  **User Profile:** Profile settings me ja kar CGPA (e.g. 3.8) aur IELTS score (e.g. 7.5) enter karein.
2.  **Home Page Match:** Dashboard par dikhayein ke "Best Matches" user ki profile ke mutabiq change ho gaye hain.
3.  **Search & Filters:** Country (e.g. UK) aur Funding (Full/Partial) filter karke dikhayein.
4.  **Detail View:** Scholarship detail page open karein. 
    *   **Financial Breakdown:** Dikhaein ke hum Tuition Fees aur Net Cost calculate karke dikha rahe hain.
5.  **Apply Link:** "Apply Now" button par click karke external site redirect dikhayein.

## 4. Maintenance & Safety (30 Seconds)
*Goal: Show production-readiness.*

1.  **Archive System:** `scripts/archive_expired_scholarships.py` ka zikr karein ke expired data khud hide ho jata hai.
2.  **Health Check Summary:** Terminal me `python scripts/health_check_summary.py` run karein.
    *   "Ye hamara custom health check hai jo DB counts aur system stability ka JSON summary deta hai."

---

## Technical Highlights for Viva/Panel:
- **Backend:** FastAPI + SQLAlchemy (Asynchronous & Fast).
- **ML Logic:** Isolation Forest for Fraud Detection.
- **Frontend:** React + TypeScript (Type safe & Responsive).
- **Database:** SQLite (Demo-friendly) but compatible with PostgreSQL.
