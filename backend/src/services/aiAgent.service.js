const axios = require("axios");
const { AI_ENGINE_URL } = require("../config/env");

const processWithAI = async (transcript) => {
  try {
    const response = await axios.post(`${AI_ENGINE_URL}/process`, {
      transcript
    });
    return response.data;
  } catch (error) {
    console.error("AI Agent Service Error:", error);
    throw error;
  }
};

module.exports = { processWithAI };
