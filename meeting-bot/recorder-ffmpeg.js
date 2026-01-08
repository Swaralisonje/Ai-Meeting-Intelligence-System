import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let ffmpegProcess = null;

/**
 * Starts recording system audio using FFmpeg (Windows WASAPI)
 * This captures all audio playing through the speakers (meeting audio)
 * 
 * @returns {Promise<object>} Recording stream object with process and output path
 */
export async function startRecordingFFmpeg() {
  try {
    console.log("🎙 Setting up system audio recording with FFmpeg...");

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, "../uploads/audio");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `live_meeting_${Date.now()}.wav`);

    // FFmpeg command for Windows WASAPI to capture system audio (loopback)
    // This captures "what you hear" - all audio output from the computer
    const ffmpegArgs = [
      "-f", "wasapi",                    // Windows Audio Session API input format
      "-i", "loopback",                  // Capture loopback (system audio output)
      "-ar", "44100",                    // Sample rate: 44.1 kHz
      "-ac", "2",                        // Stereo (2 channels)
      "-f", "wav",                       // Output format: WAV
      "-y",                              // Overwrite output file
      outputPath
    ];

    console.log("🔍 Attempting to start FFmpeg...");
    console.log("📝 Command: ffmpeg " + ffmpegArgs.join(" "));

    // Spawn FFmpeg process
    ffmpegProcess = spawn("ffmpeg", ffmpegArgs, {
      stdio: ["ignore", "pipe", "pipe"] // Ignore stdin, capture stdout/stderr
    });

    const recordingStream = {
      process: ffmpegProcess,
      outputPath: outputPath,
      startTime: Date.now()
    };

    // Handle FFmpeg output
    ffmpegProcess.stdout.on("data", (data) => {
      // FFmpeg usually doesn't output to stdout for recording
    });

    ffmpegProcess.stderr.on("data", (data) => {
      const message = data.toString();
      // FFmpeg outputs info to stderr
      if (message.includes("Stream mapping") || message.includes("Output #0")) {
        console.log("✅ FFmpeg recording started successfully");
        console.log(`📁 Recording to: ${outputPath}`);
      }
    });

    // Handle process errors
    ffmpegProcess.on("error", (err) => {
      if (err.code === "ENOENT") {
        console.error("❌ FFmpeg not found! Please install FFmpeg:");
        console.error("   1. Download from: https://ffmpeg.org/download.html");
        console.error("   2. Or use: winget install FFmpeg");
        console.error("   3. Or use: choco install ffmpeg");
        console.error("   4. Make sure FFmpeg is in your PATH");
      } else {
        console.error("❌ FFmpeg error:", err.message);
      }
    });

    // Wait a bit to see if FFmpeg starts successfully
    // Give it 2 seconds - if process is still running, it started successfully
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // If process is still running after 2 seconds, it started successfully
        if (ffmpegProcess && !ffmpegProcess.killed && ffmpegProcess.exitCode === null) {
          resolve();
        } else {
          reject(new Error("FFmpeg process failed to start or exited immediately"));
        }
      }, 2000);

      // If process exits quickly (before timeout), it failed
      const exitHandler = (code) => {
        clearTimeout(timeout);
        ffmpegProcess.removeListener("exit", exitHandler);
        if (code !== 0 && code !== null) {
          reject(new Error(`FFmpeg exited with code ${code}`));
        }
      };
      
      ffmpegProcess.once("exit", exitHandler);
    }).catch((err) => {
      // If it fails, it's probably because FFmpeg isn't installed or loopback isn't available
      if (ffmpegProcess) {
        ffmpegProcess.kill();
      }
      throw new Error(`FFmpeg recording failed: ${err.message}`);
    });

    console.log("✅ System audio recording started");
    return recordingStream;

  } catch (error) {
    console.error("❌ Failed to start FFmpeg recording:", error.message);
    throw error;
  }
}

/**
 * Stops FFmpeg recording and returns the path to the audio file
 * 
 * @param {object} recordingStream - Recording stream object from startRecordingFFmpeg
 * @returns {Promise<string>} Path to the recorded audio file
 */
export async function stopRecordingFFmpeg(recordingStream) {
  try {
    console.log("⏹ Stopping FFmpeg recording...");

    if (!recordingStream || !recordingStream.process) {
      throw new Error("No active FFmpeg recording to stop");
    }

    const { process, outputPath } = recordingStream;

    // Stop FFmpeg gracefully by sending 'q' to stdin (quit)
    return new Promise((resolve, reject) => {
      // Send 'q' to quit FFmpeg gracefully
      if (process.stdin && !process.stdin.destroyed) {
        process.stdin.write("q\n");
      }

      process.on("exit", (code) => {
        if (fs.existsSync(outputPath)) {
          const stats = fs.statSync(outputPath);
          if (stats.size > 0) {
            console.log(`✅ Recording stopped. File saved: ${outputPath}`);
            console.log(`📊 File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`);
            resolve(outputPath);
          } else {
            reject(new Error("Recorded file is empty"));
          }
        } else {
          reject(new Error("Recorded file not found"));
        }
      });

      // If process doesn't exit within 5 seconds, kill it
      setTimeout(() => {
        if (!process.killed) {
          console.warn("⚠️ FFmpeg didn't stop gracefully, forcing termination...");
          process.kill("SIGTERM");
        }
      }, 5000);

      // Handle errors
      process.on("error", (err) => {
        reject(new Error(`FFmpeg process error: ${err.message}`));
      });
    });

  } catch (error) {
    console.error("❌ Failed to stop FFmpeg recording:", error.message);
    throw error;
  }
}

