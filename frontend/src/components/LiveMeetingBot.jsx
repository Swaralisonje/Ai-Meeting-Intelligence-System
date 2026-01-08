import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { startLiveBot, getMeetingStatus } from "../services/api";

const LiveMeetingBot = () => {
  const [link, setLink] = useState("");
  const [botJoined, setBotJoined] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [botId, setBotId] = useState(null);
  const [status, setStatus] = useState("idle"); // idle, recording, processing, completed
  const statusIntervalRef = useRef(null);
  const navigate = useNavigate();

  const handleStartBot = async () => {
    if (!link.trim()) {
      setError("Please enter a meeting link");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setStatus("recording");

    try {
      const response = await startLiveBot({ meetingLink: link });
      const newBotId = response.data.botId;
      
      setBotId(newBotId);
      setBotJoined(true);
      setSuccess(true);
      setLink("");
      
      // Start polling for meeting status
      startStatusPolling(newBotId);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to start bot");
      setStatus("idle");
      console.error("Start bot error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startStatusPolling = (id) => {
    // Clear any existing interval
    if (statusIntervalRef.current) {
      clearInterval(statusIntervalRef.current);
    }

    // Poll every 3 seconds for meeting completion
    statusIntervalRef.current = setInterval(async () => {
      try {
        const response = await getMeetingStatus(id);
        const result = response.data;

        if (result.status === "completed" && result.data) {
          // Meeting completed, stop polling and navigate to results
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
          }
          
          setStatus("completed");
          navigate("/result", { state: result.data });
        } else if (result.status === "failed") {
          // Meeting failed
          if (statusIntervalRef.current) {
            clearInterval(statusIntervalRef.current);
            statusIntervalRef.current = null;
          }
          
          setError(result.error || "Meeting processing failed");
          setStatus("idle");
        } else if (result.status === "recording") {
          setStatus("recording");
        } else if (result.status === "processing") {
          setStatus("processing");
        }
      } catch (err) {
        console.error("Status check error:", err);
        // Continue polling even if one request fails
      }
    }, 3000);
  };

  useEffect(() => {
    // Cleanup interval on unmount
    return () => {
      if (statusIntervalRef.current) {
        clearInterval(statusIntervalRef.current);
      }
    };
  }, []);


  return (
    <div className="card">
      <h2>Live Meeting Bot</h2>
      
      {!botJoined ? (
        <>
          <input
            type="text"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="Paste Google Meet or Zoom link"
            style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          {success && <p style={{ color: "green" }}>Bot started successfully!</p>}
          <button onClick={handleStartBot} disabled={loading}>
            {loading ? "Starting..." : "Start Meeting Bot"}
          </button>
        </>
      ) : (
        <>
          {status === "recording" && (
            <>
              <p style={{ color: "green", fontSize: "18px" }}>
                🤖 Bot is in the meeting and recording...
              </p>
              <p style={{ color: "gray" }}>
                The meeting will be automatically processed when it ends.
              </p>
              <div style={{ marginTop: "20px" }}>
                <div className="spinner" style={{ 
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #3498db",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto"
                }}></div>
              </div>
            </>
          )}
          {status === "processing" && (
            <>
              <p style={{ color: "blue", fontSize: "18px" }}>
                ⚙️ Meeting ended. Processing audio and generating summary...
              </p>
              <div style={{ marginTop: "20px" }}>
                <div className="spinner" style={{ 
                  border: "4px solid #f3f3f3",
                  borderTop: "4px solid #3498db",
                  borderRadius: "50%",
                  width: "40px",
                  height: "40px",
                  animation: "spin 1s linear infinite",
                  margin: "0 auto"
                }}></div>
              </div>
            </>
          )}
          {status === "completed" && (
            <p style={{ color: "green" }}>✅ Meeting processed! Redirecting to results...</p>
          )}
          {error && <p style={{ color: "red" }}>{error}</p>}
        </>
      )}
    </div>
  );
};

export default LiveMeetingBot;
