import React, { useState } from "react";
import { downloadPDF } from "../services/api";

const DownloadPDF = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!data) {
      setError("No data available to download");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await downloadPDF(data);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "meeting-summary.pdf");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to download PDF");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleDownload} disabled={loading}>
        {loading ? "Generating..." : "Download PDF"}
      </button>
    </div>
  );
};

export default DownloadPDF;
