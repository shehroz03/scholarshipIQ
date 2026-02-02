from sqlalchemy.orm import Session
from app.db import models

def log_interaction(db: Session, user_id: int, scholarship_id: int, interaction_type: str) -> None:
    """
    Logs user interactions (view, save, apply) for future ML training.
    """
    interaction = models.UserScholarshipInteraction(
        user_id=user_id,
        scholarship_id=scholarship_id,
        interaction_type=interaction_type
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
