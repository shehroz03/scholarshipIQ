"""
Courses API — Student Side
Browse, enroll, take lessons and quizzes.
"""
import json
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db import models
from app.api.deps import get_current_user

router = APIRouter(prefix="/courses", tags=["Courses"])


def _serialize_course(c: models.Course, enrolled: bool = False, progress: int = 0):
    teacher_name = c.teacher.user.full_name if c.teacher and c.teacher.user else "Unknown"
    return {
        "id": c.id,
        "title": c.title,
        "subject": c.subject,
        "description": c.description,
        "test_type": c.test_type,
        "level": c.level,
        "price": c.price,
        "is_free": c.price == 0,
        "teacher_name": teacher_name,
        "teacher_id": c.teacher_id,
        "thumbnail_url": c.thumbnail_url,
        "total_lessons": len(c.lessons),
        "total_quizzes": len(c.quizzes),
        "upcoming_live_classes": sum(1 for lc in c.live_classes if not lc.is_cancelled and lc.scheduled_at > datetime.now()),
        "total_students": c.total_students,
        "rating": c.rating,
        "enrolled": enrolled,
        "progress": progress,
        "created_at": c.created_at.isoformat(),
    }


# ── BROWSE COURSES ─────────────────────────────

@router.get("")
def list_courses(
    test_type: Optional[str] = None,
    level: Optional[str] = None,
    free_only: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    q = db.query(models.Course).filter(models.Course.is_published == True)
    if test_type:
        q = q.filter(models.Course.test_type == test_type)
    if level:
        q = q.filter(models.Course.level == level)
    if free_only:
        q = q.filter(models.Course.price == 0)
    courses = q.all()
    enrolled_ids = {e.course_id for e in db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()}
    progress_map = {e.course_id: e.progress_percent for e in db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()}
    return [_serialize_course(c, c.id in enrolled_ids, progress_map.get(c.id, 0)) for c in courses]


# ⚠️ IMPORTANT: /my/* and /quizzes/* routes MUST be defined BEFORE /{course_id}
# to prevent FastAPI from treating "my" or "quizzes" as a course_id parameter.

@router.get("/my/enrolled")
def my_courses(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    enrollments = db.query(models.Enrollment).filter(models.Enrollment.user_id == current_user.id).all()
    return [_serialize_course(e.course, True, e.progress_percent) for e in enrollments]


@router.get("/my/progress")
def get_my_progress(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    attempts = db.query(models.QuizAttempt).filter(models.QuizAttempt.user_id == current_user.id).all()
    by_test = {}
    for a in attempts:
        t = a.quiz.test_type if a.quiz else "Unknown"
        if t not in by_test:
            by_test[t] = {"attempts": 0, "best_score": 0, "passed": 0}
        by_test[t]["attempts"] += 1
        by_test[t]["best_score"] = max(by_test[t]["best_score"], a.score)
        if a.passed:
            by_test[t]["passed"] += 1
    return {
        "total_attempts": len(attempts),
        "overall_avg": round(sum(a.score for a in attempts) / len(attempts), 1) if attempts else 0,
        "by_test_type": by_test,
    }


@router.get("/quizzes/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id, models.Quiz.is_published == True).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == quiz.course_id
    ).first()
    if not enrollment:
        raise HTTPException(403, "Enroll in the course first")
    questions = [
        {
            "id": q.id, "question": q.question,
            "options": json.loads(q.options),
            "difficulty": q.difficulty, "order": q.order
        }
        for q in quiz.questions
    ]
    past_attempts = db.query(models.QuizAttempt).filter(
        models.QuizAttempt.quiz_id == quiz_id,
        models.QuizAttempt.user_id == current_user.id
    ).order_by(models.QuizAttempt.completed_at.desc()).all()
    return {
        "id": quiz.id, "title": quiz.title, "description": quiz.description,
        "section": quiz.section, "test_type": quiz.test_type,
        "time_limit_minutes": quiz.time_limit_minutes,
        "pass_score": quiz.pass_score, "questions": questions,
        "attempts": [{"score": a.score, "passed": a.passed, "completed_at": a.completed_at.isoformat()} for a in past_attempts],
        "best_score": max((a.score for a in past_attempts), default=None)
    }


@router.post("/quizzes/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    answers: dict = Body(...),
    time_taken_seconds: int = Body(0),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(404, "Quiz not found")
    questions = db.query(models.QuizQuestion).filter(models.QuizQuestion.quiz_id == quiz_id).all()
    correct = 0
    result_detail = []
    for q in questions:
        selected = answers.get(str(q.id))
        is_correct = selected == q.correct_answer
        if is_correct:
            correct += 1
        result_detail.append({
            "question_id": q.id,
            "question": q.question,
            "selected": selected,
            "correct_answer": q.correct_answer,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })
    total = len(questions)
    score = round(correct / total * 100, 1) if total else 0
    passed = score >= quiz.pass_score
    attempt = models.QuizAttempt(
        quiz_id=quiz_id, user_id=current_user.id,
        score=score, correct_count=correct, total_questions=total,
        answers=json.dumps(answers), time_taken_seconds=time_taken_seconds,
        passed=passed
    )
    db.add(attempt)
    db.commit()
    return {
        "score": score, "correct": correct, "total": total,
        "passed": passed, "pass_score": quiz.pass_score,
        "time_taken_seconds": time_taken_seconds,
        "result_detail": result_detail,
    }


@router.get("/{course_id}")
def get_course_detail(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.is_published == True).first()
    if not course:
        raise HTTPException(404, "Course not found")
    enrollment = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id,
        models.Enrollment.course_id == course_id
    ).first()
    enrolled = bool(enrollment)
    completed_lessons = json.loads(enrollment.completed_lessons) if enrollment else []
    lessons = [
        {
            "id": l.id, "title": l.title, "duration_minutes": l.duration_minutes,
            "order": l.order, "has_video": bool(l.video_url),
            "is_free_preview": l.is_free_preview,
            "completed": l.id in completed_lessons,
            "content": l.content if (enrolled or l.is_free_preview) else None,
            "video_url": l.video_url if (enrolled or l.is_free_preview) else None,
        }
        for l in course.lessons
    ]
    quizzes = [
        {
            "id": q.id, "title": q.title, "section": q.section,
            "time_limit_minutes": q.time_limit_minutes, "pass_score": q.pass_score,
            "question_count": len(q.questions),
            "best_score": max((a.score for a in db.query(models.QuizAttempt).filter(
                models.QuizAttempt.quiz_id == q.id, models.QuizAttempt.user_id == current_user.id
            ).all()), default=None),
        }
        for q in course.quizzes if q.is_published
    ]
    upcoming_classes = [
        {
            "id": lc.id, "title": lc.title, "platform": lc.platform,
            "scheduled_at": lc.scheduled_at.isoformat(),
            "duration_minutes": lc.duration_minutes,
            "meet_link": lc.meet_link if enrolled else None,
        }
        for lc in course.live_classes
        if not lc.is_cancelled and lc.scheduled_at > datetime.now()
    ]
    # Meeting links - only show to enrolled students
    meeting_links = [
        {
            "id": ml.id,
            "date": ml.date.isoformat(),
            "time": ml.time,
            "link": ml.link if enrolled else None,
            "platform": ml.platform,
            "description": ml.description,
        }
        for ml in course.meeting_links
    ] if course.meeting_links else []
    # Include scheduled_at in quizzes
    quizzes_with_schedule = [
        {
            "id": q.id, "title": q.title, "section": q.section,
            "time_limit_minutes": q.time_limit_minutes, "pass_score": q.pass_score,
            "question_count": len(q.questions),
            "scheduled_at": q.scheduled_at.isoformat() if q.scheduled_at else None,
            "best_score": max((a.score for a in db.query(models.QuizAttempt).filter(
                models.QuizAttempt.quiz_id == q.id, models.QuizAttempt.user_id == current_user.id
            ).all()), default=None),
        }
        for q in course.quizzes if q.is_published
    ]
    result = _serialize_course(course, enrolled, enrollment.progress_percent if enrollment else 0)
    result["lessons"] = lessons
    result["quizzes"] = quizzes_with_schedule
    result["upcoming_live_classes_detail"] = upcoming_classes
    result["meeting_links"] = meeting_links
    return result


# ── ENROLLMENT ─────────────────────────────────

@router.post("/{course_id}/enroll")
def enroll_course(course_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    course = db.query(models.Course).filter(models.Course.id == course_id, models.Course.is_published == True).first()
    if not course:
        raise HTTPException(404, "Course not found")
    existing = db.query(models.Enrollment).filter(
        models.Enrollment.user_id == current_user.id, models.Enrollment.course_id == course_id
    ).first()
    if existing:
        raise HTTPException(400, "Already enrolled")
    e = models.Enrollment(user_id=current_user.id, course_id=course_id)
    db.add(e)
    course.total_students += 1
    db.commit()
    return {"message": "Enrolled successfully!", "course_title": course.title}


