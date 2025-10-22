import { useState } from "react";
import AudioUploader from "./components/AudioUploader";
import FilterDesigner from "./components/FilterDesigner";
import SignalGenerator from "./components/SignalGenerator";
import FilterAnalysis from "./components/FilterAnalysis";
import "./App.css";

export default function App() {
  const [currentView, setCurrentView] = useState("audio");
  const [audioData, setAudioData] = useState(null);
  const [filteredAudio, setFilteredAudio] = useState(null);
  const [filterParams, setFilterParams] = useState(null);
  const [generatedSignal, setGeneratedSignal] = useState(null);

  const handleAudioProcessed = (data) => {
    setAudioData(data);
    setFilteredAudio(null);
  };

  const handleFilterApplied = (filterData) => {
    setFilteredAudio(filterData.filtered);
    setFilterParams(filterData.filterParams);
  };

  const handleSignalGenerated = (signalData) => {
    setGeneratedSignal(signalData);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case "audio":
        return (
          <div className="w-full">
            <AudioUploader onAudioProcessed={handleAudioProcessed} />
            {audioData && (
              <div className="mt-8">
                <FilterDesigner 
                  audioData={audioData} 
                  onFilterApplied={handleFilterApplied}
                />
                {filterParams && (
                  <div className="mt-8">
                    <FilterAnalysis filterParams={filterParams} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case "signal":
        return (
          <div className="w-full">
            <SignalGenerator onSignalGenerated={handleSignalGenerated} />
            {generatedSignal && (
              <div className="mt-8">
                <FilterDesigner 
                  audioData={generatedSignal} 
                  onFilterApplied={handleFilterApplied}
                />
                {filterParams && (
                  <div className="mt-8">
                    <FilterAnalysis filterParams={filterParams} />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-800">
                Digital Communication Systems Simulator
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView("audio")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === "audio"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-blue-100"
                }`}
              >
                Audio Processor
              </button>
              <button
                onClick={() => setCurrentView("signal")}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${
                  currentView === "signal"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:text-gray-800 hover:bg-blue-100"
                }`}
              >
                Signal Generator
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentView()}
      </div>
    </div>
  );
}