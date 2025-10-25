function sourceData = generateSource(config)
    % Generate random binary source data
    % Input: config structure with numBits field
    % Output: binary vector of random bits
    
    sourceData = randi([0 1], config.numBits, 1);
end

