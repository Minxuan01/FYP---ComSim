import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title } from 'chart.js';


ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title);

export default function SignalGenerator({ onSignalGenerated }) {
  const [signalType, setSignalType] = useState('sine');
  const [frequency, setFrequency] = useState(1000);
  const [amplitude, setAmplitude] = useState(1);
  const [duration, setDuration] = useState(1);
  const [sampleRate, setSampleRate] = useState(44100);
  const [phase, setPhase] = useState(0);
  const [modulationFreq, setModulationFreq] = useState(100);
  const [modulationIndex, setModulationIndex] = useState(1);
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [generatedSignal, setGeneratedSignal] = useState(null);

  // Generate signal based on current parameters
  const generateSignal = () => {
    const samples = Math.floor(duration * sampleRate);
    const time = Array.from({ length: samples }, (_, i) => i / sampleRate);
    let signal = new Array(samples).fill(0);

    switch (signalType) {
      case 'sine':
        signal = time.map(t => amplitude * Math.sin(2 * Math.PI * frequency * t + phase));
        break;
      
      case 'cosine':
        signal = time.map(t => amplitude * Math.cos(2 * Math.PI * frequency * t + phase));
        break;
      
      case 'square':
        signal = time.map(t => {
          const sine = Math.sin(2 * Math.PI * frequency * t + phase);
          return amplitude * (sine >= 0 ? 1 : -1);
        });
        break;
      
      case 'sawtooth':
        signal = time.map(t => {
          const normalized = ((frequency * t + phase / (2 * Math.PI)) % 1);
          return amplitude * (2 * normalized - 1);
        });
        break;
      
      case 'triangle':
        signal = time.map(t => {
          const normalized = ((frequency * t + phase / (2 * Math.PI)) % 1);
          return amplitude * (normalized < 0.5 ? 4 * normalized - 1 : 3 - 4 * normalized);
        });
        break;
      
      case 'chirp':
        signal = time.map(t => {
          const instantaneousFreq = frequency + (modulationFreq - frequency) * t / duration;
          return amplitude * Math.sin(2 * Math.PI * instantaneousFreq * t + phase);
        });
        break;
      
      case 'fm':
        signal = time.map(t => {
          const instantaneousFreq = frequency + modulationIndex * Math.sin(2 * Math.PI * modulationFreq * t);
          return amplitude * Math.sin(2 * Math.PI * instantaneousFreq * t + phase);
        });
        break;
      
      case 'am':
        signal = time.map(t => {
          const carrier = Math.sin(2 * Math.PI * frequency * t + phase);
          const modulator = 1 + modulationIndex * Math.sin(2 * Math.PI * modulationFreq * t);
          return amplitude * carrier * modulator;
        });
        break;
      
      case 'pulse':
        signal = time.map(t => {
          const period = 1 / frequency;
          const position = (t % period) / period;
          const dutyCycle = 0.5; // 50% duty cycle
          return position < dutyCycle ? amplitude : 0;
        });
        break;
      
      case 'multitone':
        const frequencies = [frequency, frequency * 2, frequency * 3, frequency * 5];
        signal = time.map(t => {
          let sum = 0;
          frequencies.forEach((f, i) => {
            sum += (amplitude / frequencies.length) * Math.sin(2 * Math.PI * f * t + phase);
          });
          return sum;
        });
        break;
      
      case 'noise':
        signal = time.map(() => amplitude * (2 * Math.random() - 1));
        break;
      
      case 'pink_noise':
        signal = generatePinkNoise(samples, amplitude);
        break;
      
      case 'white_noise':
        signal = time.map(() => amplitude * (2 * Math.random() - 1));
        break;
      
      default:
        signal = time.map(t => amplitude * Math.sin(2 * Math.PI * frequency * t + phase));
    }

    // Add noise if specified
    if (noiseLevel > 0) {
      signal = signal.map(sample => {
        const noise = noiseLevel * (2 * Math.random() - 1);
        return sample + noise;
      });
    }

    // Normalize signal
    const maxAmplitude = Math.max(...signal.map(Math.abs));
    if (maxAmplitude > 0) {
      signal = signal.map(s => s / maxAmplitude * amplitude);
    }

    return {
      signal,
      time,
      sampleRate,
      duration,
      parameters: {
        signalType,
        frequency,
        amplitude,
        duration,
        sampleRate,
        phase,
        modulationFreq,
        modulationIndex,
        noiseLevel
      }
    };
  };

  // Generate pink noise using Voss-McCartney algorithm
  const generatePinkNoise = (samples, amplitude) => {
    const pink = new Array(samples).fill(0);
    const white = new Array(16).fill(0);
    
    for (let i = 0; i < samples; i++) {
      const whiteIndex = i % 16;
      white[whiteIndex] = Math.random() * 2 - 1;
      
      let pinkValue = 0;
      for (let j = 0; j < 16; j++) {
        pinkValue += white[j];
      }
      
      pink[i] = (pinkValue / 16) * amplitude;
    }
    
    return pink;
  };

  // Generate signal when parameters change
  useEffect(() => {
    const signalData = generateSignal();
    setGeneratedSignal(signalData);
  }, [signalType, frequency, amplitude, duration, sampleRate, phase, modulationFreq, modulationIndex, noiseLevel]);

  // Handle signal generation
  const handleGenerateSignal = () => {
    const signalData = generateSignal();
    setGeneratedSignal(signalData);
    
    if (onSignalGenerated) {
      onSignalGenerated(signalData);
    }
  };

  // Chart data for signal visualization
  const chartData = generatedSignal ? {
    labels: generatedSignal.time.slice(0, Math.min(2000, generatedSignal.time.length)),
    datasets: [
      {
        label: 'Generated Signal',
        data: generatedSignal.signal.slice(0, Math.min(2000, generatedSignal.signal.length)),
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Generated Signal'
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (s)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Amplitude'
        },
        min: -1.2,
        max: 1.2
      }
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Signal Generator</h2>
        
        {/* Signal Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signal Type
            </label>
            <select
              value={signalType}
              onChange={(e) => setSignalType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="sine">Sine Wave</option>
              <option value="cosine">Cosine Wave</option>
              <option value="square">Square Wave</option>
              <option value="sawtooth">Sawtooth Wave</option>
              <option value="triangle">Triangle Wave</option>
              <option value="chirp">Linear Chirp</option>
              <option value="fm">Frequency Modulated</option>
              <option value="am">Amplitude Modulated</option>
              <option value="pulse">Pulse Train</option>
              <option value="multitone">Multi-tone</option>
              <option value="noise">White Noise</option>
              <option value="pink_noise">Pink Noise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency: {frequency} Hz
            </label>
            <input
              type="range"
              min="1"
              max="20000"
              step="1"
              value={frequency}
              onChange={(e) => setFrequency(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amplitude: {amplitude.toFixed(2)}
            </label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.01"
              value={amplitude}
              onChange={(e) => setAmplitude(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration: {duration} s
            </label>
            <input
              type="range"
              min="0.1"
              max="5"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sample Rate: {sampleRate} Hz
            </label>
            <select
              value={sampleRate}
              onChange={(e) => setSampleRate(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="8000">8 kHz</option>
              <option value="16000">16 kHz</option>
              <option value="22050">22.05 kHz</option>
              <option value="44100">44.1 kHz</option>
              <option value="48000">48 kHz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phase: {phase.toFixed(2)} rad
            </label>
            <input
              type="range"
              min="0"
              max={2 * Math.PI}
              step="0.1"
              value={phase}
              onChange={(e) => setPhase(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          {(signalType === 'fm' || signalType === 'am' || signalType === 'chirp') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modulation Frequency: {modulationFreq} Hz
                </label>
                <input
                  type="range"
                  min="1"
                  max="1000"
                  step="1"
                  value={modulationFreq}
                  onChange={(e) => setModulationFreq(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modulation Index: {modulationIndex.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={modulationIndex}
                  onChange={(e) => setModulationIndex(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Noise Level: {noiseLevel.toFixed(2)}
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={noiseLevel}
              onChange={(e) => setNoiseLevel(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Generate Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleGenerateSignal}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Generate Signal
          </button>
        </div>
      </div>

      {/* Signal Visualization */}
      {chartData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Signal Preview</h3>
          <div className="h-96">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
      )}

      {/* Signal Information */}
      {generatedSignal && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Signal Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="font-medium text-gray-600">Type:</p>
              <p className="text-gray-800 capitalize">{signalType.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Frequency:</p>
              <p className="text-gray-800">{frequency} Hz</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Amplitude:</p>
              <p className="text-gray-800">{amplitude.toFixed(2)}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Duration:</p>
              <p className="text-gray-800">{duration} s</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Sample Rate:</p>
              <p className="text-gray-800">{sampleRate} Hz</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Samples:</p>
              <p className="text-gray-800">{generatedSignal.signal.length}</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Phase:</p>
              <p className="text-gray-800">{phase.toFixed(2)} rad</p>
            </div>
            <div>
              <p className="font-medium text-gray-600">Noise Level:</p>
              <p className="text-gray-800">{noiseLevel.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
