import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale } from 'chart.js';
import { complex, add, multiply, divide, pow, abs, arg } from 'mathjs';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale);

export default function FilterDesigner({ audioData, onFilterApplied }) {
  const [filterType, setFilterType] = useState('lowpass');
  const [filterDesign, setFilterDesign] = useState('butterworth');
  const [cutoffFreq, setCutoffFreq] = useState(1000);
  const [highCutoffFreq, setHighCutoffFreq] = useState(3000);
  const [filterOrder, setFilterOrder] = useState(4);
  const [ripple, setRipple] = useState(0.5);
  const [stopbandAttenuation, setStopbandAttenuation] = useState(40);
  const [sampleRate, setSampleRate] = useState(44100);
  const [filterResponse, setFilterResponse] = useState(null);
  const [filteredAudio, setFilteredAudio] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const filterNodeRef = useRef(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (typeof window !== 'undefined' && window.AudioContext) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
  }, []);

  // Calculate filter coefficients using MATLAB backend
  const calculateFilterCoefficients = async () => {
    try {
      const response = await fetch('/api/design-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filterType,
          filterDesign,
          cutoffFreq,
          highCutoffFreq,
          filterOrder,
          ripple,
          stopbandAttenuation,
          sampleRate
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error designing filter:', error);
      alert('Failed to design filter: ' + error.message);
      return null;
    }
  };

  // Butterworth filter design functions
  const butterworthLowpass = (cutoff, order) => {
    const omega = Math.tan(Math.PI * cutoff / 2);
    const poles = [];
    
    for (let k = 0; k < order; k++) {
      const angle = Math.PI * (2 * k + 1) / (2 * order);
      const real = -omega * Math.sin(angle);
      const imag = omega * Math.cos(angle);
      poles.push({ real, imag });
    }

    // Convert poles to transfer function coefficients
    return polesToCoefficients(poles, order, 'lowpass');
  };

  const butterworthHighpass = (cutoff, order) => {
    const omega = Math.tan(Math.PI * cutoff / 2);
    const poles = [];
    
    for (let k = 0; k < order; k++) {
      const angle = Math.PI * (2 * k + 1) / (2 * order);
      const real = -omega * Math.sin(angle);
      const imag = omega * Math.cos(angle);
      poles.push({ real, imag });
    }

    return polesToCoefficients(poles, order, 'highpass');
  };

  const butterworthBandpass = (lowCutoff, highCutoff, order) => {
    // Simplified bandpass implementation
    const [b1, a1] = butterworthLowpass(highCutoff, order);
    const [b2, a2] = butterworthHighpass(lowCutoff, order);
    return convolveFilters(b1, a1, b2, a2);
  };

  const butterworthBandstop = (lowCutoff, highCutoff, order) => {
    // Simplified bandstop implementation
    const [b1, a1] = butterworthHighpass(highCutoff, order);
    const [b2, a2] = butterworthLowpass(lowCutoff, order);
    return convolveFilters(b1, a1, b2, a2);
  };

  // Chebyshev Type I filter design
  const chebyshev1Lowpass = (cutoff, order, ripple) => {
    const epsilon = Math.sqrt(Math.pow(10, ripple / 10) - 1);
    const poles = [];
    
    for (let k = 0; k < order; k++) {
      const angle = Math.PI * (2 * k + 1) / (2 * order);
      const real = -Math.sinh((1 / order) * Math.asinh(1 / epsilon)) * Math.sin(angle);
      const imag = Math.cosh((1 / order) * Math.asinh(1 / epsilon)) * Math.cos(angle);
      poles.push({ real, imag });
    }

    return polesToCoefficients(poles, order, 'lowpass');
  };

  const chebyshev1Highpass = (cutoff, order, ripple) => {
    const epsilon = Math.sqrt(Math.pow(10, ripple / 10) - 1);
    const poles = [];
    
    for (let k = 0; k < order; k++) {
      const angle = Math.PI * (2 * k + 1) / (2 * order);
      const real = -Math.sinh((1 / order) * Math.asinh(1 / epsilon)) * Math.sin(angle);
      const imag = Math.cosh((1 / order) * Math.asinh(1 / epsilon)) * Math.cos(angle);
      poles.push({ real, imag });
    }

    return polesToCoefficients(poles, order, 'highpass');
  };

  // Elliptic filter design (simplified)
  const ellipticLowpass = (cutoff, order, passbandRipple, stopbandAttenuation) => {
    // Simplified elliptic filter - using Chebyshev as approximation
    return chebyshev1Lowpass(cutoff, order, passbandRipple);
  };

  // Helper functions
  const polesToCoefficients = (poles, order, type) => {
    // Simplified conversion from poles to transfer function coefficients
    const b = [1];
    const a = [1];
    
    for (let i = 0; i < poles.length; i++) {
      const pole = poles[i];
      if (Math.abs(pole.imag) < 1e-10) {
        // Real pole
        a.push(-pole.real);
      } else {
        // Complex pole pair
        const realPart = -2 * pole.real;
        const imagPart = pole.real * pole.real + pole.imag * pole.imag;
        a.push(realPart, imagPart);
      }
    }

    // Normalize coefficients
    const gain = a.reduce((sum, coeff) => sum + Math.abs(coeff), 0);
    a.forEach((coeff, i) => a[i] = coeff / gain);
    b.forEach((coeff, i) => b[i] = coeff / gain);

    return [b, a];
  };

  const convolveFilters = (b1, a1, b2, a2) => {
    // Convolve two filters
    const b = simpleConvolve(b1, b2);
    const a = simpleConvolve(a1, a2);
    return [b, a];
  };

  const simpleConvolve = (a, b) => {
    const result = new Array(a.length + b.length - 1).fill(0);
    for (let i = 0; i < a.length; i++) {
      for (let j = 0; j < b.length; j++) {
        result[i + j] += a[i] * b[j];
      }
    }
    return result;
  };

  // Calculate frequency response using MATLAB backend
  const calculateFrequencyResponse = async () => {
    try {
      const filterCoefficients = await calculateFilterCoefficients();
      if (!filterCoefficients) return null;
      
      // The frequency response is already included in the filter design result
      return filterCoefficients.frequencyResponse || null;
    } catch (error) {
      console.error('Error calculating frequency response:', error);
      return null;
    }
  };

  // Apply filter to audio data using MATLAB backend
  const applyFilterToAudio = async (audioData, filterCoefficients) => {
    try {
      // Prepare signal data
      let signalData;
      if (audioData.waveform) {
        signalData = audioData.waveform;
      } else if (audioData.signal) {
        signalData = audioData.signal;
      } else if (Array.isArray(audioData)) {
        signalData = audioData;
      } else {
        throw new Error('Invalid audio data format');
      }

      const response = await fetch('/api/apply-filter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signal: signalData,
          filterCoefficients: filterCoefficients,
          sampleRate: audioData.sampleRate || 44100
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result.data.filteredSignal;
    } catch (error) {
      console.error('Error applying filter:', error);
      alert('Failed to apply filter: ' + error.message);
      return null;
    }
  };

  // Update frequency response when parameters change
  useEffect(() => {
    const loadFrequencyResponse = async () => {
      const response = await calculateFrequencyResponse();
      setFilterResponse(response);
    };
    loadFrequencyResponse();
  }, [filterType, filterDesign, cutoffFreq, highCutoffFreq, filterOrder, ripple, stopbandAttenuation, sampleRate]);

  // Handle filter application
  const handleApplyFilter = async () => {
    if (!audioData) return;
    
    setIsProcessing(true);
    
    try {
      const filterCoefficients = await calculateFilterCoefficients();
      if (!filterCoefficients) return;
      
      const filtered = await applyFilterToAudio(audioData, filterCoefficients);
      if (!filtered) return;
      
      // Create filtered result based on input data structure
      let filteredResult;
      if (audioData.waveform) {
        // Audio data from file upload
        filteredResult = {
          ...audioData,
          waveform: filtered,
          filtered: true
        };
      } else if (audioData.signal) {
        // Generated signal data
        filteredResult = {
          ...audioData,
          signal: filtered,
          filtered: true
        };
      } else {
        // Fallback
        filteredResult = {
          ...audioData,
          waveform: filtered,
          filtered: true
        };
      }
      
      setFilteredAudio(filteredResult);
      
      if (onFilterApplied) {
        onFilterApplied({
          original: audioData,
          filtered: filteredResult,
          filterParams: { 
            filterType, 
            filterDesign, 
            cutoffFreq, 
            highCutoffFreq, 
            filterOrder, 
            ripple, 
            stopbandAttenuation,
            coefficients: filterCoefficients
          }
        });
      }
    } catch (error) {
      console.error('Error applying filter:', error);
      alert('Error applying filter. Please check your parameters.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Frequency response chart data
  const frequencyResponseData = filterResponse ? {
    labels: filterResponse.frequencies.slice(0, 1000), // Limit for performance
    datasets: [
      {
        label: 'Magnitude Response (dB)',
        data: filterResponse.magnitudes.slice(0, 1000),
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y',
      },
      {
        label: 'Phase Response (degrees)',
        data: filterResponse.phases.slice(0, 1000),
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y1',
      }
    ]
  } : null;

  const frequencyResponseOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: 'Filter Frequency Response'
      },
      legend: {
        display: true,
        position: 'top',
      }
    },
    scales: {
      x: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Frequency (Hz)'
        },
        min: 1,
        max: sampleRate / 2
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Magnitude (dB)'
        },
        min: -80,
        max: 10
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Phase (degrees)'
        },
        min: -180,
        max: 180,
        grid: {
          drawOnChartArea: false,
        },
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Filter Design</h2>
        
        {/* Filter Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="lowpass">Low Pass</option>
              <option value="highpass">High Pass</option>
              <option value="bandpass">Band Pass</option>
              <option value="bandstop">Band Stop</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Design
            </label>
            <select
              value={filterDesign}
              onChange={(e) => setFilterDesign(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="butterworth">Butterworth</option>
              <option value="chebyshev1">Chebyshev Type I</option>
              <option value="elliptic">Elliptic</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Order: {filterOrder}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={filterOrder}
              onChange={(e) => setFilterOrder(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cutoff Frequency: {cutoffFreq} Hz
            </label>
            <input
              type="range"
              min="10"
              max={sampleRate / 2}
              step="10"
              value={cutoffFreq}
              onChange={(e) => setCutoffFreq(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {(filterType === 'bandpass' || filterType === 'bandstop') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                High Cutoff: {highCutoffFreq} Hz
              </label>
              <input
                type="range"
                min={cutoffFreq + 100}
                max={sampleRate / 2}
                step="10"
                value={highCutoffFreq}
                onChange={(e) => setHighCutoffFreq(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {(filterDesign === 'chebyshev1' || filterDesign === 'elliptic') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Passband Ripple: {ripple} dB
              </label>
              <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={ripple}
                onChange={(e) => setRipple(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          )}

          {filterDesign === 'elliptic' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stopband Attenuation: {stopbandAttenuation} dB
              </label>
              <input
                type="range"
                min="20"
                max="80"
                step="5"
                value={stopbandAttenuation}
                onChange={(e) => setStopbandAttenuation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          )}

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
        </div>

        {/* Apply Filter Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleApplyFilter}
            disabled={!audioData || isProcessing}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Apply Filter to Audio'}
          </button>
        </div>
      </div>

      {/* Frequency Response Chart */}
      {frequencyResponseData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Frequency Response</h3>
          <div className="h-96">
            <Line data={frequencyResponseData} options={frequencyResponseOptions} />
          </div>
        </div>
      )}

      {/* Filtered Audio Display */}
      {filteredAudio && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Filtered Audio</h3>
          <div className="text-sm text-gray-600 mb-4">
            <p><strong>Filter Type:</strong> {filterType} {filterDesign}</p>
            <p><strong>Cutoff Frequency:</strong> {cutoffFreq} Hz</p>
            {filterType === 'bandpass' || filterType === 'bandstop' ? (
              <p><strong>High Cutoff:</strong> {highCutoffFreq} Hz</p>
            ) : null}
            <p><strong>Filter Order:</strong> {filterOrder}</p>
          </div>
          <div className="h-64">
            <Line
              data={{
                labels: Array.from({ 
                  length: filteredAudio.waveform ? filteredAudio.waveform.length : filteredAudio.signal.length 
                }, (_, i) => i),
                datasets: [
                  {
                    label: 'Original',
                    data: audioData.waveform || audioData.signal,
                    borderColor: 'rgba(156, 163, 175, 0.8)',
                    backgroundColor: 'rgba(156, 163, 175, 0.1)',
                    borderWidth: 1,
                    pointRadius: 0,
                  },
                  {
                    label: 'Filtered',
                    data: filteredAudio.waveform || filteredAudio.signal,
                    borderColor: 'rgba(59, 130, 246, 0.8)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                  }
                ]
              }}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Original vs Filtered Audio'
                  }
                },
                scales: {
                  x: {
                    title: {
                      display: true,
                      text: 'Sample Number'
                    }
                  },
                  y: {
                    title: {
                      display: true,
                      text: 'Amplitude'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
