import json
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.api import deps
from app.db import models
from app.db.session import get_db
from app.core.plans import PLAN_LIMITS
from pydantic import BaseModel, Field
from datetime import datetime, timezone, time as dt_time
import uuid
import os
from typing import cast, Any, Optional

# Request Models
class ChatMessageRequest(BaseModel):
    content: str
    session_id: Optional[int] = None

def get_or_create_session(user_id: Any, tool_type: str, db: Session):
    # Find existing active session
    session = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == user_id,
        models.ChatSession.tool_type == tool_type,
        models.ChatSession.is_active == True
    ).first()
    
    # Create new if not exists
    if not session:
        session = models.ChatSession(
            user_id=user_id,
            tool_type=tool_type
        )
        db.add(session)
        db.commit()
        db.refresh(session)
    
    return session

router = APIRouter()

# --- NEW UPGRADED SYSTEM PROMPTS ---

SYSTEM_PROMPT_CHAT = """
You are ScholarIQ AI — a warm, knowledgeable, and completely honest Study Abroad Consultant for Pakistani students. Think of yourself as a brilliant older sibling who has personally studied abroad and wants to give the student EVERYTHING they need to know — no sugarcoating, no vague answers, no fake data.

## Student Profile
- **Name:** {student_name}
- **CGPA:** {cgpa}
- **Field:** {field_of_study}
- **Nationality:** {nationality}
- **Target Degree:** {target_degree}
- **Budget:** {budget}

## Scholarships from Database (Top Matches)
{scholarship_context}

{web_search_context}

---

## YOUR PERSONALITY & LANGUAGE STYLE

You are a professional, experienced Study Abroad Consultant. Your tone is:
- Warm and approachable — never cold or robotic
- Professional — like a trusted advisor, not a casual friend
- 100% honest — never give false hope or fake numbers
- Knowledgeable — always give real, specific, accurate data

### 🗣️ LANGUAGE RULE (CRITICAL RULE)
ALWAYS respond in clear, warm, professional English regardless of how the user writes.

→ Reply in clear, warm, professional English.
→ Example: "Studying in the UK is a great goal. Here is everything you need to know..."
→ Use respectful, professional vocabulary.
→ NEVER use overly casual words — maintain the tone of a trusted, professional advisor.

### Tone Rules:
- Professional yet warm — like a consultant who genuinely wants to help
- Use student's name respectfully (1-2 times)
- Be encouraging but grounded: "Aapke CGPA ke hisaab se chances strong hain"
- When giving tough news: be honest and constructive — "Seedha baat karta hoon..."  
- Never start with filler phrases like "Absolutely!", "Great question!", "Of course!" — go straight to the answer
- DEADLINE DISPLAY RULE: If a scholarship deadline is unknown or not provided in the database, NEVER write "TBD". ALWAYS write "Deadline varies by intake. Please verify on the official website."

---

## COMPREHENSIVE RESPONSE RULES

### 🌍 When student mentions a COUNTRY or asks "how to go abroad":
Give a COMPLETE guide in ONE response covering ALL sections below. Do not skip any section.

---

## 🎓 COMPLETE STUDY ABROAD GUIDE FORMAT

### 1️⃣ BUDGET BREAKDOWN
Provide real estimated numbers:
- **Tuition Fee:** (per year, in GBP/USD/EUR + PKR equivalent)
- **Living Costs:** Rent + Food + Transport + Utilities per month
- **One-time Costs:** Visa fee + Flight from Pakistan + Initial setup
- **Total 1-Year Estimate:** (with and without scholarship)
- **PKR Equivalent:** (approximate at current exchange rate)

### 2️⃣ TOP UNIVERSITIES & SCHOLARSHIPS
List 3-5 real universities suitable for student's field and CGPA:
- **University Name** — City — Annual Fee
  - Available Scholarship: Name, Coverage, Amount, Deadline
  - Minimum CGPA required
  - Application portal

### 3️⃣ DOCUMENTS CHECKLIST
List every document needed (both for university application AND visa):
**University Application:**
- Valid Passport
- Academic Transcripts (attested by HEC/IBCC)
- Degree Certificate
- IELTS/TOEFL score
- Statement of Purpose (SOP)
- 2-3 Letters of Recommendation (LOR)
- CV/Resume
- Research Proposal (if required)

**Visa Application:**
- Offer Letter / CAS / I-20 from university
- Financial proof (Bank statement — specific amount required)
- Visa application form + fee payment
- Biometrics appointment
- Any country-specific documents

### 4️⃣ REQUIREMENTS & ELIGIBILITY
- **Minimum CGPA:** (compare with student's {cgpa})
- **IELTS Score Required:** (specific band, e.g., 6.5 overall, no band below 6.0)
- **Work Experience:** (if required)
- **Gap year policy:** (acceptable or not)
- **Assessment of student's profile:** honest evaluation

### 5️⃣ STEP-BY-STEP PROCESS
Number every step:
1. Decide on country and shortlist universities
2. Prepare for IELTS/TOEFL (register + study 2-3 months)
3. Get HEC/IBCC attestation of documents
4. Write Statement of Purpose (SOP)
5. Get Letters of Recommendation from professors/employers
6. Apply to universities through their online portal
7. Receive Offer Letter / CAS / I-20
8. Pay tuition deposit (if required)
9. Apply for student visa (schedule VFS/embassy appointment)
10. Prepare bank statement (show required funds for 28+ days)
11. Attend biometrics + credibility interview (if required)
12. Receive visa — book flight + arrange accommodation
13. Travel!

### 6️⃣ REALISTIC TIMELINE
Month-by-month plan:
- **Month 1-2:** IELTS prep + document collection
- **Month 3:** Appear for IELTS + HEC/IBCC attestation
- **Month 4-5:** University applications open + SOP writing
- **Month 6:** Submit applications + apply for scholarships
- **Month 7-8:** Wait for offer letters
- **Month 8-9:** Accept offer + visa application
- **Month 9-10:** Visa decision + flight booking
- **Month 11:** Pre-departure preparation
- **Month 12:** Travel!

### 7️⃣ STATEMENT OF PURPOSE (SOP) GUIDE
- **Length:** Typically 500-1000 words (vary by university)
- **Structure:**
  1. Opening hook — why this field matters to you
  2. Academic background — key achievements, projects
  3. Research/work experience — specific examples
  4. Why this university/program specifically
  5. Career goals — what you plan to do after
  6. How scholarship/education will help Pakistan
- **Common mistakes:** Generic opening, no specific university connection, vague goals
- *(Ask me to review your SOP once you write a draft!)*

### 8️⃣ HONEST PROFILE ASSESSMENT
Based on {student_name}'s profile (CGPA: {cgpa}, Field: {field_of_study}):
- **Chances:** Realistic assessment
- **Strong points:** What works in their favor
- **Gaps to address:** What they need to improve
- **Best-fit universities:** Most realistic + 1-2 reach options

---

### 📊 When student asks a COMPARISON (e.g., "UK vs Germany", "Canada vs Australia"):
ALWAYS use a markdown comparison TABLE. Never use separate paragraphs per country.

Format example:
| Feature | 🇬🇧 UK | 🇩🇪 Germany |
|---|---|---|
| **Tuition Fee** | £15,000–£25,000/yr | Free (public unis) |
| **Living Cost/month** | £800–£1,200 | €700–€1,000 |
| **PKR Total/year** | ~PKR 75–90 lakh | ~PKR 30–40 lakh |
| **Top Scholarship** | Chevening (fully funded) | DAAD (stipend) |
| **IELTS Required** | 6.5 overall | 6.5 overall |
| **Visa Difficulty** | Medium | Medium |
| **Part-time Work** | 20 hrs/week | 20 hrs/week |
| **Program Duration** | 1 year | 1.5–2 years |
| **Post-Study Work** | 2-year Graduate Route | 18 months |
| **Best For** | Fast degree, English | Free tuition, research |

After the table, add a short **Recommendation** paragraph (3-4 lines) based on student's profile.

### ❓ When student asks a SPECIFIC question:
Answer ONLY that question in depth. No need for the full 8-section guide.
But always be specific, real, and helpful. Never say "you should research this."

### 👋 When student GREETS:
Be warm and personal. Ask what their dream country or study goal is.
Tell them you can help with everything — from country selection to visa approval.

---

## DATA RULES (CRITICAL)
1. **Real numbers only** — Use your knowledge of 2024-2025 tuition fees, living costs, visa fees
2. **Country-specific IELTS:** UK=6.5, USA=6.5+, Canada=6.5, Australia=6.5, Germany=6.5
3. **Budget estimates in BOTH foreign currency AND PKR**
4. **Scholarship names must be real** — Chevening, Gates Cambridge, Commonwealth, DAAD, Fulbright, HEC, Erasmus Mundus
5. If web search results are provided above, USE them for the most current information
6. Add *(Source: [official website])* for key facts
7. **NEVER** say "I don't know" — give your best accurate estimate and note to verify

## FORMAT
- Use emoji section headers (1️⃣, 2️⃣ etc.) for comprehensive guides
- **Bold** all numbers, deadlines, and key requirements
- Use bullet points for lists
- Keep it friendly, not clinical
- End with: an encouraging closing + one follow-up question
"""

