# 🧪 ScholarIQ - Complete System Verification Test (30 mins)

## Prerequisites: Start Terminals

```bash
# Terminal 1: Backend
cd backend
python seed.py
uvicorn app.main:app --reload

# Terminal 2: Frontend (new terminal)
cd "d:\ScholarIQ Landing Page Design"
npm run dev

# Browser: Open http://localhost:5173
```

---

## ✅ SECTION 1: AUTHENTICATION [3 mins]

### TEST 1A: LOGIN WITH EXISTING USER
1. Browser: `http://localhost:5173/login`
2. Enter:
   - Email: `test@example.com`
   - Password: `password123`
3. Click: "Sign In"

**✅ PASS IF:**
- Dashboard loads immediately
- Top-right shows: "Welcome, Test User"
- F12 Console: NO red errors
- URL changed to: `/dashboard`

**❌ FAIL IF:**
- "Invalid credentials" error
- Can't find localStorage token
- Red errors in console

**ACTION IF FAIL:**
```bash
# Check Terminal 1 for auth errors
# Reseed database
python seed.py
# Restart backend
```

### TEST 1B: LOGOUT & RE-LOGIN
1. Click: Top-right "Logout" button
2. Verify: Redirected to `/login`
3. Re-login with same credentials
4. Verify: Dashboard loads again

**✅ PASS IF:** Works both times  
**❌ FAIL IF:** Logout doesn't clear token or re-login fails

---

## 🔍 SECTION 2: SEARCH FUNCTIONALITY [4 mins]

### TEST 2A: CASCADE FILTER (Country → City)
1. Go to: `/search`
2. Click: "Target Country" dropdown
3. Select: "United Kingdom"
4. Wait 2 seconds
5. Check: "Target City" dropdown now populated

**✅ PASS IF:**
- Cities dropdown has 10+ options: London, Manchester, etc.
- No duplicate cities
- Alphabetically sorted

**❌ FAIL IF:**
- Cities dropdown stays empty
- Only 1-2 cities show
- Takes >3 seconds to load

**ACTION IF FAIL:**
```bash
# Test endpoint manually
curl "http://localhost:8000/scholarships/filters/cities?country=United%20Kingdom"
# Should return JSON array of cities
```

### TEST 2B: FULL FILTER TEST
1. Select: United Kingdom → London → Masters → Computer Science
2. Click: "Find Opportunity"
3. Wait for results

**✅ PASS IF:**
- 2-5 scholarship cards load
- Each card shows: Name, Duration, Deadline, Funding
- All results are: UK + London + Masters + CS only
- Sorted by deadline (earliest first)
- F12 Network: GET `/scholarships` API returns 200 OK

**❌ FAIL IF:**
- 0 results or 100+ results
- Wrong filters applied (not London)
- Not sorted by deadline
- API error in Network tab

---

## 📄 SECTION 3: SCHOLARSHIP DETAIL [5 mins]

### TEST 3A: TIMELINE BADGE VISIBILITY
1. From search results, click ANY scholarship
2. Detail page loads
3. Scroll down, look for:

**Expected to SEE:**
- 🎓 Duration: "1 year" OR "2 years" OR "Full degree" (NOT empty)
- ⏳ Deadline: Date in format "Jan 31, 2026"
- 💰 Funding: "Fully Funded" OR amount like "£5,000"
- 📍 Map: Google Maps showing university location

**✅ PASS IF:** All 4 elements visible and populated  
**❌ FAIL IF:** Any field shows NULL, empty, or "undefined"

**ACTION IF FAIL:**
```bash
# Duration NULL: Reseed database
python seed.py

# Map not loading: Check .env has VITE_GOOGLE_MAPS_API_KEY
```

### TEST 3B: URGENCY BADGE COLOR TEST
Check top scholarship's deadline:

- **IF deadline < 7 days:** ✅ RED pulsing badge "⚠️ Expiring Soon"
- **IF deadline 7-30 days:** ✅ YELLOW badge "Coming Soon"
- **IF deadline > 30 days:** ✅ GREEN badge "Safe"

### TEST 3C: FRAUD WARNING TEST
1. Admin panel: `#admin`
2. Login: `admin` / `admin123`
3. Go to: "Fraud Manager" tab
4. Flag ANY scholarship as suspicious
5. Go back to that scholarship detail
6. Refresh page

