import React, { useState } from "react";
import { uploadMeeting, processTranscript } from "../services/api";
import { useNavigate } from "react-router-dom";

const UploadMeeting = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Step 1: Upload and transcribe
      const uploadRes = await uploadMeeting(formData);
      
      if (!uploadRes.data || !uploadRes.data.transcript) {
        throw new Error("Transcription failed - no transcript received");
      }

      // Step 2: Process transcript with AI
      const aiRes = await processTranscript({ transcript: uploadRes.data.transcript });

      if (!aiRes.data) {
        throw new Error("AI processing failed - no results received");
      }

      navigate("/result", { state: aiRes.data });
    } catch (err) {
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.details || 
                          err.message || 
                          "Failed to process meeting";
      setError(errorMessage);
      console.error("Upload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Upload Meeting File</h2>
      <input 
        type="file" 
        accept="audio/*,video/*"
        onChange={(e) => setFile(e.target.files[0])} 
      />
      {error && <p style={{ color: "red" }}>{error}</p>}
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Processing..." : "Process Meeting"}
      </button>
    </div>
  );
};

export default UploadMeeting;
