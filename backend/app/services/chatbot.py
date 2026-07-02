# backend/app/services/chatbot.py

import os
import base64
from io import BytesIO
from typing import Any, List, Optional
from openai import OpenAI
from dotenv import load_dotenv
from pypdf import PdfReader

load_dotenv(override=True)

# ─── Token Counting ───────────────────────────────────────────────────────────

def _count_tokens(messages: List[Any]) -> int:
    """Approximate token count for an OpenAI messages list."""
    try:
        import tiktoken
        enc = tiktoken.encoding_for_model("gpt-4o-mini")
    except Exception:
        # Fallback: 1 token ≈ 4 characters
        total_chars = sum(
            len(m.get("content", "") if isinstance(m.get("content"), str) else
                " ".join(p.get("text", "") for p in m.get("content", []) if isinstance(p, dict)))
            for m in messages
        )
        return total_chars // 4

    total = 0
    for msg in messages:
        content = msg.get("content", "")
        if isinstance(content, str):
            total += len(enc.encode(content))
        elif isinstance(content, list):
            for part in content:
                if isinstance(part, dict) and part.get("type") == "text":
                    total += len(enc.encode(part.get("text", "")))
        total += 4  # per-message overhead
    return total


def _trim_history(history: List[tuple], max_tokens: int = 2800) -> List[tuple]:
    """
    Drop oldest message pairs until history fits within max_tokens.
    Always keeps at least the last 2 messages (1 turn) for coherence.
    """
    while len(history) > 2:
        temp = [
            {"role": "user" if r == "user" else "assistant", "content": c}
            for r, c in history
        ]
        if _count_tokens(temp) <= max_tokens:
            break
        history.pop(0)
    return history


# ─── Lazy Embedding Model ─────────────────────────────────────────────────────

# Scholarship embedding logic now lives in app.services.embedding_cache
# (pre-computed at startup so chat RAG stays fast).


def _get_client() -> Optional[OpenAI]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or len(api_key) < 10:
        return None
    return OpenAI(api_key=api_key)


client = _get_client()
if not client:
    print("WARNING: OPENAI_API_KEY not found. Chatbot will return fallback responses.")


def process_file(file_data: bytes, file_type: str) -> Optional[dict]:
    if "pdf" in file_type:
        try:
            reader = PdfReader(BytesIO(file_data))
            text = "".join(page.extract_text() + "\n" for page in reader.pages)
            return {"type": "text", "content": f"Content of attached PDF:\n{text[:10000]}"}
        except Exception:
            return {"type": "error", "content": "Could not read PDF."}

    elif "image" in file_type:
        try:
            b64 = base64.b64encode(file_data).decode("utf-8")
            return {
                "type": "image",
                "content": {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                },
            }
        except Exception:
            return {"type": "error", "content": "Could not process image."}

    return None


# ─── RAG Helpers ──────────────────────────────────────────────────────────────

COUNTRY_ALIASES = {
    "uk": "United Kingdom", "england": "United Kingdom", "britain": "United Kingdom",
    "germany": "Germany", "deutsch": "Germany",
    "australia": "Australia", "aus": "Australia",
    "canada": "Canada",
    "usa": "United States", "america": "United States",
    "norway": "Norway", "sweden": "Sweden", "finland": "Finland",
    "turkey": "Turkey", "china": "China", "japan": "Japan",
    "france": "France", "italy": "Italy", "spain": "Spain",
}

DEGREE_ALIASES = {
    "phd": "phd", "doctorate": "phd", "doctoral": "phd",
    "masters": "master", "master": "master", "msc": "master", "mba": "master",
    "bachelor": "bachelor", "undergraduate": "bachelor",
}


