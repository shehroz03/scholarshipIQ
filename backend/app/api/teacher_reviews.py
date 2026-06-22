"""
Teacher Reviews API
Student ratings and reviews for teachers with admin moderation
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.db import models
from app.api.deps import get_current_user, require_admin, require_student, require_teacher

router = APIRouter(prefix="/teacher-reviews", tags=["Teacher Reviews"])


@router.post("/{teacher_id}")
def submit_review(
    teacher_id: int,
    rating: int,
    review_text: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student)
):
    """Student submits a review for a teacher (1-5 stars)"""
    
    if not 1 <= rating <= 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    # Check if teacher exists
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Check if student already reviewed this teacher
    existing = db.query(models.TeacherReview).filter(
        models.TeacherReview.teacher_id == teacher_id,
        models.TeacherReview.student_id == current_user.id
    ).first()
    
    if existing:
        # Update existing review
        existing.rating = rating
        existing.review_text = review_text
        existing.updated_at = datetime.utcnow()
        existing.is_visible = True
        db.commit()
        return {"message": "Review updated successfully", "review_id": existing.id}
    
    # Create new review
    review = models.TeacherReview(
        teacher_id=teacher_id,
        student_id=current_user.id,
        rating=rating,
        review_text=review_text
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    return {"message": "Review submitted successfully", "review_id": review.id}


@router.get("/{teacher_id}")
def get_teacher_reviews(
    teacher_id: int,
    db: Session = Depends(get_db),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=50)
):
    """Get all visible reviews for a teacher with statistics"""
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get statistics
    stats = db.query(
        func.avg(models.TeacherReview.rating).label("average_rating"),
        func.count(models.TeacherReview.id).label("total_reviews")
    ).filter(
        models.TeacherReview.teacher_id == teacher_id,
        models.TeacherReview.is_visible == True,
        models.TeacherReview.is_removed_by_admin == False
    ).first()
    
    # Get rating distribution
    distribution = db.query(
        models.TeacherReview.rating,
        func.count(models.TeacherReview.id).label("count")
    ).filter(
        models.TeacherReview.teacher_id == teacher_id,
        models.TeacherReview.is_visible == True,
        models.TeacherReview.is_removed_by_admin == False
    ).group_by(models.TeacherReview.rating).all()
    
    dist_dict = {i: 0 for i in range(1, 6)}
    for d in distribution:
        dist_dict[d.rating] = d.count
    
    # Get paginated reviews
    reviews = db.query(models.TeacherReview).filter(
        models.TeacherReview.teacher_id == teacher_id,
        models.TeacherReview.is_visible == True,
        models.TeacherReview.is_removed_by_admin == False
    ).order_by(models.TeacherReview.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
    
    return {
        "teacher_id": teacher_id,
        "average_rating": round(stats.average_rating, 2) if stats.average_rating else 0,
        "total_reviews": stats.total_reviews or 0,
        "rating_distribution": dist_dict,
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "review_text": r.review_text,
                "student_name": r.student.full_name if r.student else "Anonymous",
                "student_profile_picture": r.student.profile_picture_url if r.student else None,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "updated_at": r.updated_at.isoformat() if r.updated_at else None
            }
            for r in reviews
        ]
    }


@router.get("/student/my-reviews")
def get_my_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_student)
):
    """Get all reviews submitted by current student"""
    
    reviews = db.query(models.TeacherReview).filter(
        models.TeacherReview.student_id == current_user.id
    ).order_by(models.TeacherReview.created_at.desc()).all()
    
    return {
        "reviews": [
            {
                "id": r.id,
                "teacher_id": r.teacher_id,
                "teacher_name": r.teacher.user.full_name if r.teacher and r.teacher.user else "Unknown",
                "rating": r.rating,
                "review_text": r.review_text,
                "created_at": r.created_at.isoformat() if r.created_at else None,
                "is_visible": r.is_visible,
                "is_reported": r.is_reported
            }
            for r in reviews
        ]
    }


@router.post("/report/{review_id}")
def report_review(
    review_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    """Teacher reports a review (only teachers can report)"""
    
    # Get teacher profile
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    # Get review
    review = db.query(models.TeacherReview).filter(models.TeacherReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    # Check if review belongs to this teacher
    if review.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="You can only report reviews on your profile")
    
    review.is_reported = True
    review.report_reason = reason
    review.reported_at = datetime.utcnow()
    review.reported_by_teacher_id = teacher.id
    db.commit()
    
    return {"message": "Review reported successfully. Admin will review it."}


@router.get("/teacher/reported")
def get_my_reported_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_teacher)
):
    """Teacher gets their reported reviews status"""
    
    teacher = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == current_user.id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher profile not found")
    
    reviews = db.query(models.TeacherReview).filter(
        models.TeacherReview.reported_by_teacher_id == teacher.id
    ).order_by(models.TeacherReview.reported_at.desc()).all()
    
    return {
        "reviews": [
            {
                "id": r.id,
                "rating": r.rating,
                "review_text": r.review_text,
                "report_reason": r.report_reason,
                "reported_at": r.reported_at.isoformat() if r.reported_at else None,
                "admin_review_status": r.admin_review_status,
                "admin_notes": r.admin_notes,
                "is_removed": r.is_removed_by_admin,
                "student_name": r.student.full_name if r.student else "Anonymous"
            }
            for r in reviews
        ]
    }


# ==================== ADMIN ENDPOINTS ====================

@router.get("/admin/reported")
def get_all_reported_reviews(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Admin gets all reported reviews"""
    reviews = db.query(models.TeacherReview).filter(
        models.TeacherReview.is_reported == True
    ).order_by(models.TeacherReview.reported_at.desc()).all()
    
    return {
        "reviews": [
            {
                "id": r.id,
                "teacher_id": r.teacher_id,
                "teacher_name": r.teacher.user.full_name if r.teacher and r.teacher.user else "Unknown",
                "student_id": r.student_id,
                "student_name": r.student.full_name if r.student else "Anonymous",
                "rating": r.rating,
                "review_text": r.review_text,
                "report_reason": r.report_reason,
                "reported_at": r.reported_at.isoformat() if r.reported_at else None,
                "admin_review_status": r.admin_review_status,
                "admin_notes": r.admin_notes,
                "is_visible": r.is_visible,
                "is_removed": r.is_removed_by_admin
            }
            for r in reviews
        ]
    }


