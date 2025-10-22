# MATLAB Functions for Digital Communication Systems Simulator

This directory contains MATLAB functions that provide advanced signal processing capabilities for the Digital Communication Systems Simulator. These functions are designed to be compiled into standalone executables that can be called from the Node.js backend.

## Functions Overview

### 1. `processAudio.m`
- **Purpose**: Processes uploaded audio files
- **Features**: FFT analysis, spectrum calculation, signal metrics
- **Input**: Audio file path, output directory
- **Output**: JSON with time domain, frequency domain, and signal statistics

### 2. `designFilter.m`
- **Purpose**: Designs digital filters using MATLAB's Signal Processing Toolbox
- **Supported Types**: Low-pass, High-pass, Band-pass, Band-stop
- **Supported Designs**: Butterworth, Chebyshev I/II, Elliptic, Bessel
- **Features**: Frequency response, pole-zero plots, impulse/step response, group delay
- **Input**: Filter parameters (type, design, frequencies, order, etc.)
- **Output**: Filter coefficients and comprehensive analysis

### 3. `applyFilter.m`
- **Purpose**: Applies designed filters to signals
- **Features**: Real-time filtering, signal statistics, spectrum analysis
- **Input**: Signal data, filter coefficients
- **Output**: Filtered signal with performance metrics

### 4. `modulationSimulation.m`
- **Purpose**: Comprehensive modulation/demodulation simulation
- **Supported Types**: AM, FM, PM, ASK, FSK, PSK, QAM
- **Features**: Noise modeling, BER calculation, constellation diagrams
- **Input**: Modulation type, signal data, carrier frequency, parameters
- **Output**: Modulated/demodulated signals with performance analysis

### 5. `generateSignal.m`
- **Purpose**: Generates various types of test signals
- **Supported Types**: Sine, cosine, square, sawtooth, triangle, chirp, FM, AM, pulse, multitone, noise types
- **Features**: Signal statistics, spectrum analysis, parameter control
- **Input**: Signal type and parameters
- **Output**: Generated signal with analysis

## Compilation Instructions

### Prerequisites
- MATLAB R2019b or later
- MATLAB Compiler Toolbox
- Signal Processing Toolbox (for filter design functions)

### Compilation Steps

1. **Open MATLAB** and navigate to this directory:
   ```matlab
   cd path/to/matlab-files
   ```

2. **Run the compilation script**:
   ```matlab
   compileMATLAB
   ```

3. **Verify executables** are created in `../server/matlab-executables/`:
   - `processAudio.exe`
   - `designFilter.exe`
   - `applyFilter.exe`
   - `modulationSimulation.exe`
   - `generateSignal.exe`

### Manual Compilation (Alternative)

If the batch compilation fails, compile each function individually:

```matlab
% Compile processAudio
mcc('-m', 'processAudio.m', '-o', 'processAudio', '-d', '../server/matlab-executables');

% Compile designFilter
mcc('-m', 'designFilter.m', '-o', 'designFilter', '-d', '../server/matlab-executables');

% Compile applyFilter
mcc('-m', 'applyFilter.m', '-o', 'applyFilter', '-d', '../server/matlab-executables');

% Compile modulationSimulation
mcc('-m', 'modulationSimulation.m', '-o', 'modulationSimulation', '-d', '../server/matlab-executables');

% Compile generateSignal
mcc('-m', 'generateSignal.m', '-o', 'generateSignal', '-d', '../server/matlab-executables');
```

## Usage Examples

### Filter Design
```bash
designFilter.exe lowpass butterworth 1000 3000 4 0.5 40 44100 output.json
```

### Signal Generation
```bash
generateSignal.exe sine params.json output.json
```

### Modulation Simulation
```bash
modulationSimulation.exe am signal.wav 1000 44100 mod_params.json output.json
```

## API Integration

The Node.js backend provides REST API endpoints that call these MATLAB executables:

- `POST /api/design-filter` - Filter design
- `POST /api/apply-filter` - Filter application
- `POST /api/generate-signal` - Signal generation
- `POST /api/modulation` - Modulation simulation
- `POST /api/upload` - Audio processing

## Error Handling

All MATLAB functions include comprehensive error handling:
- Input validation
- File I/O error checking
- MATLAB function error catching
- Detailed error messages in JSON format

## Performance Considerations

- MATLAB executables are optimized for performance
- Large signals are processed efficiently using MATLAB's vectorized operations
- Memory usage is optimized for typical signal processing tasks
- Executables can handle signals up to several minutes in length

## Troubleshooting

### Common Issues

1. **"MATLAB Runtime not found"**
   - Install MATLAB Runtime (available from MathWorks website)
   - Ensure runtime is in system PATH

2. **"Function not found" errors**
   - Verify all required toolboxes are installed
   - Check that functions are in the correct directory

3. **Permission errors**
   - Ensure executables have proper permissions
   - Run as administrator if necessary (Windows)

4. **Memory errors with large signals**
   - Reduce signal length or sample rate
   - Increase system memory
   - Process signals in chunks

### Debug Mode

To debug MATLAB functions, run them directly in MATLAB:
```matlab
% Example: Test filter design
designFilter('lowpass', 'butterworth', 1000, 3000, 4, 0.5, 40, 44100, 'test_output.json');
```

## Future Enhancements

- Additional filter types (FIR, adaptive filters)
- More modulation schemes (OFDM, spread spectrum)
- Real-time processing capabilities
- GPU acceleration support
- Advanced noise models
- Channel modeling and equalization