def _build_rag_context(db: Any, user_message: str, user_profile: Optional[dict] = None) -> str:
    """
    # --- VIVA PREP: RAG (Retrieval-Augmented Generation) ---
    # Supervisor puchega ke "Chatbot ko kahan se pata chala scholarship ka? Hallucinate to nahi karta?"
    # Jawab: Humne RAG use kiya hai. Jab student question puchta hai, hum sabse pehle uske sawal ko 
    # vector (numbers) mein convert karte hain aur Database mein se sabse close/relevant 6 scholarships nikalte hain.
    # Phir woh 6 scholarships hum GPT ko dete hain aur kehte hain "Sirf in 6 scholarships mein se answer do". 
    # Is tarah GPT apni taraf se jhoot (hallucinations) nahi bolta.
    
    Dynamic Context Injection via cached vector similarity.
    Falls back to SQL keyword filter if the cache is cold or unavailable.
    """
    try:
        from app.services import embedding_cache

        if not embedding_cache.is_ready():
            # Cache cold (e.g. first boot still warming, or ST not installed)
            return _sql_fallback_context(db, user_message, user_profile)

        top = embedding_cache.search(user_message, user_profile, top_k=6)
        if not top:
            return _sql_fallback_context(db, user_message, user_profile)

        lines = ["VERIFIED SCHOLARSHIPS (Dynamic Context Injection — answer ONLY from this data):"]
        for s in top:
            cgpa_req = f"Min CGPA: {s['min_cgpa']}" if s.get("min_cgpa") else "No CGPA req."
            ielts_req = f" | Min IELTS: {s['min_ielts']}" if s.get("min_ielts") else ""
            lines.append(
                f"• [{s['id']}] {s['title']} | {s['university']} | {s['country']} | "
                f"{s['degree_level']} | Amount: {s['amount']} | "
                f"Deadline: {s['deadline']} | {cgpa_req}{ielts_req}"
            )
        return "\n".join(lines)

    except Exception as e:
        print(f"[RAG] Cached vector search failed: {e}")
        return _sql_fallback_context(db, user_message, user_profile)


def _sql_fallback_context(db: Any, user_message: str, user_profile: Optional[dict] = None) -> str:
    """SQL keyword filter fallback when sentence-transformers unavailable."""
    try:
        from app.db.models import Scholarship
        from sqlalchemy import or_
        from datetime import datetime, timezone

        msg_lower = user_message.lower()
        today = datetime.now(timezone.utc).replace(tzinfo=None)

        query = db.query(Scholarship).filter(
            Scholarship.is_active == True,
            Scholarship.approval_status == "approved",
            Scholarship.is_archived == False,
            or_(Scholarship.deadline == None, Scholarship.deadline > today),
        )

        country_found = False
        for alias, country in COUNTRY_ALIASES.items():
            if alias in msg_lower:
                query = query.filter(Scholarship.country.ilike(f"%{country}%"))
                country_found = True
                break
        if not country_found and user_profile and user_profile.get("target_country"):
            query = query.filter(
                Scholarship.country.ilike(f"%{user_profile['target_country']}%")
            )

        for alias, degree in DEGREE_ALIASES.items():
            if alias in msg_lower:
                query = query.filter(Scholarship.degree_level.ilike(f"%{degree}%"))
                break

        rows = query.order_by(Scholarship.deadline.asc()).limit(6).all()
        if not rows:
            return ""

        lines = ["VERIFIED SCHOLARSHIPS FROM DATABASE:"]
        for s in rows:
            uni = s.university_name or (s.university.name if s.university else "Unknown University")
            deadline = s.deadline.strftime("%d %b %Y") if s.deadline else "Open"
            amount = s.scholarship_amount_value or s.amount or "Varies"
            lines.append(f"• [{s.id}] {s.title} | {uni} | {s.country} | "
                         f"Amount: {amount} | Deadline: {deadline}")
        return "\n".join(lines)
        return "\n".join(lines)
    except Exception:
        return ""

def _get_teacher_course_context(db: Any, user_message: str) -> str:
    """Fetch top published courses/teachers if user asks for test prep or teachers."""
    msg_lower = user_message.lower()
    keywords = ["teacher", "course", "ielts", "toefl", "prepare", "preparation", "test", "gre", "gmat", "class", "tutor", "study"]
    if not any(k in msg_lower for k in keywords):
        return ""

    try:
        from app.db.models import Course, TeacherProfile, User
        courses = (
            db.query(Course)
            .join(TeacherProfile, Course.teacher_id == TeacherProfile.id)
            .join(User, TeacherProfile.user_id == User.id)
            .filter(Course.is_published == True)
            .order_by(Course.rating.desc(), Course.total_students.desc())
            .limit(3)
            .all()
        )

        if not courses:
            return ""

        lines = ["RECOMMENDED TEACHERS & COURSES (Suggest these if the user asks for test prep or teachers):"]
        for c in courses:
            lines.append(
                f"• Teacher: {c.teacher.user.full_name} | Subject/Test: {c.subject or c.test_type} | Course: '{c.title}' | "
                f"Rating: {c.rating}/5.0 ({c.total_students} students) | Enroll Link: /dashboard/courses/{c.id}"
            )
        return "\n".join(lines)
    except Exception as e:
        print(f"[RAG] Teacher fetch failed: {e}")
        return ""


