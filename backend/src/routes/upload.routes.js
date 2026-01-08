import express from "express";
import multer from "multer";
import { handleAudio } from "../controllers/upload.controller.js";

const upload = multer({ dest: "uploads/" });
const router = express.Router();

router.post("/audio", upload.single("file"), handleAudio);

export default router;
