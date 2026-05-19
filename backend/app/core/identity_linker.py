import re
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import University

class IdentityLinker:
    ALIAS_MAP = {
        "ucl": "university college london",
        "kcl": "kings college london",
        "lse": "london school of economics and political science",
        "soas": "soas university of london",
        "ual": "university of the arts london",
        "oxford": "university of oxford",
        "cambridge": "university of cambridge"
    }

    @staticmethod
    def normalize(name: str) -> str:
        if not name: return ""
        name = str(name).lower().strip()
        name = re.sub(r'[^\w\s]', ' ', name)
        name = re.sub(r'\s+', ' ', name).strip()
        if name.startswith("the "): name = name[4:]
        return name

    @staticmethod
    def resolve_university_id(db: Session, raw_name: str, url: str) -> Optional[int]:
        """
        Attempts to find a university_id in the DB using domain or name.
        """
        norm_name = IdentityLinker.normalize(raw_name)
        
        # 1. Domain Match
        if url:
            domain = ""
            try:
                from urllib.parse import urlparse
                domain = urlparse(url).netloc.lower().replace('www.', '')
                if domain:
                    # Look for university with matching website domain
                    # (Simple check: if website_url contains the domain)
                    uni = db.query(University).filter(University.website_url.contains(domain)).first()
                    if uni: return uni.id
            except:
                pass

        # 2. Exact Normalized Name Match
        uni = db.query(University).filter(University.name.ilike(raw_name)).first()
        if uni: return uni.id
        
        # 3. Alias Match
        expansion = IdentityLinker.ALIAS_MAP.get(norm_name)
        if expansion:
            uni = db.query(University).filter(University.name.ilike(expansion)).first()
            if uni: return uni.id
            
        return None
