from sqlalchemy import Column, Integer, String, Text, Float, DateTime, Boolean, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

# Many-to-Many relationship for saved scholarships
saved_scholarships = Table(
    "saved_scholarships",
    Base.metadata,
    Column("user_id", Integer, ForeignKey("users.id")),
    Column("scholarship_id", Integer, ForeignKey("scholarships.id")),
    Column("saved_at", DateTime, default=datetime.datetime.utcnow)
)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    nationality = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Profile details (signup + profile settings)
    cgpa = Column(Float, nullable=True)
    degree_level = Column(String, nullable=True)  # Legacy
    field_of_interest = Column(String, nullable=True) # Legacy
    specialization = Column(String, nullable=True) # Legacy
    institution = Column(String, nullable=True) # Legacy
    current_university = Column(String, nullable=True)
    email_notifications = Column(Boolean, default=True)
    
    # --- 1. Personal Info ---
    phone_number = Column(String, nullable=True)

    # --- 2. Academic History (Past) ---
    current_degree = Column(String, nullable=True)     # BS / MS
    major = Column(String, nullable=True)              # Computer Science, etc.
    graduation_year = Column(Integer, nullable=True)   # 2025

    # --- 3. Future Goals (Target) ---
    target_country = Column(String, nullable=True)     # UK, USA, Germany
    target_degree = Column(String, nullable=True)      # Masters, PhD
    
    # --- 4. Extra Important Fields for Scholarship ---
    english_proficiency = Column(String, nullable=True) # IELTS / TOEFL / None
    research_experience = Column(Boolean, default=False) # Research papers hain?
    
    # Relationships
    saved_items = relationship("Scholarship", secondary=saved_scholarships, back_populates="saved_by")
    applications = relationship("Application", back_populates="user")
    messages = relationship("ChatMessage", back_populates="user")

class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    
    # Relationship to University
    university_id = Column(Integer, ForeignKey("universities.id"), nullable=False)
    
    # Geographical denormalization for faster filtering
    country = Column(String)
    city = Column(String)
    
    # Funding Details
    funding_type = Column(String)  # Fully Funded, Partial, etc.
    funding_amount = Column(String)  # consolidated naming
    amount = Column(String)  # Keeping for backward compat briefly
    deadline = Column(DateTime)
    
    # ============================================
    # VERIFIED FINANCIAL DATA (New Feature)
    # ============================================
    # Tuition Fee Information
    tuition_fee_per_year = Column(String, nullable=True)  # e.g. "£28,950 per year"
    tuition_fee_numeric = Column(Float, nullable=True)  # Numeric value for calculations
    
    # Scholarship Amount Information
    scholarship_amount_value = Column(String, nullable=True)  # e.g. "£15,000 per year" or "50% tuition waiver"
    scholarship_amount_numeric = Column(Float, nullable=True)  # Numeric value for calculations
    scholarship_type = Column(String, nullable=True)  # fixed_amount, percentage, full_tuition, tuition_plus_stipend, other
    
    # Currency
    currency = Column(String, nullable=True)  # ISO code: GBP, EUR, AUD, USD, etc.
    
    # Net Cost Summary
    net_cost_per_year = Column(String, nullable=True)  # e.g. "£13,950 per year"
    net_cost_numeric = Column(Float, nullable=True)  # Numeric value
    net_cost_assumptions = Column(Text, nullable=True)  # Assumptions for the calculation
    
    # Verification Status
    tuition_verified = Column(String, default="not_verified")  # verified, approximate, not_found, not_verified
    scholarship_verified = Column(String, default="not_verified")  # verified, approximate, not_found, not_verified
    tuition_source_url = Column(String, nullable=True)  # Official source URL for tuition
    scholarship_source_url = Column(String, nullable=True)  # Official source URL for scholarship
    verification_notes = Column(Text, nullable=True)  # Any notes about the verification
    verified_at = Column(DateTime, nullable=True)  # When was it last verified
    # ============================================
    
    # Academic Details
    description = Column(Text)
    degree_level = Column(String)
    field_of_study = Column(String)
    eligibility = Column(Text, nullable=True)
    duration_text = Column(String, nullable=True)
    
    # Flags & URLs
    is_suspicious = Column(Boolean, default=False)
    website_url = Column(String, nullable=True)  # University website
    scholarship_url = Column(String, nullable=True)  # Specific application link
    has_separate_form = Column(Boolean, default=True)
    
    # Application System (Smart Button)
    application_type = Column(String, default="direct_form") # direct_form, portal_application, auto_considered
    button_label = Column(String, default="Apply Now 🎯")
    user_note = Column(String, nullable=True)

    # Geographical coords (inherited or specific)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    university = relationship("University", back_populates="scholarships")
    saved_by = relationship("User", secondary=saved_scholarships, back_populates="saved_items")

class University(Base):
    __tablename__ = "universities"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    city = Column(String)
    country = Column(String)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    website_url = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    established_year = Column(Integer, nullable=True)
    qs_ranking = Column(Integer, nullable=True)
    logo_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    
    # UK Curator / Enriched Profile (official sources only)
    short_description = Column(Text, nullable=True)  # 1–2 lines about the university
    campus_type = Column(String, nullable=True)  # Collegiate, City campus, Single-site, etc.
    official_contact_page = Column(String, nullable=True)  # Contact / International Students URL
    
    # Admission Requirements (Masters, international – from official pages)
    min_cgpa = Column(Float, nullable=True)
    min_ielts = Column(Float, nullable=True)
    min_toefl = Column(Integer, nullable=True)
    min_pte = Column(Integer, nullable=True)
    minimum_cgpa_or_grade = Column(Text, nullable=True)  # e.g. "Typically 2:1 (approx. CGPA 3.3/4.0)"
    english_language_requirements = Column(Text, nullable=True)  # JSON: {ielts, toefl_ibt, pte, notes}
    other_academic_requirements = Column(Text, nullable=True)
    required_documents = Column(Text, nullable=True)  # JSON array of strings
    admission_process = Column(Text, nullable=True)
    admission_notes = Column(Text, nullable=True)  # e.g. "Requirements may vary by course"
    
    # Relationship: One university has many scholarships
    scholarships = relationship("Scholarship", back_populates="university", cascade="all, delete-orphan")

    @property
    def scholarship_count(self):
        return len(self.scholarships)


class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), nullable=True)
    type = Column(String) # deadline_reminder, new_match, etc.
    message = Column(Text)
    status = Column(String, default="sent") # sent, pending, failed
    sent_date = Column(DateTime, default=datetime.datetime.utcnow)

class UserScholarshipInteraction(Base):
    """Tracks user interactions with scholarships for ML training"""
    __tablename__ = "user_scholarship_interactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"), index=True)
    interaction_type = Column(String)  # "view", "save", "apply"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))  # Link to User
    role = Column(String)  # 'user' or 'ai'
    content = Column(Text) # The actual message
    file_name = Column(String, nullable=True) # Agar file thi to uska naam
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationship with User
    user = relationship("User", back_populates="messages")

class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    scholarship_id = Column(Integer, ForeignKey("scholarships.id"))
    
    # Status: 'Saved', 'Applied', 'Interview', 'Rejected', 'Accepted'
    status = Column(String, default="Saved") 
    applied_date = Column(DateTime, default=datetime.datetime.utcnow)
    notes = Column(Text, nullable=True) 

    # Relationships
    user = relationship("User", back_populates="applications")
    scholarship = relationship("Scholarship") 
