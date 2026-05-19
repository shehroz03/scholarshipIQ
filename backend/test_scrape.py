import asyncio
from app.db.session import SessionLocal
from app.services.scraper_service import scrape_and_import

async def run_test_scrape():
    db = SessionLocal()
    print("Starting Test Scrape & Import...")
    results = await scrape_and_import(db, triggered_by="test_verification")
    print(f"Results: {results}")
    db.close()

if __name__ == "__main__":
    asyncio.run(run_test_scrape())
