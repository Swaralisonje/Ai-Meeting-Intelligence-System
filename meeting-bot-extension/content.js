let mediaRecorder;
let audioChunks = [];

function startRecording() {
  navigator.mediaDevices.getDisplayMedia({ audio: true, video: true })
    .then(stream => {
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = e => {
        audioChunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });

        window.dispatchEvent(
          new CustomEvent("meeting-ended", {
            detail: { audio: audioBlob }
          })
        );
      };

      mediaRecorder.start();
    });
}

window.addEventListener("message", (event) => {
  if (event.data.type === "START_RECORDING") {
    startRecording();
  }
});