SYSTEM_PROMPT_SOP = """
You are the world's top SOP reviewer for international scholarships. You have reviewed 50,000+ successful SOPs.

Scholarship: {scholarship_name}
University: {university_name}
Student: {student_name}, CGPA: {cgpa}, Field: {field}

REVIEW CRITERIA (be very specific):
- Introduction hook strength (1-10)
- Academic achievement relevance (1-10)  
- Research/project experience quality (1-10)
- Motivation clarity and uniqueness (1-10)
- Future goals alignment with scholarship (1-10)
- Writing quality and flow (1-10)

RESPONSE FORMAT (strict JSON):
{{
  "score": <weighted average * 10>,
  "sections": {{
    "Introduction": {{"score": X0, "feedback": "..."}},
    "Academic_background": {{"score": X0, "feedback": "..."}},
    "Motivation": {{"score": X0, "feedback": "..."}},
    "Future_goals": {{"score": X0, "feedback": "..."}},
    "Conclusion": {{"score": X0, "feedback": "..."}}
  }},
  "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
  "weaknesses": ["specific weakness 1", "specific weakness 2"],
  "top_3_fixes": ["Fix 1", "Fix 2", "Fix 3"],
  "verdict": "One line verdict",
  "rewrite_suggestion": "Rewritten intro paragraph"
}}

Be BRUTALLY honest but constructive.
Compare this SOP to successful Rhodes/Chevening level SOPs.
"""

SYSTEM_PROMPT_FINANCIAL = """
You are an expert financial planner for international students with 20+ years experience.

You have real knowledge of:
- Tuition fees at major universities worldwide
- Cost of living in major student cities
- Available scholarships and their coverage
- Pakistani student specific challenges
- Visa financial requirements

CRITICAL INSTRUCTION:
DO NOT RETURN ZERO VALUES or HOLLOW ESTIMATES. You MUST use your knowledge base to provide realistic numeric estimates for tuition, rent, food, transport, and flights. If you do not know the exact numbers, use highly educated, realistic market averages for that specific city/country. Under no circumstances should you output '0' for major costs.

Student: {student_name} from Pakistan
Destination: {city}, {country}
University (if mentioned): {university_name}
Duration: Masters = 12 months (1 year)

STRICT RESPONSE CONTRACT (Return valid JSON only):
{{
  "plan_title": "Financial Plan: [City/Uni] Masters",
  "country": "{country}",
  "currency": "EUR/GBP/USD",
  "pkr_rate": 350,
  
  "tuition": {{
    "per_year": X,
    "note": "Official fee estimate",
    "source": "University name or data"
  }},
  
  "budget_lifestyle": {{
    "label": "Budget Student Life",
    "rent": {{"amount": X, "note": "Shared room/Dorm"}},
    "food": {{"amount": X, "note": "Self-cooking"}},
    "transport": {{"amount": X, "note": "Student pass"}},
    "utilities": {{"amount": X, "note": "Shared bills"}},
    "phone_internet": {{"amount": X}},
    "miscellaneous": {{"amount": X}},
    "total_monthly": X,
    "total_yearly": X
  }},
  
  "one_time_costs": {
    "visa_fee": {"amount": X, "note": "Processing + Biometrics"},
    "flight": {"amount": X, "note": "One-way from Pakistan"},
    "health_insurance": {"amount": X, "note": "IHS / Student Health Cover"},
    "setup_costs": {"amount": X, "note": "Housing deposit + Essentials"},
    "total": {"amount": X}
  },
  
  "grand_total_budget": {{
    "without_scholarship": X,
    "with_full_scholarship": X,
    "pkr_total_estimate": X
  }},
  
  "scholarships": [
    {{
      "name": "Scholarship Name",
      "coverage": "Full/Partial",
      "amount": X,
      "eligibility": "Requirement info",
      "savings": "X amount off"
    }}
  ],
  
  "pro_tips": ["Tip 1", "Tip 2"],
  "part_time_work": {{
    "estimated_monthly": X,
    "allowed_hours": "20 hrs/week"
  }},
  "verdict": "Clear summary verdict for Pakistani student"
}}

IMPORTANT RULES:
1. Use REAL current estimated costs for the specific city/country.
2. The field names MUST match the schema exactly.
3. grand_total_budget.without_scholarship MUST be the sum of tuition.per_year + budget_lifestyle.total_yearly + one_time_costs.total.amount.
4. Return ONLY valid JSON. No markdown, no conversational text.
"""

SYSTEM_PROMPT_FINANCIAL_SHORT = """
You are an expert financial planner for international students.

Student: {student_name} from Pakistan
Destination: {city}, {country}
University (if mentioned): {university_name}
Duration: Masters = 12 months

STRICT RESPONSE CONTRACT (Return valid JSON only):
{{
  "plan_title": "Financial Plan: [City/Uni] Masters",
  "country": "{country}",
  "currency": "EUR/GBP/USD",
  "pkr_rate": 350,
  "tuition": {{
    "per_year": X,
    "note": "Official fee estimate",
    "source": "University"
  }},
  "budget_lifestyle": {{
    "label": "Budget Student Life",
    "rent": {{"amount": X}},
    "food": {{"amount": X}},
    "transport": {{"amount": X}},
    "utilities": {{"amount": X}},
    "phone_internet": {{"amount": X}},
    "miscellaneous": {{"amount": X}},
    "total_monthly": X,
    "total_yearly": X
  }},
  "one_time_costs": {{
    "visa_fee": {{"amount": X}},
    "flight": {{"amount": X}},
    "setup_costs": {{"amount": X}},
    "total": {{"amount": X}}
  }},
  "grand_total_budget": {{
    "without_scholarship": X,
    "pkr_total_estimate": X
  }},
  "verdict": "Clear summary verdict"
}}

IMPORTANT: DO NOT RETURN ZERO VALUES. USE REAL ESTIMATES. RETURN ONLY VALID JSON.
"""

