import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";
import { whisperTranscribe } from "../services/whisper.service.js";
import axios from "axios";
import fs from "fs";
import env from "../config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store active bot processes
const activeBots = new Map();

// Store meeting results by bot ID
const meetingResults = new Map();

const AI_ENGINE_URL = env.AI_ENGINE_URL || "http://127.0.0.1:8000";

export const startLiveBot = (req, res) => {
  try {
    const { meetingLink } = req.body;

    if (!meetingLink || typeof meetingLink !== "string" || meetingLink.trim() === "") {
      return res.status(400).json({ error: "Valid meeting link is required" });
    }

    // Validate meeting link format
    if (!meetingLink.includes("meet.google.com") && !meetingLink.includes("zoom.us")) {
      return res.status(400).json({ 
        error: "Invalid meeting link. Supported: Google Meet or Zoom" 
      });
    }

    // Get absolute path to meeting-bot
    const botPath = path.join(__dirname, "../../../meeting-bot/index.js");

    console.log("🚀 Starting meeting bot...");
    console.log("🔗 Meeting link:", meetingLink);
    console.log("📂 Bot path:", botPath);

    // Generate botId BEFORE using it
    const botId = Date.now().toString();

    // Spawn bot process with botId as environment variable
    const botProcess = spawn(
      "node",
      [botPath, meetingLink],
      { 
        stdio: ["ignore", "pipe", "pipe"],
        detached: false,
        env: {
          ...process.env,
          BOT_ID: botId,
          BACKEND_URL: process.env.BACKEND_URL || "http://127.0.0.1:5000"
        }
      }
    );

    // Store process info
    activeBots.set(botId, botProcess);
    
    // Initialize result storage for this bot
    meetingResults.set(botId, { status: "recording", data: null });

    // Handle bot output
    botProcess.stdout.on("data", (data) => {
      console.log(`[Bot ${botId}] ${data.toString().trim()}`);
    });

    botProcess.stderr.on("data", (data) => {
      console.error(`[Bot ${botId}] Error: ${data.toString().trim()}`);
    });

    // Handle bot exit
    botProcess.on("exit", (code, signal) => {
      console.log(`[Bot ${botId}] Exited with code ${code}, signal ${signal}`);
      activeBots.delete(botId);
    });

    botProcess.on("error", (err) => {
      console.error(`[Bot ${botId}] Spawn error:`, err);
      activeBots.delete(botId);
    });

    // Send response immediately (don't wait for bot to finish)
    res.json({
      success: true,
      message: "Bot started successfully. It will join the meeting shortly.",
      botId: botId
    });

  } catch (error) {
    console.error("❌ startLiveBot error:", error);
    res.status(500).json({ 
      error: "Failed to start meeting bot",
      details: error.message 
    });
  }
};

export const getMeetingStatus = (req, res) => {
  try {
    const { botId } = req.params;
    
    if (!botId) {
      return res.status(400).json({ error: "Bot ID is required" });
    }

    const result = meetingResults.get(botId);
    
    if (!result) {
      return res.status(404).json({ 
        status: "not_found",
        message: "Bot session not found" 
      });
    }

    res.json(result);
  } catch (error) {
    console.error("❌ getMeetingStatus error:", error);
    res.status(500).json({ error: "Failed to get meeting status" });
  }
};

export const endLiveBot = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Audio file is required" });
    }

    console.log("🎙 Audio received:", req.file.originalname, `(${req.file.size} bytes)`);
    console.log("📂 File path:", req.file.path);

    // Step 1: Transcribe audio
    let transcript;
    try {
      transcript = await whisperTranscribe(req.file.path);
      console.log("✅ Transcription complete:", transcript.length, "characters");
    } catch (transcribeError) {
      console.error("❌ Transcription error:", transcribeError);
      
      // Clean up file on error
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {}
      
      return res.status(500).json({ 
        error: "Failed to transcribe audio",
        details: transcribeError.message 
      });
    }

    // Step 2: Process transcript with AI Engine
    let analysis;
    try {
      // Normalize URL
      const normalizedUrl = (AI_ENGINE_URL || "http://127.0.0.1:8000").replace("localhost", "127.0.0.1");
      
      // Check if AI Engine is running
      try {
        await axios.get(`${normalizedUrl}/health`, { timeout: 5000 });
      } catch (healthError) {
        throw new Error("AI Engine is not running. Please start it first.");
      }

      const response = await axios.post(
        `${normalizedUrl}/process`,
        { transcript },
        { timeout: 60000 }
      );
      
      analysis = response.data;
      console.log("✅ AI processing complete");
    } catch (processError) {
      console.error("❌ AI processing error:", processError);
      
      // Clean up file on error
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {}
      
      return res.status(500).json({ 
        error: "Failed to process transcript",
        details: processError.response?.data?.detail || processError.message 
      });
    }

    // Clean up uploaded file
    try {
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log("🗑️ Cleaned up audio file");
      }
    } catch (cleanupError) {
      console.warn("⚠️ Could not delete audio file:", cleanupError.message);
    }

    // Get botId from form data or query params
    const botId = req.body.botId || req.query.botId;
    
    // If no botId provided, try to find the most recent bot that's recording
    if (!botId) {
      for (const [id, result] of meetingResults.entries()) {
        if (result.status === "recording") {
          meetingResults.set(id, {
            status: "completed",
            data: analysis
          });
          break;
        }
      }
    } else {
      meetingResults.set(botId, {
        status: "completed",
        data: analysis
      });
    }

    // Return analysis results
    res.json({
      success: true,
      ...analysis
    });

  } catch (error) {
    console.error("❌ endLiveBot error:", error);
    
    // Clean up file on error
    try {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupErr) {}
    
    res.status(500).json({ 
      error: "Failed to process meeting",
      details: error.message 
    });
  }
};
