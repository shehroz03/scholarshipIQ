from __future__ import annotations
from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, Table, func
from sqlalchemy.orm import relationship, DeclarativeBase, Mapped, mapped_column
from datetime import datetime, timezone
from typing import Optional, List, Any

# Helper for naive UTC datetime (Safe for SQLite)
def utc_now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Base(DeclarativeBase):
    pass

# Many-to-Many relationship for saved scholarships
saved_scholarships = Table(
    "saved_scholarships",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("scholarship_id", Integer, ForeignKey("scholarships.id")),
    Column("saved_at", DateTime, default=utc_now)
)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String)
    nationality: Mapped[Optional[str]] = mapped_column(String)
    role: Mapped[str] = mapped_column(String, default="student")  # student, teacher, admin
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    last_login: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)

    
    # Profile details (signup + profile settings)
    cgpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    degree_level: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    field_of_interest: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    specialization: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    institution: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    current_university: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    email_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # --- 1. Personal Info ---
    phone_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # --- 2. Academic History (Past) ---
    current_degree: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    major: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    graduation_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- 3. Future Goals (Target) ---
    target_country: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_degree: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # --- 4. Extra Important Fields for Scholarship ---
    english_proficiency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    research_experience: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # --- New Fields for Profile Settings ---
    cgpa_scale: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    english_test_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    ielts_overall: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ielts_listening: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ielts_reading: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ielts_writing: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    ielts_speaking: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    toefl_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    toefl_reading: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    toefl_listening: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    toefl_writing: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    toefl_speaking: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    pte_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duolingo_score: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    
    target_field: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    target_start_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    study_mode: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    monthly_family_income: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    can_afford_partial: Mapped[bool] = mapped_column(Boolean, default=False)
    max_budget_gbp: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scholarship_type_pref: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    work_experience_years: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    work_experience_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    has_publications: Mapped[bool] = mapped_column(Boolean, default=False)
    leadership_activities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    passport_valid: Mapped[bool] = mapped_column(Boolean, default=False)
    transcripts_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    sop_ready: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    references_count: Mapped[int] = mapped_column(Integer, default=0)
    cv_ready: Mapped[bool] = mapped_column(Boolean, default=False)
    
    # AI Consultant Premium Feature
    subscription_plan: Mapped[str] = mapped_column(String, default="free")
    subscription_expires: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    subscription_started: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    messages_today: Mapped[int] = mapped_column(Integer, default=0)
    messages_reset_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Relationships
    saved_items: Mapped[List[Scholarship]] = relationship("Scholarship", secondary=saved_scholarships, back_populates="saved_by")
    applications: Mapped[List[Application]] = relationship("Application", back_populates="user")
    messages: Mapped[List[ChatMessage]] = relationship("ChatMessage", back_populates="user")

class ConsultantMessage(Base):
    __tablename__ = "consultant_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    session_id: Mapped[str] = mapped_column(String, default="default")
    type: Mapped[str] = mapped_column(String, default="text")
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(Text)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    tool_type: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    last_active: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    
    messages: Mapped[List[ChatMessage]] = relationship("ChatMessage", back_populates="session", order_by="ChatMessage.created_at")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    session_id: Mapped[int] = mapped_column(Integer, ForeignKey("chat_sessions.id"), nullable=False)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    role: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    tool_type: Mapped[Optional[str]] = mapped_column(String)
    file_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    
    session: Mapped[ChatSession] = relationship("ChatSession", back_populates="messages")
    user: Mapped[Optional[User]] = relationship("User", back_populates="messages")

