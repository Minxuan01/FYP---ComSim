import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { SimulationResults } from '../services/api'

interface ResultsDisplayProps {
  results: SimulationResults | null
  loading: boolean
  error: string | null
}

const ResultsDisplay = ({ results, loading, error }: ResultsDisplayProps) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mb-4"
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
          <p className="text-lg text-gray-600">Running simulation...</p>
          <p className="text-sm text-gray-500 mt-2">
            This may take a few moments depending on the configuration
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center h-96">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative max-w-lg">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <svg
            className="w-24 h-24 mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg">No results yet</p>
          <p className="text-sm mt-2">
            Configure your simulation and click "Run Simulation" to see results
          </p>
        </div>
      </div>
    )
  }

  // Prepare data for BER vs SNR chart
  const berData = results.snr.map((snr, index) => ({
    snr,
    ber: results.ber[index],
  }))

  // Prepare data for constellation diagram
  const constellationData = results.constellation
    ? results.constellation.real.map((real, index) => ({
        real,
        imag: results.constellation!.imag[index],
      }))
    : []

  return (
    <div className="space-y-6">
      {/* Performance Metrics Card */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Performance Metrics
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Average BER</p>
            <p className="text-2xl font-bold text-blue-600">
              {results.metrics.avgBER.toExponential(3)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Minimum BER</p>
            <p className="text-2xl font-bold text-green-600">
              {results.metrics.minBER.toExponential(3)}
            </p>
          </div>
        </div>
      </div>

      {/* BER vs SNR Chart */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          BER vs SNR Performance
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={berData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="snr"
              label={{ value: 'SNR (dB)', position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              scale="log"
              domain={['auto', 'auto']}
              label={{ value: 'BER', angle: -90, position: 'insideLeft' }}
              tickFormatter={(value) => value.toExponential(0)}
            />
            <Tooltip
              formatter={(value: any) => value.toExponential(3)}
              labelFormatter={(label) => `SNR: ${label} dB`}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ber"
              stroke="#2563eb"
              strokeWidth={2}
              dot={{ r: 5 }}
              name="Bit Error Rate"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Constellation Diagram */}
      {constellationData.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Constellation Diagram
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="real"
                name="In-Phase"
                label={{ value: 'In-Phase', position: 'insideBottom', offset: -5 }}
              />
              <YAxis
                type="number"
                dataKey="imag"
                name="Quadrature"
                label={{ value: 'Quadrature', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Legend />
              <Scatter
                name="Received Symbols"
                data={constellationData}
                fill="#8b5cf6"
                fillOpacity={0.6}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Raw Data Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Detailed Results
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SNR (dB)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  BER
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {results.snr.map((snr, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {snr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {results.ber[index].toExponential(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ResultsDisplay