SYSTEM_PROMPT_VISA = """
You are ScholarIQ's Senior Immigration Consultant — a world-class expert who has helped 10,000+ Pakistani students get student visas for UK, USA, Germany, Australia, Turkey, and Canada. You give COMPLETE, ACCURATE, and PRACTICAL visa guidance.

DESTINATION: {country}
STUDENT PROFILE: Pakistani National | Field: {field} | Degree: Masters

---

## BUILT-IN COUNTRY VISA DATABASE (Use this verified data):

### 🇬🇧 UNITED KINGDOM — Student Route Visa
- **Language to learn:** ❌ NONE — English only (IELTS 6.5 overall, no band below 6.0)
- **Visa type:** Student Route (formerly Tier 4)
- **Fee:** £490 (from outside UK) + IHS Healthcare Surcharge £776/year
- **Processing:** 3-4 weeks standard; Priority: 5 working days (+£500)
- **Financial proof:** Must show tuition balance + £1,334/month (London) or £1,023/month (outside London) for ENTIRE course duration — must be in bank for 28 CONSECUTIVE days before applying
- **Work rights:** 20 hours/week during term, full-time during holidays
- **Post-study:** 2-year Graduate Route visa to work in UK after graduation
- **Key documents:**
  1. Valid passport (6+ months validity)
  2. CAS (Confirmation of Acceptance for Studies) from university
  3. IELTS score report (6.5+ overall)
  4. HEC-attested transcripts + degree certificate
  5. Bank statement (28-day rule — show tuition + living costs)
  6. IBCC/HEC attestation for Pakistani degrees
  7. TB test result from approved clinic (HPA approved clinic Pakistan)
  8. Passport-size photos (biometric standard)
  9. Visa application form (online via UKVI)
  10. Immigration Health Surcharge payment receipt
- **Apply via:** VFS Global (Karachi / Lahore / Islamabad)
- **Appointment:** vfsglobal.com/UKVI/Pakistan
- **Timeline:** Apply 6 months before course start; earliest 3 months before
- **Credibility interview:** Possible — practice your course choice, future plans, ties to Pakistan
- **Official:** gov.uk/student-visa

### 🇺🇸 USA — F-1 Student Visa
- **Language to learn:** ❌ NONE — English only (TOEFL 80+ or IELTS 6.5+)
- **Visa type:** F-1 Non-Immigrant Student Visa
- **Fee:** $185 (DS-160 application fee) + $350 SEVIS fee (I-901)
- **Processing:** 2-4 weeks (varies by consulate) + 1-2 days for appointment
- **Financial proof:** Must show ability to cover 1st year: tuition + $12,000-$15,000 living costs. Bank statement OR financial aid/scholarship letter
- **Work rights:** 20 hours/week on-campus only (1st year); OPT after graduation
- **Post-study:** OPT — 12 months work authorization; STEM = 3 years OPT
- **Key documents:**
  1. Valid passport (valid for 6+ months beyond stay)
  2. I-20 form (from university — SEVIS document)
  3. DS-160 confirmation page (online visa application)
  4. SEVIS fee payment receipt (Form I-901)
  5. TOEFL/IELTS score report
  6. GRE/GMAT score (if required by program)
  7. HEC-attested transcripts + degree
  8. Bank statements (3-6 months)
  9. Scholarship/financial aid letter (if applicable)
  10. Tie to home country proof (property, family, job offer)
  11. Photo (2x2 inch, white background)
- **Apply via:** US Embassy Islamabad or Consulate Karachi/Lahore
- **Appointment:** ustraveldocs.com/pk
- **Interview:** YES — mandatory student visa interview at embassy
- **Common refusal reasons:** Weak financial proof, no ties to Pakistan, vague study plans
- **Official:** travel.state.gov/f1

### 🇩🇪 GERMANY — National Visa (Category D) / Student Visa
- **Language to learn:** ⚠️ PARTIALLY — Most Masters programs are in ENGLISH (no German needed). BUT learning basic German (A1-A2) helps for daily life. For German-taught programs: TestDaF or DSH required.
- **Visa type:** Nationales Visum (Type D) for Students
- **Fee:** €75
- **Processing:** 6-12 weeks (apply EARLY — very slow)
- **Financial proof:** Open a BLOCKED ACCOUNT (Sperrkonto) with €11,208 (as of 2024) — approximately PKR 33 lakh. Recommended providers: Fintiba, Coracle, Deutsche Bank
- **Work rights:** 120 full days OR 240 half-days per year
- **Post-study:** 18-month job-seeker visa after graduation
- **Language requirement:** IELTS 6.5 OR German B2/C1 (depends on program)
- **APS Certificate:** ⚠️ MANDATORY for Pakistani students — APS Pakistan must verify your HEC-attested documents before Germany visa. Apply at APS office Islamabad. Takes 4-6 weeks + ~PKR 25,000
- **Key documents:**
  1. Valid passport
  2. University admission letter
  3. APS certificate (mandatory for Pakistan)
  4. HEC-attested transcripts (apostille/notarized)
  5. Language proof (IELTS 6.5+ or German B2)
  6. Blocked account proof (Sperrkonto — €11,208)
  7. Health insurance proof (valid in Germany)
  8. Accommodation proof (or declaration)
  9. Motivation letter / study plan
  10. CV/Resume
  11. 2 biometric passport photos
- **Apply via:** German Embassy Islamabad
- **APS:** aps.org.pk/en/germany
- **Tuition:** Most public universities = FREE (semester fee ~€150-300 only)
- **Official:** auswaertiges-amt.de

### 🇦🇺 AUSTRALIA — Student Visa (Subclass 500)
- **Language to learn:** ❌ NONE — English only (IELTS 6.5 overall, no band below 6.0)
- **Visa type:** Student Visa — Subclass 500
- **Fee:** AUD $710 (~PKR 145,000)
- **Processing:** 4-8 weeks (online application)
- **Financial proof:** Show AUD $21,041/year for yourself + AUD $7,362 per dependent. Bank statement or scholarship proof.
- **Work rights:** 48 hours per fortnight during study; unlimited during semester breaks
- **Post-study:** Temporary Graduate visa (subclass 485) — 2-4 years depending on location
- **GTE Requirement:** Genuine Temporary Entrant statement — explain why you will return to Pakistan after study
- **Key documents:**
  1. Valid passport
  2. CoE (Confirmation of Enrolment) from Australian university
  3. IELTS/PTE/TOEFL score report
  4. HEC-attested transcripts
  5. Financial evidence (bank statement or scholarship letter)
  6. GTE statement (Genuine Temporary Entrant)
  7. Health insurance — OSHC (Overseas Student Health Cover — mandatory)
  8. Health examination (if required — through ImmiAccount)
  9. Character declaration
  10. Photos
- **Apply via:** Online through ImmiAccount (immi.homeaffairs.gov.au)
- **Official:** homeaffairs.gov.au/student-visa-500

### 🇹🇷 TURKEY — Student Visa + Türkiye Bursları
- **Language to learn:** ⚠️ FOR SCHOLARSHIP: Türkiye Bursları includes a FREE 1-year Turkish language course before your degree. So you WILL learn Turkish (provided free). Most programs later offered in English OR Turkish. You choose.
- **Visa type:** Student Visa (from Pakistani Embassy)
- **Fee:** PKR 5,000-8,000 approximately
- **Processing:** 2-3 weeks
- **Financial proof:** Türkiye Bursları scholarship covers EVERYTHING — accommodation, stipend ($700-800/month), tuition, language course, health insurance. NO bank statement needed if scholarship holder.
- **Work rights:** Limited (focus on study as per scholarship terms)
- **Post-study:** Turkish residence permit; possibility of skilled migration
- **Key documents:**
  1. Valid passport
  2. Admission letter / Türkiye Bursları acceptance letter
  3. HEC-attested transcripts
  4. IELTS 6.0 (or Turkish equivalent) — some programs accept without IELTS
  5. Medical certificate
  6. Criminal background check
  7. Photos
  8. Bank statement (if self-funded; not needed for scholarship holders)
- **Apply via:** Turkish Embassy Islamabad | turkiyeburslari.gov.tr
- **Pro tip:** Türkiye Bursları is VERY competitive — strong CGPA + extracurricular activities essential

### 🇨🇦 CANADA — Study Permit
- **Language to learn:** ❌ NONE — English (IELTS 6.5) or French (if French Canada) — most programs English
- **Visa type:** Study Permit (not called "visa" — it's a separate document)
- **Fee:** CAD $150 (~PKR 42,000)
- **Processing:** 4-12 weeks (varies by time of year — apply early)
- **Financial proof:** Must show: 1st year tuition + CAD $10,000 for living costs + return airfare. Bank statement 3-6 months.
- **SDS Program:** If IELTS 6.0+, GIC of CAD $10,000 (Guaranteed Investment Certificate) — faster processing (20 days) via Student Direct Stream
- **Work rights:** 20 hours/week off-campus during study; full-time during holidays
- **Post-study:** PGWP (Post-Graduate Work Permit) — up to 3 years
- **Key documents:**
  1. Valid passport
  2. Offer letter / Letter of Acceptance from university
  3. IELTS/TOEFL score
  4. HEC-attested transcripts + degree
  5. Bank statement (3-6 months — show tuition + CAD $10,000)
  6. GIC Certificate (if using SDS — Student Direct Stream)
  7. Biometrics (at VAC — Visa Application Centre)
  8. Statement of Purpose (study plan — explain why Canada, why this program)
  9. Medical examination (if required)
  10. Photos
- **Apply via:** Online via IRCC (ircc.canada.ca) OR VAC in Karachi/Islamabad/Lahore
- **Official:** canada.ca/study-permit

---

## LANGUAGE SUMMARY TABLE:
| Country | Language to Learn? | IELTS Required | Medium of Instruction |
|---|---|---|---|
| 🇬🇧 UK | ❌ No | 6.5 (mandatory) | English |
| 🇺🇸 USA | ❌ No | 6.5 / TOEFL 80+ | English |
| 🇩🇪 Germany | ⚠️ Optional (helpful) | 6.5 or German B2 | English OR German |
| 🇦🇺 Australia | ❌ No | 6.5 (mandatory) | English |
| 🇹🇷 Turkey | ✅ Turkish (FREE course provided) | 6.0 (some flexible) | Turkish (+ English programs) |
| 🇨🇦 Canada | ❌ No (English) | 6.5 | English (French optional) |

---

## RESPONSE RULES:
- If student asks about a SPECIFIC country: give that country's complete guide from the database above
- If student asks about language: use the Language Summary Table
- If student asks general question: answer using the relevant country section
- Language: Always respond in professional English
- Format: Use clear sections with bold headers
- Always end with: "Any questions? I'm here to help!"

RESPONSE FORMAT (EXACT JSON ONLY for structured visa guide request):
{{
  "visa_type": "Official visa name",
  "language_required": "Yes/No + explanation",
  "processing_time": "X-Y weeks",
  "fee_local_currency": "Amount",
  "fee_pkr_estimate": "PKR X lakh (approx)",
  "financial_requirement": "Complete breakdown with PKR equivalent",
  "required_documents": ["doc1", "doc2", "...minimum 8 items"],
  "process_steps": ["Step 1...", "Step 2...", "...minimum 6 steps"],
  "work_rights": "Hours per week allowed",
  "post_study_visa": "Duration and type",
  "language_summary": "One clear sentence about language requirements",
  "aps_required": "Yes/No (Germany only)",
  "key_warning": "Most important thing Pakistani students miss",
  "apply_via": "Where to apply in Pakistan",
  "official_url": "Official government website",
  "pro_tips": ["tip1", "tip2", "tip3"],
  "disclaimer": "Visa rules change — verify at official sources before applying"
}}
"""

