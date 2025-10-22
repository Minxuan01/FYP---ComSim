% MATLAB function for comprehensive filter design
% Usage: designFilter(filterType, filterDesign, cutoffFreq, highCutoffFreq, filterOrder, ripple, stopbandAttenuation, sampleRate, outputPath)

function designFilter(filterType, filterDesign, cutoffFreq, highCutoffFreq, filterOrder, ripple, stopbandAttenuation, sampleRate, outputPath)
    try
        % Convert string inputs to appropriate types
        if ischar(filterType)
            filterType = string(filterType);
        end
        if ischar(filterDesign)
            filterDesign = string(filterDesign);
        end
        
        cutoffFreq = str2double(cutoffFreq);
        highCutoffFreq = str2double(highCutoffFreq);
        filterOrder = str2double(filterOrder);
        ripple = str2double(ripple);
        stopbandAttenuation = str2double(stopbandAttenuation);
        sampleRate = str2double(sampleRate);
        
        % Normalize frequencies
        nyquist = sampleRate / 2;
        normalizedCutoff = cutoffFreq / nyquist;
        normalizedHighCutoff = highCutoffFreq / nyquist;
        
        % Ensure normalized frequencies are valid
        normalizedCutoff = min(normalizedCutoff, 0.99);
        normalizedHighCutoff = min(normalizedHighCutoff, 0.99);
        
        % Design filter based on type and design method
        switch lower(filterDesign)
            case 'butterworth'
                [b, a] = designButterworth(filterType, normalizedCutoff, normalizedHighCutoff, filterOrder);
            case 'chebyshev1'
                [b, a] = designChebyshev1(filterType, normalizedCutoff, normalizedHighCutoff, filterOrder, ripple);
            case 'chebyshev2'
                [b, a] = designChebyshev2(filterType, normalizedCutoff, normalizedHighCutoff, filterOrder, stopbandAttenuation);
            case 'elliptic'
                [b, a] = designElliptic(filterType, normalizedCutoff, normalizedHighCutoff, filterOrder, ripple, stopbandAttenuation);
            case 'bessel'
                [b, a] = designBessel(filterType, normalizedCutoff, normalizedHighCutoff, filterOrder);
            otherwise
                error('Unsupported filter design: %s', filterDesign);
        end
        
        % Calculate frequency response
        [H, w] = freqz(b, a, 1024, sampleRate);
        magnitude = 20 * log10(abs(H));
        phase = unwrap(angle(H)) * 180 / pi;
        
        % Calculate pole-zero plot
        [z, p, k] = tf2zp(b, a);
        
        % Calculate impulse response
        impulseResponse = impz(b, a, 100);
        
        % Calculate step response
        stepResponse = stepz(b, a, 100);
        
        % Calculate group delay
        [gd, w_gd] = grpdelay(b, a, 512, sampleRate);
        
        % Create results structure
        results = struct();
        results.filterCoefficients = struct();
        results.filterCoefficients.numerator = b;
        results.filterCoefficients.denominator = a;
        
        results.frequencyResponse = struct();
        results.frequencyResponse.frequencies = w;
        results.frequencyResponse.magnitude = magnitude;
        results.frequencyResponse.phase = phase;
        
        results.poleZero = struct();
        results.poleZero.zeros = z;
        results.poleZero.poles = p;
        results.poleZero.gain = k;
        
        results.timeResponse = struct();
        results.timeResponse.impulse = impulseResponse;
        results.timeResponse.step = stepResponse;
        results.timeResponse.groupDelay = gd;
        results.timeResponse.groupDelayFreq = w_gd;
        
        results.parameters = struct();
        results.parameters.filterType = filterType;
        results.parameters.filterDesign = filterDesign;
        results.parameters.cutoffFreq = cutoffFreq;
        results.parameters.highCutoffFreq = highCutoffFreq;
        results.parameters.filterOrder = filterOrder;
        results.parameters.ripple = ripple;
        results.parameters.stopbandAttenuation = stopbandAttenuation;
        results.parameters.sampleRate = sampleRate;
        
        % Save results as JSON
        jsonStr = jsonencode(results);
        outputFile = fullfile(outputPath, 'filterDesign.json');
        
        fid = fopen(outputFile, 'w');
        if fid == -1
            error('Cannot create output file');
        end
        fprintf(fid, '%s', jsonStr);
        fclose(fid);
        
        fprintf('Filter design completed successfully\n');
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

