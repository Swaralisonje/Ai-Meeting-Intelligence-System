import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

/* ================= LIVE MEETING ================= */

// Start live meeting bot
export const startLiveBot = (data) => {
  return API.post("/livebot/start", data);
};

// Called when meeting ends (audio upload)
export const endLiveMeeting = (formData) => {
  return API.post("/livebot/end", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Get meeting status
export const getMeetingStatus = (botId) => {
  return API.get(`/livebot/status/${botId}`);
};

/* ================= UPLOADED MEETING ================= */

// Upload recorded meeting file
export const uploadMeeting = (formData) => {
  return API.post("/ai/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Process transcript / audio
export const processTranscript = (data) => {
  return API.post("/ai/process", data);
};

/* ================= PDF ================= */

// Download PDF summary
export const downloadPDF = (meetingId) => {
  return API.get(`/pdf/${meetingId}`, {
    responseType: "blob",
  });
};