class Scholarship(Base):
    __tablename__ = "scholarships"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String, index=True, nullable=False)
    
    university_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("universities.id"), nullable=True)
    university_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    country: Mapped[Optional[str]] = mapped_column(String)
    city: Mapped[Optional[str]] = mapped_column(String)
    
    funding_type: Mapped[Optional[str]] = mapped_column(String)
    funding_amount: Mapped[Optional[str]] = mapped_column(String)
    amount: Mapped[Optional[str]] = mapped_column(String)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime)
    
    # --- Verified Financial Data ---
    tuition_fee_per_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tuition_fee_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scholarship_amount_value: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scholarship_amount_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scholarship_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    net_cost_per_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    net_cost_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    net_cost_assumptions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Verification Status
    tuition_verified: Mapped[str] = mapped_column(String, default="not_verified")
    scholarship_verified: Mapped[str] = mapped_column(String, default="not_verified")
    tuition_source_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scholarship_source_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verification_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    # Academic Details
    description: Mapped[Optional[str]] = mapped_column(Text)
    degree_level: Mapped[Optional[str]] = mapped_column(String)
    field_of_study: Mapped[Optional[str]] = mapped_column(String)
    eligibility: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    duration_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # New Scholarship Criteria
    min_cgpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_ielts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_toefl: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_work_exp: Mapped[bool] = mapped_column(Boolean, default=False)
    open_to_pakistani: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Flags & URLs
    is_suspicious: Mapped[bool] = mapped_column(Boolean, default=False)
    website_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scholarship_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    has_separate_form: Mapped[bool] = mapped_column(Boolean, default=True)
    
    # Application System
    application_type: Mapped[str] = mapped_column(String, default="direct_form")
    button_label: Mapped[str] = mapped_column(String, default="Apply Now 🎯")
    user_note: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Geographical coords
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    # Admin Approval Workflow: pending → checking → approved / rejected
    approval_status: Mapped[str] = mapped_column(String, default="pending")

    # Auto-Update System
    last_auto_checked: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Fraud Detection & Risk
    fraud_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_risk_level: Mapped[str] = mapped_column(String, default="SAFE")
    fraud_reasons: Mapped[str] = mapped_column(Text, default="[]")
    last_fraud_check: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    auto_flagged: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True) 
    
    # Archiving Support
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    archive_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    # Relationships
    university: Mapped[Optional[University]] = relationship("University", back_populates="scholarships")
    saved_by: Mapped[List[User]] = relationship("User", secondary=saved_scholarships, back_populates="saved_items")

class University(Base):
    __tablename__ = "universities"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True, nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String)
    country: Mapped[Optional[str]] = mapped_column(String)
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    website_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    established_year: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    qs_ranking: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    logo_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # UK Curator / Enriched Profile
    short_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    campus_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    official_contact_page: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # Admission Requirements
    min_cgpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_ielts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_toefl: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    min_pte: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    minimum_cgpa_or_grade: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    english_language_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    other_academic_requirements: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    required_documents: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admission_process: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admission_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    scholarships: Mapped[List[Scholarship]] = relationship("Scholarship", back_populates="university", cascade="all, delete-orphan")

    @property
    def scholarship_count(self) -> int:
        return len(self.scholarships)


class Notification(Base):
    __tablename__ = "notifications"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    scholarship_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scholarships.id"), nullable=True)
    type: Mapped[Optional[str]] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String)
    message: Mapped[Optional[str]] = mapped_column(Text)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="sent")
    sent_date: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

class UserScholarshipInteraction(Base):
    """Tracks user interactions with scholarships for ML training"""
    __tablename__ = "user_scholarship_interactions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    scholarship_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scholarships.id"), index=True)
    interaction_type: Mapped[Optional[str]] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    scholarship_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("scholarships.id"))
    
    status: Mapped[str] = mapped_column(String, default="Saved") 
    applied_date: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True) 

    # Relationships
    user: Mapped[User] = relationship("User", back_populates="applications")
    scholarship: Mapped[Scholarship] = relationship("Scholarship") 

