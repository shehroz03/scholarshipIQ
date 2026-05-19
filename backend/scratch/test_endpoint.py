import requests
import json

API_BASE = "http://localhost:8000"

# 1. Login to get token
login_data = {
    "username": "test@example.com",
    "password": "password123"
}

# Try to find a real user if possible, but let's try this first
res = requests.post(f"{API_BASE}/auth/login", data={"username": "test@example.com", "password": "password123"})
if res.status_code != 200:
    print("Login failed")
    # Try to find users
    import sqlite3
    conn = sqlite3.connect("scholariq.db")
    cursor = conn.cursor()
    cursor.execute("SELECT email FROM users LIMIT 1;")
    user = cursor.fetchone()
    if user:
        email = user[0]
        print(f"Trying with user: {email}")
        # Note: I don't know the password, but I can try a common one or reset it
        # Actually, let's just check the endpoint without auth first to see if it returns 401 properly with CORS
    conn.close()

# 2. Test the endpoint with OPTIONS first
res = requests.options(f"{API_BASE}/consultant/session/sop_review/message", headers={"Origin": "http://localhost:3000", "Access-Control-Request-Method": "POST"})
print(f"OPTIONS Status: {res.status_code}")
print(f"OPTIONS Headers: {res.headers}")

# 3. Test the endpoint with POST (no auth)
res = requests.post(f"{API_BASE}/consultant/session/sop_review/message", headers={"Origin": "http://localhost:3000"}, json={"content": "test"})
print(f"POST (no auth) Status: {res.status_code}")
print(f"POST (no auth) Headers: {res.headers}")
print(f"POST (no auth) Body: {res.text}")
