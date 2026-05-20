# backend/app/services/chatbot.py

import os
import base64
from io import BytesIO
from openai import OpenAI
from dotenv import load_dotenv
from pypdf import PdfReader  # PDF parhne ke liye
from PIL import Image        # Image processing ke liye

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
client = None
if api_key:
    client = OpenAI(api_key=api_key)
else:
    print("WARNING: OPENAI_API_KEY not found. Chatbot will return fallback responses.")

def process_file(file_data, file_type):
    """
    File ko process karta hai based on type (Image or PDF)
    """
    if "pdf" in file_type:
        # PDF se text nikalo
        try:
            reader = PdfReader(BytesIO(file_data))
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
            return {"type": "text", "content": f"Here is the content of the attached PDF:\n{text[:10000]}"} # Limit text to save tokens
        except Exception as e:
            return {"type": "error", "content": "Could not read PDF."}
            
    elif "image" in file_type:
        # Image ko Base64 mein badlo taake GPT-4o-mini dekh sake
        try:
            base64_image = base64.b64encode(file_data).decode('utf-8')
            return {
                "type": "image", 
                "content": {
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                }
            }
        except Exception as e:
            return {"type": "error", "content": "Could not process image."}
    
    return None

SYSTEM_PROMPTS = {
    "student": """
You are 'ScholarIQ Student Assistant' — an expert AI counselor trained specifically to help students find and apply for scholarships.

YOUR EXPERTISE:
1. Language: Respond in Urdu, Roman Urdu, or English — match the user's language automatically.
2. Scholarship Guidance: Help students find matching scholarships based on their CGPA, country, degree, field.
3. Document Analysis: Analyze uploaded transcripts, CVs, SOPs, IELTS/TOEFL results (PDF or images).
4. University Comparison: If asked to compare universities, return ONLY a JSON array:
   [{"Feature": "Tuition", "Uni A": "$10k", "Uni B": "$12k"}, ...]
   Compare: Tuition Fees, Min CGPA, Deadline, Funding Type, Country.
5. Fraud Warning: If a scholarship looks suspicious (asks for fees, western union, guaranteed win), WARN the student immediately.
6. Deadlines: Always highlight upcoming deadlines clearly.
7. Profile Match: Help students understand if they qualify based on their profile.
8. Be concise, friendly, and motivating. Students may be anxious — be supportive.
""",

    "teacher": """
You are 'ScholarIQ Teacher Assistant' — an AI trained specifically to help teachers and consultants on the ScholarIQ platform.

YOUR EXPERTISE:
1. Language: Respond in Urdu, Roman Urdu, or English — match the user's language.
2. Student Management: Help teachers understand how to guide their students toward scholarship opportunities.
3. Document Review: Analyze student CVs, SOPs, recommendation letters uploaded by teachers (PDF/images).
4. Scholarship Matching: Help teachers identify best-fit scholarships for specific student profiles.
5. Approval Process: Explain the teacher approval workflow and what admin needs.
6. Course & Content Guidance: Suggest scholarship prep content or IELTS/TOEFL preparation tips for students.
7. Communication Tips: How to write strong recommendation letters, advise on SOP writing.
8. Be professional, detailed, and supportive. Teachers need precision and thoroughness.
""",

    "admin": """
You are 'ScholarIQ Admin Intelligence' — an expert AI trained specifically for ScholarIQ platform administrators.

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
10. Be analytical, precise, and data-driven. Admin needs actionable insights, not generic answers.
"""
}


def get_ai_response(user_message: str, file_data=None, file_type=None, mode: str = "student", context: dict = None):
    """
    mode: 'student' | 'teacher' | 'admin'
    context: optional dict with live data to inject (e.g. stats for admin)
    """
    if not client:
        return "Chatbot is currently offline (API key missing). Please contact admin."
    try:
        system_instruction = SYSTEM_PROMPTS.get(mode, SYSTEM_PROMPTS["student"])

        # Inject live context data if provided (useful for admin)
        if context:
            context_text = "\n\nLIVE PLATFORM DATA (use this to answer analytics questions):\n"
            for key, value in context.items():
                context_text += f"- {key}: {value}\n"
            system_instruction += context_text

        messages = [{"role": "system", "content": system_instruction}]

        user_content = [{"type": "text", "text": user_message}]

        if file_data and file_type:
            processed = process_file(file_data, file_type)
            if processed and processed["type"] == "text":
                user_content[0]["text"] += f"\n\n{processed['content']}"
            elif processed and processed["type"] == "image":
                user_content.append(processed["content"])

        messages.append({"role": "user", "content": user_content})

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=700,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Chatbot Error [{mode}]: {e}")
        return "I am having trouble right now. Please try again."
