# Quick Start Guide

## Prerequisites Check
- [ ] Node.js installed (`node --version`)
- [ ] Python installed (`python --version`)
- [ ] MongoDB running
- [ ] OpenAI API key ready

## Setup (One-time)

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install

# AI Engine
cd ../ai-engine
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Meeting Bot
cd ../meeting-bot
npm install
npx playwright install chromium
```

### 2. Create Environment Files

**Create `backend/.env`:**
```
MONGO_URI=mongodb://localhost:27017/ai-meeting-assistant
OPENAI_API_KEY=your_api_key_here
PORT=5000
AI_ENGINE_URL=http://localhost:8000
```

**Create `ai-engine/.env`:**
```
OPENAI_API_KEY=your_api_key_here
```

## Running the Project

### Option 1: Use the Batch Script (Windows)
```bash
start-all.bat
```

### Option 2: Manual Start (3 Terminals)

**Terminal 1 - AI Engine:**
```bash
cd ai-engine
venv\Scripts\activate
python main.py
```

**Terminal 2 - Backend:**
```bash
cd backend
npm start
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

## Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- AI Engine: http://localhost:8000

## Verify Installation

1. Open http://localhost:3000
2. Try uploading an audio file
3. Check all 3 terminals for errors

For detailed setup instructions, see `SETUP.md`