**✅ PASS IF:** RED WARNING banner appears at top  
**❌ FAIL IF:** No warning appears

---

## 🗺️ SECTION 4: UNIVERSITY MATCHER [4 mins]

### TEST 4A: MAP LOADS WITH MARKERS
1. Go to: `/matcher`
2. Select: United Kingdom → London
3. Wait 2-3 seconds

**✅ PASS IF:**
- Google Maps renders
- 10+ blue markers visible on map
- Zoomed to London area
- F12 Console: NO Google Maps errors

**❌ FAIL IF:**
- Blank/white area (map not loading)
- Only 1-2 markers
- Red error about API key

### TEST 4B: CLICK UNIVERSITY → DETAIL PANEL
1. Click ANY marker on map
2. Right panel should SLIDE IN

**✅ PASS IF:**
- Panel shows university name
- Shows "Scholarships" section
- Lists 2-5 scholarships for that university
- Field grouping visible (CS, Engineering, etc.)

---

## 💾 SECTION 5: SAVE & DASHBOARD [4 mins]

### TEST 5A: SAVE SCHOLARSHIP
1. Search results page
2. Click "Save" button on ANY card
3. Button should fill (heart icon)

**✅ PASS IF:**
- Button changes color/state
- Toast message: "Added to saved"
- F12 Network: POST `/dashboard/save/{id}` returns 200 OK

### TEST 5B: DASHBOARD STATS UPDATE
1. Go to: `/dashboard`
2. Note: "Scholarships Saved" count
3. Go back to search, save 1 more scholarship
4. Return to dashboard
5. Refresh page

**✅ PASS IF:** "Saved count" increased by 1

### TEST 5C: VERIFY 4 STATS CARDS
Dashboard should show:
- 📌 Scholarships Saved: (number)
- 💡 Recommended for You: (number)
- 📊 Profile Completion: (0-100%)
- ⏰ Upcoming Deadlines: (number)

**✅ PASS IF:** All 4 cards visible with numbers

---

## 🛡️ SECTION 6: ADMIN PANEL [4 mins]

### TEST 6A: ADMIN LOGIN
1. Go to: `#admin`
2. Login: `admin` / `admin123`

**✅ PASS IF:**
- Admin dashboard loads
- 10 FR cards visible
- All show ✅ WORKING status

### TEST 6B: FR VALIDATION CARDS
Check each card shows:
- FR name (FR01-FR10)
- Status: ✅ WORKING
- Count: Total users/scholarships/etc.

**✅ PASS IF:** All 10 cards show ✅ and counts > 0

### TEST 6C: FRAUD MANAGER
1. Go to: "Fraud Manager" tab
2. Should show list of suspicious scholarships

**✅ PASS IF:**
- List loads (1-5 items or empty)
- Each shows: Name, Reason, Toggle button
- Can toggle suspicious flag ON/OFF

### TEST 6D: API HEALTH CHECK
1. Go to: "API Health" tab
2. Should show list of all endpoints

**✅ PASS IF:**
- 15+ endpoints listed
- All show: Status 200 OK
- Response times: 30-200ms

---

## 💬 SECTION 7: CHATBOT [3 mins]

### TEST 7A: CHATBOT OPENS
1. Any page → Bottom-right: Click chat icon 💬
2. Chat window should slide in

**✅ PASS IF:**
- Window opens smoothly
- Input field visible
- Suggestion pills show (Deadlines, Funding, etc.)

### TEST 7B: SEND MESSAGE
1. Type: "Masters scholarships in UK"
2. Press Enter or click Send

**✅ PASS IF:**
- Bot responds within 2 seconds
- Response mentions "Masters" or "UK"
- No error messages

---

## 🎯 FINAL VERIFICATION SUMMARY

| Section | Tests | Expected Time |
|---------|-------|---------------|
| Authentication | 2 | 3 mins |
| Search | 3 | 4 mins |
| Details | 3 | 5 mins |
| Matcher | 2 | 4 mins |
| Save/Dashboard | 3 | 4 mins |
| Admin Panel | 4 | 4 mins |
| Chatbot | 2 | 3 mins |
| **TOTAL** | **19** | **27 mins** |

---

## 🚨 Quick Troubleshooting

