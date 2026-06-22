"""
Teacher Dashboard API
Endpoints for teacher registration, course/lesson/quiz/live-class management.
"""
import json
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Body, File, UploadFile
from fastapi.responses import JSONResponse
import os
import uuid
import shutil
from pathlib import Path
from pydantic import BaseModel as PydanticBaseModel
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.session import get_db
from app.db import models
from app.api.deps import get_current_user

router = APIRouter(prefix="/teacher", tags=["Teacher"])


def get_teacher(db: Session, user_id: int) -> models.TeacherProfile:
    t = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == user_id).first()
    if not t:
        raise HTTPException(status_code=403, detail="Not a registered teacher. Register first.")
    return t


# ── REGISTRATION ──────────────────────────────

@router.post("/register")
def register_teacher(
    bio: str = Body(""),
    specializations: str = Body("IELTS"),
    experience_years: int = Body(1),
    qualification: str = Body(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    existing = db.query(models.TeacherProfile).filter(models.TeacherProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(400, "Already registered as teacher")
    teacher = models.TeacherProfile(
        user_id=current_user.id,
        bio=bio,
        specializations=specializations,
        experience_years=experience_years,
        qualification=qualification,
    )
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    return {"message": "Teacher registered!", "teacher_id": teacher.id}


@router.get("/profile")
def get_teacher_profile(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    courses_count = db.query(models.Course).filter(models.Course.teacher_id == teacher.id).count()
    total_students = db.query(models.Enrollment).join(models.Course).filter(models.Course.teacher_id == teacher.id).count()
    return {
        "id": teacher.id,
        "user_id": teacher.user_id,
        "name": current_user.full_name,
        "email": current_user.email,
        "bio": teacher.bio,
        "specializations": teacher.specializations.split(",") if teacher.specializations else [],
        "experience_years": teacher.experience_years,
        "qualification": teacher.qualification,
        "degree": teacher.degree,
        "institution": teacher.institution,
        "cv_url": teacher.cv_url,
        "is_verified": teacher.is_verified,
        "courses_count": courses_count,
        "total_students": total_students,
        "profile_picture_url": teacher.profile_picture_url,
    }


@router.put("/profile")
def update_teacher_profile(
    name: Optional[str] = Body(None),
    bio: Optional[str] = Body(None),
    specializations: Optional[str] = Body(None),
    experience_years: Optional[int] = Body(None),
    qualification: Optional[str] = Body(None),
    degree: Optional[str] = Body(None),
    institution: Optional[str] = Body(None),
    cv_url: Optional[str] = Body(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    if bio is not None: teacher.bio = bio
    if specializations is not None: teacher.specializations = specializations
    if experience_years is not None: teacher.experience_years = experience_years
    if qualification is not None: teacher.qualification = qualification
    if degree is not None: teacher.degree = degree
    if institution is not None: teacher.institution = institution
    if cv_url is not None: teacher.cv_url = cv_url
    
    if name is not None:
        current_user.full_name = name

    db.commit()
    return {"message": "Profile updated"}


@router.post("/profile/picture")
def upload_profile_picture(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload teacher profile picture"""
    teacher = get_teacher(db, current_user.id)
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/jpg", "image/webp"]
    if file.content_type not in allowed_types:
        raise HTTPException(400, "Only image files (JPEG, PNG, WebP) are allowed")
    
    # Create uploads directory if not exists
    uploads_dir = Path("uploads/profile_pictures")
    uploads_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate unique filename
    ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"teacher_{teacher.id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = uploads_dir / filename
    
    # Save file efficiently
    if file.size is not None and file.size > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(400, "File size too large. Max 5MB allowed.")
    
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Update teacher profile with new picture URL
    file_url = f"/uploads/profile_pictures/{filename}"
    teacher.profile_picture_url = file_url
    db.commit()
    
    return {"message": "Profile picture uploaded successfully", "profile_picture_url": file_url}


@router.delete("/profile/picture")
def remove_profile_picture(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove teacher profile picture"""
    teacher = get_teacher(db, current_user.id)
    
    if teacher.profile_picture_url:
        # Delete file if exists
        old_file = Path(".") / teacher.profile_picture_url.lstrip("/")
        if old_file.exists():
            old_file.unlink()
        
        teacher.profile_picture_url = None
        db.commit()
    
    return {"message": "Profile picture removed"}


# ── COURSES ────────────────────────────────────

@router.post("/courses")
def create_course(
    title: str = Body(...),
    subject: str = Body(""),
    description: str = Body(""),
    test_type: str = Body("IELTS"),
    level: str = Body("Beginner"),
    price: float = Body(0),
    thumbnail_url: str = Body(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    course = models.Course(
        teacher_id=teacher.id,
        title=title,
        subject=subject or None,
        description=description,
        test_type=test_type,
        level=level,
        price=price,
        thumbnail_url=thumbnail_url or None,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return {"message": "Course created!", "course_id": course.id}


@router.get("/courses")
def list_my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    
    courses = db.query(models.Course).options(
        joinedload(models.Course.lessons),
        joinedload(models.Course.quizzes).joinedload(models.Quiz.questions),
        joinedload(models.Course.live_classes),
        joinedload(models.Course.meeting_links)
    ).filter(models.Course.teacher_id == teacher.id).all()
    
    enrollment_counts = dict(
        db.query(models.Enrollment.course_id, func.count(models.Enrollment.id))
        .join(models.Course)
        .filter(models.Course.teacher_id == teacher.id)
        .group_by(models.Enrollment.course_id).all()
    )
    
    result = []
    for c in courses:
        enrolled = enrollment_counts.get(c.id, 0)
        meeting_links = [
            {
                "id": ml.id,
                "date": ml.date.isoformat(),
                "time": ml.time,
                "link": ml.link,
                "platform": ml.platform,
                "description": ml.description
            }
            for ml in c.meeting_links
        ]
        quizzes = [
            {
                "id": q.id,
                "title": q.title,
                "section": q.section,
                "scheduled_at": q.scheduled_at.isoformat() if q.scheduled_at else None,
                "time_limit_minutes": q.time_limit_minutes,
                "pass_score": q.pass_score,
                "question_count": len(q.questions),
            }
            for q in c.quizzes
        ]
        live_classes = [
            {
                "id": lc.id,
                "title": lc.title,
                "scheduled_at": lc.scheduled_at.isoformat() if lc.scheduled_at else None,
                "platform": lc.platform,
                "meet_link": lc.meet_link,
                "duration_minutes": lc.duration_minutes,
                "is_cancelled": lc.is_cancelled
            }
            for lc in c.live_classes
            if not lc.is_cancelled  # Only show active classes
        ]
        lessons = [
            {
                "id": l.id,
                "title": l.title,
                "duration_minutes": l.duration_minutes,
                "is_free_preview": l.is_free_preview,
                "video_url": l.video_url,
                "order": l.order
            }
            for l in c.lessons
        ]
        result.append({
            "id": c.id, "title": c.title, "subject": c.subject, "test_type": c.test_type, "level": c.level,
            "price": c.price, "is_published": c.is_published,
            "total_lessons": len(c.lessons), "total_quizzes": len(c.quizzes),
            "total_live_classes": len(live_classes),
            "lessons": lessons,
            "live_classes": live_classes,
            "meeting_links": meeting_links,
            "quizzes": quizzes,
            "enrolled_students": enrolled,
            "created_at": c.created_at.isoformat()
        })
    return result


@router.put("/courses/{course_id}")
def update_course(
    course_id: int,
    title: Optional[str] = Body(None),
    description: Optional[str] = Body(None),
    level: Optional[str] = Body(None),
    price: Optional[float] = Body(None),
    is_published: Optional[bool] = Body(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    if title is not None: course.title = title
    if description is not None: course.description = description
    if level is not None: course.level = level
    if price is not None: course.price = price
    if is_published is not None: course.is_published = is_published
    db.commit()
    return {"message": "Course updated"}


@router.delete("/courses/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}


# ── LESSONS ────────────────────────────────────

@router.post("/courses/{course_id}/lessons")
def add_lesson(
    course_id: int,
    title: str = Body(...),
    content: str = Body(""),
    video_url: str = Body(""),
    duration_minutes: int = Body(0),
    is_free_preview: bool = Body(False),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    order = db.query(models.Lesson).filter(models.Lesson.course_id == course_id).count()
    lesson = models.Lesson(
        course_id=course_id, title=title, content=content,
        video_url=video_url or None, duration_minutes=duration_minutes,
        order=order, is_free_preview=is_free_preview
    )
    db.add(lesson)
    db.commit()
    db.refresh(lesson)
    return {"message": "Lesson added!", "lesson_id": lesson.id}


@router.put("/lessons/{lesson_id}")
def update_lesson(
    lesson_id: int,
    title: Optional[str] = Body(None),
    content: Optional[str] = Body(None),
    video_url: Optional[str] = Body(None),
    duration_minutes: Optional[int] = Body(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    lesson = db.query(models.Lesson).join(models.Course).filter(
        models.Lesson.id == lesson_id, models.Course.teacher_id == teacher.id
    ).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    if title is not None: lesson.title = title
    if content is not None: lesson.content = content
    if video_url is not None: lesson.video_url = video_url
    if duration_minutes is not None: lesson.duration_minutes = duration_minutes
    db.commit()
    return {"message": "Lesson updated"}


@router.delete("/lessons/{lesson_id}")
def delete_lesson(lesson_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    lesson = db.query(models.Lesson).join(models.Course).filter(
        models.Lesson.id == lesson_id, models.Course.teacher_id == teacher.id
    ).first()
    if not lesson:
        raise HTTPException(404, "Lesson not found")
    db.delete(lesson)
    db.commit()
    return {"message": "Lesson deleted"}


# ── QUIZZES ────────────────────────────────────

@router.post("/courses/{course_id}/quizzes")
def create_quiz(
    course_id: int,
    title: str = Body(...),
    description: str = Body(""),
    section: str = Body("General"),
    time_limit_minutes: int = Body(30),
    pass_score: int = Body(60),
    scheduled_at: str = Body(None),  # ISO datetime string
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")

    scheduled_dt = None
    if scheduled_at:
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_at)
        except Exception:
            raise HTTPException(400, "Invalid scheduled_at format. Use ISO format: 2026-06-01T10:00:00")

    quiz = models.Quiz(
        course_id=course_id, title=title, description=description,
        test_type=course.test_type, section=section,
        time_limit_minutes=time_limit_minutes, pass_score=pass_score,
        scheduled_at=scheduled_dt
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return {"message": "Quiz created!", "quiz_id": quiz.id}


@router.post("/quizzes/{quiz_id}/questions")
def add_question(
    quiz_id: int,
    question: str = Body(...),
    options: list = Body(...),
    correct_answer: str = Body(...),
    explanation: str = Body(""),
    difficulty: str = Body("Medium"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    quiz = db.query(models.Quiz).join(models.Course).filter(
        models.Quiz.id == quiz_id, models.Course.teacher_id == teacher.id
    ).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    order = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).count()
    q = models.QuizQuestion(
        quiz_id=quiz_id, question=question,
        options=json.dumps(options), correct_answer=correct_answer,
        explanation=explanation, difficulty=difficulty, order=order
    )
    db.add(q)
    db.commit()
    db.refresh(q)
    return {"message": "Question added!", "question_id": q.id}


@router.delete("/questions/{question_id}")
def delete_question(question_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    q = db.query(models.QuizQuestion).join(models.Quiz).join(models.Course).filter(
        models.QuizQuestion.id == question_id, models.Course.teacher_id == teacher.id
    ).first()
    if not q:
        raise HTTPException(404, "Question not found")
    db.delete(q)
    db.commit()
    return {"message": "Question deleted"}


@router.delete("/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Delete a quiz and all its questions/attempts."""
    teacher = get_teacher(db, current_user.id)
    quiz = db.query(models.Quiz).join(models.Course).filter(
        models.Quiz.id == quiz_id, models.Course.teacher_id == teacher.id
    ).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    # Delete related attempts first
    db.query(models.QuizAttempt).filter(models.QuizAttempt.quiz_id == quiz_id).delete()
    # Delete related questions
    db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).delete()
    # Delete the quiz
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted"}


# ── LIVE CLASSES ───────────────────────────────

@router.post("/courses/{course_id}/live-classes")
def schedule_live_class(
    course_id: int,
    title: str = Body(...),
    description: str = Body(""),
    meet_link: str = Body(...),
    platform: str = Body("Google Meet"),
    scheduled_at: str = Body(...),
    duration_minutes: int = Body(60),
    max_students: int = Body(30),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    try:
        scheduled_dt = datetime.fromisoformat(scheduled_at)
    except Exception:
        raise HTTPException(400, "Invalid date format. Use ISO format: 2026-06-01T10:00:00")
    lc = models.LiveClass(
        course_id=course_id, title=title, description=description,
        meet_link=meet_link, platform=platform,
        scheduled_at=scheduled_dt, duration_minutes=duration_minutes,
        max_students=max_students
    )
    db.add(lc)
    db.commit()
    db.refresh(lc)
    return {"message": "Live class scheduled!", "live_class_id": lc.id}


@router.delete("/live-classes/{lc_id}")
def cancel_live_class(lc_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    lc = db.query(models.LiveClass).join(models.Course).filter(
        models.LiveClass.id == lc_id, models.Course.teacher_id == teacher.id
    ).first()
    if not lc:
        raise HTTPException(404, "Live class not found")
    lc.is_cancelled = True
    db.commit()
    return {"message": "Live class cancelled"}


# ── DAILY MEETING LINKS ────────────────────────

@router.post("/courses/{course_id}/meeting-links")
def add_meeting_link(
    course_id: int,
    date: str = Body(...),
    time: str = Body(""),
    link: str = Body(...),
    platform: str = Body("Google Meet"),
    description: str = Body(""),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a daily meeting link for enrolled students (paid only)."""
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    try:
        meeting_date = datetime.fromisoformat(date)
    except Exception:
        raise HTTPException(400, "Invalid date format. Use YYYY-MM-DD")

    ml = models.MeetingLink(
        course_id=course_id,
        date=meeting_date,
        time=time,
        link=link,
        platform=platform,
        description=description
    )
    db.add(ml)
    db.commit()
    db.refresh(ml)
    return {"message": "Meeting link added!", "link_id": ml.id}


@router.get("/courses/{course_id}/meeting-links")
def list_meeting_links(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """List all meeting links for a course (teacher view)."""
    teacher = get_teacher(db, current_user.id)
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.teacher_id == teacher.id).first()
    if not course:
        raise HTTPException(404, "Course not found")
    links = db.query(models.MeetingLink).filter(models.MeetingLink.course_id == course_id).order_by(models.MeetingLink.date.desc()).all()
    return [
        {
            "id": l.id,
            "date": l.date.isoformat(),
            "time": l.time,
            "link": l.link,
            "platform": l.platform,
            "description": l.description,
            "created_at": l.created_at.isoformat()
        }
        for l in links
    ]


@router.delete("/meeting-links/{link_id}")
def delete_meeting_link(link_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Delete a meeting link."""
    teacher = get_teacher(db, current_user.id)
    ml = db.query(models.MeetingLink).join(models.Course).filter(
        models.MeetingLink.id == link_id, models.Course.teacher_id == teacher.id
    ).first()
    if not ml:
        raise HTTPException(404, "Meeting link not found")
    db.delete(ml)
    db.commit()
    return {"message": "Meeting link deleted"}


# ── QUIZ DETAIL (teacher) ──────────────────────

@router.get("/quizzes/{quiz_id}")
def get_quiz_for_teacher(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    quiz = db.query(models.Quiz).join(models.Course).filter(
        models.Quiz.id == quiz_id, models.Course.teacher_id == teacher.id
    ).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    questions = [
        {
            "id": q.id,
            "question": q.question,
            "options": json.loads(q.options),
            "correct_answer": q.correct_answer,
            "explanation": q.explanation,
            "difficulty": q.difficulty,
            "order": q.order,
        }
        for q in quiz.questions
    ]
    return {
        "id": quiz.id,
        "title": quiz.title,
        "section": quiz.section,
        "scheduled_at": quiz.scheduled_at.isoformat() if quiz.scheduled_at else None,
        "time_limit_minutes": quiz.time_limit_minutes,
        "pass_score": quiz.pass_score,
        "questions": questions,
    }


# ── STUDENT MANAGEMENT ─────────────────────────

@router.get("/students")
def get_my_students(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    enrollments = db.query(models.Enrollment).join(models.Course).filter(
        models.Course.teacher_id == teacher.id
    ).all()
    result = []
    for e in enrollments:
        attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == e.user_id).count()
        avg_score = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == e.user_id).all()
        avg = round(sum(a.score for a in avg_score) / len(avg_score), 1) if avg_score else 0
        result.append({
            "enrollment_id": e.id,
            "student_name": e.user.full_name or e.user.email,
            "student_email": e.user.email,
            "course_id": e.course_id,
            "course_title": e.course.title,
            "course_price": e.course.price,
            "test_type": e.course.test_type,
            "progress": e.progress_percent,
            "enrolled_at": e.enrolled_at.isoformat(),
            "quiz_attempts": attempts,
            "avg_score": avg,
            "payment_status": e.payment_status,
            "payment_method": e.payment_method,
            "payment_reference": e.payment_reference,
            "amount_paid": e.amount_paid,
        })
    return result


@router.get("/payments/pending")
def get_pending_payments(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    enrollments = db.query(models.Enrollment).join(models.Course).filter(
        models.Course.teacher_id == teacher.id,
        models.Enrollment.payment_status.in_(["pending", "submitted"]),
        models.Course.price > 0,
    ).all()
    return [
        {
            "enrollment_id": e.id,
            "student_name": e.user.full_name or e.user.email,
            "student_email": e.user.email,
            "course_title": e.course.title,
            "test_type": e.course.test_type,
            "course_price": e.course.price,
            "payment_status": e.payment_status,
            "payment_method": e.payment_method,
            "payment_reference": e.payment_reference,
            "amount_paid": e.amount_paid,
            "enrolled_at": e.enrolled_at.isoformat(),
        }
        for e in enrollments
    ]





@router.post("/enrollments/{enrollment_id}/approve-payment")
def approve_payment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Teacher approves a student's submitted payment - grants access."""
    teacher = get_teacher(db, current_user.id)
    if not teacher:
        raise HTTPException(403, "Not a teacher")

    enrollment = db.query(models.Enrollment).filter(models.Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")

    # Verify this enrollment is for one of this teacher's courses
    course = db.query(models.Course).filter(
        models.Course.id == enrollment.course_id,
        models.Course.teacher_id == teacher.id
    ).first()
    if not course:
        raise HTTPException(403, "This enrollment is not for your course")

    if enrollment.payment_status != "submitted":
        raise HTTPException(400, "Payment must be submitted before approval")

    # Approve payment
    enrollment.payment_status = "paid"
    enrollment.paid_at = datetime.now()
    db.commit()

    return {
        "message": "Payment approved! Student now has full access to the course.",
        "enrollment_id": enrollment.id,
        "payment_status": "paid",
        "course_title": course.title,
    }


@router.post("/enrollments/{enrollment_id}/reject-payment")
def reject_payment(
    enrollment_id: int,
    reason: str = Body("Payment could not be verified"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    teacher = get_teacher(db, current_user.id)
    enrollment = db.query(models.Enrollment).join(models.Course).filter(
        models.Enrollment.id == enrollment_id,
        models.Course.teacher_id == teacher.id,
    ).first()
    if not enrollment:
        raise HTTPException(404, "Enrollment not found")
    enrollment.payment_status = "rejected"
    db.commit()
    return {"message": reason, "payment_status": "rejected"}


@router.get("/analytics")
def get_teacher_analytics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    teacher = get_teacher(db, current_user.id)
    courses = db.query(models.Course).filter(models.Course.teacher_id == teacher.id).all()
    course_ids = [c.id for c in courses]
    total_students = db.query(models.Enrollment).filter(models.Enrollment.course_id.in_(course_ids)).count()
    total_quizzes = db.query(models.Quiz).filter(models.Quiz.course_id.in_(course_ids)).count()
    total_lessons = db.query(models.Lesson).filter(models.Lesson.course_id.in_(course_ids)).count()
    all_attempts = db.query(models.QuizAttempt).join(models.Quiz).filter(models.Quiz.course_id.in_(course_ids)).all()
    avg_score = round(sum(a.score for a in all_attempts) / len(all_attempts), 1) if all_attempts else 0
    pass_rate = round(sum(1 for a in all_attempts if a.passed) / len(all_attempts) * 100, 1) if all_attempts else 0
    pending_payments = db.query(models.Enrollment).join(models.Course).filter(
        models.Course.teacher_id == teacher.id,
        models.Enrollment.payment_status.in_(["pending", "submitted"]),
        models.Course.price > 0,
    ).count()
    paid_students = db.query(models.Enrollment).join(models.Course).filter(
        models.Course.teacher_id == teacher.id,
        models.Enrollment.payment_status == "paid",
    ).count()
    return {
        "total_courses": len(courses),
        "total_students": total_students,
        "total_lessons": total_lessons,
        "total_quizzes": total_quizzes,
        "total_quiz_attempts": len(all_attempts),
        "average_score": avg_score,
        "pass_rate": pass_rate,
        "pending_payments": pending_payments,
        "paid_students": paid_students,
    }


# ─── TEACHER AI CHAT ──────────────────────────────────────────────────────────

class TeacherChatRequest(PydanticBaseModel):
    message: str

@router.post("/ai-chat")
def teacher_ai_chat(
    body: TeacherChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Teacher-specific AI assistant with teacher context injected."""
    from app.services.chatbot import get_ai_response
    from fastapi import HTTPException

    try:
        teacher = db.query(models.TeacherProfile).filter(
            models.TeacherProfile.user_id == current_user.id
        ).first()

        context = {}
        if teacher:
            total_courses = db.query(models.Course).filter(models.Course.teacher_id == teacher.id).count()
            context = {
                "Teacher Name": current_user.full_name or current_user.email,
                "Approval Status": getattr(teacher, 'approval_status', 'pending'),
                "Specialization": getattr(teacher, 'specializations', None) or "Not set",
                "Total Courses Created": total_courses,
            }

        reply = get_ai_response(body.message, mode="teacher", context=context if context else None)
        
        # Check if reply indicates an error
        if reply and ("offline" in reply.lower() or "trouble" in reply.lower() or "error" in reply.lower()):
            print(f"[teacher_ai_chat] AI service returned error message: {reply}")
            return JSONResponse(
                status_code=503,
                content={"error": "AI service temporarily unavailable", "reply": reply}
            )
        
        return {"reply": reply}
    except Exception as e:
        print(f"[teacher_ai_chat] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"AI generation failed: {str(e)}")
