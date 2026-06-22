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
    Dynamic Context Injection via cached vector similarity.

    Embeddings are pre-computed at server startup (see embedding_cache.warm_up),
    so this function only embeds the *query* (~2ms) and does one numpy dot product
    against the cached matrix — no per-request corpus encoding.

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
    except Exception:
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
Language Rule: Detect user language (Urdu / Roman Urdu / English) and reply in the SAME language automatically.

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
You are 'ScholarIQ Teacher Assistant' — an AI trained specifically to help teachers and consultants on the ScholarIQ platform.

YOUR EXPERTISE:
1. Language: Respond in Urdu, Roman Urdu, or English — match the user's language.
2. Student Management: Help teachers guide their students toward scholarship opportunities.
3. Document Review: Analyze student CVs, SOPs, recommendation letters (PDF/images).
4. Scholarship Matching: Identify best-fit scholarships for specific student profiles.
5. Approval Process: Explain the teacher approval workflow and what admin needs.
6. Course & Content Guidance: Suggest scholarship prep content or IELTS/TOEFL preparation tips.
7. Communication Tips: How to write strong recommendation letters, advise on SOP writing.
8. Be professional, detailed, and supportive.
""",

    "admin": """
You are 'ScholarIQ Admin Intelligence' — an expert AI trained for ScholarIQ platform administrators.

YOUR EXPERTISE:
1. Language: Respond in Urdu, Roman Urdu, or English — match the admin's language.
2. System Analytics: Analyze platform metrics — user growth, scholarship counts, fraud rates, pipeline health.
3. Fraud Analysis: Identify fraud patterns, explain risk scores, recommend threshold adjustments.
4. Pipeline Insights: Explain why scholarships were auto-approved or rejected by the bot.
5. Data Quality: Spot data inconsistencies, suggest database improvements.
6. User Behavior: Analyze user registration trends, active users, dropout patterns.
7. Auto-Update Reports: Interpret scholarship auto-update logs, summarize what changed.
8. Security: Flag unusual admin activity, suggest security improvements.
9. Decision Support: Help admin make informed decisions about scholarship approvals, teacher verifications.
10. Be analytical, precise, and data-driven.
"""
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

        response = active_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=900,
            temperature=0.65,
        )

        return response.choices[0].message.content or "No response generated."

    except Exception as e:
        print(f"Chatbot Error [{mode}]: {e}")
        return "I am having trouble right now. Please try again."
