const path = require("path");
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const range = require("lodash/range");

const DATA_DIR = path.join(__dirname, "../data/mock-server");
fs.mkdirSync(DATA_DIR, { recursive: true });

const upload = multer({ dest: DATA_DIR });

const app = express();

app.post("/mock-api/auth", upload.single("file"), function (req, res) {
  console.log("/upload api called");

  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  let { filename: fileName, path: filePath } = req.file;
  const extname = path.extname(filePath);
  if (extname === "") {
    const newPath = filePath + ".wav";
    fs.renameSync(filePath, newPath);
    filePath = newPath;
  }

  console.log(req.file);
  console.log(`File uplaoded: ${filePath}`);

  const match = req.file.size % 2 === 1;
  const pubInputs = range(match ? 5 : 6).map(() => Math.floor(Math.random() * 100));

  return res.json({
    match,
    pubInputs,
    proof: "0x",
  });
});

app.post(
  "/mock-api/match",
  upload.fields([
    { name: "userAudio", maxCount: 1 },
    { name: "hackerAudio", maxCount: 1 },
  ]),
  function (req, res) {
    console.log("/match api called");

    console.log("req.file", req.file);
    console.log("req.files", req.files);

    if (!req.files) {
      return res.status(400).send("No files were uploaded.");
    }

    const userAudio = req.files.userAudio[0];
    const hackerAudio = req.files.hackerAudio[0];

    if (!userAudio || !hackerAudio) {
      return res.status(400).send("One of files is missing.");
    }

    const userAudioPath = userAudio.path + ".wav";
    const hackerAudioPath = hackerAudio.path + ".wav";

    fs.renameSync(userAudio.path, userAudioPath);
    fs.renameSync(hackerAudio.path, hackerAudioPath);

    console.log("user audio uploaded: %s", userAudioPath);
    console.log("hacker audio uploaded: %s", hackerAudioPath);

    return res.json({
      success: true,
      message: `File uploaded: userAudio.size: ${userAudio.size} and hackerAudio: ${hackerAudio.size}`,
      match: userAudio.size > hackerAudio.size,
    });
  }
);

app.listen(3030, () => console.log("Mock server listening on port 3030"));
