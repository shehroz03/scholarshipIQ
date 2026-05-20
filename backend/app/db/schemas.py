from pydantic import BaseModel, EmailStr
from typing import Optional, Union, List
from datetime import datetime


class VerificationInfo(BaseModel):
    """Verification details for tuition and scholarship data"""
    tuition_verified: str = "not_verified"  # verified, approximate, not_found, not_verified
    scholarship_verified: str = "not_verified"
    tuition_source_url: Optional[str] = None
    scholarship_source_url: Optional[str] = None
    notes: Optional[str] = None
    verified_at: Optional[datetime] = None


class NetCostSummary(BaseModel):
    """Net cost calculation summary"""
    approx_student_pays_per_year: Optional[str] = None
    numeric_value: Optional[float] = None
    assumptions: Optional[str] = None


class FinancialDetails(BaseModel):
    """Complete financial information for a scholarship"""
    tuition_fee_per_year: Optional[str] = None
    tuition_fee_numeric: Optional[float] = None
    scholarship_amount: Optional[str] = None
    scholarship_amount_numeric: Optional[float] = None
    scholarship_type: Optional[str] = None  # fixed_amount, percentage, full_tuition, tuition_plus_stipend, other
    currency: Optional[str] = None
    net_cost: Optional[NetCostSummary] = None
    verification: Optional[VerificationInfo] = None

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    phone_number: Optional[str] = None
    cgpa: Optional[float] = None
    current_university: Optional[str] = None
    current_degree: Optional[str] = None
    major: Optional[str] = None
    specialization: Optional[str] = None
    graduation_year: Optional[int] = None
    target_country: Optional[str] = None
    target_degree: Optional[str] = None
    english_proficiency: Optional[str] = None
    research_experience: Optional[bool] = False
    email_notifications: Optional[bool] = True
    
    # New Fields
    cgpa_scale: Optional[str] = None
    english_test_type: Optional[str] = None
    ielts_overall: Optional[float] = None
    ielts_listening: Optional[float] = None
    ielts_reading: Optional[float] = None
    ielts_writing: Optional[float] = None
    ielts_speaking: Optional[float] = None
    toefl_score: Optional[int] = None
    pte_score: Optional[int] = None
    duolingo_score: Optional[int] = None
    target_field: Optional[str] = None
    target_start_year: Optional[int] = None
    study_mode: Optional[str] = None
    monthly_family_income: Optional[str] = None
    can_afford_partial: Optional[bool] = False
    max_budget_gbp: Optional[float] = None
    scholarship_type_pref: Optional[str] = None
    work_experience_years: Optional[str] = None
    work_experience_type: Optional[str] = None
    has_publications: Optional[bool] = False
    leadership_activities: Optional[str] = None
    passport_valid: Optional[bool] = False
    transcripts_ready: Optional[bool] = False
    sop_ready: Optional[str] = None
    references_count: Optional[int] = 0
    cv_ready: Optional[bool] = False
    
    # Subscription Fields
    subscription_plan: Optional[str] = "free"
    subscription_expires: Optional[datetime] = None
    subscription_started: Optional[datetime] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    nationality: Optional[str] = None
    phone_number: Optional[str] = None
    current_university: Optional[str] = None
    current_degree: Optional[str] = None
    major: Optional[str] = None
    cgpa: Optional[float] = None
    graduation_year: Optional[int] = None
    target_country: Optional[str] = None
    target_degree: Optional[str] = None
    english_proficiency: Optional[str] = None
    research_experience: Optional[bool] = None
    email_notifications: Optional[bool] = None
    
    cgpa_scale: Optional[str] = None
    english_test_type: Optional[str] = None
    ielts_overall: Optional[float] = None
    ielts_listening: Optional[float] = None
    ielts_reading: Optional[float] = None
    ielts_writing: Optional[float] = None
    ielts_speaking: Optional[float] = None
    toefl_score: Optional[int] = None
    pte_score: Optional[int] = None
    duolingo_score: Optional[int] = None
    target_field: Optional[str] = None
    target_start_year: Optional[int] = None
    study_mode: Optional[str] = None
    monthly_family_income: Optional[str] = None
    can_afford_partial: Optional[bool] = None
    max_budget_gbp: Optional[float] = None
    scholarship_type_pref: Optional[str] = None
    work_experience_years: Optional[str] = None
    work_experience_type: Optional[str] = None
    has_publications: Optional[bool] = None
    leadership_activities: Optional[str] = None
    passport_valid: Optional[bool] = None
    transcripts_ready: Optional[bool] = None
    sop_ready: Optional[str] = None
    references_count: Optional[int] = None
    cv_ready: Optional[bool] = None

    # Subscription Fields (Only for Admin/Demo)
    subscription_plan: Optional[str] = None
    subscription_expires: Optional[datetime] = None
    subscription_started: Optional[datetime] = None

class UserCreate(UserBase):
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool
    profile_completion: int = 0
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: Optional[str] = "student"

