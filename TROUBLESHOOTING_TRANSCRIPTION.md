# Troubleshooting "Transcription Failed" Error

## Quick Checklist

### 1. ✅ Is AI Engine Running?
Check if the Python AI Engine is running on port 8000:
- Open browser: http://localhost:8000/health
- Should return: `{"status":"ok"}`

**If not running:**
```bash
cd ai-engine
venv\Scripts\activate
python main.py
```

You should see:
```
🔄 Loading Whisper model...
✅ Whisper model loaded successfully!
Application startup complete
```

---

### 2. ✅ Is Whisper Installed?
Check if Whisper is installed in your virtual environment:

```bash
cd ai-engine
venv\Scripts\activate
pip list | findstr whisper
```

**If not installed:**
```bash
pip install openai-whisper
```

**Note:** First time loading the model will download it (~150MB for "base" model). This happens automatically.

---

### 3. ✅ Check Backend Environment Variables
Make sure `backend/.env` has:

```env
AI_ENGINE_URL=http://localhost:8000
```

**To verify:**
- Check `backend/.env` file exists
- Restart backend after changing `.env`

---

### 4. ✅ Check File Format
Supported audio formats:
- `.mp3`, `.wav`, `.m4a`, `.flac`, `.ogg`, `.webm`

**If your file format is not supported:**
- Convert to `.wav` or `.mp3` using ffmpeg or online converter

---

### 5. ✅ Check Console Logs

**Backend Terminal** should show:
```
📥 File uploaded: filename.mp3 (123456 bytes)
📂 Saved to: D:\Ai_meeting_assistant\backend\uploads\audio\...
📤 Sending audio file to AI Engine: ...
🔗 AI Engine URL: http://localhost:8000/transcribe
✅ Transcription received: XXX characters
```

**AI Engine Terminal** should show:
```
📁 Received file: filename.mp3, content-type: audio/mpeg
💾 Saved to temp file: ... (123456 bytes)
🎤 Starting Whisper transcription...
✅ Transcription complete: XXX characters
```

**If you see errors:**
- Copy the full error message
- Check which step failed

---

## Common Errors & Solutions

### Error: "Cannot connect to AI Engine"
**Problem:** Backend can't reach AI Engine

**Solution:**
1. Make sure AI Engine is running (`python main.py`)
2. Check `AI_ENGINE_URL` in `backend/.env`
3. Try accessing http://localhost:8000/health in browser

---

### Error: "Whisper model not loaded"
**Problem:** Whisper library not installed or model failed to load

**Solution:**
```bash
cd ai-engine
venv\Scripts\activate
pip install openai-whisper
# Restart AI Engine
python main.py
```

---

### Error: "Transcription produced empty text"
**Problem:** Audio file might be:
- Too quiet (no audio)
- Corrupted
- Wrong format

**Solution:**
- Try a different audio file
- Check if audio plays in media player
- Convert to `.wav` format

---

### Error: "Request timeout"
**Problem:** Audio file is too large or processing is slow

**Solution:**
- Wait longer (large files take time)
- Use smaller audio files
- Check AI Engine terminal for progress

---

### Error: "File not found"
**Problem:** Upload directory doesn't exist

**Solution:**
The code should create it automatically, but if not:
```bash
mkdir backend\uploads\audio
```

---

## Step-by-Step Debugging

1. **Start AI Engine** and wait for "✅ Whisper model loaded successfully!"
   ```bash
   cd ai-engine
   venv\Scripts\activate
   python main.py
   ```

2. **Test AI Engine directly:**
   ```bash
   # In another terminal, test the endpoint
   curl -X POST http://localhost:8000/health
   # Should return: {"status":"ok"}
   ```

3. **Start Backend** and check it connects:
   ```bash
   cd backend
   npm start
   ```
   Should show: `Backend running on port 5000`

4. **Upload a file** from frontend and watch both terminals for errors

5. **Check the exact error message** in:
   - Browser console (F12)
   - Backend terminal
   - AI Engine terminal

---

## Still Not Working?

1. **Check all services are running:**
   - AI Engine (port 8000) ✅
   - Backend (port 5000) ✅
   - Frontend (port 3000) ✅

2. **Verify Whisper installation:**
   ```bash
   cd ai-engine
   venv\Scripts\activate
   python -c "import whisper; print('Whisper installed!')"
   ```

3. **Test with a simple audio file:**
   - Use a short (10-30 second) `.mp3` or `.wav` file
   - Make sure it has clear speech

4. **Check firewall/antivirus:**
   - Might be blocking localhost connections

5. **Restart everything:**
   - Stop all terminals
   - Start AI Engine first
   - Then Backend
   - Then Frontend

---

## Need More Help?

Share these details:
- Full error message from backend terminal
- Full error message from AI Engine terminal
- Browser console errors (F12 → Console tab)
- File format and size you're trying to upload

