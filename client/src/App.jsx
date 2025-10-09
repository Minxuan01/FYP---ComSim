import AudioUploader from "./components/AudioUploader";
import "./App.css";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center">
      <h1 className="text-3xl font-bold mt-10">MATLAB Audio Visualization</h1>
      <AudioUploader />
    </div>
  );
}