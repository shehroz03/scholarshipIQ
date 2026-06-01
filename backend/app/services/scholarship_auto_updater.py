"""
ScholarIQ Auto-Update Service
==============================
Uses Serper (Google Search) + GPT-4o to automatically detect and apply
changes to scholarship data every 3 days.

Strategy:
- Process scholarships in rotating batches (15 per run) to save API credits
- Prioritize scholarships not checked recently
- Use AI to extract structured changes from search results
- Update DB only when actual changes detected
- Log everything for admin review
"""

import os
import json
import httpx
import asyncio
from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app.db.models import Scholarship
from dotenv import load_dotenv

load_dotenv()

BATCH_SIZE = 6   # scholarships per run (small = stable, saves API credits)
DAYS_BETWEEN_CHECKS = 4  # check each scholarship every 4 days (was 3)


async def _serper_search(query: str) -> str:
    """Search Google via Serper API. Returns top snippets as text."""
    api_key = os.getenv("SERPER_API_KEY", "")
    if not api_key:
        return ""
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.post(
                "https://google.serper.dev/search",
                headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
                json={"q": query, "num": 5, "gl": "us", "hl": "en"}
            )
            data = resp.json()
            parts = []
            for item in data.get("organic", [])[:5]:
                title = item.get("title", "")
                snippet = item.get("snippet", "")
                link = item.get("link", "")
                if snippet:
                    parts.append(f"- {title}: {snippet} ({link})")
            return "\n".join(parts)
    except Exception as e:
        print(f"[AutoUpdater] Serper error: {e}")
        return ""


def _call_gpt_extract(old_data: dict, search_results: str) -> Optional[dict]:
    """
    Ask GPT-4o to compare old scholarship data with fresh search results.
    Returns dict of changed fields, or None if no changes.
    """
    openai_key = os.getenv("OPENAI_API_KEY", "")
    if not openai_key:
        return None

    prompt = f"""You are a scholarship data verification expert. 
Compare the CURRENT scholarship record with FRESH web search results.
Extract only VERIFIED changes. Be conservative — only report changes when you are 90%+ confident.

CURRENT SCHOLARSHIP DATA:
- Title: {old_data.get('title')}
- University: {old_data.get('university_name')}
- Country: {old_data.get('country')}
- Deadline: {old_data.get('deadline')}
- Amount: {old_data.get('amount')}
- Funding Type: {old_data.get('funding_type')}
- CGPA Min: {old_data.get('cgpa_min')}
- URL: {old_data.get('scholarship_url')}

FRESH WEB SEARCH RESULTS:
{search_results}

Respond ONLY in JSON. If no changes detected, return {{"no_changes": true}}.
If changes found, return only the changed fields:
{{
  "deadline": "YYYY-MM-DD or null if not found",
  "amount": "new amount string or null",
  "funding_type": "Fully Funded or Partial or null",
  "cgpa_min": number or null,
  "is_active": true/false (false if scholarship is discontinued),
  "notes": "brief explanation of what changed"
}}
Only include fields that actually changed. Do NOT guess."""

    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            temperature=0.1,
            response_format={"type": "json_object"}
        )
        result = json.loads(response.choices[0].message.content)
        if result.get("no_changes"):
            return None
        return result
    except Exception as e:
        print(f"[AutoUpdater] GPT error: {e}")
        return None


