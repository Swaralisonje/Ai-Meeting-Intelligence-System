import express from "express";
import multer from "multer";
import { startLiveBot, endLiveBot, getMeetingStatus } from "../controllers/livebot.controller.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/start", startLiveBot);
router.post("/end", upload.single("audio"), endLiveBot);
router.get("/status/:botId", getMeetingStatus);

export default router;
