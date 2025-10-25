function demodulatedData = demodulate(receivedSignal, config)
    % Demodulate received signal back to bits
    % Input: receivedSignal - complex symbols with noise
    %        config - configuration with modulation scheme
    % Output: binary data
    
    switch config.modulation
        case 'BPSK'
            % BPSK demodulation: hard decision
            demodulatedData = real(receivedSignal) > 0;
            
        case 'QPSK'
            % QPSK demodulation
            numSymbols = length(receivedSignal);
            bits = zeros(numSymbols * 2, 1);
            
            for i = 1:numSymbols
                symbol = receivedSignal(i);
                % Detect I and Q components
                bit1 = real(symbol) > 0;
                bit2 = imag(symbol) > 0;
                bits(2*i-1) = bit1;
                bits(2*i) = bit2;
            end
            demodulatedData = bits;
            
        case '8QAM'
            % 8-QAM demodulation
            numSymbols = length(receivedSignal);
            bits = zeros(numSymbols * 3, 1);
            
            % Constellation for reference
            constellation = [
                -3-1i, -1-1i, 1-1i, 3-1i, ...
                -3+1i, -1+1i, 1+1i, 3+1i
            ] / sqrt(10);
            
            for i = 1:numSymbols
                symbol = receivedSignal(i);
                % Find nearest constellation point
                [~, idx] = min(abs(constellation - symbol));
                % Convert to bits
                bitVector = de2bi(idx-1, 3, 'left-msb');
                bits(3*i-2:3*i) = bitVector';
            end
            demodulatedData = bits;
            
        case '16QAM'
            % 16-QAM demodulation
            numSymbols = length(receivedSignal);
            bits = zeros(numSymbols * 4, 1);
            
            for i = 1:numSymbols
                symbol = receivedSignal(i);
                I = real(symbol) * sqrt(10);
                Q = imag(symbol) * sqrt(10);
                
                % Detect bits
                bit1 = I > 0;
                bit2 = Q > 0;
                bit3 = abs(I) > 2;
                bit4 = abs(Q) > 2;
                
                bits(4*i-3:4*i) = [bit1; bit2; bit3; bit4];
            end
            demodulatedData = bits;
            
        case '64QAM'
            % 64-QAM demodulation
            numSymbols = length(receivedSignal);
            bits = zeros(numSymbols * 6, 1);
            
            for i = 1:numSymbols
                symbol = receivedSignal(i);
                I = real(symbol) * sqrt(42);
                Q = imag(symbol) * sqrt(42);
                
                % Quantize to nearest level
                I_level = round((I + 7) / 2);
                Q_level = round((Q + 7) / 2);
                
                % Clamp to valid range
                I_level = max(0, min(7, I_level));
                Q_level = max(0, min(7, Q_level));
                
                % Convert to bits
                I_bits = de2bi(I_level, 3, 'left-msb');
                Q_bits = de2bi(Q_level, 3, 'left-msb');
                
                bits(6*i-5:6*i) = [I_bits'; Q_bits'];
            end
            demodulatedData = bits;
            
        otherwise
            error('Unknown modulation scheme: %s', config.modulation);
    end
end

