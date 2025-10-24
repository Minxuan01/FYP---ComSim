import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Title, LogarithmicScale);

export default function FilterAnalysis({ filterParams, sampleRate = 44100 }) {
  const [analysisData, setAnalysisData] = useState(null);
  const [showPoleZero, setShowPoleZero] = useState(true);
  const [showImpulseResponse, setShowImpulseResponse] = useState(true);
  const [showGroupDelay, setShowGroupDelay] = useState(true);
  const [showStepResponse, setShowStepResponse] = useState(true);

  // Calculate filter analysis data using MATLAB backend
  const calculateAnalysis = async () => {
    if (!filterParams) return null;

    try {
      const { filterType, filterDesign, cutoffFreq, highCutoffFreq, filterOrder, ripple, stopbandAttenuation } = filterParams;
      
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
      console.error('Error calculating filter analysis:', error);
      return null;
    }
  };







  // Update analysis when filter parameters change
  useEffect(() => {
    const loadAnalysis = async () => {
      const analysis = await calculateAnalysis();
      setAnalysisData(analysis);
    };
    loadAnalysis();
  }, [filterParams, sampleRate]);

  // Pole-zero plot data
  const poleZeroData = analysisData && analysisData.poleZero ? {
    datasets: [
      {
        label: 'Poles',
        data: analysisData.poleZero.poles.map(p => ({ x: p.real, y: p.imag })),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        pointRadius: 8,
        pointHoverRadius: 10,
        showLine: false,
        pointStyle: 'circle'
      },
      {
        label: 'Zeros',
        data: analysisData.poleZero.zeros.map(z => ({ x: z.real, y: z.imag })),
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
  const impulseResponseData = analysisData && analysisData.timeResponse ? {
    labels: Array.from({ length: analysisData.timeResponse.impulse.length }, (_, i) => i),
    datasets: [
      {
        label: 'Impulse Response',
        data: analysisData.timeResponse.impulse,
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
  const stepResponseData = analysisData && analysisData.timeResponse ? {
    labels: Array.from({ length: analysisData.timeResponse.step.length }, (_, i) => i),
    datasets: [
      {
        label: 'Step Response',
        data: analysisData.timeResponse.step,
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
  const groupDelayData = analysisData && analysisData.timeResponse ? {
    labels: analysisData.timeResponse.groupDelayFreq.slice(0, 1000),
    datasets: [
      {
        label: 'Group Delay',
        data: analysisData.timeResponse.groupDelay.slice(0, 1000),
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
                [{analysisData.filterCoefficients.numerator.map(c => c.toFixed(6)).join(', ')}]
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Denominator (a):</h4>
              <div className="bg-gray-100 p-3 rounded font-mono text-sm">
                [{analysisData.filterCoefficients.denominator.map(c => c.toFixed(6)).join(', ')}]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
