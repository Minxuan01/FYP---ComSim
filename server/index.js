const express = require("express");
const multer = require("multer");
const cors = require("cors");
const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// Error handler for multer file size limits
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: "File too large. Maximum file size is 50MB."
      });
    }
  }
  next(error);
});

// Store uploaded files in /uploads with 50MB file size limit
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB in bytes
  }
});

// Helper function to run MATLAB executable
const runMatlabExecutable = (executableName, args, outputPath) => {
  return new Promise((resolve, reject) => {
    const executablePath = path.resolve("matlab-executables", executableName);
    const matlabProcess = spawn(executablePath, args);

    let stdoutData = '';
    let stderrData = '';

    matlabProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
      console.log("MATLAB output:", data.toString());
    });
    
    matlabProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error("MATLAB error:", data.toString());
    });

    matlabProcess.on("close", (code) => {
      console.log(`MATLAB ${executableName} exited with code ${code}`);

      if (code !== 0) {
        return reject(new Error(`MATLAB process failed with code ${code}.\nSTDOUT: ${stdoutData}\nSTDERR: ${stderrData}`));
      }

      if (!fs.existsSync(outputPath)) {
        return reject(new Error("MATLAB did not produce output file"));
      }

      try {
        const jsonData = fs.readFileSync(outputPath, "utf8");
        const result = JSON.parse(jsonData);
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to read MATLAB output: ${err.message}`));
      }
    });

    matlabProcess.on("error", (err) => {
      reject(new Error(`Failed to start MATLAB process: ${err.message}`));
    });
  });
};

// POST route to receive audio file
app.post("/api/upload", upload.single("audio"), async (req, res) => {
  try {
    // Check if file was uploaded successfully
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        error: "No audio file uploaded or file too large (max 50MB)" 
      });
    }

    const audioPath = path.resolve(req.file.path);
    const outputPath = path.resolve("outputs", `${path.parse(req.file.filename).name}_result.json`);

    // Make sure the outputs folder exists
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Processing audio:", audioPath);

    const result = await runMatlabExecutable("processAudio", [audioPath, outputPath], outputPath);

    // Cleanup
    fs.unlink(audioPath, () => {});
    fs.unlink(outputPath, () => {});

    res.json({ success: true, message: "Audio processed successfully", data: result });
  } catch (error) {
    console.error("Audio processing error:", error.message);
    res.status(500).json({ success: false, error: error.message });
    
    // Cleanup on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

// POST route for filter design
app.post("/api/design-filter", async (req, res) => {
  try {
    const { filterType, filterDesign, cutoffFreq, highCutoffFreq, filterOrder, ripple, stopbandAttenuation, sampleRate } = req.body;
    
    const outputPath = path.resolve("outputs", `filter_design_${Date.now()}.json`);
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Designing filter:", filterType, filterDesign);

    const result = await runMatlabExecutable("designFilter", [
      filterType, filterDesign, cutoffFreq.toString(), highCutoffFreq.toString(), 
      filterOrder.toString(), ripple.toString(), stopbandAttenuation.toString(), 
      sampleRate.toString(), outputPath
    ]);

    // Cleanup
    fs.unlink(outputPath, () => {});

    res.json({ success: true, message: "Filter designed successfully", data: result });
  } catch (error) {
    console.error("Filter design error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST route for applying filters
app.post("/api/apply-filter", upload.single("signal"), async (req, res) => {
  try {
    const { filterCoefficients } = req.body;
    const signalPath = req.file ? path.resolve(req.file.path) : null;
    const outputPath = path.resolve("outputs", `filtered_signal_${Date.now()}.json`);
    
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Applying filter to signal");

    // Save filter coefficients to temporary file if needed
    let coeffPath = null;
    if (typeof filterCoefficients === 'object') {
      coeffPath = path.resolve("outputs", `coeff_${Date.now()}.mat`);
      // For now, we'll pass coefficients as JSON
      fs.writeFileSync(coeffPath.replace('.mat', '.json'), JSON.stringify(filterCoefficients));
      coeffPath = coeffPath.replace('.mat', '.json');
    }

    const args = [signalPath || '', coeffPath || JSON.stringify(filterCoefficients), outputPath];
    const result = await runMatlabExecutable("applyFilter", args);

    // Cleanup
    if (req.file) fs.unlink(req.file.path, () => {});
    if (coeffPath) fs.unlink(coeffPath, () => {});
    fs.unlink(outputPath, () => {});

    res.json({ success: true, message: "Filter applied successfully", data: result });
  } catch (error) {
    console.error("Filter application error:", error.message);
    res.status(500).json({ success: false, error: error.message });
    
    // Cleanup on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

// POST route for signal generation
app.post("/api/generate-signal", async (req, res) => {
  try {
    const { signalType, parameters } = req.body;
    const outputPath = path.resolve("outputs", `generated_signal_${Date.now()}.json`);
    
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Generating signal:", signalType);

    // Save parameters to temporary file
    const paramsPath = path.resolve("outputs", `params_${Date.now()}.json`);
    console.log("Parameters JSON path:", paramsPath);
    fs.writeFileSync(paramsPath, JSON.stringify(parameters));

    const result = await runMatlabExecutable("generateSignal", [signalType, paramsPath, outputPath], outputPath);

    // Cleanup
    fs.unlink(paramsPath, () => {});
    fs.unlink(outputPath, () => {});

    res.json({ success: true, message: "Signal generated successfully", data: result });
  } catch (error) {
    console.error("Signal generation error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST route for modulation simulation
app.post("/api/modulation", upload.single("signal"), async (req, res) => {
  try {
    const { modulationType, carrierFreq, sampleRate, modulationParams } = req.body;
    const signalPath = req.file ? path.resolve(req.file.path) : null;
    const outputPath = path.resolve("outputs", `modulation_${Date.now()}.json`);
    
    fs.mkdirSync("outputs", { recursive: true });

    console.log("Running modulation simulation:", modulationType);

    // Save modulation parameters to temporary file
    const paramsPath = path.resolve("outputs", `mod_params_${Date.now()}.json`);
    fs.writeFileSync(paramsPath, JSON.stringify(modulationParams));

    const args = [modulationType, signalPath || JSON.stringify({}), carrierFreq.toString(), 
                 sampleRate.toString(), paramsPath, outputPath];
    const result = await runMatlabExecutable("modulationSimulation", args);

    // Cleanup
    if (req.file) fs.unlink(req.file.path, () => {});
    fs.unlink(paramsPath, () => {});
    fs.unlink(outputPath, () => {});

    res.json({ success: true, message: "Modulation simulation completed", data: result });
  } catch (error) {
    console.error("Modulation simulation error:", error.message);
    res.status(500).json({ success: false, error: error.message });
    
    // Cleanup on error
    if (req.file) {
      fs.unlink(req.file.path, () => {});
    }
  }
});

app.listen(5000, () => console.log("Server running on http://localhost:5000"));