class PipelineLog(Base):
    __tablename__ = "pipeline_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    pipeline_run_id: Mapped[Optional[str]] = mapped_column(String, index=True)
    triggered_by: Mapped[Optional[str]] = mapped_column(String)
    source_url: Mapped[Optional[str]] = mapped_column(String) 
    
    total_found: Mapped[int] = mapped_column(Integer, default=0)
    inserted: Mapped[int] = mapped_column(Integer, default=0)
    staged: Mapped[int] = mapped_column(Integer, default=0)
    skipped_fraud: Mapped[int] = mapped_column(Integer, default=0)
    skipped_duplicate: Mapped[int] = mapped_column(Integer, default=0)
    skipped_not_masters: Mapped[int] = mapped_column(Integer, default=0)
    errors: Mapped[Optional[str]] = mapped_column(Text)
    new_scholarships: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[Optional[str]] = mapped_column(String)
    
    event_type: Mapped[Optional[str]] = mapped_column(String)
    action_taken: Mapped[Optional[str]] = mapped_column(String)
    scholarship_title: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    official_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text) 


# ─── VISA GUIDANCE MODULE ──────────────────────────────────────────────────

class VisaProfile(Base):
    __tablename__ = "visa_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    target_country: Mapped[Optional[str]] = mapped_column(String)
    intake_term: Mapped[Optional[str]] = mapped_column(String)
    intended_start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    
    passport_status: Mapped[Optional[str]] = mapped_column(String)
    admission_status: Mapped[Optional[str]] = mapped_column(String)
    scholarship_status: Mapped[Optional[str]] = mapped_column(String)
    funding_source: Mapped[Optional[str]] = mapped_column(String)
    bank_statement_available: Mapped[bool] = mapped_column(Boolean, default=False)
    
    language_test_type: Mapped[Optional[str]] = mapped_column(String)
    language_test_score: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tuberculosis_test_status: Mapped[str] = mapped_column(String, default="not_done")
    health_insurance_status: Mapped[str] = mapped_column(String, default="not_done")
    
    previous_visa_refusal: Mapped[bool] = mapped_column(Boolean, default=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    user: Mapped[User] = relationship("User")


class VisaRequirementTemplate(Base):
    __tablename__ = "visa_requirement_templates"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    country_code: Mapped[Optional[str]] = mapped_column(String, index=True)
    document_key: Mapped[Optional[str]] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text)
    is_required: Mapped[bool] = mapped_column(Boolean, default=True)
    depends_on_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    format_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    official_source_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    active: Mapped[bool] = mapped_column(Boolean, default=True)


class VisaChecklist(Base):
    __tablename__ = "visa_checklists"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    visa_profile_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("visa_profiles.id"))
    country_code: Mapped[Optional[str]] = mapped_column(String)
    readiness_score: Mapped[Optional[int]] = mapped_column(Integer)
    status_summary: Mapped[Optional[str]] = mapped_column(Text)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    version_tag: Mapped[str] = mapped_column(String, default="v1.0")

    items: Mapped[List[VisaChecklistItem]] = relationship("VisaChecklistItem", back_populates="checklist")


class VisaChecklistItem(Base):
    __tablename__ = "visa_checklist_items"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    checklist_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("visa_checklists.id"))
    document_key: Mapped[Optional[str]] = mapped_column(String)
    title: Mapped[Optional[str]] = mapped_column(String)
    status: Mapped[Optional[str]] = mapped_column(String)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    action_hint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    deadline_hint: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    checklist: Mapped[VisaChecklist] = relationship("VisaChecklist", back_populates="items")


class VisaAISession(Base):
    __tablename__ = "visa_ai_sessions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"))
    visa_profile_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("visa_profiles.id"))
    prompt_type: Mapped[Optional[str]] = mapped_column(String)
    user_query: Mapped[Optional[str]] = mapped_column(Text)
    ai_response: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


class VisaCountryGuide(Base):
    __tablename__ = "visa_country_guides"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    country_code: Mapped[str] = mapped_column(String, unique=True, index=True)
    overview: Mapped[Optional[str]] = mapped_column(Text)
    common_mistakes: Mapped[Optional[str]] = mapped_column(Text)
    financial_proof_notes: Mapped[Optional[str]] = mapped_column(Text)
    document_format_notes: Mapped[Optional[str]] = mapped_column(Text)
    last_reviewed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

# ─── INGESTION & FRAUD DETECTION ───────────────────────────────────────────

