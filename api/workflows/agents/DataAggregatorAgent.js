/**
 * DataAggregatorAgent - Aggregates data from multiple sources
 *
 * Collects and combines data from various agents in the workflow,
 * performing basic validation and normalization.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ErrorHandler for standardized errors
 * - Safe expression evaluation (no eval/Function constructor)
 */

const BaseAgent = require('./BaseAgent');
const { logger } = require('../../core/Logger');
const { ValidationError } = require('../../core/ErrorHandler');

class DataAggregatorAgent extends BaseAgent {
  constructor(config = {}) {
    super(config);
    this.sources = config.sources || [];
    this.outputFormat = config.outputFormat || 'combined';
    this.formulas = config.formulas || {};
  }

  /**
   * Get agent capabilities
   * @returns {string[]} Array of capability descriptions
   */
  getCapabilities() {
    return [
      'Data aggregation from multiple sources',
      'Input validation and normalization',
      'Duplicate detection and merging',
      'Confidence score calculation'
    ];
  }

  /**
   * Evaluate formula with given variables (SAFE - no eval)
   * @param {string} formula - Formula expression
   * @param {Object} variables - Variable values
   * @returns {any} Formula result
   */
  evaluateFormula(formula, variables) {
    try {
      // Safe formula evaluation without eval or Function constructor
      // Supports basic arithmetic and comparison operations only
      
      let expression = formula.trim();
      
      // Replace variable references with actual values
      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`\\b${key}\\b`, 'g');
        
        // Sanitize value to prevent injection
        let sanitizedValue;
        if (typeof value === 'number') {
          sanitizedValue = String(value);
        } else if (typeof value === 'boolean') {
          sanitizedValue = String(value);
        } else if (typeof value === 'string') {
          // Escape and quote strings
          sanitizedValue = `"${value.replace(/"/g, '\\"')}"`;
        } else {
          sanitizedValue = 'null';
        }
        
        expression = expression.replace(regex, sanitizedValue);
      }
      
      // Use safe expression evaluator (only basic math operations)
      const result = this.safeEvaluate(expression);
      
      logger.debug('Formula evaluated', {
        formula,
        result,
        variableCount: Object.keys(variables).length
      });
      
