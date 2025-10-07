import React, { useState } from "react";
import "./App.css";

export default function AudioUploader() {
  const [audioFile, setAudioFile] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("audio/")) {
      setAudioFile(file);
      setAudioURL(URL.createObjectURL(file));
      setResult(null);
    } else {
      alert("Please upload a valid audio file (e.g., .wav, .mp3)");
    }
  };

  const handleUpload = async () => {
    if (!audioFile) return alert("No file selected!");

    const formData = new FormData();
    formData.append("audio", audioFile);

    setUploading(true);
    setResult(null);

    try {
      const res = await fetch("http://localhost:5000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setResult({ success: false, error: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="audio-container">
      <h2 className="title"> Audio File Upload</h2>

      <label className="upload-btn">
        Choose Audio File
        <input
          type="file"
          accept="audio/*"
          className="hidden-input"
          onChange={handleFileChange}
        />
      </label>

      {audioFile && (
        <div className="audio-preview">
          <p className="file-name">{audioFile.name}</p>
          <audio controls src={audioURL} className="audio-player"></audio>

          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`process-btn ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {uploading ? "Processing..." : "Upload & Process"}
          </button>

          {result && (
            <div className="result-box">
              {result.success ? (
                <p className="text-green-600"> {result.message || "Processed successfully!"}</p>
              ) : (
                <p className="text-red-600"> {result.error}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}