class FraudRisk:
    SAFE = "SAFE"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ReviewStatus:
    PENDING = "pending"
    APPROVED = "approved"
    BLOCKED = "blocked"
    MISSING_UNI = "missing_uni"

class ScholarshipStaging(Base):
    __tablename__ = "scholarship_staging"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    
    title: Mapped[str] = mapped_column(String, nullable=False)
    university_name_raw: Mapped[Optional[str]] = mapped_column(String)
    university_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("universities.id"), nullable=True)
    
    country: Mapped[Optional[str]] = mapped_column(String)
    city: Mapped[Optional[str]] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(Text)
    degree_level: Mapped[Optional[str]] = mapped_column(String)
    field_of_study: Mapped[Optional[str]] = mapped_column(String)
    funding_type: Mapped[Optional[str]] = mapped_column(String)
    amount: Mapped[Optional[str]] = mapped_column(String)
    deadline: Mapped[Optional[datetime]] = mapped_column(DateTime)
    eligibility: Mapped[Optional[str]] = mapped_column(Text)
    duration_text: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    tuition_fee_per_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    tuition_fee_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scholarship_amount_value: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scholarship_amount_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    scholarship_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    currency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    net_cost_per_year: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    net_cost_numeric: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    
    min_cgpa: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_ielts: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    min_toefl: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    requires_work_exp: Mapped[bool] = mapped_column(Boolean, default=False)
    open_to_pakistani: Mapped[bool] = mapped_column(Boolean, default=True)
    
    scholarship_url: Mapped[Optional[str]] = mapped_column(String)
    website_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    fraud_risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    fraud_risk_level: Mapped[str] = mapped_column(String, default=FraudRisk.SAFE)
    fraud_reasons: Mapped[str] = mapped_column(Text, default="[]")
    
    review_status: Mapped[str] = mapped_column(String, default=ReviewStatus.PENDING)
    is_archived: Mapped[bool] = mapped_column(Boolean, default=False)
    archived_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    archive_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    import_source: Mapped[Optional[str]] = mapped_column(String) 
    pipeline_run_id: Mapped[Optional[str]] = mapped_column(String, index=True)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    raw_payload_json: Mapped[Optional[str]] = mapped_column(Text)


class NewsletterSubscription(Base):
    __tablename__ = "newsletter_subscriptions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    subscribed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)


# ─────────────────────────────────────────────
#   TEACHER DASHBOARD MODELS
# ─────────────────────────────────────────────

class TeacherProfile(Base):
    __tablename__ = "teacher_profiles"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), unique=True)
    bio: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    specializations: Mapped[str] = mapped_column(String, default="IELTS")
    experience_years: Mapped[int] = mapped_column(Integer, default=1)
    qualification: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    degree: Mapped[Optional[str]] = mapped_column(String, nullable=True)      # e.g. "M.Ed, CELTA, B.Ed"
    institution: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Where they studied
    cv_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)      # LinkedIn profile URL
    cv_file_url: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Uploaded CV document path
    profile_picture_url: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Profile picture URL
    # Admin approval workflow: pending → approved / rejected
    approval_status: Mapped[str] = mapped_column(String, default="pending")   # pending, approved, rejected
    rejection_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    user: Mapped["User"] = relationship("User", backref="teacher_profile")
    courses: Mapped[List["Course"]] = relationship("Course", back_populates="teacher")


