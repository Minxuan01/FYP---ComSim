function resultJson = runSimulation(configJson)
    % Main entry point for digital communication simulation
    % Parses configuration, builds dynamic pipeline, and returns results
    
    % Parse JSON configuration
    config = jsondecode(configJson);
    
    % Display configuration
    fprintf('Starting simulation with configuration:\n');
    fprintf('  Modulation: %s\n', config.modulation);
    fprintf('  Channel Type: %s\n', config.channelType);
    fprintf('  Number of Bits: %d\n', config.numBits);
    fprintf('  SNR Range: [%s] dB\n', num2str(config.snr));
    
    % Initialize results storage
    numSnrPoints = length(config.snr);
    berResults = zeros(1, numSnrPoints);
    
    % Stage 1: Source generation
    fprintf('Stage 1: Generating source data...\n');
    sourceData = generateSource(config);
    
    % Stage 2: Source encoding (conditional)
    if strcmp(config.sourceEncoding, 'none')
        encodedSource = sourceData;
    else
        fprintf('Stage 2: Applying source encoding (%s)...\n', config.sourceEncoding);
        encodedSource = sourceEncode(sourceData, config);
    end
    
    % Stage 3: Channel coding (conditional)
    if strcmp(config.channelCoding, 'none')
        codedData = encodedSource;
    else
        fprintf('Stage 3: Applying channel coding (%s)...\n', config.channelCoding);
        codedData = channelEncode(encodedSource, config);
    end
    
    % Run simulation for each SNR value
    for snrIdx = 1:numSnrPoints
        currentSnr = config.snr(snrIdx);
        fprintf('Simulating SNR = %d dB...\n', currentSnr);
        
        % Create temporary config with single SNR value
        tempConfig = config;
        tempConfig.currentSnr = currentSnr;
        
        % Stage 4: Modulation
        modulatedSignal = modulate(codedData, tempConfig);
        
        % Stage 5: Channel simulation
        receivedSignal = channelSimulation(modulatedSignal, tempConfig);
        
        % Stage 6: Demodulation
        demodulatedData = demodulate(receivedSignal, tempConfig);
        
        % Stage 7: Channel decoding
        if strcmp(config.channelCoding, 'none')
            decodedData = demodulatedData;
        else
            decodedData = channelDecode(demodulatedData, config);
        end
        
        % Stage 8: Performance evaluation for this SNR
        berResults(snrIdx) = evaluatePerformance(encodedSource, decodedData);
    end
    
    % Get constellation points at highest SNR for visualization
    tempConfig = config;
    tempConfig.currentSnr = config.snr(end);
    modulatedSignal = modulate(codedData, tempConfig);
    receivedSignal = channelSimulation(modulatedSignal, tempConfig);
    
    % Take a sample of constellation points for plotting (max 500 points)
    numSamples = min(500, length(receivedSignal));
    sampleIndices = round(linspace(1, length(receivedSignal), numSamples));
    constellationSamples = receivedSignal(sampleIndices);
    
    % Prepare results structure
    results.ber = berResults;
    results.snr = config.snr;
    results.constellation.real = real(constellationSamples);
    results.constellation.imag = imag(constellationSamples);
    results.metrics.avgBER = mean(berResults);
    results.metrics.minBER = min(berResults);
    
    % Convert results to JSON
    resultJson = jsonencode(results);
    
    fprintf('Simulation completed successfully!\n');
    
    % Print JSON result to stdout (for backend to parse)
    fprintf('%s\n', resultJson);
end

