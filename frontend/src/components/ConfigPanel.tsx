import { useState } from 'react'
import { SimulationConfig } from '../services/api'

interface ConfigPanelProps {
  onRunSimulation: (config: SimulationConfig) => void
  loading: boolean
}

const ConfigPanel = ({ onRunSimulation, loading }: ConfigPanelProps) => {
  const [numBits, setNumBits] = useState(10000)
  const [modulation, setModulation] = useState('QPSK')
  const [channelType, setChannelType] = useState('AWGN')
  const [channelCoding, setChannelCoding] = useState('none')
  const [sourceEncoding, setSourceEncoding] = useState('none')
  const [codeRate, setCodeRate] = useState(0.5)
  const [snrStart, setSnrStart] = useState(0)
  const [snrEnd, setSnrEnd] = useState(10)
  const [snrStep, setSnrStep] = useState(2)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Generate SNR array
    const snrArray: number[] = []
    for (let snr = snrStart; snr <= snrEnd; snr += snrStep) {
      snrArray.push(snr)
    }

    const config: SimulationConfig = {
      numBits,
      modulation,
      channelType,
      snr: snrArray,
      channelCoding,
      sourceEncoding,
      codeRate: channelCoding !== 'none' ? codeRate : undefined,
    }

    onRunSimulation(config)
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        Simulation Configuration
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Number of Bits */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Bits
          </label>
          <input
            type="number"
            value={numBits}
            onChange={(e) => setNumBits(Number(e.target.value))}
            min="100"
            max="1000000"
            step="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Modulation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Modulation Scheme
          </label>
          <select
            value={modulation}
            onChange={(e) => setModulation(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="BPSK">BPSK</option>
            <option value="QPSK">QPSK</option>
            <option value="8QAM">8-QAM</option>
            <option value="16QAM">16-QAM</option>
            <option value="64QAM">64-QAM</option>
          </select>
        </div>

        {/* Channel Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel Type
          </label>
          <select
            value={channelType}
            onChange={(e) => setChannelType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="AWGN">AWGN</option>
            <option value="Rayleigh">Rayleigh Fading</option>
            <option value="Rician">Rician Fading</option>
          </select>
        </div>

        {/* SNR Range */}
        <div className="border-t pt-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            SNR Range (dB)
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input
                type="number"
                value={snrStart}
                onChange={(e) => setSnrStart(Number(e.target.value))}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End</label>
              <input
                type="number"
                value={snrEnd}
                onChange={(e) => setSnrEnd(Number(e.target.value))}
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Step</label>
              <input
                type="number"
                value={snrStep}
                onChange={(e) => setSnrStep(Number(e.target.value))}
                min="0.5"
                step="0.5"
                className="w-full px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>

        {/* Channel Coding */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Channel Coding
          </label>
          <select
            value={channelCoding}
            onChange={(e) => setChannelCoding(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="Hamming">Hamming Code</option>
            <option value="Convolutional">Convolutional Code</option>
            <option value="Turbo">Turbo Code</option>
            <option value="LDPC">LDPC Code</option>
          </select>
        </div>

        {/* Code Rate (only shown if channel coding is enabled) */}
        {channelCoding !== 'none' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Rate
            </label>
            <input
              type="number"
              value={codeRate}
              onChange={(e) => setCodeRate(Number(e.target.value))}
              min="0.1"
              max="1"
              step="0.1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        )}

        {/* Source Encoding */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Source Encoding
          </label>
          <select
            value={sourceEncoding}
            onChange={(e) => setSourceEncoding(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="none">None</option>
            <option value="Huffman">Huffman Coding</option>
          </select>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-md font-semibold text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Running Simulation...
            </span>
          ) : (
            'Run Simulation'
          )}
        </button>
      </form>
    </div>
  )
}

export default ConfigPanel

