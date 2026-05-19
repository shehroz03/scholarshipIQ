import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import re
import json
from app.api.consultant import SYSTEM_PROMPT_FINANCIAL, normalize_financial_plan, _safe_json_parse, _call_ai

message = "Financial plan for MSc Computer Science at University of Birmingham, UK for 1 year from Pakistan"
context = {
    "student_name": "Student",
    "cgpa": "Not specified",
    "field_of_study": "Not specified",
    "field": "Not specified",
    "nationality": "Pakistani",
    "target_degree": "Masters",
    "budget": "Not specified"
}

city_detected = "city"
uni_detected = "Target University"

city_match = re.search(r'(?:in|at|mein|city)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)', message)
if city_match:
    city_detected = city_match.group(1)
    
uni_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:University|Uni|College|Institute|LMU|TUM))', message, re.IGNORECASE)
if uni_match:
    uni_detected = uni_match.group(1)

system_prompt = "You are currently in Financial Planning mode. " + SYSTEM_PROMPT_FINANCIAL.format(
    city=city_detected, 
    country="country", 
    university_name=uni_detected,
    **context
)

print("--- EXACT FINAL SYSTEM PROMPT ---")
print(system_prompt)
print("---------------------------------")

history = [{"role": "user", "content": message}]
reply, tokens = _call_ai(history, system_prompt, response_format="json")

print("--- RAW AI RESPONSE ---")
print(reply)
print("-----------------------")

raw_json = _safe_json_parse(reply, {})
print("--- PARSED JSON BEFORE NORMALIZATION ---")
print(json.dumps(raw_json, indent=2))
print("----------------------------------------")

normalized = normalize_financial_plan(raw_json)
print("--- NORMALIZED JSON ---")
print(json.dumps(normalized, indent=2))
print("-----------------------")

tuition = normalized.get("tuition", {}).get("per_year", 0)
ot_total = normalized.get("one_time_costs", {}).get("total", {}).get("amount", 0)
ls_total = normalized.get("budget_lifestyle", {}).get("total_yearly", 0)

print("--- QUALITY GATE VALUES ---")
print(f"tuition.per_year: {tuition}")
print(f"one_time_costs.total.amount: {ot_total}")
print(f"budget_lifestyle.total_yearly: {ls_total}")
print("---------------------------")

print("--- FALLBACK TRIGGER CONDITION ---")
if tuition == 0 and ot_total == 0 and ls_total == 0:
    print("Triggered because tuition == 0 AND ot_total == 0 AND ls_total == 0")
else:
    print("Fallback NOT triggered.")
print("----------------------------------")
