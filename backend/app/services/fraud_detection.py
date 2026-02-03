import re

def analyze_fraud_risk(title: str, description: str):
    """
    Scholarship ke content ko scan karta hai aur 'Risk Score' return karta hai.
    Agar return True hai, to scholarship FRAUD/SUSPICIOUS hai.
    """
    
    # 1. Words jo scam scholarships mein common hote hain
    suspicious_keywords = [
        "processing fee",      # Paisay mangna
        "application fee",     # Fee mangna
        "bank account",        # Bank details mangna
        "credit card",         # Card details
        "western union",       # Unsafe transfer
        "moneygram",           # Unsafe transfer
        "guaranteed winner",   # Jhoota waada
        "no essay",            # Too good to be true
        "login credentials",   # Phishing
        "pay to apply"         # Direct scam
    ]

    # 2. Text ko lowercase mein convert karein taake matching aasaan ho
    full_text = f"{title or ''} {description or ''}".lower()
    
    found_flags = []

    # 3. Check karein ke koi ghalat lafz to nahi hai?
    for keyword in suspicious_keywords:
        if keyword in full_text:
            found_flags.append(keyword)

    # 4. Result Return karein
    if found_flags:
        return {
            "is_suspicious": True,
            "reason": f"System detected high-risk keywords: {', '.join(found_flags)}",
            "risk_level": "HIGH"
        }
    else:
        return {
            "is_suspicious": False,
            "reason": "No suspicious keywords found.",
            "risk_level": "SAFE"
        }
