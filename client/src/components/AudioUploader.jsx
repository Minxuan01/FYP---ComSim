// handles audio file upload and server response

import { useState } from "react";
import WaveformChart from "./WaveformChart";
import SpectrumChart from "./SpectrumChart";

export default function AudioUploader({ onAudioProcessed }) {
  const [file, setFile] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setData(null);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select an audio file (<60s).");

    setLoading(true);
    const formData = new FormData();
    formData.append("audio", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      setData(json.data);
      if (onAudioProcessed) {
        onAudioProcessed(json.data);
      }
    } catch (err) {
      alert("Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 mt-8">
      <div className="p-6 border rounded-xl shadow-md w-full max-w-md bg-white">
        <h2 className="text-2xl font-bold mb-4 text-center">Audio Processor</h2>
        <label htmlFor="file-input" className="block mb-2">Choose an audio file, 10-50 MB</label>
        <input
          type="file"
          accept="audio/*"
          onChange={handleFileChange}
          className="block w-full border p-2 rounded mb-3"
          id="file-input"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Upload & Process"}
        </button>
      </div>

      {data && (
        <div className="w-full max-w-3xl space-y-8 mt-6">
          <WaveformChart waveform={data.waveform} fs={data.fs} step={data.step} />
          <SpectrumChart freq={data.freq} spectrum={data.spectrum} />
        </div>
      )}
    </div>
  );
}