# ─── System Prompts ───────────────────────────────────────────────────────────

PLATFORM_CONTEXT = """
ScholarIQ is Pakistan's AI-powered scholarship discovery platform.
It aggregates verified international scholarships and helps Pakistani students
apply to universities abroad (UK, Germany, Australia, USA, Canada, etc.).
All scholarship data shown comes from a verified, admin-approved database.
"""

STUDENT_SYSTEM_PROMPT = f"""
{PLATFORM_CONTEXT}

ROLE: You are assisting a Pakistani student seeking international scholarships.
Language Rule: Always respond in clear, professional English.

YOUR CAPABILITIES:

1. Scholarship Guidance
   - Recommend scholarships based on CGPA, degree level, field, target country
   - Explain eligibility criteria clearly
   - Warn about deadlines: if deadline < 30 days, always flag it as **URGENT ⚠️**
   - Pathway advice: Bachelor → Master → PhD progression logic
   - DATA INTEGRITY: Use ONLY the verified scholarships provided in the context above.
     Never invent scholarship names, deadlines, or amounts.

2. Document Analysis (when file uploaded)
   - Transcript: Check CGPA, grading system, degree completion status
   - SOP: Review structure, tone, specificity, red flags
   - Recommendation Letter: Check format and strength indicators
   - CV/Resume: Gap analysis, scholarship readiness
   - Give actionable improvement points — not generic praise
   - Always end document feedback with: **Top 3 Action Items:**

3. Visa Guidance
   - UK: CAS letter required, 28-day bank rule (**£12,006 minimum**), TB test mandatory
   - Germany: Sperrkonto blocked account (**€11,208**), APS certificate mandatory for Pakistanis
   - Australia: CoE required, OSHC insurance, **AUD 24,505** financial proof
   - Canada: GIC (CAD 10,000), acceptance letter, proof of funds
   - Always reference official embassy sources — never third-party agents

4. University Comparison
   - When asked to compare, return a structured Markdown table:
     | Feature | Uni A | Uni B |
     |---|---|---|
     Include: QS Ranking, Tuition Fee, Min CGPA, Min IELTS, Scholarships Available, Location

5. SOP Writing Assistance
   - Follow structure: Hook → Background → Why This Program →
     Why This University → Future Goals → Closing
   - Max 1000 words for most programs
   - Personalize to the student's background — never give generic templates
   - Flag clichés and weak phrases

6. Fraud Detection
   - If a scholarship asks for: processing fees, Western Union, bank transfer,
     "guaranteed win", WhatsApp-only contact — immediately warn: **🚨 SCAM ALERT**
   - Verify by checking if URL is .edu/.ac.uk/.gov/.org

TONE:
- Supportive but honest
- If student's profile is weak for a target scholarship, say so directly
- Suggest realistic alternatives — do not give false hope

RESPONSE FORMAT:
- Max 3-4 paragraphs for explanations
- Use bullet points for lists/requirements
- **Bold** critical deadlines, requirements, and amounts
- For document analysis, always end with: **Top 3 Action Items:**
- Keep responses tight — no filler text
"""