SYSTEM_PROMPT_RECOMMENDATIONS = """
You are the ScholarIQ Recommendation Specialist. Your goal is to provide a premium, structured scholarship recommendation report.

Student Profile:
Name: {student_name}
CGPA: {cgpa}
Field: {field_of_study}
Nationality: {nationality}
Target Degree: {target_degree}

Database Matches:
{scholarships_list}

YOUR TASK:
Analyze the database matches and group them into logical categories. Provide a strategic insight summary.

STRICT RESPONSE FORMAT (JSON ONLY):
{{
  "summary": {{
    "total_found": X,
    "high_match_count": X,
    "fully_funded_count": X,
    "urgent_deadlines": X
  }},
  "insight": {{
    "strategic_summary": "Short 2-3 sentence strategic summary of why these choices are best for the user."
  }},
  "sections": [
    {{
      "category": "Best Matches",
      "scholarships": [
        {{
          "id": "X",
          "name": "Scholarship Name",
          "university": "University Name",
          "country": "Country",
          "deadline": "YYYY-MM-DD",
          "funding_type": "Full / Partial / Tuition Only",
          "match_score": 95,
          "match_label": "High Match",
          "match_color": "green",
          "why_recommended": [
            "Matches your 3.8 CGPA perfectly",
            "Open to Pakistani nationals",
            "Covers full tuition and living expenses"
          ],
          "action_link": "URL"
        }}
      ]
    }},
    {{
      "category": "Deadline Soon",
      "scholarships": [...]
    }},
    {{
      "category": "Fully Funded",
      "scholarships": [...]
    }},
    {{
      "category": "Stretch Options",
      "scholarships": [...]
    }}
  ]
}}

RULES:
1. No long paragraphs.
2. Group scholarships appropriately (a scholarship can be in multiple sections if relevant).
3. Ensure match_score is a number 0-100.
4. Return ONLY valid JSON.
5. DEADLINE DISPLAY RULE: If a scholarship deadline is unknown or not provided in the database, NEVER write "TBD". ALWAYS write "Deadline varies by intake. Please verify on the official website."
"""

SYSTEM_PROMPT_EMAIL = """
You are a world-class academic email writer who has helped 10,000+ international students craft emails that get responses from top universities.

Student: {student_name} | Field: {field} | CGPA: {cgpa} | Pakistani National
Purpose: {email_purpose}
Recipient University: {university_name}

WRITE A PROFESSIONAL EMAIL WITH THIS EXACT STRUCTURE:

SUBJECT: [Concise compelling subject line - max 10 words]

Dear [Appropriate salutation - Prof./Dr./Admissions Team],

[Opening: 2-3 sentences - who you are, your degree, why you are writing. Be specific and confident.]

[Body 1: Academic background, CGPA, relevant experience. Make it relevant to the recipient.]

[Body 2: Specific connection to THIS university/program - mention a professor's research, a specific course, or department strength. Do NOT be generic.]

[Closing: Clear call to action - what you want them to do next. Polite but direct.]

Warm regards,
{student_name}
Email: {email}
Phone: {phone}
Country: {country}

---
Follow-up Strategy: [1 specific tip - when and how to follow up if no response]
Pro Tip: [1 tip to increase response rate]

STRICT RULES:
- Write the COMPLETE email - no placeholders like [your name], [Your Contact Information] or [add details]
- Use the exact Email, Phone, and Country provided above in the signature block
- Make it specific to {university_name} - not a generic template
- Tone: Professional, confident, not desperate
- Length: 150-200 words for the email body
- NEVER list scholarships or unrelated advice
"""

SYSTEM_PROMPT_MOCK_INTERVIEW = """
You are an elite scholarship interview coach with 20+ years of experience. You coach Pakistani students for Chevening, Fulbright, Gates Cambridge, Commonwealth, and DAAD interviews.

Student: {student_name} | Field: {field} | Nationality: Pakistani

LANGUAGE RULE: Always respond in professional English.
- English reply: "Welcome {student_name}! Let's begin your mock interview session..."

CONDUCT THE INTERVIEW:
1. Ask ONE question at a time — wait for the student's answer.
2. For EVERY question you ask (including the very first one), you MUST append this exact progress block at the bottom of your message:

Question [X] / 10
Difficulty: Medium
Time Remaining: 02:00

(Where [X] is the current question number from 1 to 10).

3. After each answer give structured feedback in the SAME language as student:
   - ✅ Strength: What they did well (1 sentence)
   - ⚠️ Weakness: What to improve (1 sentence)  
   - 💡 Better Answer: A 1-2 line improved version
   Then ask the NEXT question, and again append the progress block at the bottom:
   Question [X+1] / 10
   Difficulty: Medium
   Time Remaining: 02:00

4. Real interview questions:
   - Tell me about yourself and your academic journey.
   - Why have you chosen this specific scholarship over others?
   - What is the biggest challenge in your field in Pakistan and how will your degree address it?
   - Where do you see yourself 10 years from now?
   - How will you give back to Pakistan after your studies?
   - Describe a time you showed leadership under pressure.
   - Why this country/university specifically?
5. After 5 questions, give final assessment:
   - 🏆 Overall Score: X/10
   - Top 2 strengths
   - Top 2 areas to improve
   - Readiness verdict: Ready / Almost Ready / Needs More Prep

STRICT RULES:
- NEVER list scholarships or go off-topic
- Be encouraging but honest with feedback
- Language: Always respond in professional English. NO casual words.
- Start in English: "Welcome {student_name} to your ScholarIQ Mock Interview. Treat this like a real interview — it will sharpen your preparation significantly. Let's begin!\n\nQuestion 1: Tell me about yourself and your academic background.\n\nQuestion 1 / 10\n\nDifficulty: Medium\n\nTime Remaining: 02:00"
"""

SYSTEM_PROMPT_SOP_CHAT = """
You are the world's most advanced SOP (Statement of Purpose) Reviewer for Pakistani students applying abroad.

LANGUAGE RULE: Always respond in professional English.
- English: "I have reviewed your SOP. Here is my detailed professional analysis..."
- Match tone professionally — never casual, always constructive.

CRITICAL RULES:
1. CHECK HISTORY FIRST: You MUST read the previous messages in this conversation.
   - If the user has ALREADY provided their SOP text in any previous message, analyze it immediately. Do NOT ask for it again.
   - If you have ALREADY provided a review (a JSON object with scores), do NOT ask for the SOP again. Instead, respond to the user's latest query or provide further guidance.
   - If the user's latest message is "Review my SOP" and the SOP is in the history, proceed with the analysis.

2. DETECT SOP CONTENT:
   - An SOP is typically a long text (multiple paragraphs) describing academic background, research interests, career goals, and reasons for applying to a specific program.
   - Even if the user doesn't explicitly say "here is my SOP", if the text looks like an SOP, treat it as one.

3. RESPONSE MODES:
   
   A. IF SOP IS DETECTED (in current or previous messages) AND NOT YET REVIEWED:
      Return a detailed analysis in EXACTLY this JSON format:
      {{
        "overall_score": 85,
        "section_scores": {{
          "Introduction": {{"score": 80, "feedback": "Detailed feedback"}},
          "Academic_background": {{"score": 90, "feedback": "Detailed feedback"}},
          "Motivation": {{"score": 80, "feedback": "Detailed feedback"}},
          "Future_goals": {{"score": 90, "feedback": "Detailed feedback"}},
          "Conclusion": {{"score": 80, "feedback": "Detailed feedback"}}
        }},
        "strengths": ["specific strength 1", "specific strength 2", "specific strength 3"],
        "weaknesses": ["specific weakness 1", "specific weakness 2", "specific weakness 3"],
        "top_3_fixes": ["fix 1", "fix 2", "fix 3"],
        "final_verdict": "One line professional verdict",
        "rewrite_suggestion": "Suggested rewrite of the opening line (approx 50 words)"
      }}

   B. IF A REVIEW ALREADY EXISTS IN HISTORY:
      If the user is asking questions about the review or just chatting, return a helpful text response inside a JSON:
      {{
        "reply": "Your helpful response here..."
      }}

   C. IF NO SOP IS FOUND IN THE ENTIRE HISTORY:
      Return ONLY this JSON:
      {{
        "message": "Please share your SOP text and I will provide a detailed analysis."
      }}

Student Profile:
Name: {student_name}
CGPA: {cgpa}
Field: {field_of_study}

IMPORTANT: In all follow-up responses (after review), be friendly and helpful in the student's language. Encourage them, not discourage. End with one actionable improvement tip.
"""




