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

def get_ai_response(user_message: str, file_data=None, file_type=None):
    if not client:
        return "Chatbot is currently offline (API key missing). Please contact admin."
    try:
        system_instruction = """
        You are the official 'ScholarIQ' AI Counselor. 
        1. Language Support: Always support both Urdu (Urdu script/Roman Urdu) and English. Respond in the user's chosen language.
        2. Grounded in Data: You must ONLY provide information based on the verified scholarship data provided to you from our PostgreSQL database[cite: 31, 185]. 
        3. Data Comparison: If a user asks to compare 2 or 3 universities, RETURN A JSON ARRAY ONLY. Do not add any text before or after. The JSON should be an array of objects where keys are "Feature" and university names. Example: [{"Feature": "Tuition", "Uni A": "$10k", "Uni B": "$12k"}, {"Feature": "Min CGPA", "Uni A": "3.0", "Uni B": "3.5"}]. Compare them based on: Tuition Fees, GPA Requirements, Deadline, and Country[cite: 141, 156].
        4. Verification: If a scholarship is flagged as 'suspicious' in our database, warn the user immediately[cite: 150, 438].
        5. Speed: Be precise and avoid unnecessary talk to ensure the fastest response time[cite: 740, 1024].
        6. Handling Unknowns: If the data for a specific university is not in our database, politely tell the user that it's currently unverified and offer to help with available options.
        """

        messages = [{"role": "system", "content": system_instruction}]

        # User ka message content prepare karein
        user_content = [{"type": "text", "text": user_message}]

        # Agar koi file hai to usay add karein
        if file_data and file_type:
            processed = process_file(file_data, file_type)
            if processed and processed["type"] == "text":
                # PDF Text ko message mein jod do
                user_content[0]["text"] += f"\n\n{processed['content']}"
            elif processed and processed["type"] == "image":
                # Image ko alag se jod do
                user_content.append(processed["content"])

        messages.append({"role": "user", "content": user_content})

        response = client.chat.completions.create(
            model="gpt-4o-mini",  # Best & Cheapest Vision Model
            messages=messages,
            max_tokens=600,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Chatbot Error: {e}")
        return "I am having trouble analyzing the file. Please try again."
