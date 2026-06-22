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
Extract only VERIFIED changes. Be conservative — only report a change when the
search results EXPLICITLY support it. When unsure, do NOT report the change.

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
For EVERY field you report, you MUST include a per-field confidence 0.0-1.0 and
the exact source snippet that proves it. Schema:
{{
  "deadline": {{"value": "YYYY-MM-DD", "confidence": 0.0-1.0, "evidence": "quote"}},
  "amount": {{"value": "string", "confidence": 0.0-1.0, "evidence": "quote"}},
  "funding_type": {{"value": "Fully Funded|Partial", "confidence": 0.0-1.0, "evidence": "quote"}},
  "cgpa_min": {{"value": number, "confidence": 0.0-1.0, "evidence": "quote"}},
  "discontinued": {{"value": true, "confidence": 0.0-1.0, "evidence": "quote"}},
  "notes": "brief overall explanation"
}}
Only include fields that actually changed AND are explicitly supported by the
search snippets. Mark 'discontinued' true ONLY if a source clearly states the
scholarship/program is closed, cancelled, or no longer offered. Do NOT guess."""

    try:
        import openai
        client = openai.OpenAI(api_key=openai_key)
        # Retry up to 2x on transient API errors
        last_err = None
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model="gpt-4o",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=500,
                    temperature=0.0,
                    response_format={"type": "json_object"}
                )
                content = response.choices[0].message.content
                if not content:
                    return None
                result = json.loads(content)
                if result.get("no_changes"):
                    return None
                return result
            except Exception as e:
                last_err = e
                continue
        print(f"[AutoUpdater] GPT error after retries: {last_err}")
        return None
    except Exception as e:
        print(f"[AutoUpdater] GPT error: {e}")
        return None


# ─── AI Output Validation ──────────────────────────────────────────────────────

# Only apply an AI-proposed change if the model's confidence meets this bar.
MIN_FIELD_CONFIDENCE = 0.80
# Deactivating a live scholarship is high-impact → require near-certainty.
MIN_DISCONTINUE_CONFIDENCE = 0.90

_DEADLINE_FORMATS = (
    "%Y-%m-%d", "%d-%m-%Y", "%d/%m/%Y", "%m/%d/%Y",
    "%d %B %Y", "%d %b %Y", "%B %d, %Y", "%b %d, %Y", "%Y/%m/%d",
)


def _parse_deadline(value: str) -> Optional[datetime]:
    """Robustly parse a deadline string across common formats."""
    if not value or not isinstance(value, str):
        return None
    v = value.strip()
    for fmt in _DEADLINE_FORMATS:
        try:
            return datetime.strptime(v[:len(datetime.now().strftime(fmt)) + 5], fmt)
        except Exception:
            continue
    # Last resort: ISO prefix
    try:
        return datetime.strptime(v[:10], "%Y-%m-%d")
    except Exception:
        return None


def _field(changes: dict, key: str):
    """
    Extract a confidence-gated field from the new structured GPT output.
    Supports both the new {value, confidence, evidence} schema and the legacy
    flat schema. Returns (value, confidence, evidence) or (None, 0, "").
    """
    raw = changes.get(key)
    if raw is None:
        return None, 0.0, ""
    if isinstance(raw, dict):
        return raw.get("value"), float(raw.get("confidence", 0.0) or 0.0), raw.get("evidence", "")
    # Legacy flat value: treat as moderately confident
    return raw, 0.70, ""


def _valid_cgpa(v) -> bool:
    try:
        f = float(v)
        return 0.0 < f <= 10.0   # covers 4.0 and 10.0 scales
    except Exception:
        return False


async def auto_update_scholarships(db: Session, batch_size: int = BATCH_SIZE) -> dict:
    """
    Main auto-update function. Processes a small batch of scholarships.
    Called by scheduler every 4 days. Batch kept small (6) to avoid
    API timeouts and preserve Serper + OpenAI credits.

    SAFETY MODEL:
      • Every AI-proposed change is confidence-gated (>= 0.80).
      • Values are validated/sanity-checked before being written.
      • "Discontinued" is NEVER auto-applied destructively: the scholarship is
        flagged for ADMIN REVIEW (auto_flagged=True), not silently rejected.
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
                skipped_low_conf = []

                # ── Deadline (validated + confidence-gated) ───────────────────
                dl_val, dl_conf, _ = _field(changes, "deadline")
                if dl_val:
                    new_dl = _parse_deadline(dl_val)
                    if new_dl is None:
                        skipped_low_conf.append(f"deadline unparseable ('{dl_val}')")
                    elif dl_conf < MIN_FIELD_CONFIDENCE:
                        skipped_low_conf.append(f"deadline conf={dl_conf:.2f}")
                    elif s.deadline is None or abs((new_dl - s.deadline).days) > 5:
                        old_dl = str(s.deadline.date()) if s.deadline else "None"
                        # If the verified new deadline is already in the past,
                        # the scholarship has expired → archive instead of keeping live.
                        if new_dl < datetime.now():
                            s.deadline = new_dl
                            s.is_archived = True
                            s.is_active = False
                            s.archived_at = datetime.now()
                            s.archive_reason = "deadline_passed_ai_verified"
                            change_notes.append(f"Deadline {old_dl} → {new_dl.date()} (past → archived)")
                        else:
                            s.deadline = new_dl
                            change_notes.append(f"Deadline: {old_dl} → {new_dl.date()}")

                # ── Amount (confidence-gated, sanity-checked) ─────────────────
                amt_val, amt_conf, _ = _field(changes, "amount")
                if amt_val and isinstance(amt_val, str) and 0 < len(amt_val) <= 100 and amt_val != s.amount:
                    if amt_conf >= MIN_FIELD_CONFIDENCE:
                        change_notes.append(f"Amount: {s.amount} → {amt_val}")
                        s.amount = amt_val
                    else:
                        skipped_low_conf.append(f"amount conf={amt_conf:.2f}")

                # ── Funding type (confidence-gated, whitelisted) ──────────────
                ft_val, ft_conf, _ = _field(changes, "funding_type")
                if ft_val and ft_val != s.funding_type:
                    if ft_conf >= MIN_FIELD_CONFIDENCE and any(
                        k in str(ft_val).lower() for k in ("fully", "partial", "fund")
                    ):
                        change_notes.append(f"Funding: {s.funding_type} → {ft_val}")
                        s.funding_type = ft_val
                    else:
                        skipped_low_conf.append(f"funding conf={ft_conf:.2f}")

                # ── Min CGPA (confidence-gated + range-validated) — FIXED FIELD
                cg_val, cg_conf, _ = _field(changes, "cgpa_min")
                if cg_val is not None and _valid_cgpa(cg_val) and float(cg_val) != (s.min_cgpa or 0):
                    if cg_conf >= MIN_FIELD_CONFIDENCE:
                        change_notes.append(f"Min CGPA: {s.min_cgpa} → {float(cg_val)}")
                        s.min_cgpa = float(cg_val)   # correct model field is min_cgpa
                    else:
                        skipped_low_conf.append(f"cgpa conf={cg_conf:.2f}")

                # ── Discontinued → SAFE: flag for admin, never silent-reject ──
                disc_val, disc_conf, disc_ev = _field(changes, "discontinued")
                if disc_val is True and disc_conf >= MIN_DISCONTINUE_CONFIDENCE:
                    s.auto_flagged = True
                    s.fraud_reasons = json.dumps(
                        (json.loads(s.fraud_reasons) if s.fraud_reasons else [])
                        + [f"AI: possibly discontinued (conf={disc_conf:.2f}) — admin review needed"]
                    )
                    change_notes.append(
                        f"FLAGGED for admin: possibly discontinued (conf={disc_conf:.2f})"
                    )
                elif disc_val is True:
                    skipped_low_conf.append(f"discontinue conf={disc_conf:.2f} (<{MIN_DISCONTINUE_CONFIDENCE})")

                if change_notes:
                    log_entry = {
                        "scholarship_id": s.id,
                        "title": s.title,
                        "university": uni_name,
                        "country": s.country or "",
                        "deadline": str(s.deadline.date()) if s.deadline else "",
                        "scholarship_url": s.scholarship_url or s.website_url or "",
                        "changes": change_notes,
                        "skipped_low_confidence": skipped_low_conf,
                        "ai_notes": changes.get("notes", ""),
                        "updated_at": datetime.now().isoformat()
                    }
                    update_log.append(log_entry)
                    print(f"[AutoUpdater] UPDATED {s.title}: {', '.join(change_notes)}")
                    updated += 1
                elif skipped_low_conf:
                    print(f"[AutoUpdater] Skipped low-confidence changes for {s.title[:40]}: {skipped_low_conf}")

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
