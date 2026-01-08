import PDFDocument from "pdfkit";

const generatePDFBuffer = (data) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument();
      const buffers = [];

      doc.on("data", buffers.push.bind(buffers));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on("error", reject);

      // Add content
      doc.fontSize(20).text("Meeting Summary", { align: "center" });
      doc.moveDown();

      if (data.summary) {
        doc.fontSize(16).text("Summary:", { underline: true });
        doc.fontSize(12).text(data.summary);
        doc.moveDown();
      }

      if (data.mom) {
        doc.fontSize(16).text("Minutes of Meeting:", { underline: true });
        if (Array.isArray(data.mom)) {
          data.mom.forEach((item) => {
            doc.fontSize(12).text(`• ${item}`);
          });
        } else {
          doc.fontSize(12).text(data.mom);
        }
        doc.moveDown();
      }

      if (data.tasks && Array.isArray(data.tasks)) {
        doc.fontSize(16).text("Tasks:", { underline: true });
        data.tasks.forEach((task) => {
          const taskText = typeof task === "object" 
            ? `${task.task || JSON.stringify(task)} - ${task.date || "No date"}`
            : task;
          doc.fontSize(12).text(`• ${taskText}`);
        });
        doc.moveDown();
      }

      if (data.important_dates && Array.isArray(data.important_dates)) {
        doc.fontSize(16).text("Important Dates:", { underline: true });
        data.important_dates.forEach((date) => {
          doc.fontSize(12).text(`• ${date}`);
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export { generatePDFBuffer };
