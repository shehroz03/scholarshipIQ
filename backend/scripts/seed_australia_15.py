"""
Seed 15 Real Australia Scholarships into scholariq.db
All fields filled for model matching:
- CGPA, IELTS, TOEFL, funding_type, field_of_study, degree_level
- country, city, lat/lng, deadline, amount, net_cost
- approval_status = approved, is_active = True, fraud = SAFE
"""
import sqlite3
import os
import sys
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "scholariq.db")

UNIVERSITIES = [
    {"name": "University of Melbourne",    "city": "Melbourne", "country": "Australia", "lat": -37.7963, "lng": 144.9614, "website": "https://www.unimelb.edu.au", "ranking": 33},
    {"name": "Australian National University","city": "Canberra","country": "Australia","lat": -35.2777,"lng": 149.1185,"website": "https://www.anu.edu.au","ranking": 30},
    {"name": "University of Sydney",        "city": "Sydney",    "country": "Australia", "lat": -33.8882, "lng": 151.1873, "website": "https://www.sydney.edu.au", "ranking": 18},
    {"name": "University of Queensland",    "city": "Brisbane",  "country": "Australia", "lat": -27.4975, "lng": 153.0137, "website": "https://www.uq.edu.au",     "ranking": 47},
    {"name": "Monash University",           "city": "Melbourne", "country": "Australia", "lat": -37.9105, "lng": 145.1362, "website": "https://www.monash.edu",    "ranking": 57},
    {"name": "University of New South Wales","city":"Sydney",    "country": "Australia", "lat": -33.9173, "lng": 151.2313, "website": "https://www.unsw.edu.au",   "ranking": 19},
    {"name": "University of Western Australia","city":"Perth",   "country": "Australia", "lat": -31.9801, "lng": 115.8181, "website": "https://www.uwa.edu.au",    "ranking": 90},
    {"name": "University of Adelaide",      "city": "Adelaide",  "country": "Australia", "lat": -34.9204, "lng": 138.6007, "website": "https://www.adelaide.edu.au","ranking": 109},
]

