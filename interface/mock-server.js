const path = require("path");
const express = require("express");
const multer = require("multer");
const fs = require("fs");

const DATA_DIR = path.join(__dirname, "../data/mock-server");
fs.mkdirSync(DATA_DIR, { recursive: true });

const upload = multer({ dest: DATA_DIR });

const app = express();

app.post("/api/upload", upload.single("audio"), function (req, res) {
  console.log("/upload api called");

  if (!req.file) {
    return res.status(400).send("No files were uploaded.");
  }

  let { filename: fileName, path: filePath } = req.file;
  const extname = path.extname(filePath);
  if (extname === "") {
    const newPath = filePath + ".mp3";
    fs.renameSync(filePath, newPath);
    filePath = newPath;
  }

  console.log(req.file);
  console.log(`File uplaoded: ${filePath}`);

  return res.json({ success: true, message: `File uploaded: ${fileName}` });
});

app.listen(3030, () => console.log("Mock server listening on port 3030"));
