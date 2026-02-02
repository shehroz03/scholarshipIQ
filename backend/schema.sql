-- ScholarIQ Database Schema (PostgreSQL)

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    nationality VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    cgpa FLOAT,
    degree_level VARCHAR(50), -- Bachelor's, Master's, PhD
    field_of_interest VARCHAR(255),
    current_university VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scholarships Table
CREATE TABLE scholarships (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    university VARCHAR(255),
    country VARCHAR(100),
    funding_type VARCHAR(50), -- Fully Funded, Partial, etc.
    amount VARCHAR(100),
    deadline TIMESTAMP,
    description TEXT,
    degree_level VARCHAR(50),
    field_of_study VARCHAR(255),
    is_suspicious BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved Scholarships Join Table (Many-to-Many)
CREATE TABLE saved_scholarships (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    scholarship_id INTEGER REFERENCES scholarships(id) ON DELETE CASCADE,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, scholarship_id)
);

-- Initial Mock Data for Scholarships
INSERT INTO scholarships (title, university, country, funding_type, amount, deadline, description, degree_level, field_of_study) 
VALUES 
('Gates Cambridge Scholarship', 'University of Cambridge', 'United Kingdom', 'Fully Funded', '$50,000/year', '2025-12-03', 'Outstanding international students pursuing graduate studies', 'Master''s/PhD', 'All Fields'),
('Fulbright Foreign Student Program', 'Various US Universities', 'United States', 'Fully Funded', '$40,000/year', '2026-01-15', 'Graduate students for study and research in the United States', 'Master''s/PhD', 'All Fields'),
('DAAD Scholarship', 'German Universities', 'Germany', 'Fully Funded', '€1,200/month', '2025-11-30', 'International students pursuing Master''s or PhD in Germany', 'Master''s/PhD', 'All Fields');
