import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale } from 'chart.js';
import { complex, add, multiply, divide, pow, abs, arg } from 'mathjs';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale);

export default function FilterAnalysis({ filterParams, sampleRate = 44100 }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [showPoleZero, setShowPoleZero] = useState(true);
  const [showImpulseResponse, setShowImpulseResponse] = useState(true);
  const [showGroupDelay, setShowGroupDelay] = useState(true);
  const [showStepResponse, setShowStepResponse] = useState(true);

  // Get filter analysis data from MATLAB backend
  const calculateAnalysis = () => {
    if (!filterParams || !filterParams.coefficients) return null;

    // The MATLAB backend should provide all analysis data
    const coefficients = filterParams.coefficients;
    
    return {
      coefficients: coefficients,
      frequencyResponse: coefficients.frequencyResponse,
      impulseResponse: coefficients.impulseResponse,
      stepResponse: coefficients.stepResponse,
      groupDelay: coefficients.groupDelay,
      poles: coefficients.poles,
      zeros: coefficients.zeros
    };
  };

  // Update analysis data when filter parameters change
  useEffect(() => {
    const analysis = calculateAnalysis();
    setAnalysisData(analysis);
  }, [filterParams]);

  // All analysis functions are now handled by MATLAB backend
  // The following functions are kept for reference but not used:
  const butterworthAnalysis = (cutoff, order, type) => {
    const poles = [];
    const zeros = [];
    
    // Calculate poles
    for (let k = 0; k < order; k++) {
      const angle = Math.PI * (2 * k + 1) / (2 * order);
      const real = -Math.sin(angle);
      const imag = Math.cos(angle);
      poles.push({ real, imag });
    }

    // Calculate zeros based on filter type
    if (type === 'highpass') {
      // High-pass has zeros at z = 1
      for (let i = 0; i < order; i++) {
        zeros.push({ real: 1, imag: 0 });
      }
    } else if (type === 'bandpass') {
      // Band-pass has zeros at z = 1 and z = -1
      for (let i = 0; i < order; i++) {
        zeros.push({ real: 1, imag: 0 });
        zeros.push({ real: -1, imag: 0 });
      }
    } else if (type === 'bandstop') {
      // Band-stop has zeros on unit circle
      for (let i = 0; i < order; i++) {
        const angle = Math.PI * (2 * i + 1) / (2 * order);
        zeros.push({ real: Math.cos(angle), imag: Math.sin(angle) });
      }
    }

    // Convert to transfer function coefficients
    const b = [1];
    const a = [1];
    
    // Add zeros
    for (const zero of zeros) {
      if (Math.abs(zero.imag) < 1e-10) {
        b.push(-zero.real);
      } else {
        b.push(-2 * zero.real, zero.real * zero.real + zero.imag * zero.imag);
      }
    }
    
    // Add poles
    for (const pole of poles) {
      if (Math.abs(pole.imag) < 1e-10) {
        a.push(-pole.real);
      } else {
        a.push(-2 * pole.real, pole.real * pole.real + pole.imag * pole.imag);
      }
    }

    return [b, a, poles, zeros];
  };

  // Calculate frequency response
  const calculateFrequencyResponse = (b, a, sampleRate) => {
    const frequencies = [];
    const magnitudes = [];
    const phases = [];

    for (let f = 1; f <= sampleRate / 2; f += sampleRate / 2000) {
      const omega = 2 * Math.PI * f / sampleRate;
      const z = complex(Math.cos(omega), Math.sin(omega));
      
      let numerator = complex(0, 0);
      let denominator = complex(0, 0);

      // Calculate H(z) = B(z)/A(z)
      for (let i = 0; i < b.length; i++) {
        numerator = add(numerator, multiply(b[i], pow(z, -i)));
      }
      for (let i = 0; i < a.length; i++) {
        denominator = add(denominator, multiply(a[i], pow(z, -i)));
      }

      const H = divide(numerator, denominator);
      const magnitude = 20 * Math.log10(abs(H));
      const phase = arg(H) * 180 / Math.PI;

      frequencies.push(f);
      magnitudes.push(magnitude);
      phases.push(phase);
    }

    return { frequencies, magnitudes, phases };
  };

  // Calculate impulse response
  const calculateImpulseResponse = (b, a, length) => {
    const impulse = new Array(length).fill(0);
    impulse[0] = 1; // Unit impulse
    
    const response = new Array(length).fill(0);
    
    for (let n = 0; n < length; n++) {
      let output = 0;
      
      // Feedforward terms
      for (let i = 0; i < b.length && n - i >= 0; i++) {
        output += b[i] * impulse[n - i];
      }
      
      // Feedback terms
      for (let i = 1; i < a.length && n - i >= 0; i++) {
        output -= a[i] * response[n - i];
      }
      
      response[n] = output;
    }
    
    return response;
  };

  // Calculate step response
  const calculateStepResponse = (b, a, length) => {
    const step = new Array(length).fill(1);
    const response = new Array(length).fill(0);
    
    for (let n = 0; n < length; n++) {
      let output = 0;
      
      // Feedforward terms
      for (let i = 0; i < b.length && n - i >= 0; i++) {
        output += b[i] * step[n - i];
      }
      
      // Feedback terms
      for (let i = 1; i < a.length && n - i >= 0; i++) {
        output -= a[i] * response[n - i];
      }
      
      response[n] = output;
    }
    
    return response;
  };

  // Calculate group delay
  const calculateGroupDelay = (frequencies, phases) => {
    const groupDelay = [];
    
    for (let i = 1; i < phases.length - 1; i++) {
      const phaseDiff = phases[i + 1] - phases[i - 1];
      const freqDiff = frequencies[i + 1] - frequencies[i - 1];
      const delay = -phaseDiff / (freqDiff * 2 * Math.PI);
      groupDelay.push(delay);
    }
    
    return {
      frequencies: frequencies.slice(1, -1),
      delays: groupDelay
    };
  };

  // Update analysis when filter parameters change
  useEffect(() => {
    const analysis = calculateAnalysis();
    setAnalysisData(analysis);
  }, [filterParams, sampleRate]);

  // Pole-zero plot data
  const poleZeroData = analysisData ? {
    datasets: [
      {
        label: 'Poles',
        data: analysisData.poles.map(p => ({ x: p.real, y: p.imag })),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
        pointStyle: 'circle'
      },
      {
        label: 'Zeros',
        data: analysisData.zeros.map(z => ({ x: z.real, y: z.imag })),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        pointRadius: 6,
        pointHoverRadius: 8,
        showLine: false,
        pointStyle: 'rect'
      }
    ]
  } : null;

  const poleZeroOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Pole-Zero Plot'
      },
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Real Part'
        },
        min: -2,
        max: 2
      },
      y: {
        type: 'linear',
        title: {
          display: true,
          text: 'Imaginary Part'
        },
        min: -2,
        max: 2
      }
    }
  };

  // Frequency response data
  const frequencyResponseData = analysisData ? {
    labels: analysisData.frequencyResponse.frequencies.slice(0, 1000),
    datasets: [
      {
        label: 'Magnitude (dB)',
        data: analysisData.frequencyResponse.magnitudes.slice(0, 1000),
        borderColor: 'rgba(59, 130, 246, 0.8)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y'
      },
      {
        label: 'Phase (degrees)',
        data: analysisData.frequencyResponse.phases.slice(0, 1000),
        borderColor: 'rgba(239, 68, 68, 0.8)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        yAxisID: 'y1'
      }
    ]
  } : null;

  const frequencyResponseOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Frequency Response'
      }
    },
    scales: {
      x: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Frequency (Hz)'
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Magnitude (dB)'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        title: {
          display: true,
          text: 'Phase (degrees)'
        },
        grid: {
          drawOnChartArea: false
        }
      }
    }
  };

  // Impulse response data
  const impulseResponseData = analysisData ? {
    labels: Array.from({ length: analysisData.impulseResponse.length }, (_, i) => i),
    datasets: [
      {
        label: 'Impulse Response',
        data: analysisData.impulseResponse,
        borderColor: 'rgba(34, 197, 94, 0.8)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        pointRadius: 0
      }
    ]
  } : null;

  const impulseResponseOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Impulse Response'
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
  };

  // Step response data
  const stepResponseData = analysisData ? {
    labels: Array.from({ length: analysisData.stepResponse.length }, (_, i) => i),
    datasets: [
      {
        label: 'Step Response',
        data: analysisData.stepResponse,
        borderColor: 'rgba(168, 85, 247, 0.8)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderWidth: 2,
        pointRadius: 0
      }
    ]
  } : null;

  const stepResponseOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Step Response'
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
  };

  // Group delay data
  const groupDelayData = analysisData ? {
    labels: analysisData.groupDelay.frequencies.slice(0, 1000),
    datasets: [
      {
        label: 'Group Delay',
        data: analysisData.groupDelay.delays.slice(0, 1000),
        borderColor: 'rgba(245, 158, 11, 0.8)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        pointRadius: 0
      }
    ]
  } : null;

  const groupDelayOptions = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: 'Group Delay'
      }
    },
    scales: {
      x: {
        type: 'logarithmic',
        title: {
          display: true,
          text: 'Frequency (Hz)'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Group Delay (samples)'
        }
      }
    }
  };

  if (!analysisData) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Filter Analysis</h2>
        <p className="text-gray-600">No filter parameters provided for analysis.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Filter Analysis</h2>
        
        {/* Analysis Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showPoleZero}
              onChange={(e) => setShowPoleZero(e.target.checked)}
              className="mr-2"
            />
            Pole-Zero Plot
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showImpulseResponse}
              onChange={(e) => setShowImpulseResponse(e.target.checked)}
              className="mr-2"
            />
            Impulse Response
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showStepResponse}
              onChange={(e) => setShowStepResponse(e.target.checked)}
              className="mr-2"
            />
            Step Response
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showGroupDelay}
              onChange={(e) => setShowGroupDelay(e.target.checked)}
              className="mr-2"
            />
            Group Delay
          </label>
        </div>

        {/* Pole-Zero Plot */}
        {showPoleZero && poleZeroData && (
          <div className="mb-6">
            <div className="h-auto">
              <Line data={poleZeroData} options={poleZeroOptions} />
            </div>
          </div>
        )}

        {/* Frequency Response */}
        {frequencyResponseData && (
          <div className="mb-6">
            <div className="h-auto">
              <Line data={frequencyResponseData} options={frequencyResponseOptions} />
            </div>
          </div>
        )}

        {/* Impulse Response */}
        {showImpulseResponse && impulseResponseData && (
          <div className="mb-6">
            <div className="h-auto">
              <Line data={impulseResponseData} options={impulseResponseOptions} />
            </div>
          </div>
        )}

        {/* Step Response */}
        {showStepResponse && stepResponseData && (
          <div className="mb-6">
            <div className="h-auto">
              <Line data={stepResponseData} options={stepResponseOptions} />
            </div>
          </div>
        )}

        {/* Group Delay */}
        {showGroupDelay && groupDelayData && (
          <div className="mb-6">
            <div className="h-auto">
              <Line data={groupDelayData} options={groupDelayOptions} />
            </div>
          </div>
        )}

        {/* Filter Coefficients */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Filter Coefficients</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Numerator (b):</h4>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                [{analysisData.coefficients.b.map(c => c.toFixed(6)).join(', ')}]
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Denominator (a):</h4>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                [{analysisData.coefficients.a.map(c => c.toFixed(6)).join(', ')}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