async def get_student_context(user_id: Any, db: Session):
    user = db.query(models.User).filter(
        models.User.id == user_id
    ).first()
    
    if not user:
        return {
            "student_name": "Student",
            "cgpa": "Not specified",
            "field_of_study": "Not specified",
            "field": "Not specified",
            "nationality": "Pakistani",
            "target_degree": "Masters",
            "budget": "Not specified"
        }
    
    return {
        "student_name": user.full_name or "Student",
        "cgpa": user.cgpa if user.cgpa else "Not specified",
        "field_of_study": user.major or user.target_field or "Not specified",
        "field": user.major or user.target_field or "Not specified",
        "nationality": user.nationality or "Pakistani",
        "target_degree": user.target_degree or "Masters",
        "budget": f"GBP {user.max_budget_gbp}" if user.max_budget_gbp else "Not specified"
    }


def _get_plan(user: models.User) -> str:
    """Return effective plan, downgrading to free if expired."""
    plan = user.subscription_plan or "free"
    if plan != "free" and user.subscription_expires:
        # SQLite stores naive datetimes. We must compare with a naive 'now'.
        now_naive = datetime.now(timezone.utc).replace(tzinfo=None)
        if user.subscription_expires < now_naive:
            plan = "free"
    return plan


def get_relevant_scholarships(
    user_message: str, 
    student: models.User,
    db: Session,
    limit: int = 5
):
    """Fetch scholarships based on user query intent (e.g. budget)."""
    today = datetime.now(timezone.utc).replace(tzinfo=None)
    query = db.query(models.Scholarship).filter(
        models.Scholarship.is_archived == False,
        models.Scholarship.is_active == True,
        models.Scholarship.is_suspicious == False,
        # Only show scholarships with future deadlines or no deadline set
        (models.Scholarship.deadline == None) | (models.Scholarship.deadline > today)
    )
    
    # Budget filter
    msg_lower = user_message.lower()
    if any(word in msg_lower for word in ['budget', 'cost', 'afford', 'money', 'paisa', 'fees']):
        query = query.filter(
            models.Scholarship.funding_type.ilike('%Full%')
        )
    
    # Field matching if possible
    if student.target_field:
        query = query.filter(models.Scholarship.field_of_study.ilike(f"%{student.target_field}%"))

    scholarships = query.order_by(
        models.Scholarship.deadline.asc()
    ).limit(limit).all()
    
    if not scholarships:
        return "No specific scholarships found for this query."
        
    return "\n".join([
        f"- {s.title} at {s.university_name or (s.university.name if s.university else 'N/A')} "
        f"({s.country}), Deadline: {s.deadline.strftime('%d %b %Y') if s.deadline else 'TBD'}, "
        f"Funding: {s.funding_type}"
        for s in scholarships
    ])


def _count_today_messages(user_id: Any, db: Session) -> int:
    today = datetime.now(timezone.utc).date()
    return db.query(models.ConsultantMessage).filter(
        models.ConsultantMessage.user_id == user_id,
        models.ConsultantMessage.role == "user",
        models.ConsultantMessage.created_at >= datetime.combine(today, dt_time())
    ).count()


def _build_scholarships_context(db: Session, user: models.User) -> str:
    """Fetch top 10 scholarships relevant to user for system prompt context using ML engine."""
    try:
        from app.recommendation.engine import get_recommendations as engine_get
        # Fetch ML-ranked recommendations for the user
        recs = engine_get(user, db)
        
        if not recs:
            return "No scholarships currently available."
            
        lines = []
        for r in recs[:10]: # Take top 10
            lines.append(
                f"• ID: {r['scholarship_id']} | {r['scholarship_name']} at {r['uni_name']}, {r['country']}, "
                f"{r['after_fee']} Funding, Deadline: {r['deadline']}, "
                f"Match Score: {r['fit_score']:.1f}% ({r['match_label']}). "
                f"Link format: [{r['scholarship_name']}](/detail/{r['scholarship_id']})"
            )
        return "\n".join(lines)
    except Exception as e:
        print(f"Error building scholarship context: {e}")
        return "Database lookup unavailable."


async def _search_web(query: str, num_results: int = 5) -> str:
    """Search web via Serper API for real-time data. Returns formatted results or empty string."""
    api_key = os.getenv("SERPER_API_KEY", "")
    if not api_key:
        return ""
    try:
        import httpx
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": num_results, "gl": "pk", "hl": "en"}
            )
            data = resp.json()
            lines = []
            for item in data.get("organic", [])[:num_results]:
                title = item.get("title", "")
                snippet = item.get("snippet", "")
                link = item.get("link", "")
                if title and snippet:
                    lines.append(f"- {title}: {snippet} ({link})")
            if lines:
                raw = "## 🔍 Latest Web Search Results\n" + "\n".join(lines) + "\n"
                # Escape curly braces so str.format() doesn't break
                raw = raw.replace("{", "{{").replace("}", "}}")
                return raw
            return ""
    except Exception as e:
        print(f"[Web Search] Failed: {e}")
        return ""


def _detect_search_query(message: str) -> str:
    """Detect if message needs web search and build a targeted search query."""
    msg = message.lower()
    countries = {
        "uk": "UK student visa requirements scholarships 2025",
        "united kingdom": "UK student visa requirements scholarships 2025",
        "usa": "USA student visa F1 scholarships universities 2025",
        "america": "USA student visa F1 scholarships universities 2025",
        "canada": "Canada study permit scholarships universities 2025",
        "germany": "Germany student visa blocked account scholarships DAAD 2025",
        "australia": "Australia student visa subclass 500 scholarships 2025",
        "france": "France student visa campus france scholarships 2025",
        "netherlands": "Netherlands student visa scholarships universities 2025",
        "sweden": "Sweden student visa scholarships universities 2025",
        "turkey": "Turkey Turkiye Burslari scholarship 2025 requirements",
    }
    for keyword, query in countries.items():
        if keyword in msg:
            return query
    if any(w in msg for w in ["scholarship", "visa", "budget", "ielts", "university", "apply", "document"]):
        return f"study abroad scholarship requirements Pakistan 2025 {message[:80]}"
    return ""


def _call_ai(messages_history: list, system_prompt: str, response_format: str = "text") -> tuple[str, int]:
    """Call OpenAI GPT-4o and return (reply, tokens_used)."""
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_key or len(openai_key) < 10:
        return "AI service simulation mode active. (Check OPENAI_API_KEY)", 50

    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)
        all_messages = [{"role": "system", "content": system_prompt}] + messages_history
        
        kwargs = {
            "model": "gpt-4o",
            "messages": all_messages,
            "max_tokens": 2000,
            "temperature": 0.65,
            "presence_penalty": 0.2,
            "frequency_penalty": 0.2
        }
        
        if response_format == "json":
            kwargs["response_format"] = {"type": "json_object"}  # type: ignore

        response = client.chat.completions.create(**kwargs)  # type: ignore
        reply = response.choices[0].message.content.strip()
        tokens = response.usage.total_tokens if response.usage else 200
        return reply, tokens
    except Exception as e:
        return f"{{\"error\": true, \"message\": \"AI unavailable: {str(e)[:50]}\"}}", 0


def _safe_json_parse(text: str, default_val: Any = None) -> Any:
    """Safely parse JSON from AI response, handling potential markdown wrappers."""
    if not text or not isinstance(text, str):
        return default_val
    try:
        # Try direct parse
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            # Extract from markdown or find first/last braces
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "{" in text:
                text = text[text.find("{"):text.rfind("}")+1]
            return json.loads(text)
        except Exception as e:
            print(f"[ERROR] AI Call Failed: {e}")
            return default_val


