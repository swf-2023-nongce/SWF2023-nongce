import React from "react";
import { AudioRecorder } from "react-audio-voice-recorder";

import "./App.css";

/**
 * @dev This function converts a webm blob into mp3 blob with the help of ffmpeg.wasm
 */
async function convertWebmToMp3(webmBlob: Blob): Promise<Blob> {
  const FFmpeg = await import("@ffmpeg/ffmpeg");
  const ffmpeg = FFmpeg.createFFmpeg({
    log: false,
    corePath: "/ffmpeg-core.js", // corepath 없을 경우 cdn에서 가져옴
  });
  await ffmpeg.load();

  const inputName = "input.webm";
  const downloadFileExtension = "mp3";
  const outputName = `output.${downloadFileExtension}`;

  await ffmpeg.FS("writeFile", inputName, new Uint8Array(await webmBlob.arrayBuffer()));

  await ffmpeg.run("-i", inputName, outputName);

  const outputData = ffmpeg.FS("readFile", outputName);
  const outputBlob = new Blob([outputData.buffer], {
    type: `audio/${downloadFileExtension}`,
  });

  return outputBlob;
}

function App() {
  const addAudioElement = async (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = document.createElement("audio");
    audio.src = url;
    audio.controls = true;
    document.body.appendChild(audio);

    // upload audio file to server
    const timestamp = Math.floor(Date.now() / 1000);
    const fileName = `audio_${timestamp}.mp3`;
    const formData = new FormData();

    formData.append("audio", await convertWebmToMp3(blob), fileName);

    console.log("Uploading audio file: %s", fileName);

    await fetch(`/api/upload`, {
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
