function codedData = channelEncode(inputData, config)
    % Apply channel coding (error control coding)
    % Input: inputData - binary vector
    %        config - configuration with channelCoding and codeRate fields
    % Output: coded data with redundancy
    
    switch config.channelCoding
        case 'Hamming'
            % Hamming(7,4) code as example
            % Pad data if necessary
            numBits = length(inputData);
            numPaddedBits = ceil(numBits/4) * 4;
            paddedData = [inputData; zeros(numPaddedBits - numBits, 1)];
            
            % Reshape into 4-bit blocks
            dataMatrix = reshape(paddedData, 4, [])';
            
            % Simple Hamming encoding (add 3 parity bits per 4 data bits)
            numBlocks = size(dataMatrix, 1);
            codedMatrix = zeros(numBlocks, 7);
            
            for i = 1:numBlocks
                d = dataMatrix(i, :);
                % Hamming(7,4) parity bits
                p1 = mod(d(1) + d(2) + d(4), 2);
                p2 = mod(d(1) + d(3) + d(4), 2);
                p3 = mod(d(2) + d(3) + d(4), 2);
                codedMatrix(i, :) = [p1, p2, d(1), p3, d(2), d(3), d(4)];
            end
            
            codedData = reshape(codedMatrix', [], 1);
            
        case 'Convolutional'
            % Convolutional code (rate 1/2, constraint length 3)
            trellis = poly2trellis(3, [7 5]);
            codedData = convenc(inputData, trellis);
            
        case 'Turbo'
            % Simplified Turbo code placeholder
            % Using convolutional code as approximation
            trellis = poly2trellis(3, [7 5]);
            codedData = convenc(inputData, trellis);
            
        case 'LDPC'
            % LDPC code placeholder
            % For simplicity, using repetition code
            repFactor = round(1/config.codeRate);
            codedData = repelem(inputData, repFactor);
            
        case 'none'
            codedData = inputData;
            
        otherwise
            warning('Unknown channel coding: %s. Using original data.', config.channelCoding);
            codedData = inputData;
    end
end