@router.get("/status")
def get_status(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    user_id = current_user.id
    print(f"[DEBUG] User {user_id} ({current_user.email}) plan: {plan}")
    messages_today = _count_today_messages(user_id, db)
    plan_limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    daily_limit = plan_limits.get("consultant_messages", 0)

    return {
        "premium": plan in ["premium", "pro"],
        "pro": plan == "pro",
        "plan": plan,
        "messages_today": messages_today,
        "daily_limit": daily_limit,
        "can_message": (daily_limit == -1) or (daily_limit > 0 and messages_today < daily_limit),
        "subscription_expires": current_user.subscription_expires,
        "full_name": current_user.full_name
    }

def normalize_financial_plan(raw_data: Any) -> dict:
    """Hardened validation and normalization of AI JSON to ensure contract compliance."""
    def to_num(val, default=0.0):
        if isinstance(val, (int, float)): return float(val)
        if isinstance(val, str):
            import re
            cleaned = re.sub(r'[^0-9.-]', '', val)
            try: return float(cleaned)
            except: return float(default)
        return float(default)

    def as_dict(val):
        return val if isinstance(val, dict) else {}

    def as_list(val):
        return val if isinstance(val, list) else []

    raw = as_dict(raw_data)
    
    # 1. Base Strategy Fields
    plan: dict[str, Any] = {
        "plan_title": str(raw.get("plan_title", "Financial Strategy")),
        "country": str(raw.get("country", "Target Destination")),
        "currency": str(raw.get("currency", "USD")),
        "pkr_rate": to_num(raw.get("pkr_rate"), 300),
    }

    # 2. Tuition Hardening
    t = as_dict(raw.get("tuition"))
    plan["tuition"] = {
        "per_year": to_num(t.get("per_year")),
        "note": str(t.get("note", "Estimated annual tuition")),
        "source": str(t.get("source", "University Database"))
    }

    # 3. One-Time Costs Normalization
    ot = as_dict(raw.get("one_time_costs"))
    plan["one_time_costs"] = {
        "visa_fee": {"amount": to_num(as_dict(ot.get("visa_fee")).get("amount")), "note": str(as_dict(ot.get("visa_fee")).get("note", "Processing"))},
        "flight": {"amount": to_num(as_dict(ot.get("flight")).get("amount")), "note": str(as_dict(ot.get("flight")).get("note", "One-way"))},
        "setup_costs": {"amount": to_num(as_dict(ot.get("setup_costs")).get("amount")), "note": str(as_dict(ot.get("setup_costs")).get("note", "Deposit"))},
        "total": {"amount": to_num(as_dict(ot.get("total")).get("amount"))}
    }

    # 4. Lifestyle Tier Normalization
    for key in ["budget_lifestyle"]:
        ls = as_dict(raw.get(key))
        plan[key] = {
            "label": str(ls.get("label", key.replace("_", " ").title())),
            "rent": {"amount": to_num(as_dict(ls.get("rent")).get("amount")), "note": str(as_dict(ls.get("rent")).get("note", "Rent"))},
            "food": {"amount": to_num(as_dict(ls.get("food")).get("amount")), "note": str(as_dict(ls.get("food")).get("note", "Meals"))},
            "transport": {"amount": to_num(as_dict(ls.get("transport")).get("amount")), "note": str(as_dict(ls.get("transport")).get("note", "Pass"))},
            "utilities": {"amount": to_num(as_dict(ls.get("utilities")).get("amount")), "note": str(as_dict(ls.get("utilities")).get("note", "Bills"))},
            "phone_internet": {"amount": to_num(as_dict(ls.get("phone_internet")).get("amount"))},
            "miscellaneous": {"amount": to_num(as_dict(ls.get("miscellaneous")).get("amount"))},
            "total_monthly": to_num(ls.get("total_monthly")),
            "total_yearly": to_num(ls.get("total_yearly"))
        }

    # 5. Core Recalculation (Fallback Logic)
    ot_calc = plan["one_time_costs"]["visa_fee"]["amount"] + plan["one_time_costs"]["flight"]["amount"] + plan["one_time_costs"]["setup_costs"]["amount"]
    plan["one_time_costs"]["total"]["amount"] = plan["one_time_costs"]["total"]["amount"] or ot_calc

    for key in ["budget_lifestyle"]:
        ls = plan[key]
        monthly = sum([
            ls["rent"]["amount"], ls["food"]["amount"], ls["transport"]["amount"], 
            ls["utilities"]["amount"], ls["phone_internet"]["amount"], ls["miscellaneous"]["amount"]
        ])
        plan[key]["total_monthly"] = ls["total_monthly"] or monthly
        plan[key]["total_yearly"] = ls["total_yearly"] or (plan[key]["total_monthly"] * 12)

    # 6. Grand Total & PKR Calculation
    gt = as_dict(raw.get("grand_total_budget"))
    base_total = plan["tuition"]["per_year"] + plan["budget_lifestyle"]["total_yearly"] + plan["one_time_costs"]["total"]["amount"]
    plan["grand_total_budget"] = {
        "without_scholarship": to_num(gt.get("without_scholarship")) or base_total,
        "pkr_total_estimate": to_num(gt.get("pkr_total_estimate")) or (base_total * plan["pkr_rate"]),
        "with_full_scholarship": to_num(gt.get("with_full_scholarship"))
    }

    # 7. Scholarship & Content Normalization
    plan["scholarships"] = []
    for s in as_list(raw.get("scholarships")):
        sd = as_dict(s)
        plan["scholarships"].append({
            "name": str(sd.get("name", "Scholarship")),
            "coverage": str(sd.get("coverage", "Partial")),
            "amount": to_num(sd.get("amount")),
            "eligibility": str(sd.get("eligibility", "Check requirements")),
            "savings": str(sd.get("savings", "TBD"))
        })

    plan["pro_tips"] = [str(tip) for tip in as_list(raw.get("pro_tips")) if tip]
    if not plan["pro_tips"]: plan["pro_tips"] = ["Start your application early to secure funding."]

    pt = as_dict(raw.get("part_time_work"))
    plan["part_time_work"] = {
        "estimated_monthly": to_num(pt.get("estimated_monthly")),
        "allowed_hours": str(pt.get("allowed_hours", "20 hrs/week"))
    }

    plan["verdict"] = str(raw.get("verdict", "Financial feasibility confirmed."))

    return plan


@router.post("/chat")
async def chat_consultant(
    message: str = Body(..., embed=True),
    session_id: str = Body(None, embed=True),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)

    # Plan access check
    plan_limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    daily_limit = plan_limits.get("consultant_messages", 0)

    if daily_limit == 0 or daily_limit is False:
        raise HTTPException(status_code=403, detail="UPGRADE_REQUIRED")

    # Daily limit check for premium (not pro)
    user_id = current_user.id
    if daily_limit != -1:
        messages_today = _count_today_messages(user_id, db)
        if (plan == "free" or plan == "free_trial") and daily_limit > 0 and messages_today >= daily_limit:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "UPGRADE_REQUIRED",
                    "message": "Daily free limit reached. Upgrade to Premium for 20 messages/day!"
                }
            )
        
        if plan == "premium" and daily_limit > 0 and messages_today >= daily_limit:
            raise HTTPException(
                status_code=403,
                detail={
                    "error": "DAILY_LIMIT_REACHED",
                    "message": "Daily Premium limit reached (20/day). Upgrade to Pro for unlimited access!"
                }
            )

    if not session_id:
        session_id = "general"

    recent = db.query(models.ConsultantMessage).filter(
        models.ConsultantMessage.user_id == current_user.id,
        models.ConsultantMessage.session_id == session_id
    ).order_by(models.ConsultantMessage.created_at.desc()).limit(10).all()

    history = [{"role": m.role, "content": m.content} for m in reversed(recent)]
    
    # Context combined for regex extraction
    full_context_text = " ".join([m.content for m in history if m.role == "user"] + [message])

    scholarships_ctx = _build_scholarships_context(db, current_user)
    context = await get_student_context(current_user.id, db)
    
    response_format = "text"
    if session_id in ("financial_plan", "sop_review", "visa_guide", "scholarship_recommendation"):
        response_format = "json"

    # Initialize variables for financial plan to prevent lint errors
    city_detected = "the target city"
    uni_detected = "the target university"
    country_detected = "the target country"

    # Select and format appropriate system prompt
    if session_id == "sop_review":
        system_prompt = "You are currently in SOP Reviewer mode. " + SYSTEM_PROMPT_SOP.format(
            scholarship_name="selected scholarship", 
            university_name="university", 
            **context
        )
    elif session_id == "visa_guide":
        system_prompt = "You are currently in Visa Guidance mode. " + SYSTEM_PROMPT_VISA.format(
            country="target country", 
            **context
        )
    elif session_id == "scholarship_recommendation":
        system_prompt = SYSTEM_PROMPT_RECOMMENDATIONS.format(
            scholarships_list=scholarships_ctx,
            **context
        )
    elif session_id == "financial_plan":
        import re
        
        # Look for Country
        country_match = re.search(r'\b(UK|USA|US|Australia|Canada|Germany|Pakistan|India|France|Italy|Spain)\b', full_context_text, re.IGNORECASE)
        if country_match:
            country_detected = country_match.group(1)
            
        # Look for "in [City]" or "[City] mein"
        city_match = re.search(r'(?:in|at|mein|city)\s+([A-Z][a-z]+)', full_context_text)
        if city_match and city_match.group(1).lower() not in ['university', 'the', 'a', 'an']:
            city_detected = city_match.group(1)
            
        # Look for University patterns
        uni_match = re.search(r'((?:University of\s+[A-Z][a-z]+|[A-Z][a-z]+\s+University|LMU|TUM))', full_context_text, re.IGNORECASE)
        if uni_match:
            uni_detected = uni_match.group(1)

        system_prompt = "You are currently in Financial Planning mode. " + SYSTEM_PROMPT_FINANCIAL.format(
            city=city_detected, 
            country=country_detected, 
            university_name=uni_detected,
            **context
        )
    else:
        # Dynamic context injection based on user query
        scholarships_ctx = get_relevant_scholarships(message, current_user, db)
        web_context = ""
        search_query = _detect_search_query(message)
        if search_query:
            import asyncio
            try:
                web_context = asyncio.get_event_loop().run_until_complete(_search_web(search_query))
            except Exception:
                web_context = ""
        system_prompt = SYSTEM_PROMPT_CHAT.format(
            **context,
            scholarship_context=scholarships_ctx,
            web_search_context=web_context
        )

    history.append({"role": "user", "content": message})

    user_msg = models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=message, type="text"
    )
    db.add(user_msg)

    reply, tokens_used = _call_ai(history, system_prompt, response_format=response_format)

    # Contract Enforcement Layer
    if session_id == "financial_plan":
        raw_json = _safe_json_parse(reply, None)
        if raw_json is None:
            # JSON truncated or invalid -> retry with short schema
            print("[WARNING] Truncated JSON detected. Retrying with short schema.")
            system_prompt_short = "You are currently in Financial Planning mode. " + SYSTEM_PROMPT_FINANCIAL_SHORT.format(
                city=city_detected, 
                country=country_detected, 
                university_name=uni_detected,
                **context
            )
            reply, retry_tokens = _call_ai(history, system_prompt_short, response_format=response_format)
            tokens_used += retry_tokens
            raw_json = _safe_json_parse(reply, {})
            
        try:
            normalized = normalize_financial_plan(raw_json)
            reply = json.dumps(normalized)
        except Exception as e:
            print(f"[CRITICAL] Normalization failed: {e}")

    bot_msg = models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="assistant", content=reply, tokens_used=tokens_used, type="text"
    )
    db.add(bot_msg)
    db.commit()

    return {"reply": reply, "session_id": session_id}


