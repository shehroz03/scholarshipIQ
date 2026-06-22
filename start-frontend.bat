@echo off
REM ScholarIQ Frontend launcher — keep this window OPEN while using the app.
cd /d "%~dp0"
echo ============================================
echo   Starting ScholarIQ Frontend (Vite)
echo   Opens on http://localhost:3000
echo   (Keep this window open. Press Ctrl+C to stop.)
echo ============================================
npm run dev
pause
