import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import simulationRouter from './routes/simulation.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Routes
app.use('/api', simulationRouter)

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'ComSim backend is running' })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({ error: err.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`ComSim backend server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
})

