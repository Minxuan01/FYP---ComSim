# ComSim - Digital Communication Simulation Platform

A modular web-based platform for simulating digital communication systems. Users can configure simulation parameters through a React frontend, run MATLAB-based computations on the backend, and visualize results (BER curves, constellation diagrams) in the browser.

## Architecture

```
ComSim/
├── frontend/          # React + Vite + TailwindCSS
├── backend/           # Express + Node.js API
├── matlab/            # MATLAB simulation code
└── package.json       # Monorepo configuration
```

## Features

### Modular Simulation Pipeline

The simulator implements a complete digital communication chain:

1. **Source Generation** - Random bit/symbol generation
2. **Source Encoding** - Data compression (Huffman, etc.)
3. **Channel Coding** - Error control (Hamming, Convolutional, Turbo, LDPC)
4. **Modulation** - BPSK, QPSK, 8-QAM, 16-QAM, 64-QAM
5. **Channel Simulation** - AWGN, Rayleigh fading, Rician fading
6. **Demodulation** - Symbol detection
7. **Channel Decoding** - Error correction
8. **Performance Evaluation** - BER calculation

### User-Configurable Parameters

- Number of bits to simulate
- Modulation scheme
- Channel type and SNR range
- Channel coding scheme and code rate
- Source encoding

### Visualization

- BER vs SNR performance curves
- Constellation diagrams
- Performance metrics table

## Prerequisites

### Required Software

1. **Node.js** (v18 or higher)
2. **MATLAB Compiler Runtime** (MCR) or MATLAB with Compiler SDK
3. **Git** (for cloning the repository)

### MATLAB Compiler Setup

The MATLAB code must be compiled into a standalone executable:

- On Windows: Generates `runSimulation.exe`
- On Linux/Mac: Generates `runSimulation`

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ComSim
```

### 2. Install Dependencies

```bash
# Install root and workspace dependencies
npm install
npm run install:all
```

### 3. Compile MATLAB Code

Navigate to the `matlab` directory and compile the simulation code using MATLAB Compiler:

```bash
cd matlab
mcc -m runSimulation.m -a . -o runSimulation -d ./compiled
```

This will create a `compiled` directory with the standalone executable.

**Note:** This requires MATLAB Compiler (`mcc`) to be in your PATH. If you have MATLAB installed but `mcc` is not available, you may need to install MATLAB Compiler SDK.

### 4. Verify Compilation

The compiled executable should be at:
- Windows: `matlab/compiled/runSimulation.exe`
- Linux/Mac: `matlab/compiled/runSimulation`

## Running the Application

### Development Mode

You need to run frontend and backend in **separate terminal windows**:

**Terminal 1 - Backend:**
```bash
npm run dev:backend
```
This starts the API server on `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
```
This starts the dev server on `http://localhost:5173`

**Alternative (from workspace directories):**
```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

## Usage

1. Open your browser to `http://localhost:5173`
2. Configure simulation parameters:
   - Set number of bits
   - Choose modulation scheme
   - Select channel type
   - Set SNR range (start, end, step)
   - Choose channel coding (optional)
   - Choose source encoding (optional)
3. Click "Run Simulation"
4. View results:
   - BER vs SNR curve
   - Constellation diagram
   - Performance metrics

## API Reference

### POST /api/simulate

Run a simulation with the specified configuration.

**Request Body:**
```json
{
  "numBits": 10000,
  "modulation": "QPSK",
  "channelType": "AWGN",
  "snr": [0, 2, 4, 6, 8, 10],
  "channelCoding": "none",
  "sourceEncoding": "none",
  "codeRate": 0.5
}
```

**Response:**
```json
{
  "ber": [0.1, 0.05, 0.01, 0.001, 0.0001, 0.00001],
  "snr": [0, 2, 4, 6, 8, 10],
  "constellation": {
    "real": [...],
    "imag": [...]
  },
  "metrics": {
    "avgBER": 0.026,
    "minBER": 0.00001
  }
}
```

## Configuration Options

### Modulation Schemes
- **BPSK**: Binary Phase Shift Keying (1 bit/symbol)
- **QPSK**: Quadrature PSK (2 bits/symbol)
- **8-QAM**: 8-point Quadrature Amplitude Modulation (3 bits/symbol)
- **16-QAM**: 16-point QAM (4 bits/symbol)
- **64-QAM**: 64-point QAM (6 bits/symbol)

