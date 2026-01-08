const { exec } = require("child_process");
const path = require("path");

const startBot = async (meetingLink) => {
  return new Promise((resolve, reject) => {
    const botPath = path.join(__dirname, "../../meeting-bot/index.js");
    const child = exec(`node ${botPath} "${meetingLink}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error}`);
        reject(error);
        return;
      }
      console.log(stdout);
      resolve(stdout);
    });

    child.on("error", (error) => {
      console.error(`Failed to start bot: ${error}`);
      reject(error);
    });
  });
};

module.exports = { startBot };
