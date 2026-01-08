import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { processTranscript } from "../controllers/aiController.js";
import { whisperTranscribe } from "../services/whisper.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/audio");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer config
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Routes
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log(`📥 File uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    console.log(`📂 Saved to: ${req.file.path}`);

    // Validate file type
    const allowedTypes = ['audio/', 'video/'];
    if (!allowedTypes.some(type => req.file.mimetype.startsWith(type))) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ 
        error: "Invalid file type. Please upload an audio or video file." 
      });
    }

    let transcript;
    try {
      transcript = await whisperTranscribe(req.file.path);
      console.log(`✅ Transcription complete: ${transcript.length} characters`);
    } catch (transcribeError) {
      console.error("❌ Transcription error:", transcribeError.message);
      
      // Clean up file
      try {
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (cleanupErr) {}
      
      return res.status(500).json({ 
        error: "Transcription failed", 
        details: transcribeError.message 
      });
    }
    
    // Clean up uploaded file after transcription
    try {
      fs.unlinkSync(req.file.path);
      console.log(`🗑️ Cleaned up uploaded file: ${req.file.path}`);
    } catch (cleanupError) {
      console.warn(`⚠️ Could not delete uploaded file: ${cleanupError.message}`);
    }

    res.json({ transcript });
  } catch (error) {
    console.error("❌ Upload/Transcription error:", error.message);
    console.error("Full error:", error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.warn(`⚠️ Could not delete uploaded file: ${cleanupError.message}`);
      }
    }

    res.status(500).json({ 
      error: "Failed to process meeting", 
      details: error.message 
    });
  }
});
router.post("/process", async (req, res) => {
  try {
    await processTranscript(req, res);
  } catch (error) {
    console.error("Process error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to process transcript", details: error.message });
    }
  }
});

export default router;