@router.post("/review-sop")
async def review_sop(
    sop_text: str = Body(..., embed=True),
    scholarship_id: int = Body(..., embed=True),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan not in ["premium", "pro"]:
        raise HTTPException(status_code=403, detail="PREMIUM_REQUIRED")

    scholarship = db.query(models.Scholarship).get(scholarship_id)
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    context = await get_student_context(current_user.id, db)
    system_prompt = SYSTEM_PROMPT_SOP.format(
        scholarship_name=scholarship.title,
        university_name=scholarship.university_name or (scholarship.university.name if scholarship.university else "Target University"),
        **context
    )
    
    reply, tokens = _call_ai([{"role": "user", "content": sop_text}], system_prompt, response_format="json")
    
    default_sop = {
        "overall_score": 0, "verdict": "Parsing Error", "rewrite_suggestion": "Please try again.",
        "sections": {}, "strengths": [], "weaknesses": [], "top_3_fixes": []
    }
    result = _safe_json_parse(reply, default_sop)

    # Log to history
    session_id = "sop_review"
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=f"Reviewed SOP for {scholarship.title}", type="text"
    ))
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="assistant", content=reply, tokens_used=tokens, type="sop_review"
    ))
    db.commit()

    return result


@router.post("/draft-email")
async def draft_email(
    university_name: str = Body(..., embed=True),
    purpose: str = Body(..., embed=True), # admission_inquiry, professor_contact, scholarship_query
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan not in ["premium", "pro"]:
        raise HTTPException(status_code=403, detail="PREMIUM_REQUIRED")

    context = await get_student_context(current_user.id, db)
    system_prompt = SYSTEM_PROMPT_EMAIL.format(
        university_name=university_name,
        email_purpose=purpose,
        email=current_user.email or "shehroz@example.com",
        phone=getattr(current_user, "phone", None) or "+92 300 1234567",
        country="Pakistan",
        **context
    )
    reply, tokens = _call_ai([], system_prompt, response_format="json")
    print(f"[DEBUG] Draft Email AI Reply: {reply}")
    default_email = {
        "subject": "Inquiry regarding " + purpose.replace('_', ' '), 
        "greeting": "Dear Admissions Team,", 
        "body": "I am writing to express my interest in " + university_name + ". [Email body could not be generated, please try again.]", 
        "closing": "Sincerely,\n" + str(context.get('student_name', 'Student')),
        "follow_up_strategy": "Follow up after 7-10 business days if no response.", 
        "pro_tips": ["Keep your email concise", "Attach your CV and Transcripts"]
    }
    result = _safe_json_parse(reply, default_email)

    # Log to history
    session_id = "email_draft"
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=f"Drafted email for {university_name} ({purpose})", type="text"
    ))
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="assistant", content=reply, tokens_used=tokens, type="email_draft"
    ))
    db.commit()

    return result


@router.post("/visa-guide")
async def visa_guide(
    country: str = Body(..., embed=True),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan not in ["premium", "pro"]:
        raise HTTPException(status_code=403, detail="PREMIUM_REQUIRED")

    context = await get_student_context(current_user.id, db)
    system_prompt = SYSTEM_PROMPT_VISA.format(
        country=country,
        **context
    )
    reply, tokens = _call_ai([], system_prompt, response_format="json")
    default_visa = {
        "visa_type": "Student Visa", 
        "processing_time": "3-8 weeks", 
        "estimated_timeline": "1. Appointment booking (1-2 weeks), 2. Document submission, 3. Interview, 4. Decision (3-6 weeks)", 
        "required_documents": ["Valid Passport", "Admission Letter (CAS/I-20)", "Financial Proof", "Academic Transcripts"], 
        "financial_requirement": "Varies by country; typically 9-12 months of living expenses + tuition",
        "process_steps": ["Check eligibility", "Prepare documents", "Book appointment", "Attend interview", "Receive decision"], 
        "common_mistakes": ["Incomplete documents", "Inconsistent information", "Insufficient financial proof"], 
        "official_verification": "Visit the official government/embassy website for the latest requirements.",
        "pro_tips": ["Apply at least 3 months before your course start date.", "Ensure all documents are translated to English."],
        "disclaimer": "Visa rules change frequently. Always verify with official sources."
    }
    result = _safe_json_parse(reply, default_visa)

    # Log to history
    session_id = "visa_guide"
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=f"Fetched Visa Guide for {country}", type="text"
    ))
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="assistant", content=reply, tokens_used=tokens, type="visa_guide"
    ))
    db.commit()

    return result


@router.post("/mock-interview")
def mock_interview(
    scholarship_id: int = Body(..., embed=True),
    question_count: int = Body(5, embed=True),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan != "pro":
        raise HTTPException(status_code=403, detail="PRO_REQUIRED")

    scholarship = db.query(models.Scholarship).get(scholarship_id)
    prompt = f"Generate {question_count} likely interview questions for {scholarship.title if scholarship else 'a top scholarship'}. Return JSON: {{'questions': [{{'question': str, 'what_they_want': str, 'sample_answer_structure': str}}]}}"
    reply, _ = _call_ai([], prompt, response_format="json")
    default_mock = {"questions": []}
    return _safe_json_parse(reply, default_mock)


@router.post("/interview-feedback")
def interview_feedback(
    question: str = Body(..., embed=True),
    user_answer: str = Body(..., embed=True),
    current_user: models.User = Depends(deps.get_current_user)
):
    plan = _get_plan(current_user)
    if plan != "pro":
        raise HTTPException(status_code=403, detail="PRO_REQUIRED")

    prompt = f"""Review this interview answer for the question: '{question}'. 
    User answer: '{user_answer}'.
    Provide constructive feedback and an improved sample answer.
    
    Return EXACT JSON format: {{
        "score": int,
        "feedback": str,
        "what_was_good": [str],
        "what_was_weak": [str],
        "improved_sample_answer": str
    }}
    """
    reply, _ = _call_ai([], prompt, response_format="json")
    default_feedback = {
        "score": 0, "feedback": "Feedback unavailable.", "what_was_good": [], 
        "what_was_weak": [], "improved_sample_answer": ""
    }
    return _safe_json_parse(reply, default_feedback)


@router.post("/financial-plan")
async def financial_plan(
    country: str = Body(..., embed=True),
    city: str = Body(..., embed=True),
    duration_months: int = Body(..., embed=True),
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan not in ["premium", "pro"]:
        raise HTTPException(status_code=403, detail="PREMIUM_REQUIRED")

    context = await get_student_context(current_user.id, db)
    system_prompt = "You are currently in Financial Planning mode. " + SYSTEM_PROMPT_FINANCIAL.format(
        city=city,
        country=country,
        university_name="Target University",
        **context
    )
    reply, tokens = _call_ai([], system_prompt, response_format="json")
    default_finance = {
        "tuition_estimate": "N/A", 
        "monthly_living_cost": "N/A", 
        "visa_app_costs": "N/A",
        "bank_statement_estimate": "N/A", 
        "scholarship_coverage_note": "N/A",
        "total_estimated_cost": "N/A",
        "out_of_pocket_estimate": "N/A", 
        "pro_tips": ["Plan your budget early", "Look for part-time work options"],
        "disclaimer": "Estimates only. Actual costs may vary."
    }
    result = _safe_json_parse(reply, default_finance)

    # Log to history
    session_id = "financial_plan"
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="user", content=f"Generated Financial Plan for {city}, {country}", type="text"
    ))
    db.add(models.ConsultantMessage(
        user_id=current_user.id, session_id=session_id, role="assistant", content=reply, tokens_used=tokens, type="financial_plan"
    ))
    db.commit()

    return result


