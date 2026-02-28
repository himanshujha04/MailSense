@echo off
echo Starting MailSense AI...

echo Starting FastAPI Backend Server...
start cmd /k "cd /d "%~dp0" && set PYTHONPATH=%~dp0 && .\venv\Scripts\uvicorn backend.main:app --reload --port 8000"

timeout /t 2 /nobreak > nul

echo Starting React Frontend Server...
start cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo Finished! Please see the two windows that opened for server logs.
echo You can open the dashboard at: http://localhost:5173
timeout /t 5 > nul
