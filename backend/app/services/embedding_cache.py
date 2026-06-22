"""
ScholarIQ — Scholarship Embedding Cache
========================================
Pre-computes scholarship embeddings ONCE at server startup (and on demand)
instead of re-embedding every chat request.

Why: encoding 500 scholarships per request with all-MiniLM-L6-v2 on CPU costs
~3-8 seconds. Pre-computing at startup makes query-time cost ~2ms (one query
embedding + a numpy dot product against the cached matrix).

Usage:
    from app.services import embedding_cache
    embedding_cache.warm_up()                 # call in FastAPI lifespan
    hits = embedding_cache.search(query, profile, top_k=6)   # per request
"""

import threading
from datetime import datetime, timezone
from typing import List, Optional, Any

import numpy as np

# Module-level cache (populated by warm_up)
_model = None
_embeddings: Optional[np.ndarray] = None   # shape (N, 384), L2-normalized
_scholarships: List[Any] = []              # parallel list of ORM rows (detached dicts)
_built_at: Optional[datetime] = None
_lock = threading.Lock()


def _get_model():
    """Lazy-load the sentence-transformer model exactly once."""
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
    return _model


def _scholarship_to_text(s: Any) -> str:
    """Rich text representation used for embedding a scholarship."""
    uni = getattr(s, "university_name", None) or (
        s.university.name if getattr(s, "university", None) else ""
    )
    field = getattr(s, "field_of_study", None) or "All fields"
    desc = (getattr(s, "description", None) or "")[:250]
    return (
        f"{s.title}. University: {uni}. Country: {getattr(s, 'country', '')}. "
        f"Degree: {getattr(s, 'degree_level', '')}. Field: {field}. {desc}"
    )


def _to_light_dict(s: Any) -> dict:
    """Detach the fields we need so we don't hold ORM/session references."""
    uni = getattr(s, "university_name", None) or (
        s.university.name if getattr(s, "university", None) else "Unknown University"
    )
    return {
        "id": s.id,
        "title": s.title,
        "university": uni,
        "country": getattr(s, "country", "") or "",
        "degree_level": getattr(s, "degree_level", "") or "",
        "amount": (getattr(s, "scholarship_amount_value", None)
                   or getattr(s, "amount", None)
                   or getattr(s, "funding_type", None) or "Varies"),
        "deadline": s.deadline.strftime("%d %b %Y") if getattr(s, "deadline", None) else "Open / Not specified",
        "min_cgpa": getattr(s, "min_cgpa", None),
        "min_ielts": getattr(s, "min_ielts", None),
    }


def warm_up(db_factory=None) -> int:
    """
    Build (or rebuild) the embedding cache. Safe to call again to refresh.
    Returns the number of scholarships embedded.
    """
    global _embeddings, _scholarships, _built_at

    from sqlalchemy import or_
    from app.db.models import Scholarship
    if db_factory is None:
        from app.db.session import SessionLocal
        db_factory = SessionLocal

    db = db_factory()
    try:
        today = datetime.now(timezone.utc).replace(tzinfo=None)
        rows = (
            db.query(Scholarship)
            .filter(
                Scholarship.is_active == True,
                Scholarship.approval_status == "approved",
                Scholarship.is_archived == False,
                Scholarship.is_suspicious == False,
                or_(Scholarship.deadline == None, Scholarship.deadline > today),
            )
            .all()
        )

        if not rows:
            with _lock:
                _embeddings = None
                _scholarships = []
                _built_at = datetime.now()
            print("[EmbeddingCache] No scholarships to embed.")
            return 0

        model = _get_model()
        texts = [_scholarship_to_text(s) for s in rows]
        vecs = model.encode(
            texts,
            normalize_embeddings=True,   # L2-normalized → dot product == cosine similarity
            batch_size=64,
            show_progress_bar=False,
        )
        light = [_to_light_dict(s) for s in rows]

        with _lock:
            _embeddings = np.asarray(vecs, dtype=np.float32)
            _scholarships = light
            _built_at = datetime.now()

        print(f"[EmbeddingCache] Embedded {len(rows)} scholarships at {_built_at:%H:%M:%S}")
        return len(rows)

    except ImportError:
        print("[EmbeddingCache] sentence-transformers not installed — cache disabled.")
        return 0
    except Exception as e:
        print(f"[EmbeddingCache] warm_up failed: {e}")
        return 0
    finally:
        db.close()


def is_ready() -> bool:
    return _embeddings is not None and len(_scholarships) > 0


def search(user_query: str, user_profile: Optional[dict] = None, top_k: int = 6) -> List[dict]:
    """
    Cosine-similarity search against the cached matrix.
    Query-time cost: one query embedding + one numpy dot product (~2ms).
    Returns light dicts of the top-k scholarships, or [] if cache cold.
    """
    if not is_ready():
        return []

    # Enrich query with profile so country/degree intent influences ranking
    parts = [user_query]
    if user_profile:
        for key in ("target_country", "target_degree", "major"):
            if user_profile.get(key):
                parts.append(str(user_profile[key]))
    enriched = " ".join(parts)

    try:
        model = _get_model()
        q = model.encode(enriched, normalize_embeddings=True)
        q = np.asarray(q, dtype=np.float32)

        with _lock:
            mat = _embeddings
            cache = _scholarships
        if mat is None or not cache:
            return []
        # Both sides normalized → dot product == cosine similarity
        sims = mat @ q
        k = min(top_k, len(cache))
        top_idx = np.argpartition(sims, -k)[-k:]
        top_idx = top_idx[np.argsort(sims[top_idx])[::-1]]
        return [cache[i] for i in top_idx]
    except Exception as e:
        print(f"[EmbeddingCache] search failed: {e}")
        return []