class Course(Base):
    __tablename__ = "courses"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("teacher_profiles.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    subject: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # e.g. English, Math, Science
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    test_type: Mapped[str] = mapped_column(String, nullable=False)  # IELTS, TOEFL, GRE, GMAT, PTE, TestDaF, Duolingo
    level: Mapped[str] = mapped_column(String, default="Beginner")  # Beginner, Intermediate, Advanced
    price: Mapped[float] = mapped_column(Float, default=0.0)  # 0 = free
    is_published: Mapped[bool] = mapped_column(Boolean, default=False)
    thumbnail_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    total_students: Mapped[int] = mapped_column(Integer, default=0)
    rating: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)

    teacher: Mapped["TeacherProfile"] = relationship("TeacherProfile", back_populates="courses")
    lessons: Mapped[List["Lesson"]] = relationship("Lesson", back_populates="course", order_by="Lesson.order", cascade="all, delete-orphan")
    quizzes: Mapped[List["Quiz"]] = relationship("Quiz", back_populates="course", cascade="all, delete-orphan")
    live_classes: Mapped[List["LiveClass"]] = relationship("LiveClass", back_populates="course", cascade="all, delete-orphan")
    enrollments: Mapped[List["Enrollment"]] = relationship("Enrollment", back_populates="course", cascade="all, delete-orphan")
    meeting_links: Mapped[List["MeetingLink"]] = relationship("MeetingLink", back_populates="course", order_by="MeetingLink.date", cascade="all, delete-orphan")


class MeetingLink(Base):
    __tablename__ = "meeting_links"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"))
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)  # Meeting date
    time: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # Meeting time (e.g. "10:00 AM")
    link: Mapped[str] = mapped_column(String, nullable=False)  # Meeting URL
    platform: Mapped[str] = mapped_column(String, default="Google Meet")  # Google Meet, Zoom, Teams
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    course: Mapped["Course"] = relationship("Course", back_populates="meeting_links")


class Lesson(Base):
    __tablename__ = "lessons"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    video_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # YouTube URL
    duration_minutes: Mapped[int] = mapped_column(Integer, default=0)
    order: Mapped[int] = mapped_column(Integer, default=0)
    is_free_preview: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    course: Mapped["Course"] = relationship("Course", back_populates="lessons")


class LiveClass(Base):
    __tablename__ = "live_classes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    meet_link: Mapped[str] = mapped_column(String, nullable=False)  # Zoom/Google Meet URL
    platform: Mapped[str] = mapped_column(String, default="Google Meet")  # Zoom, Google Meet, MS Teams
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, default=60)
    max_students: Mapped[int] = mapped_column(Integer, default=30)
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    course: Mapped["Course"] = relationship("Course", back_populates="live_classes")


class Quiz(Base):
    __tablename__ = "quizzes"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"))
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    test_type: Mapped[str] = mapped_column(String, nullable=False)  # IELTS, GRE etc
    section: Mapped[str] = mapped_column(String, default="General")  # Reading, Writing, Listening, Vocabulary, Quantitative
    time_limit_minutes: Mapped[int] = mapped_column(Integer, default=30)
    pass_score: Mapped[int] = mapped_column(Integer, default=60)  # percent
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # When quiz will be available
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    course: Mapped["Course"] = relationship("Course", back_populates="quizzes")
    questions: Mapped[List["QuizQuestion"]] = relationship("QuizQuestion", back_populates="quiz", order_by="QuizQuestion.order", cascade="all, delete-orphan")
    attempts: Mapped[List["QuizAttempt"]] = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestion(Base):
    __tablename__ = "quiz_questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id"))
    question: Mapped[str] = mapped_column(Text, nullable=False)
    options: Mapped[str] = mapped_column(Text, nullable=False)  # JSON: ["A", "B", "C", "D"]
    correct_answer: Mapped[str] = mapped_column(String, nullable=False)  # "A", "B", "C", or "D"
    explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String, default="Medium")  # Easy, Medium, Hard
    order: Mapped[int] = mapped_column(Integer, default=0)

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="questions")


class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    quiz_id: Mapped[int] = mapped_column(Integer, ForeignKey("quizzes.id"))
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    score: Mapped[float] = mapped_column(Float, default=0.0)  # percent
    correct_count: Mapped[int] = mapped_column(Integer, default=0)
    total_questions: Mapped[int] = mapped_column(Integer, default=0)
    answers: Mapped[str] = mapped_column(Text, default="{}")  # JSON: {question_id: selected_answer}
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    quiz: Mapped["Quiz"] = relationship("Quiz", back_populates="attempts")
    user: Mapped["User"] = relationship("User")


