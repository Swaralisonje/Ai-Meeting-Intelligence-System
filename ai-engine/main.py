from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from agents.orchestrator_agent import orchestrate_agents


app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class TranscriptInput(BaseModel):
    transcript: str


@app.post("/process")
def process_meeting(data: TranscriptInput):
    try:
        if not data.transcript or not data.transcript.strip():
            raise HTTPException(status_code=400, detail="Transcript cannot be empty")

        result = orchestrate_agents(data.transcript)
        return result
    except HTTPException:
        # Re-raise HTTPException as-is
        raise
    except Exception as e:
        # Log the full error for debugging
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Processing error: {error_details}")
        raise HTTPException(status_code=500, detail=f"Processing error: {str(e)}")


# ---------- Local Whisper transcription ----------
import os
import tempfile
import whisper

# Load Whisper model once at startup (change "base" to "small"/"medium" if you want)
print("🔄 Loading Whisper model...")
try:
    WHISPER_MODEL = whisper.load_model("base")
    print("✅ Whisper model loaded successfully!")
except Exception as e:
    print(f"❌ Error loading Whisper model: {e}")
    print("💡 Make sure you installed: pip install openai-whisper")
    WHISPER_MODEL = None


@app.post("/transcribe")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe an uploaded audio file using local Whisper (no OpenAI API).
    """
    if WHISPER_MODEL is None:
        raise HTTPException(
            status_code=500,
            detail="Whisper model not loaded. Check server logs and ensure 'pip install openai-whisper' was run."
        )

    tmp_path = None
    try:
        print(f"📁 Received file: {file.filename}, content-type: {file.content_type}")

        # Save uploaded file to a temporary location
        suffix = os.path.splitext(file.filename or "")[1] or ".wav"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name
            print(f"💾 Saved to temp file: {tmp_path} ({len(content)} bytes)")

        # Run Whisper transcription
        print("🎤 Starting Whisper transcription...")
        result = WHISPER_MODEL.transcribe(tmp_path, language="en")
        text = result.get("text", "").strip()
        print(f"✅ Transcription complete: {len(text)} characters")

        # Clean up temp file
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

        if not text:
            raise HTTPException(status_code=500,
                                detail="Transcription produced empty text. The audio might be too quiet or corrupted.")

        return {"text": text}

    except HTTPException:
        # Re-raise HTTPException so FastAPI returns proper status
        raise
    except Exception as e:
        # Log the full error
        import traceback
        error_details = traceback.format_exc()
        print(f"❌ Transcription error: {error_details}")

        # Best-effort cleanup
        try:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Transcription error: {str(e)}. Check server logs for details."
        )


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
