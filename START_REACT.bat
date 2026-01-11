@echo off
echo ================================
echo BREW.AI v3 - React + FastAPI
echo ================================
echo.
echo Starting Backend (FastAPI on port 8000)...
start cmd /k "cd backend && ..\venv\Scripts\activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000"

timeout /t 3 /nobreak

echo.
echo Starting Frontend (React on port 3000)...
start cmd /k "cd frontend && npm run dev"

timeout /t 3 /nobreak

echo.
echo ================================
echo BOTH SERVERS STARTING!
echo ================================
echo.
echo Backend API: http://localhost:8000
echo Frontend UI: http://localhost:5173
echo.
echo Opening browser in 5 seconds...
timeout /t 5 /nobreak

start http://localhost:5173

echo.
echo Ready to demo!
pause

