from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from pydantic import EmailStr
from dotenv import load_dotenv
import os

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("MAIL_USERNAME", "your_email@gmail.com"),
    MAIL_PASSWORD=os.getenv("MAIL_PASSWORD", "your_app_password"),
    MAIL_FROM=os.getenv("MAIL_FROM", os.getenv("MAIL_USERNAME", "your_email@gmail.com")),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=os.getenv("MAIL_SERVER", "smtp.gmail.com"),
    MAIL_STARTTLS=os.getenv("MAIL_STARTTLS", "True").lower() == "true",
    MAIL_SSL_TLS=os.getenv("MAIL_SSL_TLS", "False").lower() == "true",
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_deadline_email(user_email: str, scholarship_title: str, days_left: int):
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h3 style="color: #1e3a8a;">ScholarIQ Alert ⏳</h3>
        <p>Hello,</p>
        <p>Just a reminder that the deadline for <strong>{scholarship_title}</strong> is in <strong>{days_left} days</strong>.</p>
        <p>Please complete your application soon!</p>
        <br>
        <p>Best,<br>ScholarIQ Team</p>
    </div>
    """

    message = MessageSchema(
        subject=f"Deadline Alert: {scholarship_title}",
        recipients=[user_email],
        body=html,
        subtype=MessageType.html
    )

    fm = FastMail(conf)
    await fm.send_message(message)
    return {"message": "Email sent"}
