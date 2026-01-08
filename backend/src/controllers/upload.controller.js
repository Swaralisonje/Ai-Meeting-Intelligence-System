import { whisperTranscribe } from "../services/whisper.service.js";
import axios from "axios";
import env from "../config/env.js";

const AI_ENGINE_URL = env.AI_ENGINE_URL || "http://127.0.0.1:8000";

export const handleAudio = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Transcribe audio
    const transcript = await whisperTranscribe(req.file.path);
    
    // Process with AI Engine
    const normalizedUrl = AI_ENGINE_URL.replace("localhost", "127.0.0.1");
    const response = await axios.post(`${normalizedUrl}/process`, { transcript });
    
    res.json(response.data);
  } catch (error) {
    console.error("❌ handleAudio error:", error);
    res.status(500).json({ 
      error: "Failed to process audio", 
      details: error.message 
    });
  }
};
