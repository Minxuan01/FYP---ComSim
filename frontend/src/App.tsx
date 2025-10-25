import { useState } from 'react'
import ConfigPanel from './components/ConfigPanel'
import ResultsDisplay from './components/ResultsDisplay'
import { runSimulation, SimulationConfig, SimulationResults } from './services/api'

function App() {
  const [results, setResults] = useState<SimulationResults | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRunSimulation = async (config: SimulationConfig) => {
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const data = await runSimulation(config)
      setResults(data)
    } catch (err: any) {
      setError(err.message || 'An error occurred during simulation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ComSim - Digital Communication Simulator
          </h1>
          <p className="mt-2 text-gray-600">
            Configure and simulate modular digital communication systems
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ConfigPanel onRunSimulation={handleRunSimulation} loading={loading} />
          </div>
          
          <div className="lg:col-span-2">
            <ResultsDisplay results={results} loading={loading} error={error} />
          </div>
        </div>
      </main>

      <footer className="mt-12 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          <p>ComSim Platform - Modular Digital Communication Systems Simulation</p>
        </div>
      </footer>
    </div>
  )
}

export default App

