# ScholarIQ Implementation & FR Mapping (FYP Chapter Data)

This document maps the **Functional Requirements (FR)** to their implementation in the ScholarIQ codebase and UI.

## 1. Requirement Traceability Matrix

| Req ID | Feature Description | Implementation (Backend) | Implementation (Frontend) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **FR_01** | User Registration | `POST /auth/register` (auth.py) | `SignupPage.tsx` | ✅ Done |
| **FR_02** | User Login (JWT) | `POST /auth/login` (auth.py) | `LoginPage.tsx` | ✅ Done |
| **FR_03** | Profile Management | `GET/PUT /users/me` (users.py) | `SettingsPage.tsx` | ✅ Done |
| **FR_04** | Scholarship Search | `GET /scholarships` (scholarships.py) | `SearchPage.tsx` | ✅ Done |
| **FR_05** | Search Filters | Query Params in `/scholarships` | Filter Panel in `SearchPage.tsx` | ✅ Done |
| **FR_06** | Scholarship Details | `GET /scholarships/{id}` | `DetailPage.tsx` | ✅ Done |
| **FR_07** | Fraud Detection | `is_suspicious` flag in Models | Fraud Warning Alert in `DetailPage.tsx` | ✅ Done |
| **FR_08** | Saved Scholarships | `POST/DELETE /dashboard/save` | Bookmark Toggle & `SavedPage.tsx` | ✅ Done |
| **FR_09** | Dashboard Summary | `GET /dashboard/summary` | Stats Cards in `DashboardPage.tsx` | ✅ Done |
| **FR_10** | Smart Recommendations | `GET /recommendations` (logic rules) | Feed in `DashboardPage.tsx` | ✅ Done |
| **FR_11** | AI Assistant (Lite) | `POST /chatbot/chat` (nlp rules) | `Chatbot.tsx` widget | ✅ Done |

---

## 2. Technical System Workflow (FYP Demo Path)

### Scenario: The Student Journey
1.  **Onboarding**: User lands on the landing page, creates an account on `SignupPage`.
2.  **Authentication**: User logs in. A **JWT token** is stored in LocalStorage and included in all future `Authorization` headers.
3.  **Profiling**: User enters CGPA (3.8) and Field (Computer Science) in `SettingsPage`.
4.  **Discovery**:
    *   **Recommendation Engine**: The Dashboard immediately shows the "Gates Cambridge" scholarship because it matches the 3.8 GPA and CS background.
    *   **Manual Search**: User goes to `SearchPage`, filters by "Germany", and finds "DAAD".
    *   **Fraud Awareness**: User clicks on a suspicious-looking "Urgent: World Bank Prize" and sees the **Security Alert** flagging it as high-risk.
5.  **Tracking**: User "Saves" the scholarship. The Dashboard "Saved" counter increments.
6.  **Support**: User opens the Chatbot and asks "What is the IELTS requirement?" and receives an instant guide based on system logic.

---

## 3. System Architecture Highlights

- **Backend**: FastAPI (Python) - Async performance, Pydantic validation.
- **Database**: SQLAlchemy ORM with SQLite (PostgreSQL compatible).
- **Frontend**: React (TypeScript) + Tailwind CSS + Radix UI (Premium Design).
- **Security**: Password hashing using PBKDF2, JWT Bearer tokens for session management.
- **AI Lite**: Rule-based matching engine for recommendations and keyword-based NLP for the chatbot.
