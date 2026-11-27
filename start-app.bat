@echo off
setlocal
cd /d "%~dp0"
echo Starting SorsU Bulan Attendance Monitoring...
call npm run dev -- --host 127.0.0.1 --open
if errorlevel 1 (
  echo.
  echo The app could not start. Make sure Node.js and project dependencies are installed.
)
pause
