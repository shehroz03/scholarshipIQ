import re
from typing import List, Tuple
from urllib.parse import urlparse

class FraudGate:
    # High-risk keywords
    SCAM_KEYWORDS = [
        r"instant (cash|money|award)",
        r"registration fee",
        r"processing fee",
        r"guaranteed (winner|selection)",
        r"bank (details|account)",
        r"winning number"
    ]

    # Trusted domains (Whitelist)
    TRUSTED_DOMAINS = [
        "ox.ac.uk", "cam.ac.uk", "ucl.ac.uk", "imperial.ac.uk",
        "ed.ac.uk", "kcl.ac.uk", "manchester.ac.uk", "lse.ac.uk"
    ]

    @staticmethod
    def calculate_risk(title: str, description: str, url: str) -> Tuple[float, str, List[str]]:
        """
        Calculates a fraud risk score (0.0 to 1.0) and returns level and reasons.
        """
        score = 0.0
        reasons = []
        
        # 1. Domain Check
        domain = ""
        if url:
            try:
                domain = urlparse(url).netloc.lower().replace('www.', '')
            except:
                pass
        
        is_trusted = any(domain.endswith(td) for td in FraudGate.TRUSTED_DOMAINS)
        
        # 2. Keyword Check
        content = (title + " " + (description or "")).lower()
        for pattern in FraudGate.SCAM_KEYWORDS:
            if re.search(pattern, content):
                score += 0.4
                reasons.append(f"Scam keyword detected: {pattern}")

        # 3. Security Check (Non-HTTPS)
        if url and not url.startswith("https"):
            score += 0.2
            reasons.append("Insecure connection (HTTP)")

        # 4. Domain Trust Offset
        if is_trusted:
            score -= 0.5 # Substantial safety boost for official domains
        elif domain and not domain.endswith((".ac.uk", ".edu", ".gov")):
            score += 0.2
            reasons.append("Non-institutional domain")

        # Normalize score
        score = max(0.0, min(1.0, score))
        
        # Determine Level
        level = "SAFE"
        if score >= 0.9:
            level = "CRITICAL"
        elif score >= 0.7:
            level = "HIGH"
        elif score >= 0.4:
            level = "MEDIUM"
            
        # Hard Rejection: Missing URL
        if not url:
            score = 1.0
            level = "CRITICAL"
            reasons.append("Missing official application URL")

        return round(score, 2), level, reasons