**If Backend Not Responding:**
```bash
# Check if running
curl http://localhost:8000/health

# Restart
cd backend
uvicorn app.main:app --reload
```

**If Frontend Not Loading:**
```bash
# Check if running
# Should see "Local: http://localhost:5173"

# Restart
npm run dev
```

**If Database Issues:**
```bash
cd backend
python seed.py
```

### TEST 7B: CHATBOT RESPONSES
Ask 3 questions and check bot responses:

**Question 1:** "Masters scholarships in UK"
- **Expected:** Bot mentions scholarships, Masters, UK
- **✅ PASS IF:** Response contains relevant keywords
- **❌ FAIL IF:** Generic error or nonsense response

**Question 2:** "What is the deadline?"
- **Expected:** Bot mentions deadlines, urgency
- **✅ PASS IF:** Response talks about dates/deadlines
- **❌ FAIL IF:** Irrelevant response

**Question 3:** "Computer Science funding"
- **Expected:** Bot mentions CS, funding, amounts
- **✅ PASS IF:** Response relevant to query
- **❌ FAIL IF:** Error message or random text

**ACTION IF FAIL:**
```bash
curl -X POST "http://localhost:8000/chatbot/chat" \
-H "Content-Type: application/json" \
-d '{"message":"Masters scholarships"}'
```

### TEST 7C: CHATBOT CLOSES
1. Click: X button to close chat
2. Should minimize/close

**✅ PASS IF:** Window closes smoothly  
**❌ FAIL IF:** Doesn't respond or errors

---

## 👤 SECTION 8: PROFILE & RECOMMENDATIONS [3 mins]

### TEST 8A: UPDATE PROFILE
1. Go to: `/settings`
2. Fill:
   - Degree: Masters
   - Field: Computer Science
   - GPA: 3.8
   - Target Country: United Kingdom
   - Preferred Funding: Fully Funded
3. Click: "Save Profile"

**✅ PASS IF:**
- Success message appears
- Database updated
- Form shows saved values

**❌ FAIL IF:**
- Error message
- Form resets/data not saved

**ACTION IF FAIL:**
```bash
# Check database
sqlite3 scholariq.db "SELECT degree_level, field_of_interest, cgpa FROM users WHERE id=1;"
```

### TEST 8B: RECOMMENDATIONS UPDATE
1. Go to: `/dashboard`
2. Check: "Recommended for You" count
3. Go back to `/settings`, change Field to "Engineering"
4. Save, go back to dashboard
5. Check: Recommendation list changed?

**✅ PASS IF:**
- First update shows CS scholarships
- Second update shows Engineering scholarships
- Lists are DIFFERENT

**❌ FAIL IF:**
- Recommendations same both times
- Always shows 0 recommendations

---

## 📱 SECTION 9: MOBILE RESPONSIVENESS [2 mins]

### TEST 9A: MOBILE VIEW
1. F12 → Toggle device mode (Ctrl+Shift+M)
2. Set width: 375px (iPhone SE)
3. Go to: `/search`

**✅ PASS IF:**
- Filters stack vertically
- Text readable (not tiny)
- Buttons tappable (>44px height)
- No horizontal scroll

**❌ FAIL IF:**
- Overlapping text
- Tiny buttons hard to tap
- Content cuts off

### TEST 9B: MOBILE DETAIL PAGE
1. Still at 375px
2. Click scholarship → detail page

**✅ PASS IF:**
- Timeline visible
- Urgency badge visible
- Map visible (or can scroll to it)
- Apply button tappable

---

## 🗄️ SECTION 10: DATABASE INTEGRITY [2 mins]

### TEST 10A: DATA EXISTS
Open Terminal (3rd one):
```bash
sqlite3 scholariq.db
```

Check counts:
```sql
SELECT COUNT(*) as users FROM users;
SELECT COUNT(*) as scholarships FROM scholarships;
SELECT COUNT(*) as universities FROM universities;
SELECT COUNT(*) as saved FROM saved_scholarships;
```

**Expected:**
- users: ≥ 1
- scholarships: ≥ 40
- universities: ≥ 10
- saved: ≥ 0

**✅ PASS IF:** All counts > 0 (except saved can be 0)  
**❌ FAIL IF:** Any critical table has 0 rows