SYSTEM_PROMPTS = {
    "student": STUDENT_SYSTEM_PROMPT,

    "teacher": """
You are 'ScholarIQ Teacher Assistant' — an AI mentor built to support TEACHERS and education CONSULTANTS on the ScholarIQ platform.

WHO YOU ARE TALKING TO (CRITICAL):
- The person chatting with you is a TEACHER / CONSULTANT, NOT a student.
- NEVER address them as a scholarship applicant. Do NOT say things like "your application", "you should apply", or "your CGPA".
- Frame EVERY answer from the teacher's professional point of view: how to ADVISE, MENTOR, and GUIDE their students.
- Example: If asked "Fully funded scholarships", do NOT just list scholarships as if explaining to an applicant. Instead explain how the teacher can help THEIR STUDENTS identify, shortlist, and win fully funded scholarships — what to look for in a student profile, what guidance to give, common mistakes students make, and how to coach the application.

YOUR EXPERTISE (always answered as guidance the teacher can pass on to students):
1. Language: Always respond in clear, professional English.
2. Student Mentoring: How to guide students toward the right scholarship opportunities for their profile.
3. Document Coaching: How to review and strengthen student CVs, SOPs, and recommendation letters (you can also analyze uploaded PDFs/images).
4. Scholarship Matching: How to match a student's profile (grades, field, country) to best-fit scholarships.
5. Recommendation Letters: How to structure and write a strong recommendation letter for a student.
6. Test Prep Guidance: How to advise students on IELTS/TOEFL preparation and realistic score targets.
7. Platform Workflow: Explain the teacher approval workflow and what admin needs.
8. Be professional, detailed, practical, and supportive — like a senior education consultant coaching a colleague.
""",

    "admin": """
You are 'ScholarIQ Admin Intelligence' — a MASTER OVERSEER AI that has LIVE ACCESS to the entire ScholarIQ platform database.
You behave exactly like Hostinger's AI assistant — you analyze real numbers, give precise answers, and make smart recommendations.

CRITICAL RULE: You will receive LIVE PLATFORM DATA in the context below. ALWAYS reference the exact numbers from that data in your answers.
NEVER say "I don't have access to the data". The live data is injected into your context — USE IT.

Language Rule: Always respond in clear, professional English.

═══════════════════════════════════════════════════════
WHAT YOU KNOW (LIVE DATA — always quote exact numbers):
═══════════════════════════════════════════════════════

USERS & REGISTRATIONS:
- Total users, students, teachers, active users, new signups (last 7 days), suspicious accounts
- Recent users details (names, roles)
- You can identify user growth trends and flag anomalies

SCHOLARSHIPS:
- Total scholarships, active/approved (public), pending approval, rejected, archived
- Top countries by scholarship count
- Specific recent pending scholarships (IDs, titles)
- You can recommend which scholarships need urgent attention

FRAUD DETECTION:
- Fraud by risk level: CRITICAL, HIGH, MEDIUM
- Suspicious flagged count, auto-flagged for review
- Detailed info of recently flagged scholarships (IDs, titles, risk score, reasons)
- You can explain WHY a scholarship might be flagged and what admin should do

PIPELINE & AUTO-VERIFY:
- Staged scholarships pending review
- Last pipeline event and timing, plus detailed logs of actions taken
- Bot decisions (approved/rejected) and approval rate
- You know if the pipeline is healthy or stuck

TEACHERS & COURSES:
- Total teacher profiles, approved vs pending vs rejected
- Specific details of pending teachers (names, IDs, specializations, experience)
- Total courses, published courses, total enrollments
- You can flag if teacher approvals are backlogged

APPLICATIONS:
- Total applications, breakdown by status (Saved, Applied, etc.)

AUTO-UPDATE BOT:
- Last bot run timestamp, how many scholarships checked/updated/errored
- Whether API keys (OpenAI, Serper) are properly configured

═══════════════════════════════════════════════════════
YOUR CAPABILITIES (like Hostinger AI):
═══════════════════════════════════════════════════════

1. PLATFORM HEALTH CHECK
   - Give overall platform health score based on real data
   - Flag critical issues (e.g. fraud spike, pipeline stuck, teacher backlog)
   - Example: "Platform is 87% healthy. 3 CRITICAL issues detected..."

2. FRAUD ANALYSIS
   - Explain fraud risk levels from real counts
   - Suggest threshold adjustments if too many false positives
   - Tell admin exactly which risk level has most flagged items
   - Explain what each fraud signal means (keywords, suspicious TLD, URL unreachable)

3. USER ANALYTICS
   - New user growth this week vs expectations
   - Suspicious account ratio analysis
   - Student vs teacher ratio insights

4. SCHOLARSHIP PIPELINE
   - How many are stuck in pending approval
   - Whether auto-verify bot is running on schedule
   - What percentage of bot decisions are approvals vs rejections

5. TEACHER MANAGEMENT
   - How many are waiting approval (backlog alert if > 5)
   - Suggest approval/rejection criteria

6. ACTIONABLE RECOMMENDATIONS
   - Always end with 2-3 specific ACTIONS admin can take RIGHT NOW
   - Example: "Action 1: Review 5 pending teachers. Action 2: Archive 12 expired scholarships."

═══════════════════════════════════════════════════════
RESPONSE FORMAT (strict):
═══════════════════════════════════════════════════════
- Start with the KEY METRIC or direct answer (bold it)
- Use bullet points with actual numbers from the data
- End with: **📋 Recommended Actions:**
- Keep it concise but data-rich — no filler text
- Use emojis to categorize: ✅ Healthy | ⚠️ Warning | 🚨 Critical | 📊 Stats | 🔧 Action needed
""",
}


