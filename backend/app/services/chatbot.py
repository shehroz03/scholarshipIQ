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
        You are the AI Assistant for 'ScholarIQ'.
        Help students with scholarships. 
        If a user uploads a document (Image/PDF), analyze it and answer their questions about it.
        Keep answers concise.
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
            max_tokens=300,
            temperature=0.7
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"Chatbot Error: {e}")
        return "I am having trouble analyzing the file. Please try again."
