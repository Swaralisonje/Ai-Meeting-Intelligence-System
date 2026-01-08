# AI Meeting Assistant - Setup & Run Guide

This project consists of 4 main components that need to be running:

1. **AI Engine** (Python/FastAPI) - Port 8000
2. **Backend** (Node.js/Express) - Port 5000
3. **Frontend** (React) - Port 3000
4. **Meeting Bot** (Node.js) - Optional, runs on demand

---

## Prerequisites

### Required Software:
- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) - [Download](https://www.python.org/)
- **MongoDB** - [Download](https://www.mongodb.com/try/download/community) or use MongoDB Atlas
- **OpenAI API Key** - Get from [OpenAI](https://platform.openai.com/api-keys)

### Optional (for Meeting Bot):
- **Playwright** (will be installed automatically)
- **Sox** (for audio recording) - Required for `node-record-lpcm16`
  - Windows: Install via [Chocolatey](https://chocolatey.org/) or [Sox for Windows](http://sox.sourceforge.net/)
  - Mac: `brew install sox`
  - Linux: `sudo apt-get install sox` or `sudo yum install sox`

---

## Step 1: Environment Variables Setup

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/ai-meeting-assistant
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/ai-meeting-assistant

# OpenAI API Key (Required for transcription)
OPENAI_API_KEY=your_openai_api_key_here

# Server Port (optional, defaults to 5000)
PORT=5000

# AI Engine URL (optional, defaults to http://localhost:8000)
AI_ENGINE_URL=http://localhost:8000
```

### AI Engine Environment Variables

Create a `.env` file in the `ai-engine/` directory (if using OpenAI for agents):

```env
OPENAI_API_KEY=your_openai_api_key_here
```

---

## Step 2: Install Dependencies

### Install Backend Dependencies

```bash
cd backend
npm install
```

### Install Frontend Dependencies

```bash
cd frontend
npm install
```

### Install AI Engine Dependencies

```bash
cd ai-engine

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Install Meeting Bot Dependencies

```bash
cd meeting-bot
npm install

# Install Playwright browsers
npx playwright install chromium
```

---

## Step 3: Start MongoDB

### Local MongoDB:
```bash
# Windows (if installed as service, it should start automatically)
# Or start manually:
mongod

# Mac (if installed via Homebrew):
brew services start mongodb-community

# Linux:
sudo systemctl start mongod
```

### MongoDB Atlas:
- No local setup needed, just use your connection string in `.env`

---

## Step 4: Run the Application

You need to run 3 components simultaneously. Open **3 separate terminal windows/tabs**.

### Terminal 1: AI Engine (Python)

```bash
cd ai-engine

# Activate virtual environment if not already activated
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Run the server
python main.py
# OR
uvicorn main:app --host 0.0.0.0 --port 8000
```

You should see: `Application startup complete` and server running on `http://0.0.0.0:8000`

### Terminal 2: Backend (Node.js)

```bash
cd backend
npm start
```

You should see: `Backend running on port 5000` and `✅ MongoDB connected`

### Terminal 3: Frontend (React)

```bash
cd frontend
npm start
```

The browser should automatically open to `http://localhost:3000`

---

## Step 5: Verify Installation

1. **Check AI Engine**: Visit `http://localhost:8000/health` - should return `{"status":"ok"}`
2. **Check Backend**: Visit `http://localhost:5000/api/ai/process` (POST endpoint, use Postman or curl)
3. **Check Frontend**: Visit `http://localhost:3000` - should show the home page

---

## Running the Meeting Bot (Optional)

The meeting bot can be started via the frontend UI or manually:

### Via Frontend:
1. Go to `http://localhost:3000/live`
2. Enter a Google Meet or Zoom link
3. Click "Join Meeting"

### Manually:
```bash
cd meeting-bot
node index.js "https://meet.google.com/your-meeting-link"
```

---

## Troubleshooting

### Port Already in Use
- **Port 3000**: Change in `frontend/package.json` scripts or kill the process
- **Port 5000**: Change `PORT` in `backend/.env`
- **Port 8000**: Change in `ai-engine/main.py` or use `--port` flag

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` in `backend/.env`
- Verify MongoDB is accessible at the specified address

### OpenAI API Errors
- Verify `OPENAI_API_KEY` is set correctly in both `backend/.env` and `ai-engine/.env`
- Check your OpenAI account has credits/quota
- Ensure the API key has proper permissions

### Python Import Errors
- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again
- Check Python version: `python --version` (should be 3.8+)

### Node.js Module Errors
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check Node.js version: `node --version` (should be 14+)

### Upload Directory Errors
- The app will create `uploads/` and `uploads/audio/` directories automatically
- If errors persist, create them manually:
  ```bash
  mkdir -p backend/uploads/audio
  mkdir -p uploads/audio
  ```

### Meeting Bot Audio Recording Issues
- Ensure Sox is installed (required for audio recording)
- On Windows, you may need to install additional audio drivers
- Check microphone permissions in your OS settings

---

## Project Structure

```
Ai_meeting_assistant/
├── ai-engine/          # Python FastAPI service
│   ├── agents/         # AI agents for processing
│   ├── chains/         # LangChain chains
│   ├── tools/          # Utility tools
│   └── main.py         # FastAPI server
├── backend/            # Node.js Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── server.js
│   └── .env           # Environment variables
├── frontend/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   └── services/
│   └── package.json
└── meeting-bot/       # Standalone meeting bot
    ├── index.js
    └── package.json
```

---

## API Endpoints

### AI Engine (Port 8000)
- `GET /health` - Health check
- `POST /process` - Process transcript

### Backend (Port 5000)
- `POST /api/ai/upload` - Upload audio file for transcription
- `POST /api/ai/process` - Process transcript with AI
- `POST /api/livebot/start` - Start live meeting bot
- `POST /api/pdf/download` - Generate and download PDF

---

## Development Tips

1. **Hot Reload**: Frontend and Backend support hot reload during development
2. **Logs**: Check terminal outputs for debugging
3. **Database**: Use MongoDB Compass to view stored meetings
4. **Testing**: Use Postman or curl to test API endpoints
5. **Environment**: Keep `.env` files out of version control (add to `.gitignore`)

---

## Quick Start Scripts (Optional)

You can create batch/shell scripts to start all services at once:

### Windows (`start-all.bat`):
```batch
@echo off
start cmd /k "cd ai-engine && venv\Scripts\activate && python main.py"
start cmd /k "cd backend && npm start"
start cmd /k "cd frontend && npm start"
```

### Mac/Linux (`start-all.sh`):
```bash
#!/bin/bash
cd ai-engine && source venv/bin/activate && python main.py &
cd backend && npm start &
cd frontend && npm start &
wait
```

---

## Need Help?

- Check the console logs for error messages
- Verify all environment variables are set
- Ensure all dependencies are installed
- Check that MongoDB is running
- Verify OpenAI API key is valid

