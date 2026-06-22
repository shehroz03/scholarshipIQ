@echo off
REM ScholarIQ Backend launcher — keep this window OPEN while using the app.
cd /d "%~dp0backend"
echo ============================================
echo   Starting ScholarIQ Backend on port 8000
echo   (Keep this window open. Press Ctrl+C to stop.)
echo ============================================
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