SCHOLARSHIPS = [
    # 1 - University of Melbourne
    {
        "title": "Melbourne International Undergraduate Scholarship",
        "uni_name": "University of Melbourne",
        "funding_type": "Partial",
        "amount": "A$10,000",
        "scholarship_amount_numeric": 10000,
        "scholarship_amount_value": "A$10,000 award",
        "tuition_fee_numeric": 42000,
        "tuition_fee_per_year": "A$42,000 per year",
        "net_cost_numeric": 32000,
        "net_cost_per_year": "A$32,000 net",
        "currency": "AUD",
        "deadline": "2025-10-31",
        "degree_level": "Masters",
        "field_of_study": "All",
        "min_cgpa": 3.0,
        "min_ielts": 6.5,
        "min_toefl": 79,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://scholarships.unimelb.edu.au/awards/melbourne-international-undergraduate-scholarship",
        "description": "Awarded to high-achieving international students based on academic merit. Open to all fields of study at Masters level.",
        "eligibility": "CGPA 3.0+, IELTS 6.5+, international student status required.",
        "duration_text": "1-2 years",
    },
    # 2
    {
        "title": "Graduate Research Scholarship - University of Melbourne",
        "uni_name": "University of Melbourne",
        "funding_type": "Fully Funded",
        "amount": "A$35,000",
        "scholarship_amount_numeric": 35000,
        "scholarship_amount_value": "A$35,000 stipend/year",
        "tuition_fee_numeric": 45000,
        "tuition_fee_per_year": "A$45,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "A$0 (fully covered)",
        "currency": "AUD",
        "deadline": "2025-08-31",
        "degree_level": "PhD",
        "field_of_study": "Research",
        "min_cgpa": 3.5,
        "min_ielts": 7.0,
        "min_toefl": 94,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://scholarships.unimelb.edu.au/awards/graduate-research-scholarship",
        "description": "Full tuition waiver plus living stipend for PhD students. One of Australia's most prestigious research scholarships.",
        "eligibility": "First-class honours or equivalent, strong research proposal required.",
        "duration_text": "3-4 years",
    },
    # 3 - ANU
    {
        "title": "ANU Chancellor's International Scholarship",
        "uni_name": "Australian National University",
        "funding_type": "Partial",
        "amount": "A$14,000",
        "scholarship_amount_numeric": 14000,
        "scholarship_amount_value": "A$14,000 per year",
        "tuition_fee_numeric": 44000,
        "tuition_fee_per_year": "A$44,000 per year",
        "net_cost_numeric": 30000,
        "net_cost_per_year": "A$30,000 net",
        "currency": "AUD",
        "deadline": "2025-09-15",
        "degree_level": "Masters",
        "field_of_study": "All",
        "min_cgpa": 3.2,
        "min_ielts": 6.5,
        "min_toefl": 80,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.anu.edu.au/study/scholarships/find-a-scholarship/anu-chancellors-international-scholarship",
        "description": "Competitive merit-based scholarship for international students applying to Masters programs at ANU.",
        "eligibility": "International students with outstanding academic record. CGPA 3.2+ equivalent.",
        "duration_text": "1-2 years",
    },
    # 4 - ANU PhD
    {
        "title": "ANU HDR Fee Remission Merit Scholarship",
        "uni_name": "Australian National University",
        "funding_type": "Fully Funded",
        "amount": "A$40,000",
        "scholarship_amount_numeric": 40000,
        "scholarship_amount_value": "A$40,000 stipend",
        "tuition_fee_numeric": 46000,
        "tuition_fee_per_year": "A$46,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "Fully Funded",
        "currency": "AUD",
        "deadline": "2025-10-01",
        "degree_level": "PhD",
        "field_of_study": "Science, Engineering, Computer Science",
        "min_cgpa": 3.5,
        "min_ielts": 7.0,
        "min_toefl": 94,
        "requires_work_exp": True,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.anu.edu.au/study/scholarships/find-a-scholarship/anu-hdr-fee-remission-merit-scholarship",
        "description": "Covers full tuition fees and provides living allowance for PhD research students in STEM fields.",
        "eligibility": "Honours/Masters degree, research publications preferred, work experience beneficial.",
        "duration_text": "3-4 years",
    },
    # 5 - University of Sydney
    {
        "title": "University of Sydney International Scholarship (USydIS)",
        "uni_name": "University of Sydney",
        "funding_type": "Partial",
        "amount": "A$10,000",
        "scholarship_amount_numeric": 10000,
        "scholarship_amount_value": "A$10,000 award",
        "tuition_fee_numeric": 47000,
        "tuition_fee_per_year": "A$47,000 per year",
        "net_cost_numeric": 37000,
        "net_cost_per_year": "A$37,000 net",
        "currency": "AUD",
        "deadline": "2025-11-15",
        "degree_level": "Masters",
        "field_of_study": "All",
        "min_cgpa": 3.0,
        "min_ielts": 6.5,
        "min_toefl": 85,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.sydney.edu.au/scholarships/e/university-of-sydney-international-scholarship.html",
        "description": "Merit-based scholarship for international students enrolling in coursework Masters at the University of Sydney.",
        "eligibility": "Strong academic record (distinction average), international student status.",
        "duration_text": "1-2 years",
    },
    # 6 - University of Sydney Engineering
    {
        "title": "Sydney Scholars Australia Scholarship",
        "uni_name": "University of Sydney",
        "funding_type": "Partial",
        "amount": "A$6,000",
        "scholarship_amount_numeric": 6000,
        "scholarship_amount_value": "A$6,000 per year",
        "tuition_fee_numeric": 47000,
        "tuition_fee_per_year": "A$47,000 per year",
        "net_cost_numeric": 41000,
        "net_cost_per_year": "A$41,000 net",
        "currency": "AUD",
        "deadline": "2025-12-01",
        "degree_level": "Masters",
        "field_of_study": "Engineering, Computer Science, IT",
        "min_cgpa": 2.8,
        "min_ielts": 6.5,
        "min_toefl": 79,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.sydney.edu.au/scholarships/e/sydney-scholars-australia-scholarship.html",
        "description": "Supports international engineering and IT Masters students at University of Sydney with partial fee reduction.",
        "eligibility": "Engineering/IT/CS background, CGPA 2.8+, IELTS 6.5+.",
        "duration_text": "1.5-2 years",
    },
    # 7 - UQ Masters
    {
        "title": "UQ Masters Scholarship for International Students",
        "uni_name": "University of Queensland",
        "funding_type": "Partial",
        "amount": "A$15,000",
        "scholarship_amount_numeric": 15000,
        "scholarship_amount_value": "A$15,000 per year",
        "tuition_fee_numeric": 41000,
        "tuition_fee_per_year": "A$41,000 per year",
        "net_cost_numeric": 26000,
        "net_cost_per_year": "A$26,000 net",
        "currency": "AUD",
        "deadline": "2025-09-30",
        "degree_level": "Masters",
        "field_of_study": "Business, Finance, Management",
        "min_cgpa": 3.0,
        "min_ielts": 6.5,
        "min_toefl": 87,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://scholarships.uq.edu.au/scholarship/uq-masters-scholarship",
        "description": "Prestigious scholarship for international Masters students joining UQ Business School or related faculties.",
        "eligibility": "CGPA 3.0+, IELTS 6.5+, applying to Masters in Business/Finance/Management.",
        "duration_text": "1-2 years",
    },
    # 8 - UQ PhD
    {
        "title": "UQ Graduate School Scholarship (UQGSS)",
        "uni_name": "University of Queensland",
        "funding_type": "Fully Funded",
        "amount": "A$32,500",
        "scholarship_amount_numeric": 32500,
        "scholarship_amount_value": "A$32,500 per year stipend",
        "tuition_fee_numeric": 42000,
        "tuition_fee_per_year": "A$42,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "Fully Funded",
        "currency": "AUD",
        "deadline": "2025-07-31",
        "degree_level": "PhD",
        "field_of_study": "Science, Health, Engineering",
        "min_cgpa": 3.5,
        "min_ielts": 6.5,
        "min_toefl": 87,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://scholarships.uq.edu.au/scholarship/uq-graduate-school-scholarship",
        "description": "Full tuition + living allowance for top PhD applicants across Science, Health, and Engineering disciplines.",
        "eligibility": "First class Honours or equivalent Masters. Strong research background.",
        "duration_text": "3.5 years",
    },
    # 9 - Monash Masters
    {
        "title": "Monash International Merit Scholarship",
        "uni_name": "Monash University",
        "funding_type": "Partial",
        "amount": "A$10,000",
        "scholarship_amount_numeric": 10000,
        "scholarship_amount_value": "A$10,000 award",
        "tuition_fee_numeric": 40000,
        "tuition_fee_per_year": "A$40,000 per year",
        "net_cost_numeric": 30000,
        "net_cost_per_year": "A$30,000 net",
        "currency": "AUD",
        "deadline": "2025-10-15",
        "degree_level": "Masters",
        "field_of_study": "All",
        "min_cgpa": 3.0,
        "min_ielts": 6.5,
        "min_toefl": 79,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.monash.edu/scholarships/find/monash-international-merit-scholarship",
        "description": "Merit-based award for outstanding international students commencing Masters at Monash University.",
        "eligibility": "Minimum 3.0 GPA, IELTS 6.5+. Open to all nationalities and all faculties.",
        "duration_text": "1-2 years",
    },
    # 10 - Monash PhD
    {
        "title": "Monash Graduate Scholarship (MGS)",
        "uni_name": "Monash University",
        "funding_type": "Fully Funded",
        "amount": "A$33,000",
        "scholarship_amount_numeric": 33000,
        "scholarship_amount_value": "A$33,000 per year stipend",
        "tuition_fee_numeric": 40000,
        "tuition_fee_per_year": "A$40,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "Fully Funded",
        "currency": "AUD",
        "deadline": "2025-08-15",
        "degree_level": "PhD",
        "field_of_study": "All",
        "min_cgpa": 3.5,
        "min_ielts": 7.0,
        "min_toefl": 94,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.monash.edu/scholarships/find/monash-graduate-scholarship",
        "description": "Covers full tuition + generous living stipend for PhD candidates. One of Australia's most competitive PhD funding packages.",
        "eligibility": "First-class Honours, strong research proposal, supervisor confirmed.",
        "duration_text": "3-4 years",
    },
    # 11 - UNSW
    {
        "title": "UNSW International Scientia Scholarship",
        "uni_name": "University of New South Wales",
        "funding_type": "Fully Funded",
        "amount": "A$50,000",
        "scholarship_amount_numeric": 50000,
        "scholarship_amount_value": "A$50,000 per year",
        "tuition_fee_numeric": 48000,
        "tuition_fee_per_year": "A$48,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "Fully Funded + Surplus",
        "currency": "AUD",
        "deadline": "2025-07-01",
        "degree_level": "PhD",
        "field_of_study": "Science, Engineering, Technology",
        "min_cgpa": 3.7,
        "min_ielts": 7.0,
        "min_toefl": 100,
        "requires_work_exp": True,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.unsw.edu.au/research/hdr/scholarships/international-scientia-phd-scholarship",
        "description": "UNSW's most prestigious scholarship — covers tuition, provides A$50,000 stipend and career development fund for elite PhD students.",
        "eligibility": "Exceptional academic record, research publications, leadership experience. IELTS 7.0+.",
        "duration_text": "4 years",
    },
    # 12 - UNSW Masters
    {
        "title": "UNSW Global Academic Award",
        "uni_name": "University of New South Wales",
        "funding_type": "Partial",
        "amount": "A$10,000",
        "scholarship_amount_numeric": 10000,
        "scholarship_amount_value": "A$10,000 per year",
        "tuition_fee_numeric": 48000,
        "tuition_fee_per_year": "A$48,000 per year",
        "net_cost_numeric": 38000,
        "net_cost_per_year": "A$38,000 net",
        "currency": "AUD",
        "deadline": "2025-11-01",
        "degree_level": "Masters",
        "field_of_study": "Computer Science, Engineering, Business",
        "min_cgpa": 3.2,
        "min_ielts": 6.5,
        "min_toefl": 85,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.unsw.edu.au/study/international/scholarships/unsw-global-academic-award",
        "description": "For high-achieving international students enrolling in Masters programs at UNSW in CS, Engineering, or Business.",
        "eligibility": "CGPA 3.2+, IELTS 6.5+, strong academic transcript.",
        "duration_text": "1.5-2 years",
    },
    # 13 - UWA
    {
        "title": "UWA Global Excellence Scholarship",
        "uni_name": "University of Western Australia",
        "funding_type": "Partial",
        "amount": "A$7,500",
        "scholarship_amount_numeric": 7500,
        "scholarship_amount_value": "A$7,500 per semester",
        "tuition_fee_numeric": 36000,
        "tuition_fee_per_year": "A$36,000 per year",
        "net_cost_numeric": 21000,
        "net_cost_per_year": "A$21,000 net",
        "currency": "AUD",
        "deadline": "2025-12-15",
        "degree_level": "Masters",
        "field_of_study": "All",
        "min_cgpa": 2.8,
        "min_ielts": 6.5,
        "min_toefl": 82,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.uwa.edu.au/study/scholarships/find-a-scholarship/uwa-global-excellence-scholarship",
        "description": "Supports international students with strong academic backgrounds across all disciplines at UWA Masters level.",
        "eligibility": "Minimum CGPA 2.8, IELTS 6.5, international student.",
        "duration_text": "1-2 years",
    },
    # 14 - University of Adelaide
    {
        "title": "Adelaide Scholarship International (ASI)",
        "uni_name": "University of Adelaide",
        "funding_type": "Fully Funded",
        "amount": "A$38,000",
        "scholarship_amount_numeric": 38000,
        "scholarship_amount_value": "A$38,000 stipend + tuition",
        "tuition_fee_numeric": 38000,
        "tuition_fee_per_year": "A$38,000 per year",
        "net_cost_numeric": 0,
        "net_cost_per_year": "Fully Funded",
        "currency": "AUD",
        "deadline": "2025-09-01",
        "degree_level": "PhD",
        "field_of_study": "All",
        "min_cgpa": 3.5,
        "min_ielts": 6.5,
        "min_toefl": 79,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.adelaide.edu.au/scholarships/postgraduate/research/adelaide-scholarship-international",
        "description": "Full tuition waiver plus living stipend for international PhD students at University of Adelaide. Highly competitive.",
        "eligibility": "First-class Honours or equivalent. IELTS 6.5+. Supervisor confirmation required.",
        "duration_text": "3.5 years",
    },
    # 15 - University of Adelaide Masters
    {
        "title": "University of Adelaide Masters Merit Scholarship",
        "uni_name": "University of Adelaide",
        "funding_type": "Partial",
        "amount": "A$8,000",
        "scholarship_amount_numeric": 8000,
        "scholarship_amount_value": "A$8,000 award",
        "tuition_fee_numeric": 38000,
        "tuition_fee_per_year": "A$38,000 per year",
        "net_cost_numeric": 30000,
        "net_cost_per_year": "A$30,000 net",
        "currency": "AUD",
        "deadline": "2025-11-30",
        "degree_level": "Masters",
        "field_of_study": "Engineering, Health Sciences, Business",
        "min_cgpa": 3.0,
        "min_ielts": 6.5,
        "min_toefl": 79,
        "requires_work_exp": False,
        "open_to_pakistani": True,
        "scholarship_url": "https://www.adelaide.edu.au/scholarships/postgraduate/coursework",
        "description": "Merit-based partial scholarship for international students in Engineering, Health Sciences, or Business at Masters level.",
        "eligibility": "CGPA 3.0+, IELTS 6.5+, applying to eligible Masters programs.",
        "duration_text": "1-2 years",
    },
]

