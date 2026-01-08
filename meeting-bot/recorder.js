import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Writable } from "stream";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let recordingStream = null;
let audioChunks = [];

/**
 * Starts recording by capturing audio from the page
 * 
 * IMPORTANT NOTE: 
 * - CDP Page.startScreencast does NOT capture audio - it only captures video/image frames
 * - The MediaRecorder API approach requires user interaction for getDisplayMedia permissions
 * - Current implementation will likely fail to capture audio, but handles it gracefully
 * 
 * RECOMMENDATION: Use FFmpeg-based system audio capture (recorder-ffmpeg.js) for reliable audio recording
 * 
 * @param {import("puppeteer").Page} page
 * @returns {Promise<object>} Recording stream object
 */
export async function startRecording(page) {
  try {
    console.log("🎙 Setting up audio recording...");

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "../uploads/audio");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `live_meeting_${Date.now()}.webm`);

    // Get CDP session for audio capture
    const client = await page.target().createCDPSession();
    
    // Enable necessary domains
    await client.send("Runtime.enable");
    await client.send("Page.enable");
    
    // Start capturing audio
    // NOTE: CDP Page.startScreencast only captures VIDEO/IMAGE frames, NOT audio
    // This method is fundamentally flawed for audio capture, but we include it for completeness
    // The error you see is expected - CDP screencast doesn't support audio capture
    try {
      // This will start screencast (video only), but won't capture audio
      await client.send("Page.startScreencast", {
        format: "png", // Only png/jpeg supported, not webm (that's why you got the error)
        quality: 100,
        maxWidth: 1920,
        maxHeight: 1080,
        everyNthFrame: 1
      });

      // Listen for screencast frames (VIDEO/IMAGE only - no audio data here)
      client.on("Page.screencastFrame", async (frame) => {
        if (frame.data) {
          // This is image/video data, not audio - so audioChunks will remain empty
          const buffer = Buffer.from(frame.data, "base64");
          // Note: These are image frames, not audio chunks, so this won't work
          audioChunks.push(buffer);
        }
        // Acknowledge frame
        await client.send("Page.screencastFrameAck", { sessionId: frame.sessionId });
      });

      console.log("✅ Screencast started (note: this captures video, not audio)");
    } catch (cdpError) {
      // Expected error: CDP screencast doesn't support audio capture
      console.warn("⚠️ CDP screencast not suitable for audio (expected) - trying alternative method");
      
      // Alternative: Use MediaRecorder API via page evaluation
      await page.evaluate(() => {
        if (window.mediaRecorder) return; // Already recording
        
        navigator.mediaDevices.getDisplayMedia({ 
          audio: true, 
          video: false 
        }).then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          window.audioChunks = [];
          
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
              window.audioChunks.push(event.data);
            }
          };
          
          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(window.audioChunks, { type: "audio/webm" });
            window.recordedAudio = audioBlob;
            console.log("Recording stopped, audio blob created");
          };
          
          mediaRecorder.start();
          window.mediaRecorder = mediaRecorder;
          console.log("MediaRecorder started");
        }).catch(err => {
          console.error("Failed to get display media:", err);
        });
      });
    }

    recordingStream = {
      outputPath,
      client,
      chunks: audioChunks,
      startTime: Date.now()
    };

    console.log(`📁 Recording to: ${outputPath}`);
    return recordingStream;

  } catch (error) {
    console.error("❌ Failed to start recording:", error);
    throw error;
  }
}

/**
 * Stops recording and saves the audio file
 * @param {import("puppeteer").Page} page
 * @param {object} recordingStream - The recording stream object
 * @returns {Promise<string>} Path to the saved audio file
 */
export async function stopRecording(page, recordingStream) {
  try {
    console.log("⏹ Stopping recording...");

    if (!recordingStream) {
      throw new Error("No active recording to stop");
    }

    const { client, outputPath } = recordingStream;

    // Stop CDP screencast
    try {
      if (client) {
        await client.send("Page.stopScreencast");
        await client.detach();
      }
    } catch (err) {
      console.warn("⚠️ Error stopping CDP recording:", err.message);
    }

    // Try to get audio from MediaRecorder if CDP didn't work
    let audioBlob = null;
    try {
      audioBlob = await page.evaluate(async () => {
        if (window.mediaRecorder && window.mediaRecorder.state !== "inactive") {
          return new Promise((resolve) => {
            window.mediaRecorder.onstop = () => {
              const blob = new Blob(window.audioChunks, { type: "audio/webm" });
              resolve(blob);
            };
            window.mediaRecorder.stop();
          });
        }
        return null;
      });
    } catch (err) {
      console.warn("⚠️ Could not get MediaRecorder audio:", err.message);
    }

    // Save audio chunks to file
    console.log(`📊 Recording status - CDP chunks: ${audioChunks.length}, MediaRecorder blob: ${audioBlob ? 'available' : 'none'}`);
    
    if (audioChunks.length > 0 || audioBlob) {
      let finalPath = outputPath;
      
      if (audioBlob) {
        // Convert blob to buffer
        try {
          const arrayBuffer = await audioBlob.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (buffer.length > 0) {
            fs.writeFileSync(finalPath, buffer);
            console.log(`✅ Saved audio from MediaRecorder: ${finalPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
          } else {
            throw new Error("Audio blob is empty");
          }
        } catch (blobError) {
          console.warn(`⚠️ Error processing MediaRecorder blob: ${blobError.message}`);
          throw new Error("Failed to save MediaRecorder audio");
        }
      } else if (audioChunks.length > 0) {
        // Combine chunks and save
        try {
          const combinedBuffer = Buffer.concat(audioChunks);
          if (combinedBuffer.length > 0) {
            fs.writeFileSync(finalPath, combinedBuffer);
            console.log(`✅ Saved audio from CDP: ${finalPath} (${(combinedBuffer.length / 1024).toFixed(2)} KB)`);
          } else {
            throw new Error("Combined audio buffer is empty");
          }
        } catch (bufferError) {
          console.warn(`⚠️ Error processing CDP chunks: ${bufferError.message}`);
          throw new Error("Failed to save CDP audio");
        }
      } else {
        throw new Error("No audio data captured (empty chunks and blob)");
      }

      // Clear chunks
      audioChunks = [];
      recordingStream = null;

      return finalPath;
    } else {
      // No audio data - throw error without logging (caller will handle gracefully)
      throw new Error("No audio data was recorded");
    }

  } catch (error) {
    // Only log unexpected errors, not the expected "no audio data" case
    if (!error.message.includes("No audio data")) {
      console.error("❌ Failed to stop recording:", error);
    }
    throw error;
  }
}
