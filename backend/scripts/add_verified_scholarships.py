"""
Run on EC2:
  cd /home/ubuntu/scholarshipIQ
  python3 backend/scripts/add_verified_scholarships.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import sqlite3
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "scholariq.db")

scholarships = [
    # --- MASTERS ---
    {
        "title": "Chevening Scholarship 2026",
        "university_name": "Various UK Universities",
        "country": "United Kingdom", "city": "London",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + GBP 1,200/month + flights + visa",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "The UK Government global scholarship programme offering fully-funded one-year Masters degrees at UK universities. Covers tuition, living allowance, travel, and visa costs. One of the world's most prestigious scholarships.",
        "eligibility": "Pakistani citizens with 2+ years work experience. Minimum 2:1 undergraduate degree. Strong leadership potential. IELTS 6.5 or TOEFL 79+.",
        "scholarship_url": "https://www.chevening.org/",
    },
    {
        "title": "DAAD Scholarship Germany 2026",
        "university_name": "Various German Universities",
        "country": "Germany", "city": "Berlin",
        "funding_type": "Fully Funded",
        "amount": "EUR 850-1,200/month + travel + health insurance",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "German Academic Exchange Service (DAAD) scholarships for international students to study Masters at top German universities. Includes monthly stipend, health insurance, travel allowance, and language courses.",
        "eligibility": "Excellent academic record (3.5/4.0 CGPA equivalent). Pakistani students eligible. German or English language proficiency required.",
        "scholarship_url": "https://www.daad.de/en/",
    },
    {
        "title": "Swedish Institute Scholarship (SISGP) 2026",
        "university_name": "Various Swedish Universities",
        "country": "Sweden", "city": "Stockholm",
        "funding_type": "Fully Funded",
        "amount": "SEK 11,000/month + full tuition waiver",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Swedish Institute Scholarships for Global Professionals (SISGP) fund full Masters studies at Swedish universities. Designed for professionals from developing countries who will contribute to development back home.",
        "eligibility": "Pakistani citizens. Bachelor's degree + 3 years professional experience. Strong leadership record. IELTS 6.5 or TOEFL 90+.",
        "scholarship_url": "https://si.se/en/apply/scholarships/",
    },
    {
        "title": "Australia Awards Scholarship 2026",
        "university_name": "Various Australian Universities",
        "country": "Australia", "city": "Canberra",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + AUD 32,000/year living + flights",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Australian Government scholarships for developing country students. Covers full tuition, living expenses, return airfare, and establishment allowance. Among the most generous scholarships in the world.",
        "eligibility": "Pakistani citizens. Minimum 2.5/4.0 GPA. Priority: Agriculture, Education, Health, Infrastructure, Water, Environment.",
        "scholarship_url": "https://www.australiaawards.gov.au/",
    },
    {
        "title": "Erasmus Mundus Joint Masters 2026",
        "university_name": "Various European Universities",
        "country": "Europe", "city": "Brussels",
        "funding_type": "Fully Funded",
        "amount": "EUR 1,400/month + full tuition waiver",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "EU-funded prestigious joint Masters degrees taught across multiple European universities. Students study in at least 2 European countries. Monthly living stipend and full tuition covered.",
        "eligibility": "Any nationality with bachelor's degree. Competitive academic record required. Each programme has its own specific requirements.",
        "scholarship_url": "https://erasmus-plus.ec.europa.eu/",
    },
    {
        "title": "Türkiye Bursları (Turkish Government Scholarship) 2026",
        "university_name": "Various Turkish Universities",
        "country": "Turkey", "city": "Ankara",
        "funding_type": "Fully Funded",
        "amount": "TRY 3,500/month + tuition + accommodation + flights",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Turkish government scholarships covering full tuition, on-campus accommodation, monthly stipend, health insurance, one-year Turkish language course, and return flights.",
        "eligibility": "Pakistani students under 30 years. Strong academic record. No IELTS required for Turkish-medium programs. English-medium also available.",
        "scholarship_url": "https://www.turkiyeburslari.gov.tr/en",
    },
    {
        "title": "Fulbright Masters Scholarship Pakistan 2026",
        "university_name": "Various US Universities",
        "country": "United States", "city": "Washington DC",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + USD 2,000+/month + flights + health insurance",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Prestigious US government scholarship for Pakistani students to pursue Masters degrees at American universities. Covers full tuition, monthly stipend, airfare, visa fees, health insurance, and pre-departure allowance.",
        "eligibility": "Pakistani citizens. Bachelor's with 3.0/4.0 CGPA. 2 years work experience. IELTS 7.0 or TOEFL 100+. Under 30 preferred. Apply through USEFP.",
        "scholarship_url": "https://www.usefp.org/",
    },
    {
        "title": "Netherlands Government Fellowship (NFP) 2026",
        "university_name": "Various Dutch Universities",
        "country": "Netherlands", "city": "The Hague",
        "funding_type": "Fully Funded",
        "amount": "EUR 1,100/month + full tuition + travel + visa",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Netherlands Fellowship Programme scholarships for professionals from developing countries. Covers full tuition, living allowance, travel, and visa costs for Masters studies at Dutch universities.",
        "eligibility": "Pakistani professionals employed in developing sector. Under 45 years. Relevant work experience essential. IELTS 6.0+.",
        "scholarship_url": "https://www.studyinholland.nl/",
    },
    {
        "title": "Canada Government Scholarships (EduCanada) 2026",
        "university_name": "Various Canadian Universities",
        "country": "Canada", "city": "Ottawa",
        "funding_type": "Fully Funded",
        "amount": "CAD 20,000+ per year including tuition",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Multiple Canadian government-funded scholarships including Vanier Canada Graduate Scholarships and provincial awards. Strong research and innovation focus. One of the top destinations for international students.",
        "eligibility": "Pakistani citizens. Strong academic standing. IELTS 6.5 or TOEFL 90+. Most programs require university nomination.",
        "scholarship_url": "https://www.educanada.ca/",
    },
    {
        "title": "New Zealand Government Scholarship 2026",
        "university_name": "Various New Zealand Universities",
        "country": "New Zealand", "city": "Wellington",
        "funding_type": "Fully Funded",
        "amount": "NZD 20,000+ tuition + NZD 15,000 living + flights",
        "degree_level": "Masters", "field_of_study": "Development",
        "description": "New Zealand Government Scholarships for students from developing countries. Covers full tuition, living allowance, return airfare, and health insurance for eligible programs.",
        "eligibility": "Pakistani citizens nominated by Ministry of Education. Under 40 years. Priority: public health, education, engineering, agriculture. IELTS 6.5+.",
        "scholarship_url": "https://www.nzscholarships.govt.nz/",
    },
    # --- PhD ---
    {
        "title": "Gates Cambridge Scholarship 2026",
        "university_name": "University of Cambridge",
        "country": "United Kingdom", "city": "Cambridge",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + GBP 21,227/year stipend + allowances",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "One of the world's most prestigious scholarships. Gates Cambridge funds outstanding students from outside the UK to pursue a full-time PhD at the University of Cambridge. Covers all fees, maintenance, and opportunity fund.",
        "eligibility": "Exceptional academic achievement, leadership potential, commitment to improving lives. IELTS 7.5 or TOEFL 110+ required.",
        "scholarship_url": "https://www.gatescambridge.org/",
    },
    {
        "title": "Commonwealth Scholarship UK (PhD) 2026",
        "university_name": "Various UK Universities",
        "country": "United Kingdom", "city": "London",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + GBP 1,347/month + flights + thesis grant",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "UK Commonwealth Scholarships for PhD studies at leading UK universities. Funded by the UK government for talented students from developing Commonwealth countries. Includes travel grant and thesis support.",
        "eligibility": "Pakistani citizens (Commonwealth member). Under 35 years. Must demonstrate development impact for Pakistan upon return.",
        "scholarship_url": "https://cscuk.fcdo.gov.uk/",
    },
    {
        "title": "Chinese Government Scholarship (CSC) 2026",
        "university_name": "Various Chinese Universities",
        "country": "China", "city": "Beijing",
        "funding_type": "Fully Funded",
        "amount": "CNY 3,500/month + full tuition + accommodation",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "One of the largest scholarship programs globally. Chinese Government Scholarship covers full tuition, on-campus accommodation, monthly stipend, and health insurance. Available for Bachelors, Masters, and PhD.",
        "eligibility": "Pakistani citizens. Masters degree for PhD applicants. Under 35 years. No IELTS needed for Chinese-medium programs.",
        "scholarship_url": "https://www.csc.edu.cn/",
    },
    {
        "title": "Japanese Government MEXT Scholarship 2026",
        "university_name": "Various Japanese Universities",
        "country": "Japan", "city": "Tokyo",
        "funding_type": "Fully Funded",
        "amount": "JPY 144,000/month + full tuition + airfare",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "Japanese Ministry of Education (MEXT) scholarship for international students. Covers full tuition, monthly stipend, and round-trip airfare. Includes Japanese language training if needed.",
        "eligibility": "Pakistani citizens. Under 34 years for Research Students. Apply through Embassy of Japan in Islamabad. Strong academic record required.",
        "scholarship_url": "https://www.studyinjapan.go.jp/en/",
    },
    {
        "title": "HEC Overseas Scholarship (PhD) 2026",
        "university_name": "Higher Education Commission Pakistan",
        "country": "Multiple Countries", "city": "Islamabad",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + monthly stipend + airfare + health insurance",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "HEC Pakistan Overseas Scholarship for PhD from top foreign universities. Comprehensive package covering all study expenses plus 2-year bond to serve in Pakistan after completion.",
        "eligibility": "Pakistani citizens. MS/M.Phil degree from HEC-recognized Pakistani university. Under 35 years. 2-year service bond required after PhD.",
        "scholarship_url": "https://hec.gov.pk/english/scholarships/",
    },
    {
        "title": "TWAS Research Fellowships 2026",
        "university_name": "The World Academy of Sciences",
        "country": "Multiple Countries", "city": "Trieste",
        "funding_type": "Fully Funded",
        "amount": "USD 15,000-25,000 research grant + airfare",
        "degree_level": "PhD", "field_of_study": "STEM",
        "description": "TWAS (The World Academy of Sciences) fellowships support scientists from developing countries to pursue advanced research. Supports PhD-level research and postdoctoral work at institutions in developing countries.",
        "eligibility": "Pakistani researchers with strong science/technology background. Acceptance from host institution required. Strong research proposal and publications preferred.",
        "scholarship_url": "https://twas.org/",
    },
    {
        "title": "Marie Curie MSCA Doctoral Fellowship 2026",
        "university_name": "Various European Universities",
        "country": "Europe", "city": "Brussels",
        "funding_type": "Fully Funded",
        "amount": "EUR 3,400-5,000/month + mobility allowance",
        "degree_level": "PhD", "field_of_study": "All Fields",
        "description": "Marie Sklodowska-Curie Actions (MSCA) Doctoral Networks fund PhD researchers across Europe. Excellent salary, international mobility, and professional training. Among the best-funded research scholarships globally.",
        "eligibility": "Any nationality. PhD researchers. Must not have lived in host country more than 12 months in last 3 years. Strong research proposal required.",
        "scholarship_url": "https://marie-sklodowska-curie-actions.ec.europa.eu/",
    },
    # --- ALL LEVELS ---
    {
        "title": "Korean Government Scholarship (GKS-KGSP) 2026",
        "university_name": "Various Korean Universities",
        "country": "South Korea", "city": "Seoul",
        "funding_type": "Fully Funded",
        "amount": "KRW 1,000,000/month + tuition + airfare + Korean language course",
        "degree_level": "Masters", "field_of_study": "All Fields",
        "description": "Korean Government Scholarship Program (KGSP/GKS) for international students. Covers tuition, living allowance, round-trip airfare, Korean language training, and health insurance.",
        "eligibility": "Pakistani citizens. Bachelor's with min 2.64/4.0 GPA. Under 40 years. Korean or English language proficiency. Not enrolled in another government scholarship.",
        "scholarship_url": "https://www.studyinkorea.go.kr/en/",
    },
    {
        "title": "Aga Khan Foundation International Scholarship 2026",
        "university_name": "Aga Khan Foundation",
        "country": "Multiple Countries", "city": "Geneva",
        "funding_type": "Fully Funded",
        "amount": "Need-based: full tuition + living costs (50% grant + 50% loan)",
        "degree_level": "Masters", "field_of_study": "Development",
        "description": "The Aga Khan Foundation International Scholarship Programme provides need and merit-based scholarships for postgraduate studies. Priority for students who cannot otherwise fund their studies.",
        "eligibility": "Pakistani students. Excellent academic record + demonstrated financial need. Enrolled or admitted to Masters/PhD. Priority: development, architecture, health, education, environment.",
        "scholarship_url": "https://www.akdn.org/",
    },
    {
        "title": "IsDB Merit Scholarship for Science & Technology 2026",
        "university_name": "Islamic Development Bank",
        "country": "Multiple Countries", "city": "Jeddah",
        "funding_type": "Fully Funded",
        "amount": "Full tuition + USD 600/month stipend",
        "degree_level": "Masters", "field_of_study": "STEM",
        "description": "Islamic Development Bank Merit Scholarship for Muslim students from member countries. Covers science and technology fields at universities in member countries. Includes tuition, living allowance, and health insurance.",
        "eligibility": "Pakistani Muslim students. Excellent academic record. STEM-related degree required. Under 30 years for Masters. Strong commitment to development.",
        "scholarship_url": "https://www.isdb.org/",
    },
]

def main():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    inserted = 0
    skipped = 0
    now = datetime.utcnow().isoformat()

    for s in scholarships:
        # Skip if already exists (same title + country)
        c.execute("SELECT id FROM scholarships WHERE title = ? AND country = ?", (s["title"], s["country"]))
        if c.fetchone():
            print(f"  SKIP (exists): {s['title']}")
            skipped += 1
            continue

        c.execute("""
            INSERT INTO scholarships (
                title, university_name, country, city,
                funding_type, amount, degree_level, field_of_study,
                description, eligibility, scholarship_url,
                approval_status, is_active, is_archived, is_suspicious,
                open_to_pakistani, fraud_risk_level, fraud_risk_score,
                has_separate_form, application_type, button_label,
                scholarship_verified, tuition_verified, created_at
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                'approved', 1, 0, 0,
                1, 'SAFE', 0.0,
                1, 'direct_form', 'Apply Now',
                'verified', 'not_verified', ?
            )
        """, (
            s["title"], s["university_name"], s["country"], s["city"],
            s["funding_type"], s["amount"], s["degree_level"], s["field_of_study"],
            s["description"], s["eligibility"], s["scholarship_url"],
            now
        ))
        print(f"  ADDED: {s['title']}")
        inserted += 1

    conn.commit()
    conn.close()
    print(f"\nDone! Inserted: {inserted}, Skipped (already exist): {skipped}")

if __name__ == "__main__":
    main()
