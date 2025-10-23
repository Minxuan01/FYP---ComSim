% MATLAB function for generating various types of signals
% Usage: generateSignal(signalType, parameters, outputPath)

function generateSignal(signalType, parameters, outputPath)
    try
        % Parse parameters
        if ischar(parameters)
            params = jsondecode(fileread(parameters));
        else
            params = parameters;
        end
        
        % Extract common parameters
        sampleRate = params.sampleRate;
        duration = params.duration;
        amplitude = params.amplitude;
        frequency = params.frequency;
        phase = params.phase;
        
        % Calculate number of samples
        N = round(duration * sampleRate);
        t = (0:N-1) / sampleRate;
        
        % Generate signal based on type
        switch lower(signalType)
            case 'sine'
                signal = amplitude * sin(2 * pi * frequency * t + phase);
                
            case 'cosine'
                signal = amplitude * cos(2 * pi * frequency * t + phase);
                
            case 'square'
                signal = amplitude * square(2 * pi * frequency * t + phase);
                
            case 'sawtooth'
                signal = amplitude * sawtooth(2 * pi * frequency * t + phase);
                
            case 'triangle'
                signal = amplitude * sawtooth(2 * pi * frequency * t + phase, 0.5);
                
                
            case 'fm'
                modulationFreq = params.modulationFreq;
                modulationIndex = params.modulationIndex;
                instantaneousFreq = frequency + modulationIndex * sin(2 * pi * modulationFreq * t);
                signal = amplitude * sin(2 * pi * instantaneousFreq .* t + phase);
                
            case 'am'
                modulationFreq = params.modulationFreq;
                modulationIndex = params.modulationIndex;
                carrier = sin(2 * pi * frequency * t + phase);
                modulator = 1 + modulationIndex * sin(2 * pi * modulationFreq * t);
                signal = amplitude * carrier .* modulator;
                
            case 'pulse'
                dutyCycle = params.dutyCycle;
                signal = amplitude * pulstran(t, 0:1/frequency:duration, 'rectpuls', 1/frequency * dutyCycle);
                
                
                
                
            case 'brown_noise'
                signal = generateBrownNoise(N, amplitude);
                
            case 'burst'
                burstFreq = params.burstFreq;
                burstDuration = params.burstDuration;
                signal = amplitude * sin(2 * pi * burstFreq * t) .* rectpuls(t - duration/2, burstDuration);
                
                
            case 'comb'
                fundamentalFreq = frequency;
                numHarmonics = params.numHarmonics;
                signal = zeros(size(t));
                for i = 1:numHarmonics
                    signal = signal + (amplitude / numHarmonics) * sin(2 * pi * i * fundamentalFreq * t + phase);
                end
                
            otherwise
                error('Unsupported signal type: %s', signalType);
        end
        
        % Add noise if specified
        if isfield(params, 'noiseLevel') && params.noiseLevel > 0
            noise = params.noiseLevel * (2 * rand(size(signal)) - 1);
            signal = signal + noise;
        end
        
        % Normalize signal
        if max(abs(signal)) > 0
            signal = signal / max(abs(signal)) * amplitude;
        end
        
        % Calculate signal statistics
        signalRMS = rms(signal);
        signalPeak = max(abs(signal));
        signalEnergy = sum(signal.^2);
        
        % Calculate spectrum
        Y = fft(signal);
        P = abs(Y / N);
        P = P(1:N/2+1);
        P(2:end-1) = 2 * P(2:end-1);
        f = sampleRate * (0:(N/2)) / N;
        
        % Create results structure
        results = struct();
        results.signalType = signalType;
        results.signal = signal;
        results.time = t;
        results.sampleRate = sampleRate;
        results.duration = duration;
        
        results.parameters = params;
        
        results.statistics = struct();
        results.statistics.rms = signalRMS;
        results.statistics.peak = signalPeak;
        results.statistics.energy = signalEnergy;
        results.statistics.crestFactor = signalPeak / signalRMS;
        
        results.spectrum = struct();
        results.spectrum.frequencies = f;
        results.spectrum.magnitude = P;
        
        % Save results as JSON
        jsonStr = jsonencode(results);
        outputFile = fullfile(outputPath, 'generatedSignal.json');
        
        fid = fopen(outputFile, 'w');
        if fid == -1
            error('Cannot create output file');
        end
        fprintf(fid, '%s', jsonStr);
        fclose(fid);
        
        fprintf('Signal generation completed successfully\n');
        fprintf('Results saved to: %s\n', outputFile);
        
    catch ME
        fprintf('Error: %s\n', ME.message);
        fprintf('Stack trace:\n');
        for k = 1:length(ME.stack)
            fprintf('  File: %s\n', ME.stack(k).file);
            fprintf('  Name: %s\n', ME.stack(k).name);
            fprintf('  Line: %d\n', ME.stack(k).line);
        end
        exit(1);
    end
end


% Generate brown noise (random walk)
function brownNoise = generateBrownNoise(N, amplitude)
    brownNoise = zeros(N, 1);
    
    for i = 2:N
        brownNoise(i) = brownNoise(i-1) + (2 * rand() - 1);
    end
    
    % Normalize
    brownNoise = brownNoise / max(abs(brownNoise)) * amplitude;
end
