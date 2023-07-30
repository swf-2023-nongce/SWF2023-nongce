import React from "react";
import { AudioRecorder } from "react-audio-voice-recorder";

import "./App.css";

function App() {
  const addAudioElement = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);

    // upload audio file to server
    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `audio_${timestamp}.mp3`;
    const formData = new FormData();

    formData.append("audio", blob, fileName);

    console.log("Uploading audio file: %s", fileName);

    fetch(`/api/upload`, {
      method: "POST",
      headers: {
        "Allow-Control-Allow-Origin": "*",
      },
      body: formData,
    })
      .then(async (res) => {
        console.log("File uploaded");

        console.log(await res.json());
      })
      .catch(async (err) => {
        console.log("Failed to upload file");
        console.error(await err.json());
      });
  };

  return (
    <div className="App">
      <div>
        <AudioRecorder
          onRecordingComplete={addAudioElement}
          audioTrackConstraints={{
            noiseSuppression: true,
            echoCancellation: true,
            // autoGainControl,
            // channelCount,
            // deviceId,
            // groupId,
            // sampleRate,
            // sampleSize,
          }}
          onNotAllowedOrFound={(err) => console.table(err)}
          downloadOnSavePress={true}
          downloadFileExtension="mp3"
          // mediaRecorderOptions={{
          //   audioBitsPerSecond: 128000,
          // }}
          // showVisualizer={true}
        />
        <br />
      </div>
    </div>
  );
}

export default App;
