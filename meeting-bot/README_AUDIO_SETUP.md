# Audio Recording Setup Guide

## Overview

The meeting bot now uses **FFmpeg** to capture system audio (all audio playing through your computer speakers), which includes all participants' voices from the meeting.

## Installation

### Step 1: Install FFmpeg on Windows

You have several options:

#### Option A: Using winget (Windows Package Manager)
```bash
winget install FFmpeg
```

#### Option B: Using Chocolatey
```bash
choco install ffmpeg
```

#### Option C: Manual Installation
1. Download FFmpeg from: https://ffmpeg.org/download.html
2. Extract the ZIP file
3. Add FFmpeg to your PATH:
   - Open System Properties → Environment Variables
   - Add the `bin` folder path to your System PATH
   - Example: `C:\ffmpeg\bin`

### Step 2: Verify Installation

Open a new PowerShell/Command Prompt and run:
```bash
ffmpeg -version
```

If FFmpeg is installed correctly, you should see version information.

## How It Works

1. **FFmpeg System Audio Capture**: Uses Windows WASAPI (Windows Audio Session API) to capture "loopback" audio
   - This captures ALL audio output from your computer
   - Includes all meeting participants' voices
   - Works automatically without user interaction

2. **Fallback Method**: If FFmpeg is not available, the bot falls back to browser-based recording (which may not capture audio due to browser limitations)

## Audio Format

- **Format**: WAV (uncompressed, high quality)
- **Sample Rate**: 44.1 kHz
- **Channels**: Stereo (2 channels)

## Troubleshooting

### FFmpeg not found
- Error: `FFmpeg not found! Please install FFmpeg`
- Solution: Install FFmpeg using one of the methods above and ensure it's in your PATH

### No audio captured
- Check that your speakers/headphones are working
- Ensure the meeting audio is actually playing through your computer
- Verify FFmpeg can access the loopback device (run as administrator if needed)

### Permission Issues
- On some systems, you may need to run the bot as Administrator
- Windows may require microphone permissions even for loopback capture

## Notes

- FFmpeg captures system audio, so make sure your meeting audio is playing through your computer speakers/headphones
- The bot will automatically use FFmpeg if available, otherwise it falls back to browser-based recording
- Recorded files are saved in `uploads/audio/` directory