async def auto_update_scholarships(db: Session, batch_size: int = BATCH_SIZE) -> dict:
    """
    Main auto-update function. Processes a small batch of scholarships.
    Called by scheduler every 4 days. Batch kept small (6) to avoid
    API timeouts and preserve Serper + OpenAI credits.
    """
    # Guard: skip if API keys missing
    if not os.getenv("SERPER_API_KEY") or not os.getenv("OPENAI_API_KEY"):
        print("[AutoUpdater] Skipping: SERPER_API_KEY or OPENAI_API_KEY not set.")
        return {"checked": 0, "updated": 0, "errors": 0, "skip_reason": "missing_api_keys"}

    print(f"[AutoUpdater] Starting scholarship auto-update run... (batch: {batch_size})")
    
    cutoff_date = datetime.now() - timedelta(days=DAYS_BETWEEN_CHECKS)
    
    # Get scholarships not checked recently — prioritize oldest
    scholarships = db.query(Scholarship).filter(
        Scholarship.is_archived == False,
        Scholarship.approval_status == "approved",
        (Scholarship.last_auto_checked == None) | (Scholarship.last_auto_checked < cutoff_date)
    ).order_by(
        Scholarship.last_auto_checked.asc().nullsfirst()
    ).limit(batch_size).all()

    if not scholarships:
        print("[AutoUpdater] All scholarships recently checked. Skipping.")
        return {"checked": 0, "updated": 0, "errors": 0}

    checked = 0
    updated = 0
    errors = 0
    update_log = []

    for s in scholarships:
        try:
            uni_name = s.university_name or (s.university.name if s.university else "")
            search_query = f'"{s.title}" {uni_name} scholarship 2025 2026 deadline requirements'
            
            print(f"[AutoUpdater] Checking: {s.title[:50]}...")
            search_results = await _serper_search(search_query)
            
            if not search_results:
                s.last_auto_checked = datetime.now()
                checked += 1
                continue

            old_data = {
                "title": s.title,
                "university_name": uni_name,
                "country": s.country,
                "deadline": str(s.deadline.date()) if s.deadline else None,
                "amount": s.amount,
                "funding_type": s.funding_type,
                "cgpa_min": s.min_cgpa,
                "scholarship_url": s.scholarship_url
            }

            changes = _call_gpt_extract(old_data, search_results)
            
            if changes:
                change_notes = []
                
                if changes.get("deadline"):
                    try:
                        new_dl = datetime.strptime(changes["deadline"], "%Y-%m-%d")
                        if s.deadline is None or abs((new_dl - s.deadline).days) > 5:
                            old_dl = str(s.deadline.date()) if s.deadline else "None"
                            s.deadline = new_dl
                            change_notes.append(f"Deadline: {old_dl} → {changes['deadline']}")
                    except Exception:
                        pass

                if changes.get("amount") and changes["amount"] != s.amount:
                    change_notes.append(f"Amount: {s.amount} → {changes['amount']}")
                    s.amount = changes["amount"]

                if changes.get("funding_type") and changes["funding_type"] != s.funding_type:
                    change_notes.append(f"Funding: {s.funding_type} → {changes['funding_type']}")
                    s.funding_type = changes["funding_type"]

                if changes.get("cgpa_min") and changes["cgpa_min"] != s.cgpa_min:
                    change_notes.append(f"CGPA: {s.cgpa_min} → {changes['cgpa_min']}")
                    s.cgpa_min = changes["cgpa_min"]

                if changes.get("is_active") is False:
                    s.is_active = False
                    s.approval_status = "rejected"
                    change_notes.append("Scholarship discontinued — marked inactive")

                if change_notes:
                    log_entry = {
                        "scholarship_id": s.id,
                        "title": s.title,
                        "university": uni_name,
                        "country": s.country or "",
                        "deadline": str(s.deadline.date()) if s.deadline else "",
                        "scholarship_url": s.scholarship_url or s.website_url or "",
                        "changes": change_notes,
                        "ai_notes": changes.get("notes", ""),
                        "updated_at": datetime.now().isoformat()
                    }
                    update_log.append(log_entry)
                    print(f"[AutoUpdater] UPDATED {s.title}: {', '.join(change_notes)}")
                    updated += 1

            s.last_auto_checked = datetime.now()
            checked += 1
            
            # Rate limiting: delay between API calls to avoid timeouts
            await asyncio.sleep(2.5)

        except Exception as e:
            print(f"[AutoUpdater] Error processing {s.title}: {e}")
            errors += 1
            continue

    db.commit()

    run_at = datetime.now().isoformat()

    # Save update log to file (only entries with changes)
    if update_log:
        log_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            "data", "auto_update_log.json"
        )
        existing = []
        if os.path.exists(log_path):
            try:
                with open(log_path) as f:
                    existing = json.load(f)
            except Exception:
                existing = []
        existing = (existing + update_log)[-200:]  # keep last 200 entries
        with open(log_path, "w") as f:
            json.dump(existing, f, indent=2)

    # Always save every run to bot_run_log.json (for admin stats)
    run_log_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data", "bot_run_log.json"
    )
    os.makedirs(os.path.dirname(run_log_path), exist_ok=True)
    existing_runs = []
    if os.path.exists(run_log_path):
        try:
            with open(run_log_path) as f:
                existing_runs = json.load(f)
        except Exception:
            existing_runs = []
    run_entry = {
        "run_number": len(existing_runs) + 1,
        "run_at": run_at,
        "checked": checked,
        "updated": updated,
        "errors": errors,
        "updates": update_log
    }
    existing_runs = ([run_entry] + existing_runs)[:500]  # keep last 500 runs
    with open(run_log_path, "w") as f:
        json.dump(existing_runs, f, indent=2)

    result = {
        "checked": checked,
        "updated": updated,
        "errors": errors,
        "run_at": run_at,
        "log": update_log
    }
    print(f"[AutoUpdater] Done. Checked: {checked} | Updated: {updated} | Errors: {errors}")
    return result