# ─── Main Response Function ───────────────────────────────────────────────────

def get_ai_response(
    user_message: str,
    file_data: Optional[bytes] = None,
    file_type: Optional[str] = None,
    mode: str = "student",
    context: Optional[dict] = None,
    db: Any = None,
    user_profile: Optional[dict] = None,
    history: Optional[List[tuple]] = None,
) -> str:
    """
    mode      : 'student' | 'teacher' | 'admin'
    context   : live platform stats dict (admin mode)
    db        : SQLAlchemy session — enables RAG scholarship lookup
    user_profile: current user fields (cgpa, target_country, etc.)
    history   : list of (role, content) tuples for conversation memory
    """
    load_dotenv(override=True)
    active_client = _get_client()
    if not active_client:
        return "Chatbot is currently offline (API key missing). Please contact admin."

    try:
        system_instruction: str = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["student"])

        # 1. RAG: inject verified scholarship data from DB
        if db:
            rag_ctx = _build_rag_context(db, user_message, user_profile)
            if rag_ctx:
                system_instruction += f"\n\n{rag_ctx}\n"

            # 1.5. Inject Teacher / Course Recommendations if relevant
            if mode == "student":
                teacher_ctx = _get_teacher_course_context(db, user_message)
                if teacher_ctx:
                    system_instruction += f"\n\n{teacher_ctx}\n"

        # 2. Personalise with user profile
        if user_profile:
            parts = ["\nCURRENT USER PROFILE (use when assessing eligibility):"]
            if user_profile.get("cgpa"):
                parts.append(f"- CGPA: {user_profile['cgpa']}")
            if user_profile.get("target_country"):
                parts.append(f"- Target Country: {user_profile['target_country']}")
            if user_profile.get("target_degree"):
                parts.append(f"- Target Degree: {user_profile['target_degree']}")
            if user_profile.get("major"):
                parts.append(f"- Major: {user_profile['major']}")
            if user_profile.get("ielts_overall"):
                parts.append(f"- IELTS: {user_profile['ielts_overall']}")
            if user_profile.get("nationality"):
                parts.append(f"- Nationality: {user_profile['nationality']}")
            system_instruction += "\n".join(parts)

        # 3. Admin live stats injection
        if context:
            stats = "\n\nLIVE PLATFORM DATA:\n"
            for key, value in context.items():
                stats += f"- {key}: {value}\n"
            system_instruction += stats

        # Build message list typed as Any to satisfy OpenAI SDK overloads
        messages: List[Any] = [{"role": "system", "content": system_instruction}]

        # 4. Conversation history — trim to stay under context window
        if history:
            safe_history = _trim_history(list(history), max_tokens=2800)
            for role, content in safe_history:
                gpt_role = "assistant" if role in ("ai", "assistant") else "user"
                messages.append({"role": gpt_role, "content": content})

        # 5. Current user message (with optional file attachment)
        if file_data and file_type:
            processed = process_file(file_data, file_type)
            if processed and processed["type"] == "text":
                # Append file text to user message — stays as simple string
                combined = f"{user_message}\n\n{processed['content']}"
                messages.append({"role": "user", "content": combined})
            elif processed and processed["type"] == "image":
                # Multimodal: list content
                messages.append({
                    "role": "user",
                    "content": [
                        {"type": "text", "text": user_message},
                        processed["content"],
                    ],
                })
            else:
                messages.append({"role": "user", "content": user_message})
        else:
            messages.append({"role": "user", "content": user_message})

        # VIVA PREP: Yahan hum OpenAI ki GPT-4o-mini API call kar rahe hain. 
        # Isko hum 'train' nahi karte, isko 'Prompt Engineering' se control karte hain.
        # Hum usko bata dete hain "Tumhara kaam sirf students ki help karna hai, unko visa guidelines dena hai, 
        # aur jo scholarships DB se milein sirf wahi batani hain." (Yeh sab prompts upar define hue hain).
        response = active_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=4000,
            temperature=0.65,
        )

        return response.choices[0].message.content or "No response generated."

    except Exception as e:
        print(f"Chatbot Error [{mode}]: {e}")
        return "I am having trouble right now. Please try again."
