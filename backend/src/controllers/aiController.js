import axios from "axios";
import env from "../config/env.js";

const AI_ENGINE_URL = env.AI_ENGINE_URL || "http://127.0.0.1:8000";

// Helper to check if AI Engine is running
const checkAIEngine = async () => {
  try {
    await axios.get(`${AI_ENGINE_URL}/health`, { timeout: 5000 });
    return true;
  } catch (error) {
    return false;
  }
};

export const processMeeting = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: "Transcript is required" });
        }

        // Check if AI Engine is running
        const isRunning = await checkAIEngine();
        if (!isRunning) {
            return res.status(503).json({ 
                error: "AI Engine is not running",
                message: "Please start the AI Engine first. See terminal for instructions."
            });
        }

        const response = await axios.post(
            `${AI_ENGINE_URL}/process`,
            { transcript }
        );

        res.json(response.data);
    } catch (error) {
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
            console.error("❌ Cannot connect to AI Engine!");
            return res.status(503).json({ 
                error: "AI Engine is not running",
                message: "Please start the AI Engine: cd ai-engine && venv\\Scripts\\activate && python main.py"
            });
        }
        console.error("AI Engine Error:", error.message);
        res.status(500).json({ error: "AI Engine Error", details: error.message });
    }
};

export const processTranscript = async (req, res) => {
    try {
        const { transcript } = req.body;

        if (!transcript) {
            return res.status(400).json({ error: "Transcript is required" });
        }

        // Check if AI Engine is running
        const isRunning = await checkAIEngine();
        if (!isRunning) {
            return res.status(503).json({ 
                error: "AI Engine is not running",
                message: "Please start the AI Engine first. See terminal for instructions."
            });
        }

        const response = await axios.post(
            `${AI_ENGINE_URL}/process`,
            { transcript }
        );

        res.json(response.data);
    } catch (error) {
        if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
            console.error("❌ Cannot connect to AI Engine!");
            return res.status(503).json({ 
                error: "AI Engine is not running",
                message: "Please start the AI Engine: cd ai-engine && venv\\Scripts\\activate && python main.py"
            });
        }
        console.error("AI Engine Error:", error.message);
        res.status(500).json({ error: "AI Engine Error", details: error.message });
    }
};