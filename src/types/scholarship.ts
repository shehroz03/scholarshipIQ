export interface EnglishRequirements {
    ielts?: string;
    toefl?: string;
    pte?: string;
    notes?: string;
}

export interface University {
    id: number;
    name: string;
    city: string;
    country: string;
    website_url?: string;
    phone?: string;
    address?: string;
    established_year?: number;
    qs_ranking?: number;
    logo_url?: string;
    image_url?: string;
    scholarship_count?: number;
    min_cgpa?: number;
    min_ielts?: number;
    min_toefl?: number;
    min_pte?: number;
    admission_process?: string;
    // UK Curator / Enriched
    short_description?: string;
    campus_type?: string;
    official_contact_page?: string;
    minimum_cgpa_or_grade?: string;
    english_language_requirements?: string;
    other_academic_requirements?: string;
    required_documents?: string;
    admission_notes?: string;
    latitude?: number;
    longitude?: number;
}

export interface Scholarship {
    id: number;
    title: string;
    university_id: number;
    university_name: string;
    country: string;
    city: string;
    degree_level: string;
    funding_type: string;
    funding_amount: string;
    amount: string; // Legacy field used in some components
    deadline: string;
    description: string;
    scholarship_url?: string;
    website_url?: string;
    has_separate_form?: boolean;

    // Smart Application System
    application_type?: "direct_form" | "portal_application" | "auto_considered";
    button_label?: string;
    user_note?: string;

    // Financials
    tuition_fee_per_year?: string;
    tuition_fee_numeric?: number;
    net_cost_per_year?: string;
    net_cost_numeric?: number;
    scholarship_amount_value?: string;
    scholarship_amount_numeric?: number;
    scholarship_type?: string;
    currency?: string;
    net_cost_assumptions?: string;

    // Verification
    tuition_verified?: string;
    scholarship_verified?: string;
    tuition_source_url?: string;
    scholarship_source_url?: string;
    verification_notes?: string;
    verified_at?: string;
    is_suspicious?: boolean;

    // Additional Metadata
    field_of_study?: string;
    duration_text?: string;
    latitude?: number;
    longitude?: number;

    // Nested Objects
    university?: University;
    match_score?: number;
}
