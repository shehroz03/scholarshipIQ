import urllib.request, json

# Need admin token - get one first
login_data = json.dumps({"username": "admin", "password": "admin123"}).encode()
try:
    req = urllib.request.Request("http://localhost:8000/admin/login",
                                  data=login_data,
                                  headers={"Content-Type": "application/json"})
    r = urllib.request.urlopen(req)
    token = json.loads(r.read()).get("access_token", "")
    print("Got token:", token[:30], "...")
except Exception as e:
    token = ""
    print("Login failed:", e)

# Check staged/pending
req2 = urllib.request.Request("http://localhost:8000/admin/staged/pending")
if token:
    req2.add_header("Authorization", f"Bearer {token}")
try:
    r2 = urllib.request.urlopen(req2)
    data = json.loads(r2.read())
    print(f"\nItems in Review Queue: {len(data)}")
    for item in data:
        print(f"  ID {item['id']}: {item['title'][:50]}")
        print(f"    Score: {item['fraud_risk_score']} | Level: {item['fraud_risk_level']} | Status: {item['review_status']}")
        print(f"    URL: {item['scholarship_url']}")
except Exception as e:
    print("Queue fetch error:", e)
