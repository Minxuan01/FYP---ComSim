% MATLAB script for audio processing

function processAudio(inputAudioPath, outputPath)
    try
        % Read audio file
        [y, Fs] = audioread(inputAudioPath);
        
        % Convert stereo to mono if necessary
        if size(y, 2) > 1
            y = mean(y, 2);
        end
        
        % Normalize audio
        y = y / max(abs(y));
        
        % Time domain analysis
        N = length(y);
        t = (0:N-1) / Fs;
        
        % Sample time domain data (take every 100th sample for visualization)
        timeDomainSampled = y(1:100:end);
        
        % Frequency domain analysis (FFT)
        Y = fft(y);
        P2 = abs(Y/N);
        P1 = P2(1:N/2+1);
        P1(2:end-1) = 2*P1(2:end-1);
        f = Fs*(0:(N/2))/N;
        
        % Convert to dB
        P1_dB = 20*log10(P1 + eps);
        
        % Sample frequency data (take every 100th sample for visualization)
        freqSampled = f(1:100:end);
        spectrumSampled = P1_dB(1:100:end);
        
        % Calculate metrics
        % Signal energy
        energy = sum(y.^2);
        
        % Signal power
        power = energy / N;
        
        % Peak amplitude
        peakAmplitude = max(abs(y));
        
        % RMS value
        rmsValue = sqrt(mean(y.^2));
        
        % Zero crossing rate
        zeroCrossings = sum(abs(diff(sign(y)))) / (2 * N);
        
        % Create results structure
        results = struct();
        results.waveform = timeDomainSampled';
        results.freq = freqSampled';
        results.spectrum = spectrumSampled';
        results.fs = Fs;
        results.step = 100;
        results.metrics = struct( ...
            'sampleRate', Fs, ...
            'duration', N/Fs, ...
            'energy', energy, ...
            'power', power, ...
            'peakAmplitude', peakAmplitude, ...
            'rmsValue', rmsValue, ...
            'zeroCrossingRate', zeroCrossings ...
        );
        
        % Save results as JSON
        jsonStr = jsonencode(results);
        
        fid = fopen(outputPath, 'w');
        if fid == -1
            error('Cannot create output file at: %s', outputPath);
        end
        fprintf(fid, '%s', jsonStr);
        fclose(fid);
        
        fprintf('Processing completed successfully\n');
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