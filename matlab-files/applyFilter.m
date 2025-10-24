% MATLAB function for applying filters to signals
% Usage: applyFilter(inputSignal, filterCoefficients, outputPath)

function applyFilter(inputSignal, filterCoefficients, outputPath)
    try
        % Parse input signal (can be file path or direct data)
        if ischar(inputSignal) || isstring(inputSignal)
            % Check if it's a JSON file
            if contains(inputSignal, '.json')
                % Load signal from JSON file
                signalData = jsondecode(fileread(inputSignal));
                signal = signalData.signal;
                fs = signalData.sampleRate;
            else
                % Try to load as audio file
                [signal, fs] = audioread(inputSignal);
                if size(signal, 2) > 1
                    signal = mean(signal, 2); % Convert stereo to mono
                end
            end
        else
            % Assume inputSignal is the actual signal data
            signal = inputSignal;
            fs = 44100; % Default sample rate
        end
        
        % Parse filter coefficients
        if ischar(filterCoefficients) || isstring(filterCoefficients)
            % Check if it's a JSON file
            if contains(filterCoefficients, '.json')
                % Load coefficients from JSON file
                coeffData = jsondecode(fileread(filterCoefficients));
                b = coeffData.numerator;
                a = coeffData.denominator;
            elseif contains(filterCoefficients, '{') || contains(filterCoefficients, '[')
                % It's a JSON string
                coeffData = jsondecode(filterCoefficients);
                b = coeffData.numerator;
                a = coeffData.denominator;
            else
                % Load coefficients from MAT file
                coeffData = load(filterCoefficients);
                b = coeffData.b;
                a = coeffData.a;
            end
        else
            % Assume filterCoefficients is a structure
            b = filterCoefficients.numerator;
            a = filterCoefficients.denominator;
        end
        
        % Apply filter using MATLAB's filter function
        filteredSignal = filter(b, a, signal);
        
        % Calculate signal statistics
        originalRMS = rms(signal);
        filteredRMS = rms(filteredSignal);
        originalPeak = max(abs(signal));
        filteredPeak = max(abs(filteredSignal));
        
        % Calculate frequency domain characteristics
        N = length(signal);
        f = (0:N-1) * fs / N;
        
        % Original signal spectrum
        Y_original = fft(signal);
        P_original = abs(Y_original / N);
        P_original = P_original(1:N/2+1);
        P_original(2:end-1) = 2 * P_original(2:end-1);
        
        % Filtered signal spectrum
        Y_filtered = fft(filteredSignal);
        P_filtered = abs(Y_filtered / N);
        P_filtered = P_filtered(1:N/2+1);
        P_filtered(2:end-1) = 2 * P_filtered(2:end-1);
        
        % Create results structure
        results = struct();
        results.originalSignal = signal;
        results.filteredSignal = filteredSignal;
        results.sampleRate = fs;
        results.signalLength = N;
        
        results.statistics = struct();
        results.statistics.originalRMS = originalRMS;
        results.statistics.filteredRMS = filteredRMS;
        results.statistics.originalPeak = originalPeak;
        results.statistics.filteredPeak = filteredPeak;
        results.statistics.rmsChange = filteredRMS / originalRMS;
        results.statistics.peakChange = filteredPeak / originalPeak;
        
        results.spectrum = struct();
        results.spectrum.frequencies = f(1:N/2+1);
        results.spectrum.originalMagnitude = P_original;
        results.spectrum.filteredMagnitude = P_filtered;
        
        results.filterInfo = struct();
        results.filterInfo.numerator = b;
        results.filterInfo.denominator = a;
        
        % Save results as JSON
        jsonStr = jsonencode(results);
        
        fid = fopen(outputPath, 'w');
        if fid == -1
            error('Cannot create output file at: %s', outputPath);
        end
        fprintf(fid, '%s', jsonStr);
        fclose(fid);
        
        fprintf('Filter application completed successfully\n');
        fprintf('Results saved to: %s\n', outputPath);
        
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
