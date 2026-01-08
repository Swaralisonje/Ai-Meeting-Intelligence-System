import express from "express";
import { generatePDF } from "../controllers/pdf.controller.js";

const router = express.Router();

router.post("/download", generatePDF);

export default router;
