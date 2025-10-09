// shows frequency spectrum of audio data (magnitude vs frequency)

import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title } from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title);

export default function SpectrumChart({ freq, spectrum }) {
  const data = {
    labels: freq.slice(0, 500), // show only first 500 points for clarity
    datasets: [
      {
        label: "Magnitude Spectrum",
        data: spectrum.slice(0, 500),
        borderColor: "rgba(234, 88, 12, 0.8)",
        borderWidth: 1,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: { title: { display: true, text: "Spectrum (Frequency vs Magnitude)" } },
    scales: {
      x: { title: { display: true, text: "Frequency (Hz)" } },
      y: { title: { display: true, text: "Magnitude" } },
    },
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow">
      <Line data={data} options={options} />
    </div>
  );
}
