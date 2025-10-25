import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Path to the compiled MATLAB executable
const MATLAB_EXECUTABLE = path.join(
  __dirname,
  '..',
  '..',
  '..',
  'matlab',
  'compiled',
  'runSimulation.exe'
)

/**
 * Execute the compiled MATLAB simulation
 * @param {Object} config - Simulation configuration
 * @returns {Promise<Object>} - Simulation results
 */
export const executeMATLAB = async (config) => {
  return new Promise((resolve, reject) => {
    // Convert config to JSON string
    const configJson = JSON.stringify(config)

    console.log('Executing MATLAB with config:', configJson)
    console.log('MATLAB executable path:', MATLAB_EXECUTABLE)

    // Spawn the MATLAB executable
    const matlabProcess = spawn(MATLAB_EXECUTABLE, [configJson])

    let stdout = ''
    let stderr = ''

    // Collect stdout
    matlabProcess.stdout.on('data', (data) => {
      stdout += data.toString()
      console.log('MATLAB stdout:', data.toString())
    })

    // Collect stderr
    matlabProcess.stderr.on('data', (data) => {
      stderr += data.toString()
      console.error('MATLAB stderr:', data.toString())
    })

    // Handle process completion
    matlabProcess.on('close', (code) => {
      if (code !== 0) {
        console.error(`MATLAB process exited with code ${code}`)
        console.error('stderr:', stderr)
        reject(new Error(`MATLAB execution failed with code ${code}: ${stderr}`))
        return
      }

      try {
        // MATLAB may output debug messages before the JSON result
        // Extract only the JSON portion (last line or find JSON object)
        const lines = stdout.trim().split('\n')
        
        // Try to find JSON in the output (look for lines starting with { or [)
        let jsonStr = null
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i].trim()
          if (line.startsWith('{') || line.startsWith('[')) {
            jsonStr = line
            break
          }
        }
        
        if (!jsonStr) {
          // If no JSON found, try parsing the entire output
          jsonStr = stdout.trim()
        }
        
        const results = JSON.parse(jsonStr)
        resolve(results)
      } catch (error) {
        console.error('Failed to parse MATLAB output:', stdout)
        reject(new Error(`Failed to parse MATLAB output: ${error.message}`))
      }
    })

    // Handle process errors
    matlabProcess.on('error', (error) => {
      console.error('Failed to start MATLAB process:', error)
      reject(new Error(`Failed to start MATLAB process: ${error.message}`))
    })
  })
}