@router.post("/admin/remove/{review_id}")
def admin_remove_review(
    review_id: int,
    reason: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Admin removes a reported review"""
    review = db.query(models.TeacherReview).filter(models.TeacherReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_visible = False
    review.is_removed_by_admin = True
    review.removal_reason = reason
    review.removed_at = datetime.utcnow()
    review.removed_by_admin_id = current_user.id
    review.admin_review_status = "reviewed"
    db.commit()
    
    return {"message": "Review removed successfully"}


@router.post("/admin/dismiss/{review_id}")
def admin_dismiss_report(
    review_id: int,
    notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin)
):
    """Admin dismisses a report (review stays visible)"""
    review = db.query(models.TeacherReview).filter(models.TeacherReview.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.is_reported = False
    review.admin_review_status = "dismissed"
    review.admin_notes = notes
    review.admin_reviewed_at = datetime.utcnow()
    review.admin_reviewed_by = current_user.id
    db.commit()
    
    return {"message": "Report dismissed successfully"}


@router.get("/admin/all-reviews")
def get_all_reviews_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100)
):
    """Admin gets all reviews with filters"""
    reviews = db.query(models.TeacherReview).order_by(
        models.TeacherReview.created_at.desc()
    ).offset((page - 1) * per_page).limit(per_page).all()
    
    total = db.query(models.TeacherReview).count()
    
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "reviews": [
            {
                "id": r.id,
                "teacher_id": r.teacher_id,
                "teacher_name": r.teacher.user.full_name if r.teacher and r.teacher.user else "Unknown",
                "student_name": r.student.full_name if r.student else "Anonymous",
                "rating": r.rating,
                "review_text": r.review_text,
                "is_visible": r.is_visible,
                "is_reported": r.is_reported,
                "is_removed": r.is_removed_by_admin,
                "created_at": r.created_at.isoformat() if r.created_at else None
            }
            for r in reviews
        ]
    }
