import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import aiRoutes from "./routes/aiRoutes.js";
import livebotRoutes from "./routes/livebot.routes.js";
import pdfRoutes from "./routes/pdf.routes.js";
import uploadRoutes from "./routes/upload.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

app.use("/api/ai", aiRoutes);
app.use("/api/livebot", livebotRoutes);
app.use("/api/pdf", pdfRoutes);
app.use("/api/upload", uploadRoutes);

export default app;
