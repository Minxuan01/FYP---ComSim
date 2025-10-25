import axios from 'axios'

const API_BASE_URL = '/api'

export interface SimulationConfig {
  numBits: number
  modulation: string
  channelType: string
  snr: number[]
  channelCoding: string
  sourceEncoding: string
  codeRate?: number
}

export interface SimulationResults {
  ber: number[]
  snr: number[]
  constellation?: {
    real: number[]
    imag: number[]
  }
  metrics: {
    avgBER: number
    minBER: number
  }
}

export const runSimulation = async (config: SimulationConfig): Promise<SimulationResults> => {
  try {
    const response = await axios.post<SimulationResults>(
      `${API_BASE_URL}/simulate`,
      config,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )
    return response.data
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Server error occurred')
    } else if (error.request) {
      throw new Error('No response from server. Please check if the backend is running.')
    } else {
      throw new Error('Failed to send request')
    }
  }
}