### Channel Types
- **AWGN**: Additive White Gaussian Noise
- **Rayleigh**: Rayleigh fading (no line-of-sight)
- **Rician**: Rician fading (with line-of-sight component)

### Channel Coding
- **None**: No error control coding
- **Hamming**: Hamming(7,4) code
- **Convolutional**: Convolutional code (rate 1/2, K=3)
- **Turbo**: Turbo code (simplified)
- **LDPC**: Low-Density Parity-Check code (simplified)

### Source Encoding
- **None**: No source compression
- **Huffman**: Huffman coding (placeholder)

## Project Structure

### Frontend (`frontend/`)

```
frontend/
├── src/
│   ├── components/
│   │   ├── ConfigPanel.tsx      # Parameter configuration UI
│   │   └── ResultsDisplay.tsx   # Results visualization
│   ├── services/
│   │   └── api.ts               # API client
│   ├── App.tsx                  # Main application
│   ├── main.tsx                 # Entry point
│   └── index.css                # Tailwind styles
├── index.html
├── vite.config.ts
└── package.json
```

### Backend (`backend/`)

```
backend/
├── src/
│   ├── routes/
│   │   └── simulation.js        # Simulation API routes
│   ├── utils/
│   │   └── matlabExecutor.js    # MATLAB execution wrapper
│   └── server.js                # Express server
└── package.json
```

### MATLAB (`matlab/`)

```
matlab/
├── runSimulation.m              # Main entry point
├── generateSource.m             # Stage 1: Source generation
├── sourceEncode.m               # Stage 2: Source encoding
├── channelEncode.m              # Stage 3: Channel coding
├── modulate.m                   # Stage 4: Modulation
├── channelSimulation.m          # Stage 5: Channel simulation
├── demodulate.m                 # Stage 6: Demodulation
├── channelDecode.m              # Stage 7: Channel decoding
├── evaluatePerformance.m        # Stage 8: Performance evaluation
├── compile.sh                   # Compilation script (Unix)
├── compile.bat                  # Compilation script (Windows)
└── compiled/                    # Compiled executables (generated)
```

## Troubleshooting

### MATLAB Compilation Issues

**Problem:** `mcc: command not found`
- **Solution:** Add MATLAB's `bin` directory to your PATH, or install MATLAB Compiler SDK

**Problem:** Compilation fails with missing toolboxes
- **Solution:** Ensure you have the Communications Toolbox installed

### Backend Issues

**Problem:** Backend can't find MATLAB executable
- **Solution:** Verify the path in `backend/src/utils/matlabExecutor.js` matches your compiled executable location

**Problem:** MATLAB execution fails
- **Solution:** 
  - Ensure MATLAB Runtime (MCR) is installed
  - Check that all required MATLAB toolboxes are compiled into the executable
  - View backend console logs for detailed error messages

### Frontend Issues

**Problem:** Frontend can't connect to backend
- **Solution:** Ensure backend is running on port 3001, check CORS settings

**Problem:** Charts not displaying
- **Solution:** Verify that the simulation returned valid data in the expected format

## Development

### Adding New Modulation Schemes

1. Add modulation logic in `matlab/modulate.m`
2. Add corresponding demodulation in `matlab/demodulate.m`
3. Add option to frontend dropdown in `ConfigPanel.tsx`
4. Recompile MATLAB code

### Adding New Channel Types

1. Add channel simulation logic in `matlab/channelSimulation.m`
2. Add option to frontend dropdown
3. Recompile MATLAB code

### Testing MATLAB Functions

Test individual MATLAB functions before compilation:

```matlab
% In MATLAB command window
config.numBits = 1000;
config.modulation = 'QPSK';
config.channelType = 'AWGN';
config.currentSnr = 10;
config.channelCoding = 'none';
config.sourceEncoding = 'none';

sourceData = generateSource(config);
modulatedSignal = modulate(sourceData, config);
% ... test other functions
```

## Building for Production

### Frontend Build

```bash
cd frontend
npm run build
```

This creates optimized static files in `frontend/dist/`.

### Backend Deployment

The backend can be deployed to any Node.js hosting service. Ensure:
- MATLAB Runtime is installed on the server
- The compiled MATLAB executable is included
- Environment variables are properly configured

## License

[Add your license here]

## Contributing

[Add contribution guidelines here]

## Support

For issues and questions, please open an issue on the GitHub repository.

