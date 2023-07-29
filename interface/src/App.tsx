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