class Enrollment(Base):
    __tablename__ = "enrollments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"))
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"))
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    progress_percent: Mapped[int] = mapped_column(Integer, default=0)
    completed_lessons: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of lesson IDs
    last_accessed: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    # Fee / payment: pending → submitted (student sent proof) → paid (teacher approved)
    payment_status: Mapped[str] = mapped_column(String, default="paid")  # pending, submitted, paid, rejected
    payment_method: Mapped[Optional[str]] = mapped_column(String, nullable=True)  # JazzCash, Easypaisa, Bank
    payment_method_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("teacher_payment_methods.id"), nullable=True)
    payment_reference: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    payment_screenshot_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    amount_paid: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    paid_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship("User")
    course: Mapped["Course"] = relationship("Course", back_populates="enrollments")


# ─────────────────────────────────────────────
#   TEACHER REVIEW SYSTEM
# ─────────────────────────────────────────────

class TeacherReview(Base):
    """Student reviews and ratings for teachers"""
    __tablename__ = "teacher_reviews"
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("teacher_profiles.id"), index=True)
    student_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), index=True)
    
    # Rating (1-5 stars)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)  # 1-5
    
    # Review content
    review_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Metadata
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now, onupdate=utc_now)
    
    # For admin control - if review is hidden/removed
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    is_removed_by_admin: Mapped[bool] = mapped_column(Boolean, default=False)
    removal_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    removed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    removed_by_admin_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Report system (teachers can report, admin decides)
    is_reported: Mapped[bool] = mapped_column(Boolean, default=False)
    report_reason: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    reported_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    reported_by_teacher_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("teacher_profiles.id"), nullable=True)
    
    # Admin verification status
    admin_review_status: Mapped[str] = mapped_column(String, default="pending")  # pending, reviewed, dismissed
    admin_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    admin_reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    admin_reviewed_by: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    
    # Relationships
    teacher: Mapped["TeacherProfile"] = relationship("TeacherProfile", foreign_keys=[teacher_id], back_populates="reviews")
    student: Mapped["User"] = relationship("User", foreign_keys=[student_id], back_populates="teacher_reviews_given")
    removed_by_admin: Mapped[Optional["User"]] = relationship("User", foreign_keys=[removed_by_admin_id])
    reported_by_teacher: Mapped[Optional["TeacherProfile"]] = relationship("TeacherProfile", foreign_keys=[reported_by_teacher_id], back_populates="reported_reviews")
    admin_reviewer: Mapped[Optional["User"]] = relationship("User", foreign_keys=[admin_reviewed_by])

# Update TeacherProfile to include relationship
TeacherProfile.reviews = relationship("TeacherReview", back_populates="teacher", foreign_keys="TeacherReview.teacher_id", lazy="dynamic")
TeacherProfile.reported_reviews = relationship("TeacherReview", foreign_keys="TeacherReview.reported_by_teacher_id", back_populates="reported_by_teacher", lazy="dynamic")

# Update User to include relationship
User.teacher_reviews_given = relationship("TeacherReview", foreign_keys="TeacherReview.student_id", back_populates="student", lazy="dynamic")


# ─────────────────────────────────────────────
#   TEACHER PAYMENT METHODS
# ─────────────────────────────────────────────

class TeacherPaymentMethod(Base):
    """Teacher's payment accounts — JazzCash, Easypaisa, or Bank"""
    __tablename__ = "teacher_payment_methods"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    teacher_id: Mapped[int] = mapped_column(Integer, ForeignKey("teacher_profiles.id"), index=True)
    method_type: Mapped[str] = mapped_column(String, nullable=False)        # JazzCash | Easypaisa | Bank
    account_title: Mapped[str] = mapped_column(String, nullable=False)      # Account holder name
    account_number: Mapped[str] = mapped_column(String, nullable=False)     # Phone number or IBAN
    bank_name: Mapped[Optional[str]] = mapped_column(String, nullable=True) # Only for Bank type
    instructions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utc_now)

    teacher: Mapped["TeacherProfile"] = relationship("TeacherProfile", backref="payment_methods")

