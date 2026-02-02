# UK University Data Curator – Flow

## Goal
Enrich UK universities in ScholarIQ with:
- Clean university profile (short_description, campus_type, official_contact_page)
- Direct scholarship links (official_link → stored as scholarship_url / scholarship_source_url)
- Clear admission requirements (CGPA/grade, IELTS/TOEFL, required documents)

**Use only official sources** (.ac.uk, .gov.uk). No agents or third-party blogs.

---

## 1. Give the AI your existing UK data

Export or build a JSON like:

```json
{
  "country": "United Kingdom",
  "universities": [
    {
      "university_name": "University of Cambridge",
      "city": "Cambridge",
      "website_url": "https://www.cam.ac.uk",
      "scholarships": [
        {
          "id": 101,
          "title": "Gates Cambridge Scholarship",
          "degree_level": "Masters",
          "official_link": "https://www.gatescambridge.org/",
          "funding_type": "Fully Funded"
        }
      ]
    }
  ]
}
```

Paste this into your STRICT DATA CURATOR prompt (the one that returns enriched JSON).

---

## 2. Get back enriched JSON

The curator should return JSON in this shape (see `uk_universities_enriched.example.json`):

- **University:** short_description, campus_type, founded_year, official_contact_page  
- **admission_requirements:** minimum_cgpa_or_grade, english_language_requirements (object with ielts, toefl_ibt, notes), other_academic_requirements  
- **required_documents:** array of strings  
- **scholarship_overview:** per scholarship: title, provider_type, official_link, degree_levels, who_it_is_for, key_benefits  

Save the response as:

`backend/data/uk_universities_enriched.json`

---

## 3. Run migration (once)

From project root:

```bash
cd backend
python migrate_uk_university_fields.py
```

This adds the new university columns (short_description, campus_type, official_contact_page, minimum_cgpa_or_grade, english_language_requirements, other_academic_requirements, required_documents, admission_notes).

---

## 4. Seed enriched data

```bash
cd backend
python seed_uk_university_enrichment.py
```

Or with a custom JSON path:

```bash
python seed_uk_university_enrichment.py path/to/your_enriched.json
```

This updates universities **by name** (university_name in JSON must match `universities.name` in the DB).

---

## 5. Scholarship official links

For each scholarship, ensure either:

- `scholarship_url` or  
- `scholarship_source_url`  

is set to the **official** application/scholarship page.  
The Detail page shows a single primary button: **“Visit Official Scholarship Page”** using `scholarship_url || scholarship_source_url`.

You can set these via admin verification API or by updating the scholarships table (e.g. from your curator’s `scholarship_overview[].official_link`).

---

## 6. What appears on the Detail page

- **Top banner:** University name, short_description (if present), campus_type, Official Portal, Contact/International link (official_contact_page).
- **Requirements tab:**  
  - **Admission requirements:** minimum_cgpa_or_grade and/or numeric min_cgpa; other_academic_requirements.  
  - **English:** Parsed from university’s english_language_requirements JSON (IELTS/TOEFL/PTE + notes), or fallback to min_ielts / min_toefl / min_pte.  
  - **Required documents:** From university’s required_documents JSON array, or default list.  
  - **admission_notes** shown when present.
- **Scholarships:** One primary button: **“Visit Official Scholarship Page”** (link = scholarship_url or scholarship_source_url).

No prose outside JSON; all curator output is structured so it can be stored and shown on the Detail page as above.
