@echo off
echo ========================================
echo Starting AI Engine (Python/FastAPI)
echo ========================================
echo.

cd /d D:\Ai_meeting_assistant\ai-engine

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo.
echo Starting AI Engine server...
echo You should see: "✅ Whisper model loaded successfully!"
echo.
echo Press Ctrl+C to stop the server
echo.

python main.py

pause

