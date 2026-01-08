@echo off
echo Starting AI Meeting Assistant...
echo.

echo [1/3] Starting AI Engine (Python)...
start "AI Engine" cmd /k "cd ai-engine && venv\Scripts\activate && python main.py"

timeout /t 3 /nobreak >nul

echo [2/3] Starting Backend (Node.js)...
start "Backend Server" cmd /k "cd backend && npm start"

timeout /t 3 /nobreak >nul

echo [3/3] Starting Frontend (React)...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo All services are starting...
echo.
echo AI Engine: http://localhost:8000
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit this window (services will continue running)...
pause >nul