def seed():
    if not os.path.exists(DB_PATH):
        print(f"❌ DB not found at: {DB_PATH}")
        sys.exit(1)

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    now = datetime.now().isoformat()

    uni_ids = {}

    print("🌏 Step 1: Inserting/Updating Universities...")
    for u in UNIVERSITIES:
        cursor.execute("SELECT id FROM universities WHERE name = ?", (u["name"],))
        row = cursor.fetchone()
        if row:
            uni_ids[u["name"]] = row[0]
            cursor.execute("""
                UPDATE universities SET city=?, country=?, latitude=?, longitude=?,
                website_url=?, qs_ranking=? WHERE id=?
            """, (u["city"], u["country"], u["lat"], u["lng"], u["website"], u["ranking"], row[0]))
            print(f"  ✏️  Updated: {u['name']}")
        else:
            cursor.execute("""
                INSERT INTO universities (name, city, country, latitude, longitude, website_url, qs_ranking)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (u["name"], u["city"], u["country"], u["lat"], u["lng"], u["website"], u["ranking"]))
            uni_ids[u["name"]] = cursor.lastrowid
            print(f"  ➕ Inserted: {u['name']} (id={uni_ids[u['name']]})")

    conn.commit()

    print("\n🎓 Step 2: Inserting Scholarships...")
    inserted = 0
    skipped = 0

    for s in SCHOLARSHIPS:
        uni_id = uni_ids.get(s["uni_name"])
        if not uni_id:
            print(f"  ⚠️  University not found for: {s['title']}")
            skipped += 1
            continue

        # Skip if already exists
        cursor.execute("SELECT id FROM scholarships WHERE title = ? AND university_id = ?", (s["title"], uni_id))
        if cursor.fetchone():
            print(f"  ⏭️  Already exists: {s['title'][:55]}")
            skipped += 1
            continue

        # Get lat/lng from university
        uni_info = next((u for u in UNIVERSITIES if u["name"] == s["uni_name"]), {})

        cursor.execute("""
            INSERT INTO scholarships (
                title, university_id, country, city,
                funding_type, amount,
                scholarship_amount_numeric, scholarship_amount_value,
                tuition_fee_numeric, tuition_fee_per_year,
                net_cost_numeric, net_cost_per_year,
                currency, deadline,
                degree_level, field_of_study,
                min_cgpa, min_ielts, min_toefl,
                requires_work_exp, open_to_pakistani,
                scholarship_url, website_url,
                description, eligibility, duration_text,
                latitude, longitude,
                is_active, is_suspicious, is_archived,
                approval_status,
                fraud_risk_score, fraud_risk_level, fraud_reasons,
                tuition_verified, scholarship_verified,
                has_separate_form, application_type, button_label,
                created_at
            ) VALUES (
                ?,?,?,?,
                ?,?,
                ?,?,
                ?,?,
                ?,?,
                ?,?,
                ?,?,
                ?,?,?,
                ?,?,
                ?,?,
                ?,?,?,
                ?,?,
                ?,?,?,
                ?,
                ?,?,?,
                ?,?,
                ?,?,?,
                ?
            )
        """, (
            s["title"], uni_id, "Australia", uni_info.get("city", ""),
            s["funding_type"], s["amount"],
            s["scholarship_amount_numeric"], s["scholarship_amount_value"],
            s["tuition_fee_numeric"], s["tuition_fee_per_year"],
            s["net_cost_numeric"], s["net_cost_per_year"],
            "AUD", s["deadline"],
            s["degree_level"], s["field_of_study"],
            s["min_cgpa"], s["min_ielts"], s["min_toefl"],
            1 if s["requires_work_exp"] else 0, 1 if s["open_to_pakistani"] else 0,
            s["scholarship_url"], uni_info.get("website", ""),
            s["description"], s["eligibility"], s["duration_text"],
            uni_info.get("lat", 0), uni_info.get("lng", 0),
            1, 0, 0,
            "approved",
            0.0, "SAFE", "[]",
            "verified", "verified",
            1, "direct_form", "Apply Now 🎯",
            now
        ))
        inserted += 1
        print(f"  ✅ Inserted: {s['title'][:60]} ({s['degree_level']}, CGPA≥{s['min_cgpa']})")

    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"✅ Done! Inserted: {inserted} | Skipped: {skipped}")
    print(f"{'='*60}")
    print("\nVerify with: SELECT title, degree_level, min_cgpa, funding_type, approval_status FROM scholarships WHERE country='Australia';")

if __name__ == "__main__":
    seed()
