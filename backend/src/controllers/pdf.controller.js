import { generatePDFBuffer } from "../services/pdf.service.js";

export const generatePDF = async (req, res) => {
  try {
    const pdfBuffer = await generatePDFBuffer(req.body);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=meeting-summary.pdf");
    res.send(pdfBuffer);
  } catch (error) {
    console.error("PDF Generation Error:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
};
