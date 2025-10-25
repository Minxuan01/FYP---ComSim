function receivedSignal = channelSimulation(modulatedSignal, config)
    % Simulate transmission through a channel
    % Input: modulatedSignal - complex symbols
    %        config - configuration with channelType and currentSnr
    % Output: received signal with impairments
    
    snr_dB = config.currentSnr;
    snr_linear = 10^(snr_dB/10);
    
    switch config.channelType
        case 'AWGN'
            % Additive White Gaussian Noise channel
            % Calculate signal power
            signalPower = mean(abs(modulatedSignal).^2);
            
            % Calculate noise power based on SNR
            noisePower = signalPower / snr_linear;
            
            % Generate complex Gaussian noise
            noise = sqrt(noisePower/2) * (randn(size(modulatedSignal)) + ...
                                          1i*randn(size(modulatedSignal)));
            
            receivedSignal = modulatedSignal + noise;
            
        case 'Rayleigh'
            % Rayleigh fading channel + AWGN
            % Generate Rayleigh fading coefficients
            h = (randn(size(modulatedSignal)) + 1i*randn(size(modulatedSignal))) / sqrt(2);
            
            % Apply fading
            fadedSignal = h .* modulatedSignal;
            
            % Calculate signal power after fading
            signalPower = mean(abs(fadedSignal).^2);
            
            % Add AWGN
            noisePower = signalPower / snr_linear;
            noise = sqrt(noisePower/2) * (randn(size(fadedSignal)) + ...
                                          1i*randn(size(fadedSignal)));
            
            receivedSignal = fadedSignal + noise;
            
            % Equalize (simple zero-forcing)
            receivedSignal = receivedSignal ./ h;
            
        case 'Rician'
            % Rician fading channel + AWGN
            K = 10; % Rician K-factor (10 dB)
            K_linear = 10^(K/10);
            
            % LOS component
            los = sqrt(K_linear / (K_linear + 1));
            
            % Scattered component
            h_scattered = sqrt(1 / (2*(K_linear + 1))) * ...
                         (randn(size(modulatedSignal)) + 1i*randn(size(modulatedSignal)));
            
            % Total channel
            h = los + h_scattered;
            
            % Apply fading
            fadedSignal = h .* modulatedSignal;
            
            % Calculate signal power
            signalPower = mean(abs(fadedSignal).^2);
            
            % Add AWGN
            noisePower = signalPower / snr_linear;
            noise = sqrt(noisePower/2) * (randn(size(fadedSignal)) + ...
                                          1i*randn(size(fadedSignal)));
            
            receivedSignal = fadedSignal + noise;
            
            % Equalize
            receivedSignal = receivedSignal ./ h;
            
        otherwise
            error('Unknown channel type: %s', config.channelType);
    end
end

