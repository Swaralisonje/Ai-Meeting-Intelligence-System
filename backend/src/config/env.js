import dotenv from "dotenv";
dotenv.config();

// Use 127.0.0.1 instead of localhost to avoid IPv6 issues on Windows
const AI_ENGINE_URL_VALUE = process.env.AI_ENGINE_URL 
  ? process.env.AI_ENGINE_URL.replace("localhost", "127.0.0.1")
  : "http://127.0.0.1:8000";

const config = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/ai-meeting-assistant",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  AI_ENGINE_URL: AI_ENGINE_URL_VALUE
};

export default config;

// Named exports
export const PORT = config.PORT;
export const MONGO_URI = config.MONGO_URI;
export const OPENAI_API_KEY = config.OPENAI_API_KEY;
export const AI_ENGINE_URL = config.AI_ENGINE_URL;
