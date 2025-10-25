function ber = evaluatePerformance(originalData, decodedData)
    % Calculate Bit Error Rate (BER)
    % Input: originalData - transmitted binary data
    %        decodedData - received binary data
    % Output: BER - bit error rate
    
    % Ensure both vectors have the same length
    minLength = min(length(originalData), length(decodedData));
    
    if minLength == 0
        ber = 1.0;
        return;
    end
    
    % Truncate to same length
    original = originalData(1:minLength);
    decoded = decodedData(1:minLength);
    
    % Count bit errors
    numErrors = sum(original ~= decoded);
    
    % Calculate BER
    ber = numErrors / minLength;
    
    % Ensure minimum BER for numerical stability
    if ber == 0
        ber = 1e-7;
    end
end

