---
description: Cleanup MongoDB and PostgreSQL records for scholarships and universities
---

# Database Cleanup Workflow

This workflow describes how to safely clear old scraped or unverified records from both MongoDB and PostgreSQL databases in the ScholarIQ project.

## 1. MongoDB Cleanup

### Step A: Prerequisites
- Ensure `MONGODB_URI` is set in your `.env` file.
- Ensure `pymongo` and `python-dotenv` are installed.

### Step B: Preparation
Open `backend/scripts/cleanup_old_scholarships.py` and ensure the safety flag is set:
```python
CONFIRM = "DELETE"
```

### Step C: Execution
// turbo
```powershell
cd backend
python scripts/cleanup_old_scholarships.py
```

## 2. PostgreSQL Cleanup

### Step A: Execution
Execute the SQL script using `psql`:
// turbo
```powershell
cd backend
psql -h localhost -U scholariq_user -d scholariq_db -f scripts/cleanup_old_scholarships.sql
```
*(Replace `scholariq_user` and `scholariq_db` with your actual credentials)*

## 3. Production Run Order (Safe)

1. **Stop Application (Optional)**:
   ```powershell
   pm2 stop scholariq-backend
   ```

2. **Run MongoDB Cleanup**:
   ```powershell
   python backend/scripts/cleanup_old_scholarships.py
   ```

3. **Run SQL Cleanup**:
   ```powershell
   psql -h localhost -U scholariq_user -d scholariq_db -f backend/scripts/cleanup_old_scholarships.sql
   ```

4. **Run Migrations**:
   ```powershell
   cd backend
   alembic upgrade head
   ```

5. **Import New Data**:
   ```powershell
   python scripts/import_uk_scholarships.py UK_Masters_Top20_Verified.csv
   ```

6. **Restart Application**:
   ```powershell
   pm2 start scholariq-backend
   ```

## 4. Sanity Checks

### MongoDB Check
```bash
mongosh
use scholariq
db.scholarships.countDocuments({ verified: false })
db.scholarships.countDocuments({ source_type: "scraped" })
```

### SQL Check
```sql
SELECT COUNT(*) FROM scholarships WHERE verified = false OR official_link IS NULL;
SELECT COUNT(*) FROM universities u
WHERE NOT EXISTS (SELECT 1 FROM scholarships s WHERE s.university_id = u.id);
```