      return result;
    } catch (error) {
      logger.error('Formula evaluation error', {
        formula,
        error: error.message,
        variables: Object.keys(variables)
      });
      return null;
    }
  }
  
  /**
   * Safe expression evaluator (no eval, no Function constructor)
   * Supports only basic arithmetic operations
   * @param {string} expression - Mathematical expression
   * @returns {number} Result
   */
  safeEvaluate(expression) {
    // Remove all whitespace
    expression = expression.replace(/\s/g, '');
    
    // Only allow numbers, operators, parentheses, and dots
    if (!/^[\d+\-*/.()]+$/.test(expression)) {
      throw new ValidationError('Formula contains invalid characters. Only numbers and basic operators allowed.');
    }
    
    // Check for balanced parentheses
    let depth = 0;
    for (const char of expression) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        throw new ValidationError('Unbalanced parentheses in formula');
      }
    }
    if (depth !== 0) {
      throw new ValidationError('Unbalanced parentheses in formula');
    }
    
    // Evaluate using safe recursive parser
    try {
      return this.parseExpression(expression);
    } catch (error) {
      throw new ValidationError(`Formula evaluation failed: ${error.message}`);
    }
  }
  
  /**
   * Parse and evaluate expression safely
   * @param {string} expr - Expression to parse
   * @returns {number} Result
   */
  parseExpression(expr) {
    // Handle parentheses
    while (expr.includes('(')) {
      const start = expr.lastIndexOf('(');
      const end = expr.indexOf(')', start);
      if (end === -1) throw new Error('Mismatched parentheses');
      
      const inner = expr.substring(start + 1, end);
      const result = this.parseExpression(inner);
      expr = expr.substring(0, start) + result + expr.substring(end + 1);
    }
    
    // Handle operators in order of precedence
    // Multiplication and division first
    expr = this.evaluateOperators(expr, ['*', '/']);
    // Addition and subtraction
    expr = this.evaluateOperators(expr, ['+', '-']);
    
    return parseFloat(expr);
  }
  
  /**
   * Evaluate operators in expression
   * @param {string} expr - Expression
   * @param {string[]} operators - Operators to evaluate
   * @returns {string} Result as string
   */
  evaluateOperators(expr, operators) {
    for (const op of operators) {
      const parts = expr.split(op);
      if (parts.length > 1) {
        let result = parseFloat(parts[0]);
        for (let i = 1; i < parts.length; i++) {
          const value = parseFloat(parts[i]);
          if (op === '+') result += value;
          else if (op === '-') result -= value;
          else if (op === '*') result *= value;
          else if (op === '/') result /= value;
        }
        return String(result);
      }
    }
    return expr;
  }

  /**
   * Execute data aggregation logic
   * @param {Object} inputs - Input data from various sources
   * @returns {Promise<Object>} Aggregated data
   */
  async execute(inputs) {
const aggregated = {
      sources: [],
      combinedData: {},
      metadata: {
        aggregationTime: new Date().toISOString(),
        sourceCount: Object.keys(inputs).length,
        totalRecords: 0
      }
    };

    // Process each input source
    for (const [sourceName, sourceData] of Object.entries(inputs)) {
      const processedSource = await this.processSource(sourceName, sourceData);
      aggregated.sources.push(processedSource);

      // Merge data based on output format
      if (this.outputFormat === 'flat') {
        Object.assign(aggregated.combinedData, processedSource.data);
      } else {
        aggregated.combinedData[sourceName] = processedSource.data;
      }

      aggregated.metadata.totalRecords += processedSource.recordCount || 1;
    }

    // Perform cross-source validation
    const validationResult = this.validateAggregatedData(aggregated);

    // Evaluate formulas if configured
    const formulaResults = {};
    if (Object.keys(this.formulas).length > 0) {
for (const [formulaName, formula] of Object.entries(this.formulas)) {
        try {
          const result = this.evaluateFormula(formula, aggregated.combinedData);
          formulaResults[formulaName] = result;
        } catch (error) {
          logger.error('Formula evaluation failed', {
            formulaName,
            error: error.message,
            agentId: this.id
          });
          formulaResults[formulaName] = null;
        }
      }
    }

    return {
      ...aggregated,
      validation: validationResult,
      formulaResults: formulaResults
    };
  }

  /**
   * Process individual data source
   * @param {string} sourceName - Name of the data source
   * @param {*} sourceData - Data from the source
   * @returns {Promise<Object>} Processed source data
   */
  async processSource(sourceName, sourceData) {
const processed = {
      name: sourceName,
      timestamp: new Date().toISOString(),
      data: sourceData,
      recordCount: this.countRecords(sourceData),
      dataType: this.detectDataType(sourceData),
      quality: this.assessDataQuality(sourceData)
    };

    // Normalize data format if needed
    processed.data = this.normalizeData(processed.data, processed.dataType);

    return processed;
  }

  /**
   * Count records in data
   * @param {*} data - Data to count
   * @returns {number} Record count
   */
  countRecords(data) {
    if (Array.isArray(data)) {
      return data.length;
    }
    if (typeof data === 'object' && data !== null) {
      return Object.keys(data).length;
    }
    return 1;
  }

  /**
   * Detect data type
   * @param {*} data - Data to analyze
   * @returns {string} Detected data type
   */
  detectDataType(data) {
    if (Array.isArray(data)) return 'array';
    if (typeof data === 'string') return 'string';
    if (typeof data === 'number') return 'number';
    if (typeof data === 'boolean') return 'boolean';
    if (data === null) return 'null';
    if (typeof data === 'object') {
      // Check for specific object types
      if (data.transcript) return 'transcript';
      if (data.ocr_text) return 'ocr_result';
      if (data.measurements) return 'inspection_data';
      return 'object';
    }
    return 'unknown';
  }

  /**
   * Assess data quality
   * @param {*} data - Data to assess
   * @returns {Object} Quality assessment
   */
  assessDataQuality(data) {
    const quality = {
      completeness: 0,
      accuracy: 0,
      consistency: 0,
      overall: 0
    };

    try {
      // Assess completeness
      quality.completeness = this.assessCompleteness(data);

      // Assess accuracy (basic checks)
      quality.accuracy = this.assessAccuracy(data);

      // Assess consistency
      quality.consistency = this.assessConsistency(data);

      // Calculate overall quality
      quality.overall = (quality.completeness + quality.accuracy + quality.consistency) / 3;

    } catch (error) {
      logger.warn('Error assessing data quality', {
        error: error.message,
        agentId: this.id
      });
      quality.overall = 0.5; // Default moderate quality
    }

    return quality;
  }

  /**
   * Assess data completeness
   * @param {*} data - Data to assess
   * @returns {number} Completeness score (0-1)
   */
  assessCompleteness(data) {
    if (!data) return 0;

    if (typeof data === 'object') {
      const keys = Object.keys(data);
      const nonNullValues = keys.filter(key => data[key] !== null && data[key] !== undefined);
      return nonNullValues.length / keys.length;
    }

    return data ? 1 : 0;
  }

  /**
   * Assess data accuracy
   * @param {*} data - Data to assess
   * @returns {number} Accuracy score (0-1)
   */
  assessAccuracy(data) {
    // Basic accuracy checks
    if (typeof data === 'object' && data.confidence !== undefined) {
      return Math.min(1, Math.max(0, data.confidence));
    }

    // Default to high confidence if no explicit confidence score
    return 0.8;
  }

  /**
   * Assess data consistency
   * @param {*} data - Data to assess
   * @returns {number} Consistency score (0-1)
   */
  assessConsistency(data) {
    if (typeof data !== 'object') return 1;

    // Check for conflicting or inconsistent data
    // This is a simplified implementation
    let consistent = true;

    // Basic consistency checks
    if (data.start_date && data.end_date) {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      if (start > end) consistent = false;
    }

    return consistent ? 1 : 0;
  }

  /**
   * Normalize data format
   * @param {*} data - Data to normalize
   * @param {string} dataType - Detected data type
   * @returns {*} Normalized data
   */
  normalizeData(data, dataType) {
    switch (dataType) {
      case 'transcript':
        return this.normalizeTranscript(data);
      case 'ocr_result':
        return this.normalizeOCRResult(data);
      case 'inspection_data':
        return this.normalizeInspectionData(data);
      default:
        return data;
    }
  }

  /**
   * Normalize transcript data
   * @param {Object} data - Transcript data
   * @returns {Object} Normalized transcript
   */
  normalizeTranscript(data) {
    return {
      text: data.transcript || data.text || '',
      confidence: data.confidence || 0.8,
      language: data.language || 'en',
      duration: data.duration || null,
      extracted_entities: data.extracted || []
    };
  }

  /**
   * Normalize OCR result data
   * @param {Object} data - OCR data
   * @returns {Object} Normalized OCR result
   */
  normalizeOCRResult(data) {
    return {
      text: data.ocr_text || data.text || '',
      confidence: data.confidence || 0.7,
      bounding_boxes: data.boxes || [],
      extracted_fields: data.extracted || {}
    };
  }

  /**
   * Normalize inspection data
   * @param {Object} data - Inspection data
   * @returns {Object} Normalized inspection data
   */
  normalizeInspectionData(data) {
    return {
      measurements: data.measurements || [],
      observations: data.observations || [],
      standards: data.standards || [],
      timestamp: data.timestamp || new Date().toISOString()
    };
  }

  /**
   * Validate aggregated data
   * @param {Object} aggregated - Aggregated data to validate
   * @returns {Object} Validation results
   */
  validateAggregatedData(aggregated) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {}
    };

    try {
      // Check for required sources
      if (this.config.requiredSources) {
        const missingSources = this.config.requiredSources.filter(
          source => !aggregated.sources.find(s => s.name === source)
        );
        if (missingSources.length > 0) {
          validation.errors.push(`Missing required sources: ${missingSources.join(', ')}`);
          validation.isValid = false;
        }
      }

      // Check data consistency across sources
      const consistencyIssues = this.checkCrossSourceConsistency(aggregated.sources);
      validation.warnings.push(...consistencyIssues);

      // Calculate summary statistics
      validation.summary = {
        totalSources: aggregated.sources.length,
        averageQuality: aggregated.sources.reduce((sum, s) => sum + s.quality.overall, 0) / aggregated.sources.length,
        dataTypes: [...new Set(aggregated.sources.map(s => s.dataType))]
      };

    } catch (error) {
      validation.errors.push(`Validation error: ${error.message}`);
      validation.isValid = false;
    }

    return validation;
  }

  /**
   * Check consistency across multiple sources
   * @param {Array} sources - Array of source data
   * @returns {string[]} Array of consistency warnings
   */
  checkCrossSourceConsistency(sources) {
    const warnings = [];

    // Check for conflicting timestamps
    const timestamps = sources
      .map(s => s.data.timestamp)
      .filter(t => t)
      .map(t => new Date(t));

    if (timestamps.length > 1) {
      const timeDiff = Math.max(...timestamps) - Math.min(...timestamps);
      if (timeDiff > 3600000) { // 1 hour in milliseconds
        warnings.push('Large time difference between data sources');
      }
    }

    // Check for duplicate data
    const dataHashes = sources.map(s => this.hashData(s.data));
    const uniqueHashes = new Set(dataHashes);
    if (uniqueHashes.size < sources.length) {
      warnings.push('Potential duplicate data detected across sources');
    }

    return warnings;
  }

  /**
   * Generate simple hash of data for duplicate detection
   * @param {*} data - Data to hash
   * @returns {string} Simple hash string
   */
  hashData(data) {
    // Simple hash for duplicate detection
    return JSON.stringify(data).length.toString();
  }

  /**
   * Calculate confidence for aggregated results
   * @param {Object} result - Aggregation results
   * @param {Object} inputs - Original inputs
   * @returns {number} Confidence score
   */
  calculateConfidence(result, inputs) {
    if (result.validation && !result.validation.isValid) {
      return 0.3; // Low confidence if validation failed
    }

    // Average quality score across all sources
    const avgQuality = result.metadata.totalRecords > 0
      ? result.sources.reduce((sum, s) => sum + s.quality.overall, 0) / result.sources.length
      : 0.5;

    // Factor in source count
    const sourceFactor = Math.min(1, result.sources.length / 3); // Optimal with 3+ sources

    return (avgQuality + sourceFactor) / 2;
  }
}

module.exports = DataAggregatorAgent;
