from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import models, schemas
from app.db.session import get_db

router = APIRouter()

@router.post("/", response_model=schemas.SubscriptionOut)
def create_subscription(
    subscription: schemas.SubscriptionCreate,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    db_subscription = db.query(models.NewsletterSubscription).filter(models.NewsletterSubscription.email == subscription.email).first()
    if db_subscription:
        if db_subscription.is_active:
            raise HTTPException(status_code=400, detail="Email already subscribed")
        else:
            # Re-activate
            db_subscription.is_active = True
            db.commit()
            db.refresh(db_subscription)
            return db_subscription
    
    new_subscription = models.NewsletterSubscription(email=subscription.email)
    db.add(new_subscription)
    db.commit()
    db.refresh(new_subscription)
    return new_subscription

@router.delete("/{email}")
def unsubscribe(
    email: str,
    db: Session = Depends(get_db)
):
    db_subscription = db.query(models.NewsletterSubscription).filter(models.NewsletterSubscription.email == email).first()
    if not db_subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    db_subscription.is_active = False
    db.commit()
    return {"message": "Successfully unsubscribed"}
