// visualizes audio waveform (amplitude vs time)

import React from "react";
import Plot from "react-plotly.js";

export default function WaveformChart({ waveform, fs, step }) {
  if (!waveform || waveform.length === 0) return null;

  // Compute accurate time axis (seconds)
  const time = waveform.map((_, i) => (i * step) / fs);

  return (
    <div className="p-4 bg-white rounded-2xl shadow">
      <h2 className="text-xl font-semibold mb-2 text-gray-700">
        Waveform (Time Domain)
      </h2>
      <Plot
        data={[
          {
            x: time,
            y: waveform,
            type: "scatter",
            mode: "lines",
            line: { width: 1 },
          },
        ]}
        layout={{
          margin: { t: 20, r: 10, l: 50, b: 40 },
          xaxis: { title: "Time (s)" },
          yaxis: { title: "Amplitude" },
          height: 300,
        }}
        config={{ responsive: true }}
      />
    </div>
  );
}