### TEST 10B: SAMPLE DATA
```sql
SELECT title, deadline, duration_text FROM scholarships LIMIT 3;
```

**✅ PASS IF:** All fields have values  
**❌ FAIL IF:** Any shows NULL

---

## 🔍 SECTION 11: BROWSER CONSOLE CLEANUP [1 min]

### TEST 11A: NO RED ERRORS
1. F12 → Console tab
2. Scan for RED error messages

**✅ PASS IF:** Only blue "i" info messages or yellow warnings  
**❌ FAIL IF:** RED error messages present

**Common OK messages:**
- ⚠️ "Compiled successfully" (yellow = good)
- ℹ️ "[React] React is in development mode" (blue = ok)

**Critical FAIL messages:**
- ❌ "Uncaught TypeError: Cannot read property"
- ❌ "POST /api/... 404 Not Found"
- ❌ "CORS error"
- ❌ "API key invalid"

### TEST 11B: NETWORK TAB
1. F12 → Network tab
2. Refresh page
3. Check all requests

**✅ PASS IF:**
- All requests status 200 or 304
- No 4xx errors (404, 403, etc.)
- No 5xx errors (500, 503, etc.)
- Response times < 500ms

---

## 📊 FINAL SCORING SYSTEM

Count your ✅ and ❌:

**IF YOU GOT:**

- **✅ 60+ PASS (out of ~70 tests)**
  - → EXCELLENT! System is PRODUCTION READY
  - → Go ahead with presentation
  - → Only minor tweaks if any

- **✅ 50-59 PASS**
  - → GOOD! Core features working
  - → Fix the 10-20 failing tests before presentation
  - → Shouldn't take more than 1-2 hours

- **✅ 40-49 PASS**
  - → OKAY but RISKY. Too many issues.
  - → Need to prioritize critical FRs (1-9)
  - → FR10 (email) can be deferred

- **❌ <40 PASS**
  - → NOT READY. Major issues.
  - → Reseed database completely
  - → Restart both servers fresh

---

## 🔧 QUICK FIX COMMANDS

```bash
# 1. RESEED DATABASE
cd backend
python seed.py

# 2. RESTART BACKEND
uvicorn app.main:app --reload

# 3. CLEAR FRONTEND CACHE
# In browser: Ctrl+Shift+Delete → Empty all cache

# 4. RESTART FRONTEND
npm run dev

# 5. CHECK DATABASE DIRECTLY
sqlite3 scholariq.db ".tables"
sqlite3 scholariq.db "SELECT COUNT(*) FROM scholarships;"

# 6. TEST BACKEND DIRECTLY
curl "http://localhost:8000/scholarships?country=United%20Kingdom"
```

---

## ✅ FINAL SIGN-OFF CHECKLIST

After all tests, mark:

**SECTIONS PASSED:**
- [ ] 1. Authentication .................... ? / 2 tests
- [ ] 2. Search Functionality .............. ? / 3 tests
- [ ] 3. Scholarship Detail ............... ? / 4 tests
- [ ] 4. University Matcher ............... ? / 3 tests
- [ ] 5. Save & Dashboard ................. ? / 3 tests
- [ ] 6. Admin Panel ...................... ? / 4 tests
- [ ] 7. Chatbot .......................... ? / 3 tests
- [ ] 8. Profile & Recommendations ........ ? / 2 tests
- [ ] 9. Mobile Responsiveness ............ ? / 2 tests
- [ ] 10. Database Integrity .............. ? / 2 tests
- [ ] 11. Browser Console ................. ? / 2 tests

**TOTAL: _____ / 70 tests passed**

**STATUS:**
- [ ] ✅ READY TO PRESENT (60+)
- [ ] ⚠️ NEEDS FIXES (40-59)
- [ ] ❌ NOT READY (<40)

---

## 📞 REPORT BACK WITH:

When you finish testing, tell me:

**PASSING TESTS:** _____/70

**FAILING TESTS (if any):**
1. [Section X, Test Name] - Error: [exact error message]
2. [Section X, Test Name] - Error: [exact error message]

**CRITICAL ISSUES (if any):**
- [Issue that blocks presentation]
- [Issue that breaks core feature]

**STATUS:** Ready / Needs fixes

---

**🏆 Now go test! Take 30 mins and report back! 🚀**
