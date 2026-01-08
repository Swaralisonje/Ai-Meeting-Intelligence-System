import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import env from "../config/env.js";

const AI_ENGINE_URL = env.AI_ENGINE_URL || "http://127.0.0.1:8000";

/**
 * Transcribe audio using local Whisper model running in the ai-engine service.
 * No OpenAI API or credits are used.
 */
const whisperTranscribe = async (audioPath) => {
  if (!AI_ENGINE_URL) {
    throw new Error("AI_ENGINE_URL is not set in environment variables");
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error(`Audio file not found: ${audioPath}`);
  }

  // Normalize URL to use IPv4 (127.0.0.1) instead of IPv6 (::1) to avoid connection issues
  const normalizedUrl = AI_ENGINE_URL.replace("localhost", "127.0.0.1");
  
  console.log(`📤 Sending audio file to AI Engine: ${audioPath}`);
  console.log(`🔗 AI Engine URL: ${normalizedUrl}/transcribe`);

  // First, check if AI Engine is running
  try {
    const healthCheck = await axios.get(`${normalizedUrl}/health`, {
      timeout: 5000,
    });
    console.log(`✅ AI Engine is running: ${healthCheck.data.status}`);
  } catch (healthError) {
    console.error("❌ AI Engine health check failed!");
    throw new Error(
      `AI Engine is not running! Please start it first:\n` +
      `1. Open a new terminal\n` +
      `2. cd D:\\Ai_meeting_assistant\\ai-engine\n` +
      `3. venv\\Scripts\\activate\n` +
      `4. python main.py\n` +
      `\nThen try uploading again.`
    );
  }

  try {
    const form = new FormData();
    form.append("file", fs.createReadStream(audioPath));

    const response = await axios.post(`${normalizedUrl}/transcribe`, form, {
      headers: {
        ...form.getHeaders(),
      },
      timeout: 300000, // 5 minutes timeout for large files
    });

    if (!response.data || typeof response.data.text !== "string") {
      console.error("❌ Invalid response from AI Engine:", response.data);
      throw new Error("Invalid response from local Whisper service");
    }

    console.log(`✅ Transcription received: ${response.data.text.length} characters`);
    return response.data.text;
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      console.error(`❌ AI Engine error (${error.response.status}):`, error.response.data);
      throw new Error(
        `Transcription failed: ${error.response.data?.detail || error.response.statusText || "Unknown error"}`
      );
    } else if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      // Connection refused or timeout
      console.error("❌ Cannot connect to AI Engine!");
      throw new Error(
        `Cannot connect to AI Engine at ${normalizedUrl}.\n` +
        `Make sure the AI Engine is running:\n` +
        `1. Open a new terminal\n` +
        `2. cd D:\\Ai_meeting_assistant\\ai-engine\n` +
        `3. venv\\Scripts\\activate\n` +
        `4. python main.py\n` +
        `\nYou should see "✅ Whisper model loaded successfully!" before uploading files.`
      );
    } else if (error.request) {
      // Request made but no response
      console.error("❌ No response from AI Engine. Is it running?");
      throw new Error(
        `Cannot connect to AI Engine at ${normalizedUrl}. Make sure the AI Engine is running on port 8000.`
      );
    } else {
      // Error setting up request
      console.error("❌ Request setup error:", error.message);
      throw error;
    }
  }
};

export { whisperTranscribe };