class ScholarshipBase(BaseModel):
    title: str
    university_id: int
    country: Optional[str] = None
    city: Optional[str] = None
    funding_type: Optional[str] = None
    funding_amount: Optional[str] = None
    amount: Optional[str] = None  # compat
    deadline: Optional[datetime] = None
    description: Optional[str] = None
    degree_level: Optional[str] = None
    field_of_study: Optional[str] = None
    eligibility: Optional[str] = None
    duration_text: Optional[str] = None
    website_url: Optional[str] = None
    scholarship_url: Optional[str] = None
    has_separate_form: Optional[bool] = True
    application_type: str = "direct_form"
    button_label: str = "Apply Now 🎯"
    user_note: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    
    # New Scholarship Criteria
    min_ielts: Optional[float] = None
    min_toefl: Optional[int] = None
    requires_work_exp: Optional[bool] = False
    open_to_pakistani: Optional[bool] = True
    
    # Verified Financial Data
    tuition_fee_per_year: Optional[str] = None
    tuition_fee_numeric: Optional[float] = None
    scholarship_amount_value: Optional[str] = None
    scholarship_amount_numeric: Optional[float] = None
    scholarship_type: Optional[str] = None  # fixed_amount, percentage, full_tuition, tuition_plus_stipend, other
    currency: Optional[str] = None
    
    # Net Cost Summary
    net_cost_per_year: Optional[str] = None
    net_cost_numeric: Optional[float] = None
    net_cost_assumptions: Optional[str] = None
    
    # Verification Status
    tuition_verified: Optional[str] = "not_verified"
    scholarship_verified: Optional[str] = "not_verified"
    tuition_source_url: Optional[str] = None
    scholarship_source_url: Optional[str] = None
    verification_notes: Optional[str] = None
    verified_at: Optional[datetime] = None

class UniversityOut(BaseModel):
    id: int
    name: str
    city: str
    country: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    website_url: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    established_year: Optional[int] = None
    qs_ranking: Optional[Union[int, str]] = None
    logo_url: Optional[str] = None
    image_url: Optional[str] = None
    scholarship_count: int = 0
    
    # UK Curator / Enriched Profile
    short_description: Optional[str] = None
    campus_type: Optional[str] = None
    official_contact_page: Optional[str] = None
    
    # Admission Requirements (Masters, international)
    min_cgpa: Optional[float] = None
    min_ielts: Optional[float] = None
    min_toefl: Optional[int] = None
    min_pte: Optional[int] = None
    minimum_cgpa_or_grade: Optional[str] = None
    english_language_requirements: Optional[str] = None  # JSON string
    other_academic_requirements: Optional[str] = None
    required_documents: Optional[str] = None  # JSON array string
    admission_process: Optional[str] = None
    admission_notes: Optional[str] = None

    class Config:
        from_attributes = True

class ScholarshipOut(ScholarshipBase):
    id: int
    is_suspicious: bool
    university_name: Optional[str] = None
    match_score: Optional[int] = None
    university: Optional[UniversityOut] = None

    # Criteria fields (returned from DB but not in ScholarshipBase)
    min_cgpa: Optional[float] = None
    fraud_risk_level: Optional[str] = None
    approval_status: Optional[str] = None

    class Config:
        from_attributes = True

class UniversityDetails(UniversityOut):
    scholarships: List[ScholarshipOut] = []

class PaginatedScholarshipResponse(BaseModel):
    """Paginated response for scholarship listings"""
    results: List[ScholarshipOut]
    total: int
    page: int
    page_size: int
    total_pages: int


class TopRecommendedScholarship(BaseModel):
    """Specific scholarship entry for AI recommendations with scoring metadata"""
    id: int
    title: str
    university_name: Optional[str] = None
    country: Optional[str] = None
    degree_level: Optional[str] = None
    fit_score: int
    eligibility: str  # eligible, borderline, not_eligible
    short_reason: str
    is_strong_match: bool
    deadline: Optional[str] = None
    after_fee: Optional[float] = None
    amount: Optional[str] = None
    funding_type: Optional[str] = None
    match_label: Optional[str] = None # For PRO users


class AIRecommendationResponse(BaseModel):
    """Main response structure for the AI Recommendation Engine"""
    user_id: int
    recommended_next_degree: str
    reason_next_degree: str
    top_scholarships: List[TopRecommendedScholarship]
    ml_active: bool = False

class ScholarshipRecommendation(BaseModel):
    id: int
    title: str
    university_name: str
    country: str
    degree_level: str
    fit_score: float
    eligibility: str
    reasons: List[str]

class RecommendationResponse(BaseModel):
    user_id: int
    recommended_next_degree: str
    reason_next_degree: str
    items: List[ScholarshipRecommendation]


class RecommendationItem(BaseModel):
    """New unified recommendation item with hybrid scoring data."""
    scholarship_id: int
    scholarship_name: str
    uni_name: str
    country: str
    city: str
    fit_score: float
    match_label: str  # "High Match" | "Good Match" | "Stretch"
    match_color: str  # "green" | "yellow" | "red"
    reasons: List[str]
    scholarship_link: str
    after_fee: float
    cgpa_min: float
    deadline: str


class ProfileRecommendationResponse(BaseModel):
    user_id: int
    items: List[RecommendationItem]
    ml_active: bool = False


class FeedbackCreate(BaseModel):
    scholarship_id: int
    action: str  # "view" | "save" | "apply"


class ApplicationBase(BaseModel):
    scholarship_id: int
    status: str = "Saved"
    notes: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    pass

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None

class ApplicationOut(ApplicationBase):
    id: int
    user_id: int
    applied_date: datetime
    scholarship: Optional[ScholarshipOut] = None

    class Config:
        from_attributes = True


class SubscriptionBase(BaseModel):
    email: EmailStr

class SubscriptionCreate(SubscriptionBase):
    pass

class SubscriptionOut(SubscriptionBase):
    id: int
    subscribed_at: datetime

    class Config:
        from_attributes = True

