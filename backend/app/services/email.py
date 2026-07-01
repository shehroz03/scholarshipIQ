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

async def send_otp_email(email: str, otp: str, name: str = ""):
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
        <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;margin:0;">ScholarIQ</h2>
            <p style="color:#64748b;font-size:13px;margin-top:4px;">Email Verification</p>
        </div>
        <p style="color:#374151;">Hello <strong>{name or email}</strong>,</p>
        <p style="color:#374151;">Your verification code is:</p>
        <div style="text-align:center;margin:24px 0;">
            <div style="display:inline-block;background:#f0f4ff;border:2px solid #6366f1;border-radius:12px;padding:16px 40px;">
                <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#4338ca;">{otp}</span>
            </div>
        </div>
        <p style="color:#374151;">Enter this code on ScholarIQ to verify your email. This code expires in <strong>15 minutes</strong>.</p>
        <p style="color:#ef4444;font-size:12px;">⚠️ Do not share this code with anyone.</p>
        <p style="color:#6b7280;font-size:12px;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:20px;">
            If you did not create a ScholarIQ account, ignore this email.<br>
            <strong>The ScholarIQ Team</strong>
        </p>
    </div>
    """
    try:
        message = MessageSchema(
            subject="🔐 Your ScholarIQ Verification Code",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EmailService] OTP sent to {email}")
    except Exception as e:
        print(f"[EmailService] Failed to send OTP to {email}: {e}")
        raise


async def send_teacher_approved_email(teacher_email: str, teacher_name: str):
    """Send approval notification email to teacher."""
    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
        <div style="text-align:center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0;">ScholarIQ</h2>
        </div>
        <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="color: #065f46; margin: 0;">🎉 Congratulations! Your Teacher Account is Approved</h3>
        </div>
        <p style="color: #374151;">Dear <strong>{teacher_name}</strong>,</p>
        <p style="color: #374151;">We are pleased to inform you that your teacher account application on <strong>ScholarIQ</strong> has been <strong style="color: #10b981;">approved</strong> by our admin team.</p>
        <p style="color: #374151;">You can now log in to your Teacher Dashboard and start:</p>
        <ul style="color: #374151;">
            <li>Creating and managing courses</li>
            <li>Scheduling live classes with meeting links</li>
            <li>Creating quizzes for students</li>
            <li>Setting your course fees</li>
            <li>Tracking enrolled students</li>
        </ul>
        <div style="text-align: center; margin: 30px 0;">
            <a href="https://scholarship.broadsolutiontech.com/teacher" style="background-color: #1e3a8a; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Go to Teacher Dashboard →
            </a>
        </div>
        <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
            Welcome to ScholarIQ! We look forward to your contributions.<br>
            <strong>The ScholarIQ Team</strong>
        </p>
    </div>
    """
    try:
        message = MessageSchema(
            subject="✅ Your Teacher Account Has Been Approved - ScholarIQ",
            recipients=[teacher_email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EmailService] Approval email sent to {teacher_email}")
    except Exception as e:
        print(f"[EmailService] Failed to send approval email to {teacher_email}: {e}")


async def send_teacher_rejected_email(teacher_email: str, teacher_name: str, reason: str = ""):
    """Send rejection notification email to teacher."""
    reason_section = f"""
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; border-radius: 8px; margin: 16px 0;">
            <p style="color: #991b1b; margin: 0;"><strong>Reason:</strong> {reason}</p>
        </div>
    """ if reason else ""

    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; background: #fff;">
        <div style="text-align:center; margin-bottom: 24px;">
            <h2 style="color: #1e3a8a; margin: 0;">ScholarIQ</h2>
        </div>
        <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
            <h3 style="color: #991b1b; margin: 0;">❌ Teacher Application Status Update</h3>
        </div>
        <p style="color: #374151;">Dear <strong>{teacher_name}</strong>,</p>
        <p style="color: #374151;">We regret to inform you that your teacher account application on <strong>ScholarIQ</strong> has been <strong style="color: #ef4444;">rejected</strong> at this time.</p>
        {reason_section}
        <p style="color: #374151;">If you believe this decision was made in error or you would like to appeal, please contact our support team.</p>
        <p style="color: #374151;">You may also reapply after addressing the mentioned concerns.</p>
        <p style="color: #6b7280; font-size: 13px; border-top: 1px solid #f1f5f9; padding-top: 16px; margin-top: 24px;">
            Thank you for your interest in ScholarIQ.<br>
            <strong>The ScholarIQ Team</strong>
        </p>
    </div>
    """
    try:
        message = MessageSchema(
            subject="❌ Teacher Application Update - ScholarIQ",
            recipients=[teacher_email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EmailService] Rejection email sent to {teacher_email}")
    except Exception as e:
        print(f"[EmailService] Failed to send rejection email to {teacher_email}: {e}")


async def send_password_reset_email(email: str, reset_link: str, name: str = ""):
    html = f"""
    <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:30px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;">
        <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;margin:0;">ScholarIQ</h2>
            <p style="color:#64748b;font-size:13px;margin-top:4px;">Password Reset</p>
        </div>
        <p style="color:#374151;">Hello <strong>{name or email}</strong>,</p>
        <p style="color:#374151;">We received a request to reset your ScholarIQ password. Click the button below to create a new password:</p>
        <div style="text-align:center;margin:28px 0;">
            <a href="{reset_link}" style="background:linear-gradient(135deg,#1e3a8a,#3b82f6);color:#fff;padding:14px 32px;text-decoration:none;border-radius:10px;font-weight:700;font-size:15px;display:inline-block;">
                Reset My Password
            </a>
        </div>
        <p style="color:#64748b;font-size:13px;">This link expires in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
        <p style="color:#ef4444;font-size:12px;">⚠️ Never share this link with anyone.</p>
        <p style="color:#6b7280;font-size:12px;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:20px;">
            The ScholarIQ Team
        </p>
    </div>
    """
    try:
        message = MessageSchema(
            subject="🔒 Reset Your ScholarIQ Password",
            recipients=[email],
            body=html,
            subtype=MessageType.html
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EmailService] Password reset email sent to {email}")
    except Exception as e:
        print(f"[EmailService] Failed to send reset email to {email}: {e}")
        raise


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
async def send_new_matches_email(user_email: str, user_name: str, matches: list):
    """
    Professional daily digest: notifies a user about NEW scholarships that match
    their profile. `matches` is a list of dicts:
      {title, country, degree_level, amount, deadline, match_score, detail_url}
    Sends ONE email listing all matches (no per-scholarship spam).
    """
    if not matches:
        return {"message": "no matches, skipped"}

    rows = ""
    for m in matches[:10]:  # cap at 10 to keep the email tidy
        badge = (
            f'<span style="background:#dcfce7;color:#166534;padding:2px 8px;'
            f'border-radius:10px;font-size:12px;font-weight:600;">'
            f'{int(m.get("match_score", 0))}% match</span>'
        )
        rows += f"""
        <tr>
          <td style="padding:14px;border-bottom:1px solid #f1f5f9;">
            <div style="font-weight:600;color:#1e293b;margin-bottom:4px;">{m.get('title','Scholarship')}</div>
            <div style="font-size:13px;color:#64748b;">
              📍 {m.get('country','')} &nbsp;·&nbsp; 🎓 {m.get('degree_level','')} &nbsp;·&nbsp; 💰 {m.get('amount','Varies')}
            </div>
            <div style="font-size:13px;color:#64748b;margin-top:2px;">⏳ Deadline: {m.get('deadline','Open')} &nbsp; {badge}</div>
            <a href="{m.get('detail_url','#')}" style="display:inline-block;margin-top:8px;font-size:13px;color:#4f46e5;font-weight:600;text-decoration:none;">View details →</a>
          </td>
        </tr>"""

    html = f"""
    <div style="font-family:sans-serif;max-width:620px;margin:auto;padding:28px;border:1px solid #e2e8f0;border-radius:12px;background:#ffffff;">
        <div style="text-align:center;margin-bottom:20px;">
            <h2 style="color:#1e3a8a;margin:0;">ScholarIQ</h2>
        </div>
        <div style="background:#eef2ff;border-left:4px solid #4f46e5;padding:16px;border-radius:8px;margin-bottom:20px;">
            <h3 style="color:#3730a3;margin:0;">✨ {len(matches)} new scholarship{'s' if len(matches) != 1 else ''} match your profile</h3>
        </div>
        <p style="color:#374151;">Hi <strong>{user_name or 'there'}</strong>,</p>
        <p style="color:#374151;">Based on your target country, degree and field of study, we found these new opportunities for you:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">{rows}</table>
        <div style="text-align:center;margin:24px 0;">
            <a href="https://scholarship.broadsolutiontech.com/dashboard" style="background:#4f46e5;color:#fff;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:bold;display:inline-block;">Open My Dashboard</a>
        </div>
        <p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;">
            You receive these because email notifications are ON. You can turn them off anytime in Settings.<br>
            <strong>The ScholarIQ Team</strong>
        </p>
    </div>
    """
    try:
        message = MessageSchema(
            subject=f"✨ {len(matches)} new scholarship match{'es' if len(matches) != 1 else ''} for you - ScholarIQ",
            recipients=[user_email],
            body=html,
            subtype=MessageType.html,
        )
        fm = FastMail(conf)
        await fm.send_message(message)
        print(f"[EmailService] New-matches digest sent to {user_email} ({len(matches)} items)")
        return {"message": "digest sent"}
    except Exception as e:
        print(f"[EmailService] Failed to send new-matches digest to {user_email}: {e}")
        return {"message": "Email failed", "error": str(e)}


async def send_scholarship_saved_email(user_email: str, user_name: str, scholarship_title: str, deadline: str, amount: str, country: str, apply_link: str | None):
    """
    Sends a confirmation email when a user saves a scholarship.
    Includes conditional CTA and safety checks.
    """
    cta_button = ""
    if apply_link and apply_link != "#" and apply_link.startswith("http"):
        cta_button = f"""
        <div style="margin-top: 25px; text-align: center;">
            <a href="{apply_link}" style="background-color: #6366f1; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Apply Now
            </a>
        </div>
        """

    html = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Scholarship Saved! 📌</h2>
        <p>Hi <strong>{user_name}</strong>,</p>
        <p>You've successfully saved <strong>{scholarship_title}</strong> to your ScholarIQ dashboard. Here are the key details:</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Country:</strong> {country}</p>
            <p style="margin: 5px 0;"><strong>Amount:</strong> {amount}</p>
            <p style="margin: 5px 0;"><strong>Deadline:</strong> {deadline}</p>
        </div>

        <p>Make sure to track your application progress in the dashboard.</p>
        
        {cta_button}
        
        <p style="margin-top: 30px; font-size: 13px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 20px;">
            Happy scholarship hunting!<br>
            <strong>The ScholarIQ Team</strong>
        </p>
    </div>
    """

    try:
        message = MessageSchema(
            subject=f"You saved: {scholarship_title}",
            recipients=[user_email],
            body=html,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)
        return {"message": "Save confirmation email sent"}
    except Exception as e:
        # Log error but don't crash background task
        print(f"[EmailService] Failed to send save confirmation to {user_email}: {e}")
        return {"message": "Email failed", "error": str(e)}

