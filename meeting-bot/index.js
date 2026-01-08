import { joinMeeting } from "./joinMeeting.js";
import { startRecording, stopRecording } from "./recorder.js";
import { startRecordingFFmpeg, stopRecordingFFmpeg } from "./recorder-ffmpeg.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import FormData from "form-data";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Backend URL for processing
const BACKEND_URL = process.env.BACKEND_URL || "http://127.0.0.1:5000";

let recordingStream = null;
let meetingEndDetected = false;

async function startBot() {
  let browser = null;
  let page = null;
  let meetingCheckInterval = null;
  
  try {
    // Get meeting link from command line
    const meetingLink = process.argv[2];

    if (!meetingLink || typeof meetingLink !== "string" || meetingLink.trim() === "") {
      console.error("❌ Meeting link not provided or invalid");
      console.error("Usage: node index.js <meeting-link>");
      process.exit(1);
    }

    console.log("🔗 Meeting link received:", meetingLink);

    // Join meeting using Puppeteer
    const result = await joinMeeting(meetingLink);

    if (!result || !result.browser || !result.page) {
      throw new Error("Failed to join meeting - browser or page not returned");
    }

    browser = result.browser;
    page = result.page;

    console.log("🤖 Bot joined meeting successfully");

    // Track initial meeting URL
    const initialUrl = page.url();
    console.log("📍 Initial meeting URL:", initialUrl);

    // Start recording - Try FFmpeg first (system audio), fallback to browser-based method
    let useFFmpeg = true;
    try {
      console.log("🎙 Attempting to start audio recording...");
      recordingStream = await startRecordingFFmpeg();
      console.log("✅ System audio recording started (FFmpeg)");
      useFFmpeg = true;
    } catch (ffmpegError) {
      console.warn("⚠️ FFmpeg recording failed:", ffmpegError.message);
      console.warn("🔄 Falling back to browser-based recording (may not capture audio)...");
      useFFmpeg = false;
      
      try {
        recordingStream = await startRecording(page);
        console.log("✅ Browser-based recording started (may not capture audio)");
      } catch (recordingError) {
        console.warn("⚠️ Browser recording also failed, continuing without recording:", recordingError.message);
        recordingStream = null;
      }
    }
    
    // Store recording method in stream object
    if (recordingStream) {
      recordingStream.useFFmpeg = useFFmpeg;
    }

    // Monitor meeting to detect when it ends
    const checkMeetingStatus = async () => {
      try {
        // Check if meeting page still exists and is active
        const isClosed = page.isClosed();
        if (isClosed) {
          console.log("=".repeat(60));
          console.log("📴 MEETING ENDED - Page Closed");
          console.log("=".repeat(60));
          console.log("🔍 Detection Method: Page closed");
          console.log("⏰ End Time:", new Date().toISOString());
          console.log("📊 Status: Meeting has been terminated");
          console.log("=".repeat(60));
          meetingEndDetected = true;
          await processAndSendAudio();
          return;
        }

        // Check current URL (navigation detection)
        const currentUrl = page.url();
        const urlChanged = currentUrl !== initialUrl && !currentUrl.includes('meet.google.com');
        
        if (urlChanged) {
          console.log("=".repeat(60));
          console.log("📴 MEETING ENDED - Navigation Detected");
          console.log("=".repeat(60));
          console.log("🔍 Detection Method: Page navigation");
          console.log("⏰ End Time:", new Date().toISOString());
          console.log("📍 Initial URL:", initialUrl);
          console.log("📍 Current URL:", currentUrl);
          console.log("📊 Status: User navigated away from meeting");
          console.log("=".repeat(60));
          console.log("🤖 Bot understands: Meeting ended via navigation. Processing audio...");
          console.log("=".repeat(60));
          meetingEndDetected = true;
          await processAndSendAudio();
          return;
        }

        // Check for "Call ended" or similar indicators (Google Meet)
        const meetingStatus = await page.evaluate(() => {
          const pageText = document.body.innerText || '';
          
          // Check for text indicators
          const textIndicators = [
            /call ended/i,
            /meeting ended/i,
            /everyone left/i,
            /left the call/i,
            /rejoin/i,
            /call disconnected/i
          ];

          let hasEndText = false;
          for (const pattern of textIndicators) {
            if (pattern.test(pageText)) {
              hasEndText = true;
              break;
            }
          }

          // Check URL changes (Google Meet redirects when meeting ends)
          const urlChanged = window.location.href.includes('/hangouts') || 
                            window.location.href.includes('/end') ||
                            !window.location.href.includes('meet.google.com');

          // Check for leave/end button visibility state
          const leaveButtons = document.querySelectorAll('button[aria-label*="Leave" i], button[aria-label*="End" i]');
          const hasLeaveButtons = leaveButtons.length > 0;

          // Check for participant count (if everyone left, count would be 0 or 1)
          const participantElements = document.querySelectorAll('[data-participant-id]');
          const participantCount = participantElements.length;

          return {
            hasEndText,
            urlChanged,
            hasLeaveButtons,
            participantCount,
            currentUrl: window.location.href,
            pageTitle: document.title
          };
        });

        // Display comprehensive meeting status
        if (meetingStatus.hasEndText || meetingStatus.urlChanged) {
          console.log("=".repeat(60));
          console.log("📴 MEETING ENDED - User Action Detected");
          console.log("=".repeat(60));
          console.log("🔍 Detection Method: End indicators found");
          console.log("⏰ End Time:", new Date().toISOString());
          console.log("📊 Meeting Status:", JSON.stringify(meetingStatus, null, 2));
          console.log("🔗 Current URL:", meetingStatus.currentUrl);
          console.log("📄 Page Title:", meetingStatus.pageTitle);
          console.log("👥 Participant Count:", meetingStatus.participantCount);
          console.log("✅ End Text Found:", meetingStatus.hasEndText);
          console.log("🔀 URL Changed:", meetingStatus.urlChanged);
          console.log("=".repeat(60));
          console.log("🤖 Bot understands: Meeting has ended. Processing audio...");
          console.log("=".repeat(60));
          meetingEndDetected = true;
          await processAndSendAudio();
          return;
        }

        // Log status every check (every 30 seconds for detailed logs)
        if (Math.random() < 0.1) { // Log 10% of the time to avoid spam
          console.log("✅ Meeting still active - URL:", meetingStatus.currentUrl.substring(0, 50) + "...");
        }

      } catch (err) {
        // Page might be closed or navigated away
        if (!meetingEndDetected) {
          console.log("=".repeat(60));
          console.log("📴 MEETING ENDED - Page Error/Navigation");
          console.log("=".repeat(60));
          console.log("🔍 Detection Method: Page error or navigation");
          console.log("⏰ End Time:", new Date().toISOString());
          console.log("❌ Error:", err.message);
          console.log("📊 Status: Meeting page is no longer accessible");
          console.log("=".repeat(60));
          console.log("🤖 Bot understands: Meeting has ended. Processing audio...");
          console.log("=".repeat(60));
          meetingEndDetected = true;
          await processAndSendAudio();
        }
      }
    };

    // Check meeting status every 3 seconds for faster detection
    meetingCheckInterval = setInterval(checkMeetingStatus, 3000);

    // Function to process and send audio
    const processAndSendAudio = async () => {
      if (meetingCheckInterval) {
        clearInterval(meetingCheckInterval);
        meetingCheckInterval = null;
      }

      try {
        console.log("=".repeat(60));
        console.log("🔄 PROCESSING MEETING AUDIO");
        console.log("=".repeat(60));
        console.log("⏰ Processing started at:", new Date().toISOString());

        // Stop recording
        let audioPath = null;
        if (recordingStream) {
          console.log("⏹ Stopping audio recording...");
          try {
            // Use appropriate stop method based on recording type
            if (recordingStream.useFFmpeg) {
              audioPath = await stopRecordingFFmpeg(recordingStream);
            } else {
              audioPath = await stopRecording(page, recordingStream);
            }
            console.log(`✅ Audio saved: ${audioPath}`);
            
            // Get file size
            try {
              const stats = fs.statSync(audioPath);
              const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
              console.log(`📊 Audio file size: ${fileSizeMB} MB`);
            } catch (statErr) {
              console.warn("⚠️ Could not get file stats:", statErr.message);
            }
          } catch (recordingError) {
            console.warn("=".repeat(60));
            console.warn("⚠️ WARNING: Audio recording failed");
            console.warn("=".repeat(60));
            console.warn("📊 Error:", recordingError.message);
            console.warn("💡 Note: The meeting ended, but no audio was captured.");
            console.warn("💡 This can happen if:");
            console.warn("   - The recording method didn't work properly");
            console.warn("   - Audio permissions were not granted");
            console.warn("   - The meeting had no audio activity");
            console.warn("=".repeat(60));
            console.warn("🔄 Continuing without audio file...");
            console.warn("=".repeat(60));
            // Continue without audio - don't crash
            audioPath = null;
          }
        } else {
          console.warn("⚠️ No recording stream found");
          console.log("=".repeat(60));
          // Continue without audio
          audioPath = null;
        }

        // Send to backend for processing (only if audio was recorded)
        if (!audioPath) {
          console.log("=".repeat(60));
          console.log("⚠️ SKIPPING BACKEND PROCESSING");
          console.log("=".repeat(60));
          console.log("❌ No audio file available to process");
          console.log("💡 Meeting ended successfully, but no audio was recorded");
          console.log("=".repeat(60));
          
          // Clean up and exit gracefully
          if (browser) {
            console.log("🔒 Closing browser...");
            await browser.close();
          }
          console.log("👋 Bot shutting down (no audio to process)");
          process.exit(0);
        }

        if (audioPath && fs.existsSync(audioPath)) {
          console.log("📤 Sending audio to backend for processing...");
          console.log("🌐 Backend URL:", BACKEND_URL);
          
          const formData = new FormData();
          formData.append("audio", fs.createReadStream(audioPath), {
            filename: path.basename(audioPath),
            contentType: "audio/webm"
          });

          // Add botId if available
          const botId = process.env.BOT_ID;
          if (botId) {
            formData.append("botId", botId);
            console.log("🆔 Bot ID:", botId);
          } else {
            console.warn("⚠️ Bot ID not found in environment");
          }

          console.log("⏳ Waiting for backend response...");
          const response = await axios.post(
            `${BACKEND_URL}/api/livebot/end`,
            formData,
            {
              headers: {
                ...formData.getHeaders(),
              },
              timeout: 300000, // 5 minutes
            }
          );

          console.log("=".repeat(60));
          console.log("✅ MEETING PROCESSED SUCCESSFULLY!");
          console.log("=".repeat(60));
          console.log("📊 Processing Results:");
          console.log(JSON.stringify(response.data, null, 2));
          console.log("=".repeat(60));
          console.log("⏰ Completed at:", new Date().toISOString());
          console.log("=".repeat(60));

          // Clean up audio file
          try {
            fs.unlinkSync(audioPath);
            console.log("🗑️ Cleaned up audio file");
          } catch (cleanupErr) {
            console.warn("⚠️ Could not delete audio file:", cleanupErr.message);
          }

          // Exit successfully
          if (browser) {
            console.log("🔒 Closing browser...");
            await browser.close();
          }
          console.log("👋 Bot shutting down gracefully");
          process.exit(0);
        } else {
          throw new Error("Audio file not found after recording");
        }
      } catch (error) {
        console.error("=".repeat(60));
        console.error("❌ ERROR PROCESSING MEETING AUDIO");
        console.error("=".repeat(60));
        console.error("⏰ Error occurred at:", new Date().toISOString());
        console.error("❌ Error message:", error.message);
        console.error("📊 Error details:", error.response?.data || error.stack);
        console.error("=".repeat(60));
        
        if (browser) {
          try {
            await browser.close();
          } catch (closeErr) {
            console.error("❌ Error closing browser:", closeErr.message);
          }
        }
        process.exit(1);
      }
    };

    // Keep bot alive (default 60 minutes max, or until meeting ends)
    const MEETING_TIMEOUT = 60 * 60 * 1000; // 60 minutes

    // Handle timeout
    const timeoutId = setTimeout(async () => {
      if (!meetingEndDetected) {
        console.log("=".repeat(60));
        console.log("⏹ MEETING TIMEOUT REACHED");
        console.log("=".repeat(60));
        console.log("⏰ Timeout at:", new Date().toISOString());
        console.log("⏱️ Meeting duration limit reached (60 minutes)");
        console.log("📊 Status: Maximum meeting time exceeded");
        console.log("=".repeat(60));
        console.log("🤖 Bot understands: Meeting timeout. Processing audio...");
        console.log("=".repeat(60));
        await processAndSendAudio();
      }
    }, MEETING_TIMEOUT);

    // Handle process signals
    const shutdown = async () => {
      if (meetingCheckInterval) {
        clearInterval(meetingCheckInterval);
        meetingCheckInterval = null;
      }
      clearTimeout(timeoutId);
      
      if (!meetingEndDetected) {
        console.log("=".repeat(60));
        console.log("⏹ MANUAL SHUTDOWN DETECTED");
        console.log("=".repeat(60));
        console.log("⏰ Shutdown at:", new Date().toISOString());
        console.log("📊 Status: User initiated shutdown (SIGINT/SIGTERM)");
        console.log("=".repeat(60));
        console.log("🤖 Bot understands: Manual shutdown. Processing audio...");
        console.log("=".repeat(60));
        await processAndSendAudio();
      } else {
        console.log("✅ Shutdown: Meeting already processed");
        if (browser) {
          await browser.close();
        }
        process.exit(0);
      }
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    // Keep process alive
    console.log("⏳ Bot is in meeting and recording. Meeting will be processed automatically when it ends.");

  } catch (error) {
    console.error("❌ Bot crashed:", error.message);
    console.error("Full error:", error);
    
    // Clean up browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
    
    process.exit(1);
  }
}

// Start bot
startBot();