% Butterworth filter design
function [b, a] = designButterworth(filterType, cutoffFreq, highCutoffFreq, order)
    switch lower(filterType)
        case 'lowpass'
            [b, a] = butter(order, cutoffFreq, 'low');
        case 'highpass'
            [b, a] = butter(order, cutoffFreq, 'high');
        case 'bandpass'
            [b, a] = butter(order, [cutoffFreq, highCutoffFreq], 'bandpass');
        case 'bandstop'
            [b, a] = butter(order, [cutoffFreq, highCutoffFreq], 'stop');
        otherwise
            error('Unsupported filter type: %s', filterType);
    end
end

% Chebyshev Type I filter design
function [b, a] = designChebyshev1(filterType, cutoffFreq, highCutoffFreq, order, ripple)
    switch lower(filterType)
        case 'lowpass'
            [b, a] = cheby1(order, ripple, cutoffFreq, 'low');
        case 'highpass'
            [b, a] = cheby1(order, ripple, cutoffFreq, 'high');
        case 'bandpass'
            [b, a] = cheby1(order, ripple, [cutoffFreq, highCutoffFreq], 'bandpass');
        case 'bandstop'
            [b, a] = cheby1(order, ripple, [cutoffFreq, highCutoffFreq], 'stop');
        otherwise
            error('Unsupported filter type: %s', filterType);
    end
end

% Chebyshev Type II filter design
function [b, a] = designChebyshev2(filterType, cutoffFreq, highCutoffFreq, order, stopbandAttenuation)
    switch lower(filterType)
        case 'lowpass'
            [b, a] = cheby2(order, stopbandAttenuation, cutoffFreq, 'low');
        case 'highpass'
            [b, a] = cheby2(order, stopbandAttenuation, cutoffFreq, 'high');
        case 'bandpass'
            [b, a] = cheby2(order, stopbandAttenuation, [cutoffFreq, highCutoffFreq], 'bandpass');
        case 'bandstop'
            [b, a] = cheby2(order, stopbandAttenuation, [cutoffFreq, highCutoffFreq], 'stop');
        otherwise
            error('Unsupported filter type: %s', filterType);
    end
end

% Elliptic filter design
function [b, a] = designElliptic(filterType, cutoffFreq, highCutoffFreq, order, ripple, stopbandAttenuation)
    switch lower(filterType)
        case 'lowpass'
            [b, a] = ellip(order, ripple, stopbandAttenuation, cutoffFreq, 'low');
        case 'highpass'
            [b, a] = ellip(order, ripple, stopbandAttenuation, cutoffFreq, 'high');
        case 'bandpass'
            [b, a] = ellip(order, ripple, stopbandAttenuation, [cutoffFreq, highCutoffFreq], 'bandpass');
        case 'bandstop'
            [b, a] = ellip(order, ripple, stopbandAttenuation, [cutoffFreq, highCutoffFreq], 'stop');
        otherwise
            error('Unsupported filter type: %s', filterType);
    end
end

% Bessel filter design
function [b, a] = designBessel(filterType, cutoffFreq, highCutoffFreq, order)
    switch lower(filterType)
        case 'lowpass'
            [b, a] = besself(order, cutoffFreq * pi);
            [b, a] = bilinear(b, a, 1); % Convert to digital
        case 'highpass'
            [b, a] = besself(order, cutoffFreq * pi);
            [b, a] = bilinear(b, a, 1); % Convert to digital
            [b, a] = iirlp2hp(b, a, cutoffFreq, cutoffFreq * 1.5); % Transform to highpass
        case 'bandpass'
            [b, a] = besself(order, [cutoffFreq, highCutoffFreq] * pi);
            [b, a] = bilinear(b, a, 1); % Convert to digital
        case 'bandstop'
            [b, a] = besself(order, [cutoffFreq, highCutoffFreq] * pi);
            [b, a] = bilinear(b, a, 1); % Convert to digital
            [b, a] = iirlp2bs(b, a, cutoffFreq, highCutoffFreq); % Transform to bandstop
        otherwise
            error('Unsupported filter type: %s', filterType);
    end
end
