import puppeteer from "puppeteer";

/**
 * Joins a Google Meet or Zoom meeting
 * @param {string} meetingLink
 * @returns {Promise<{browser: Browser, page: Page}>}
 */
export async function joinMeeting(meetingLink) {
  let browser = null;
  try {
    console.log("🌐 Launching browser...");
    browser = await puppeteer.launch({
      headless: false,
      args: [
        "--use-fake-ui-for-media-stream",
        "--disable-infobars",
        "--start-maximized",
        "--disable-blink-features=AutomationControlled"
      ],
      defaultViewport: null
    });

    const page = await browser.newPage();

    console.log("🔗 Navigating to meeting:", meetingLink);
    await page.goto(meetingLink, { 
      waitUntil: "networkidle2",
      timeout: 30000 
    });

    // Wait for page to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Handle Google Meet
    if (meetingLink.includes("meet.google.com")) {
      console.log("📹 Detected Google Meet");
      
      // Turn off mic & camera
      try {
        await page.keyboard.down("Control");
        await page.keyboard.press("KeyD"); // mic off
        await page.keyboard.press("KeyE"); // camera off
        await page.keyboard.up("Control");
        console.log("🔇 Mic and camera turned off");
      } catch (err) {
        console.warn("⚠️ Could not toggle mic/camera:", err.message);
      }

      // Wait a bit more for page to fully load
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Try multiple selectors for join button
      const joinSelectors = [
        'button[jsname="Qx7uuf"]', // Ask to join
        'button[jsname="CQylAd"]', // Join now
        'button:has-text("Ask to join")',
        'button:has-text("Join now")',
        'button[aria-label*="join" i]',
        'button[aria-label*="Join" i]'
      ];

      let joinButton = null;
      for (const selector of joinSelectors) {
        try {
          joinButton = await page.$(selector);
          if (joinButton) {
            console.log(`✅ Found join button with selector: ${selector}`);
            break;
          }
        } catch (err) {
          continue;
        }
      }

      if (joinButton) {
        await joinButton.click();
        console.log("✅ Clicked join button");
        await new Promise(resolve => setTimeout(resolve, 3000));
      } else {
        console.warn("⚠️ Join button not found, may already be in meeting");
      }
    }
    // Handle Zoom
    else if (meetingLink.includes("zoom.us")) {
      console.log("📹 Detected Zoom meeting");
      // Wait for Zoom page to load
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      // Try to find and click launch button
      try {
        const launchBtn = await page.$('a:has-text("Launch Meeting")');
        if (launchBtn) {
          await launchBtn.click();
          console.log("✅ Clicked Zoom launch button");
        }
      } catch (err) {
        console.warn("⚠️ Could not find Zoom launch button");
      }
    }

    console.log("🤖 Bot joined meeting successfully");
    return { browser, page };

  } catch (error) {
    console.error("❌ joinMeeting failed:", error);
    // Clean up browser if it was created
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("Error closing browser:", closeErr);
      }
    }
    throw new Error(`Failed to join meeting: ${error.message}`);
  }
}
