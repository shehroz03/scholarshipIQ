import requests
from bs4 import BeautifulSoup
import csv
import time
import logging
from datetime import datetime
import re
import os

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Output file
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), '../data/UK_Scraped_Scholarships.csv')

# CSV Headers (same as UK_Masters_Top20_Verified.csv)
HEADERS = [
    'uni_name', 'uni_link', 'uni_city', 'uni_country',
    'lat', 'lng', 'map_address',
    'scholarship_name', 'scholarship_link',
    'degree_level', 'field_of_study',
    'original_fee_gbp', 'scholarship_amount_gbp', 'after_scholarship_fee_gbp',
    'cgpa_min', 'deadline',
    'documents_required', 'international_email',
    'whatsapp', 'phone', 'apply_steps',
    'verified', 'source_type'
]

# University base data (geo + contact pre-filled)
UNI_META = {
    "Queen Mary University of London": {
        "uni_link": "https://www.qmul.ac.uk",
        "uni_city": "London",
        "lat": 51.5246, "lng": -0.0400,
        "map_address": "Mile End Rd, London E1 4NS",
        "international_email": "international@qmul.ac.uk",
        "phone": "+44 20 7882 5555",
    },
    "University of Reading": {
        "uni_link": "https://www.reading.ac.uk",
        "uni_city": "Reading",
        "lat": 51.4412, "lng": -0.9430,
        "map_address": "Whiteknights, Reading RG6 6AH",
        "international_email": "student.recruitment@reading.ac.uk",
        "phone": "+44 118 987 5123",
    },
    "Loughborough University": {
        "uni_link": "https://www.lboro.ac.uk",
        "uni_city": "Loughborough",
        "lat": 52.7659, "lng": -1.2257,
        "map_address": "Epinal Way, Loughborough LE11 3TU",
        "international_email": "international@lboro.ac.uk",
        "phone": "+44 1509 222222",
    },
    "University of Surrey": {
        "uni_link": "https://www.surrey.ac.uk",
        "uni_city": "Guildford",
        "lat": 51.2418, "lng": -0.5904,
        "map_address": "Guildford GU2 7XH",
        "international_email": "international@surrey.ac.uk",
        "phone": "+44 1483 300800",
    },
    "University of Bath": {
        "uni_link": "https://www.bath.ac.uk",
        "uni_city": "Bath",
        "lat": 51.3782, "lng": -2.3272,
        "map_address": "Claverton Down, Bath BA2 7AY",
        "international_email": "admissions@bath.ac.uk",
        "phone": "+44 1225 388388",
    },
    "Heriot-Watt University": {
        "uni_link": "https://www.hw.ac.uk",
        "uni_city": "Edinburgh",
        "lat": 55.9097, "lng": -3.3203,
        "map_address": "Edinburgh EH14 4AS",
        "international_email": "international@hw.ac.uk",
        "phone": "+44 131 449 5111",
    },
    "University of Dundee": {
        "uni_link": "https://www.dundee.ac.uk",
        "uni_city": "Dundee",
        "lat": 56.4565, "lng": -2.9779,
        "map_address": "Nethergate, Dundee DD1 4HN",
        "international_email": "international@dundee.ac.uk",
        "phone": "+44 1382 383000",
    },
    "University of Aberdeen": {
        "uni_link": "https://www.abdn.ac.uk",
        "uni_city": "Aberdeen",
        "lat": 57.1654, "lng": -2.0990,
        "map_address": "King's College, Aberdeen AB24 3FX",
        "international_email": "intl-admissions@abdn.ac.uk",
        "phone": "+44 1224 272090",
    },
    "Swansea University": {
        "uni_link": "https://www.swansea.ac.uk",
        "uni_city": "Swansea",
        "lat": 51.6214, "lng": -3.8779,
        "map_address": "Singleton Park, Swansea SA2 8PP",
        "international_email": "international@swansea.ac.uk",
        "phone": "+44 1792 205678",
    },
    "University of Leicester": {
        "uni_link": "https://le.ac.uk",
        "uni_city": "Leicester",
        "lat": 52.6218, "lng": -1.1253,
        "map_address": "University Rd, Leicester LE1 7RH",
        "international_email": "international@le.ac.uk",
        "phone": "+44 116 252 2522",
    },
}

# Target scholarship pages
TARGET_URLS = [
    {
        "uni_name": "Queen Mary University of London",
        "url": "https://www.qmul.ac.uk/international/international-students/fees-and-funding/",
    },
    {
        "uni_name": "University of Reading",
        "url": "https://www.reading.ac.uk/international/fees-and-funding/scholarships",
    },
    {
        "uni_name": "Loughborough University",
        "url": "https://www.lboro.ac.uk/international/fees-and-funding/scholarships/",
    },
    {
        "uni_name": "University of Surrey",
        "url": "https://www.surrey.ac.uk/fees-and-funding/scholarships",
    },
    {
        "uni_name": "University of Bath",
        "url": "https://www.bath.ac.uk/topics/scholarships-and-funding/",
    },
    {
        "uni_name": "Heriot-Watt University",
        "url": "https://www.hw.ac.uk/study/scholarships.htm",
    },
    {
        "uni_name": "University of Dundee",
        "url": "https://www.dundee.ac.uk/scholarships",
    },
    {
        "uni_name": "University of Aberdeen",
        "url": "https://www.abdn.ac.uk/study/international/scholarships.php",
    },
    {
        "uni_name": "Swansea University",
        "url": "https://www.swansea.ac.uk/scholarships/",
    },
    {
        "uni_name": "University of Leicester",
        "url": "https://le.ac.uk/study/international-students/fees-scholarships",
    },
]