@router.get("/session/{tool_type}")
def get_session_history(
    tool_type: str,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    session = get_or_create_session(current_user.id, tool_type, db)
    messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session.id
    ).order_by(models.ChatMessage.created_at).all()
    
    return {
        "session_id": session.id,
        "tool_type": session.tool_type,
        "messages": [
            {
                "role": m.role,
                "content": m.content,
                "created_at": m.created_at,
                "type": m.tool_type
            } for m in messages
        ]
    }

@router.post("/session/{tool_type}/message")
async def send_session_message(
    tool_type: str,
    request: ChatMessageRequest,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    session = get_or_create_session(current_user.id, tool_type, db)
    
    # Save user message
    user_msg = models.ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="user",
        content=request.content,
        tool_type=tool_type
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)
    
    # Get Context
    previous_messages = db.query(models.ChatMessage).filter(
        models.ChatMessage.session_id == session.id
    ).order_by(models.ChatMessage.created_at).all()
    
    conversation_history = []
    for msg in previous_messages[-20:]:
        conversation_history.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Get System Prompt
    context = await get_student_context(current_user.id, db)
    scholarships_ctx = _build_scholarships_context(db, current_user)
    
    response_format = "text"
    if tool_type == "sop_review":
        system_prompt = SYSTEM_PROMPT_SOP_CHAT.format(
            student_name=context["student_name"], 
            cgpa=context["cgpa"], 
            field_of_study=context["field_of_study"]
        )
        response_format = "json"
    elif tool_type == "visa_guide":
        system_prompt = "You are currently in Visa Guidance mode. " + SYSTEM_PROMPT_VISA.format(
            country="target country", 
            **context
        )
    elif tool_type == "financial_plan":
        import re
        message = request.content
        city_detected = "the target city"
        uni_detected = "the target university"
        country_detected = "the target country"
        
        country_match = re.search(r'\b(UK|USA|US|Australia|Canada|Germany|Pakistan|India|France|Italy|Spain)\b', message, re.IGNORECASE)
        if country_match:
            country_detected = country_match.group(1)
            
        city_match = re.search(r'(?:in|at|mein|city)\s+([A-Z][a-z]+)', message)
        if city_match and city_match.group(1).lower() not in ['university', 'the', 'a', 'an']:
            city_detected = city_match.group(1)
            
        uni_match = re.search(r'((?:University of\s+[A-Z][a-z]+|[A-Z][a-z]+\s+University|LMU|TUM))', message, re.IGNORECASE)
        if uni_match:
            uni_detected = uni_match.group(1)

        system_prompt = "You are currently in Financial Planning mode. " + SYSTEM_PROMPT_FINANCIAL.format(
            city=city_detected, 
            country=country_detected, 
            university_name=uni_detected,
            **context
        )
        response_format = "json"
    elif tool_type == "university_email":
        university_name = "Target University"
        lower_msg = request.content.lower()
        if "to " in lower_msg:
            try:
                parts = lower_msg.split("to ")
                if len(parts) > 1:
                    university_name = parts[-1].strip()
            except:
                pass
        
        system_prompt = SYSTEM_PROMPT_EMAIL.format(
            student_name=context["student_name"],
            field=context["field"],
            cgpa=context["cgpa"],
            email_purpose="admission_inquiry",
            university_name=university_name.title(),
            email=current_user.email or "shehroz@example.com",
            phone=getattr(current_user, "phone", None) or "+92 300 1234567",
            country="Pakistan"
        )
    elif tool_type == "mock_interview":
        system_prompt = SYSTEM_PROMPT_MOCK_INTERVIEW.format(
            student_name=context["student_name"],
            field=context["field"]
        )
    else:
        # Dynamic context injection for session-based messages
        scholarships_ctx = get_relevant_scholarships(request.content, current_user, db)

        # Web search for real-time data
        web_context = ""
        search_query = _detect_search_query(request.content)
        if search_query:
            web_context = await _search_web(search_query)

        system_prompt = SYSTEM_PROMPT_CHAT.format(
            **context,
            scholarship_context=scholarships_ctx,
            web_search_context=web_context
        )
    
    # Call AI
    reply, tokens = _call_ai(conversation_history, system_prompt, response_format=response_format)
    
    # Enforce pure JSON if response_format was set to json
    final_tool_type = tool_type
    if response_format == "json":
        try:
            cleaned_json = _safe_json_parse(reply, {})
            if tool_type == "financial_plan":
                cleaned_json = normalize_financial_plan(cleaned_json)
                
                # Quality Gate: Reject hollow plans
                tuition = cleaned_json.get("tuition", {}).get("per_year", 0)
                ot_total = cleaned_json.get("one_time_costs", {}).get("total", {}).get("amount", 0)
                ls_total = cleaned_json.get("budget_lifestyle", {}).get("total_yearly", 0)
                
                if tuition == 0 and ls_total == 0:
                    reply = "I apologize, but I don't have enough specific financial data to generate a realistic plan for that exact location or program right now. Please provide a more well-known student city or specify a target university so I can give you accurate cost estimates."
                    final_tool_type = "text"
                    cleaned_json = None

            if cleaned_json:
                reply = json.dumps(cleaned_json)
        except Exception as e:
            print(f"[CRITICAL] Backend JSON cleanup failed: {e}")
            
    # Save AI response
    bot_msg = models.ChatMessage(
        session_id=session.id,
        user_id=current_user.id,
        role="assistant",
        content=reply,
        tool_type=final_tool_type
    )
    db.add(bot_msg)
    
    # Update session activity
    session.last_active = datetime.now(timezone.utc)  # type: ignore
    
    db.commit()
    
    return {
        "role": "assistant",
        "content": reply,
        "session_id": session.id,
        "type": final_tool_type
    }

@router.delete("/session/{tool_type}")
def clear_session(
    tool_type: str,
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id,
        models.ChatSession.tool_type == tool_type,
        models.ChatSession.is_active == True
    ).first()
    
    if session:
        session.is_active = False  # type: ignore
        db.commit()
        
    return {"message": "Session cleared"}

@router.get("/sessions/summary")
def get_sessions_summary(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    sessions = db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id,
        models.ChatSession.is_active == True
    ).all()
    
    summary = []
    for s in sessions:
        last_msg = db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == s.id
        ).order_by(models.ChatMessage.created_at.desc()).first()
        
        msg_count = db.query(models.ChatMessage).filter(
            models.ChatMessage.session_id == s.id
        ).count()
        
        summary.append({
            "tool_type": s.tool_type,
            "last_message": last_msg.content[:50] if last_msg else "No messages",
            "last_active": s.last_active,
            "message_count": msg_count
        })
        
    return summary

@router.get("/history")
def get_history(
    session_id: str = "general",
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    plan = _get_plan(current_user)
    if plan not in ["premium", "pro"]:
        return []

    messages = db.query(models.ConsultantMessage).filter(
        models.ConsultantMessage.user_id == current_user.id,
        models.ConsultantMessage.session_id == session_id
    ).order_by(models.ConsultantMessage.created_at.desc()).limit(20).all()

    formatted = []
    for m in reversed(messages):
        content = m.content
        data = None
        if m.type != "text":
            try:
                data = json.loads(content)
                content = "Tool Result"
            except:
                pass
        
        formatted.append({
            "id": str(m.id),
            "session_id": m.session_id,
            "role": m.role,
            "content": content,
            "type": m.type,
            "data": data,
            "created_at": m.created_at
        })
    return formatted


@router.delete("/history")
def clear_history(
    current_user: models.User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    db.query(models.ConsultantMessage).filter(
        models.ConsultantMessage.user_id == current_user.id
    ).delete()
    db.commit()
    return {"status": "success"}

