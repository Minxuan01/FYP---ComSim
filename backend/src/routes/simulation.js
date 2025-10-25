import express from 'express'
import { executeMATLAB } from '../utils/matlabExecutor.js'

const router = express.Router()

// Validation helper
const validateConfig = (config) => {
  const errors = []

  if (!config.numBits || config.numBits < 1) {
    errors.push('numBits must be a positive number')
  }

  if (!config.modulation) {
    errors.push('modulation is required')
  }

  if (!config.channelType) {
    errors.push('channelType is required')
  }

  if (!Array.isArray(config.snr) || config.snr.length === 0) {
    errors.push('snr must be a non-empty array')
  }

  if (!config.channelCoding) {
    errors.push('channelCoding is required')
  }

  if (!config.sourceEncoding) {
    errors.push('sourceEncoding is required')
  }

  return errors
}

// POST /api/simulate
router.post('/simulate', async (req, res) => {
  try {
    const config = req.body

    // Validate configuration
    const validationErrors = validateConfig(config)
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Invalid configuration',
        details: validationErrors,
      })
    }

    console.log('Running simulation with config:', config)

    // Execute MATLAB simulation
    const results = await executeMATLAB(config)

    console.log('Simulation completed successfully')
    res.json(results)
  } catch (error) {
    console.error('Simulation error:', error)
    res.status(500).json({
      error: 'Simulation failed',
      message: error.message,
    })
  }
})

export default router

