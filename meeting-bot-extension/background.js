let recorder;
let chunks = [];

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "START_RECORDING") {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: false
    });

    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });

      const formData = new FormData();
      formData.append("file", blob);

      await fetch("http://localhost:5000/api/upload/audio", {
        method: "POST",
        body: formData
      });
    };

    recorder.start();
  }

  if (msg.type === "STOP_RECORDING") {
    recorder.stop();
  }
});
