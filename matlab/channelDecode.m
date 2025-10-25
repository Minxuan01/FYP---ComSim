function decodedData = channelDecode(demodulatedData, config)
    % Decode channel-coded data
    % Input: demodulatedData - received binary data
    %        config - configuration with channelCoding
    % Output: decoded data
    
    switch config.channelCoding
        case 'Hamming'
            % Hamming(7,4) decoder
            % Reshape into 7-bit blocks
            numBits = length(demodulatedData);
            numBlocks = floor(numBits / 7);
            
            if numBlocks == 0
                decodedData = demodulatedData;
                return;
            end
            
            codedMatrix = reshape(demodulatedData(1:numBlocks*7), 7, [])';
            decodedMatrix = zeros(numBlocks, 4);
            
            for i = 1:numBlocks
                r = codedMatrix(i, :);
                
                % Calculate syndrome
                s1 = mod(r(1) + r(3) + r(5) + r(7), 2);
                s2 = mod(r(2) + r(3) + r(6) + r(7), 2);
                s3 = mod(r(4) + r(5) + r(6) + r(7), 2);
                
                % Syndrome to error position
                syndrome = s1 + 2*s2 + 4*s3;
                
                % Correct single-bit error
                if syndrome ~= 0
                    r(syndrome) = mod(r(syndrome) + 1, 2);
                end
                
                % Extract data bits
                decodedMatrix(i, :) = [r(3), r(5), r(6), r(7)];
            end
            
            decodedData = reshape(decodedMatrix', [], 1);
            
        case 'Convolutional'
            % Viterbi decoding
            trellis = poly2trellis(3, [7 5]);
            decodedData = vitdec(demodulatedData, trellis, 5*3, 'trunc', 'hard');
            
        case 'Turbo'
            % Simplified Turbo decoding (using Viterbi as approximation)
            trellis = poly2trellis(3, [7 5]);
            decodedData = vitdec(demodulatedData, trellis, 5*3, 'trunc', 'hard');
            
        case 'LDPC'
            % LDPC decoding (majority voting for repetition code)
            if isfield(config, 'codeRate')
                repFactor = round(1/config.codeRate);
            else
                repFactor = 2;
            end
            
            numOriginalBits = floor(length(demodulatedData) / repFactor);
            decodedData = zeros(numOriginalBits, 1);
            
            for i = 1:numOriginalBits
                % Majority vote
                startIdx = (i-1)*repFactor + 1;
                endIdx = min(i*repFactor, length(demodulatedData));
                decodedData(i) = sum(demodulatedData(startIdx:endIdx)) > (repFactor/2);
            end
            
        case 'none'
            decodedData = demodulatedData;
            
        otherwise
            warning('Unknown channel coding: %s. Using received data.', config.channelCoding);
            decodedData = demodulatedData;
    end
end