HEADERS_HTTP = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    )
}


def clean_text(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip() if text else ""


def extract_amount(text: str) -> int:
    """Extract GBP amount from text like '£5,000' or '5000'"""
    matches = re.findall(r'[\d,]+', text.replace('£', ''))
    for m in matches:
        val = int(m.replace(',', ''))
        if val > 100:
            return val
    return 0


def extract_deadline(text: str) -> str:
    """Try to find a date in text"""
    patterns = [
        r'\d{1,2}\s+\w+\s+\d{4}',
        r'\w+\s+\d{1,2},?\s+\d{4}',
        r'\d{4}-\d{2}-\d{2}',
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group()
    return "2026-07-31"  # default fallback


def scrape_page(uni_name: str, url: str) -> list[dict]:
    """Scrape a single university scholarship page"""
    results = []
    meta = UNI_META.get(uni_name, {})

    try:
        logger.info(f"Scraping: {uni_name} → {url}")
        resp = requests.get(url, headers=HEADERS_HTTP, timeout=15)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.text, 'html.parser')

        # Find scholarship-related sections
        scholarship_blocks = []

        # Try common patterns
        for tag in ['h2', 'h3', 'h4']:
            headings = soup.find_all(tag)
            for h in headings:
                text = clean_text(h.get_text())
                if any(kw in text.lower() for kw in [
                    'scholarship', 'bursary', 'award', 'funding',
                    'international', 'masters', 'postgraduate'
                ]):
                    scholarship_blocks.append(h)

        logger.info(f"  Found {len(scholarship_blocks)} potential blocks")

        seen = set()
        for block in scholarship_blocks[:5]:  # max 5 per uni
            title = clean_text(block.get_text())

            if title in seen or len(title) < 10:
                continue
            seen.add(title)

            # Get surrounding text for amount/deadline
            parent = block.find_parent()
            context = clean_text(parent.get_text()) if parent else title

            # Find link
            link_tag = block.find('a') or (parent.find('a') if parent else None)
            scholarship_link = ""
            if link_tag and link_tag.get('href'):
                href = link_tag['href']
                if href.startswith('http'):
                    scholarship_link = href
                else:
                    base = url.split('/')[0] + '//' + url.split('/')[2]
                    scholarship_link = base + href

            amount = extract_amount(context)
            deadline = extract_deadline(context)
            original_fee = 26000  # UK Masters average
            after_fee = max(original_fee - amount, 0) if amount else original_fee

            row = {
                'uni_name': uni_name,
                'uni_link': meta.get('uni_link', url),
                'uni_city': meta.get('uni_city', ''),
                'uni_country': 'United Kingdom',
                'lat': meta.get('lat', ''),
                'lng': meta.get('lng', ''),
                'map_address': meta.get('map_address', ''),
                'scholarship_name': title[:100],
                'scholarship_link': scholarship_link or url,
                'degree_level': 'Masters',
                'field_of_study': 'All Fields',
                'original_fee_gbp': original_fee,
                'scholarship_amount_gbp': amount,
                'after_scholarship_fee_gbp': after_fee,
                'cgpa_min': 3.0,
                'deadline': deadline,
                'documents_required': 'Transcripts|Personal Statement|IELTS 6.5+|References',
                'international_email': meta.get('international_email', ''),
                'whatsapp': '',
                'phone': meta.get('phone', ''),
                'apply_steps': (
                    '1.Apply for eligible Masters course|'
                    '2.Receive offer|'
                    '3.Complete scholarship application|'
                    '4.Submit required documents|'
                    '5.Wait for scholarship decision'
                ),
                'verified': 'false',
                'source_type': 'scraped',
            }
            results.append(row)

        if not results:
            logger.warning(f"  No scholarships found for {uni_name}")

    except requests.exceptions.Timeout:
        logger.error(f"  TIMEOUT: {uni_name}")
    except requests.exceptions.HTTPError as e:
        logger.error(f"  HTTP ERROR {e.response.status_code}: {uni_name}")
    except Exception as e:
        logger.error(f"  FAILED {uni_name}: {e}")

    return results


def save_to_csv(all_data: list[dict]):
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(all_data)
    logger.info(f"\nSaved {len(all_data)} records → {OUTPUT_FILE}")


def main():
    all_results = []
    failed = []

    print("=" * 60)
    print("ScholarIQ – UK Scholarship Scraper")
    print(f"Target: {len(TARGET_URLS)} universities")
    print("=" * 60)

    for target in TARGET_URLS:
        data = scrape_page(target['uni_name'], target['url'])
        if data:
            all_results.extend(data)
            print(f"✅ {target['uni_name']}: {len(data)} scholarships")
        else:
            failed.append(target['uni_name'])
            print(f"❌ {target['uni_name']}: failed")

        # Respectful delay
        time.sleep(3)

    print("\n" + "=" * 60)
    print(f"Total scraped:  {len(all_results)}")
    print(f"Failed URLs:    {len(failed)}")
    if failed:
        print(f"Failed unis:    {', '.join(failed)}")
    print(f"Output file:    {OUTPUT_FILE}")
    print("=" * 60)

    if all_results:
        save_to_csv(all_results)
    else:
        print("No data scraped. Check internet connection or URLs.")


if __name__ == "__main__":
    main()
