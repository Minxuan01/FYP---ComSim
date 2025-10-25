function modulatedSignal = modulate(codedData, config)
    % Modulate binary data into complex symbols
    % Input: codedData - binary vector
    %        config - configuration with modulation field
    % Output: complex modulated signal
    
    switch config.modulation
        case 'BPSK'
            % BPSK: 0 -> -1, 1 -> 1
            modulatedSignal = 2*codedData - 1;
            
        case 'QPSK'
            % QPSK: 2 bits per symbol
            % Pad if odd length
            if mod(length(codedData), 2) ~= 0
                codedData = [codedData; 0];
            end
            
            % Reshape into pairs
            bitPairs = reshape(codedData, 2, [])';
            
            % Map to constellation
            % 00 -> -1-1i, 01 -> -1+1i, 10 -> 1-1i, 11 -> 1+1i
            symbols = zeros(size(bitPairs, 1), 1);
            for i = 1:size(bitPairs, 1)
                real_part = 2*bitPairs(i, 1) - 1;
                imag_part = 2*bitPairs(i, 2) - 1;
                symbols(i) = (real_part + 1i*imag_part) / sqrt(2);
            end
            modulatedSignal = symbols;
            
        case '8QAM'
            % 8-QAM: 3 bits per symbol
            numBits = length(codedData);
            numPadBits = mod(3 - mod(numBits, 3), 3);
            paddedData = [codedData; zeros(numPadBits, 1)];
            
            bitGroups = reshape(paddedData, 3, [])';
            numSymbols = size(bitGroups, 1);
            symbols = zeros(numSymbols, 1);
            
            % Simple 8-QAM constellation
            constellation = [
                -3-1i, -1-1i, 1-1i, 3-1i, ...
                -3+1i, -1+1i, 1+1i, 3+1i
            ] / sqrt(10);
            
            for i = 1:numSymbols
                idx = bi2de(bitGroups(i, :)', 'left-msb') + 1;
                symbols(i) = constellation(idx);
            end
            modulatedSignal = symbols;
            
        case '16QAM'
            % 16-QAM: 4 bits per symbol
            numBits = length(codedData);
            numPadBits = mod(4 - mod(numBits, 4), 4);
            paddedData = [codedData; zeros(numPadBits, 1)];
            
            bitGroups = reshape(paddedData, 4, [])';
            numSymbols = size(bitGroups, 1);
            symbols = zeros(numSymbols, 1);
            
            % 16-QAM constellation (square)
            for i = 1:numSymbols
                bits = bitGroups(i, :);
                I = 2*bits(1) - 1;
                Q = 2*bits(2) - 1;
                I_level = I * (2*bits(3) + 1);
                Q_level = Q * (2*bits(4) + 1);
                symbols(i) = (I_level + 1i*Q_level) / sqrt(10);
            end
            modulatedSignal = symbols;
            
        case '64QAM'
            % 64-QAM: 6 bits per symbol
            numBits = length(codedData);
            numPadBits = mod(6 - mod(numBits, 6), 6);
            paddedData = [codedData; zeros(numPadBits, 1)];
            
            bitGroups = reshape(paddedData, 6, [])';
            numSymbols = size(bitGroups, 1);
            symbols = zeros(numSymbols, 1);
            
            % 64-QAM constellation
            for i = 1:numSymbols
                bits = bitGroups(i, :);
                % I channel: first 3 bits
                I = bi2de(bits(1:3)', 'left-msb') * 2 - 7;
                % Q channel: last 3 bits
                Q = bi2de(bits(4:6)', 'left-msb') * 2 - 7;
                symbols(i) = (I + 1i*Q) / sqrt(42);
            end
            modulatedSignal = symbols;
            
        otherwise
            error('Unknown modulation scheme: %s', config.modulation);
    end
end

