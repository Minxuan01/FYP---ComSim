const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Store uploaded files in /uploads
const upload = multer({ dest: "uploads/" });

// POST route to receive audio file
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    const audioPath = path.resolve(req.file.path);
    const outputPath = path.resolve("outputs", `${path.parse(req.file.filename).name}_result.json`);

    // Make sure the outputs folder exists
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Processing:", audioPath);

    // Pass both arguments: input and output
    const matlabProcess = spawn("./processAudio", [audioPath, outputPath]);

    matlabProcess.stderr.on("data", (data) => {
      console.error("MATLAB error:", data.toString());
    });

    matlabProcess.on("close", async (code) => {
      console.log(`MATLAB exited with code ${code}`);

      if (!fs.existsSync(outputPath)) {
        console.error("Output JSON file not found at:", outputPath);
        return res.status(500).json({ success: false, error: "MATLAB did not produce output" });
      }
      
      try {
        // Read the JSON file created by MATLAB
        const jsonData = fs.readFileSync(outputPath, "utf8");
        const result = JSON.parse(jsonData);

        res.json({ success: true, message: "Audio processed successfully", data: result });
      } catch (err) {
        console.error("Failed to read MATLAB output:", err);
        res.status(500).json({ success: false, error: "Failed to read MATLAB output" });
      }

      // Cleanup
      fs.unlink(audioPath, () => {});
      fs.unlink(outputPath, () => {});
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: "Failed to process audio" });
  }
});


app.listen(5000, () => console.log("Server running on http://localhost:5000"));
