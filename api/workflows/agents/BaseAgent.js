/**
 * BaseAgent - Abstract base class for all workflow agents
 *
 * Provides common functionality, error handling, and lifecycle management
 * for all agent types in the workflow system.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ErrorHandler for standardized errors
 * - Uses Metrics for performance tracking
 * - Uses AuditTrail for execution logging
 */

const { logger } = require('../../core/Logger');
const { ValidationError, AppError } = require('../../core/ErrorHandler');
const { AuditTrail } = require('../../core/AuditTrail');

class BaseAgent {
  constructor(config = {}) {
    this.config = config;
    this.id = config.id || this.constructor.name;
    this.initialized = false;
  }

  /**
   * LangGraph Runnable interface - makes agent compatible with StateGraph
   * @param {Object} inputs - Input data
   * @param {Object} config - Optional configuration
   * @returns {Object} Processing results
   */
  async invoke(inputs, config = {}) {
    const startTime = Date.now();
    
    try {
      // Ensure agent is initialized
      await this.initialize();

      // Process the input data
      const result = await this.process(inputs);
      
      // Log successful execution
      const duration = Date.now() - startTime;
      logger.info('Agent executed successfully', {
        agentId: this.id,
        agentType: this.constructor.name,
        duration,
        confidence: result.confidence
      });
      
      // Audit trail
      await AuditTrail.logCreate('agent_execution', {
        agentId: this.id,
        agentType: this.constructor.name,
        duration,
        success: true,
        inputKeys: Object.keys(inputs)
      }, {
        userId: config.userId || 'system',
        tenantId: config.tenantId || 'system'
      });
      
      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Agent execution failed', {
        agentId: this.id,
        agentType: this.constructor.name,
        error: error.message,
        duration
      });
      
      // Audit trail for failure
      await AuditTrail.logCreate('agent_execution_failed', {
        agentId: this.id,
        agentType: this.constructor.name,
        error: error.message,
        duration
      }, {
        userId: config.userId || 'system',
        tenantId: config.tenantId || 'system'
      });
      
      throw error;
    }
  }

  /**
   * Make agent callable as a function (LangGraph compatibility)
   * @param {Object} inputs - Input data
   * @returns {Object} Processing results
   */
  async call(inputs) {
    return this.invoke(inputs);
  }

  /**
   * Get agent as a RunnableLike object for LangGraph
   * @returns {Function} Runnable function
   */
  getRunnable() {
    return async (inputs) => {
      return this.invoke(inputs);
    };
  }

  /**
   * Initialize agent (called once before first use)
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) return;
await this.onInitialize();
    this.initialized = true;
  }

  /**
   * Process input data and return results
   * @param {Object} inputs - Input data for processing
   * @returns {Promise<Object>} Processing results
   */
  async process(inputs) {
    const startTime = Date.now();
    
    try {
      // Ensure agent is initialized
      await this.initialize();

      // Validate inputs
      this.validateInputs(inputs);

      logger.debug('Processing inputs', {
        agentId: this.id,
        inputKeys: Object.keys(inputs)
      });

      // Execute main processing logic
      const rawResult = await this.execute(inputs);

      // Format output
      const formattedResult = this.formatOutput(rawResult);

      // Add metadata
      const processingTime = Date.now() - startTime;
      const result = {
        ...formattedResult,
        agentId: this.id,
        timestamp: new Date().toISOString(),
        confidence: this.calculateConfidence(rawResult, inputs),
        processingTime
      };
      
      return result;

    } catch (error) {
      logger.error('Agent processing failed', {
        agentId: this.id,
        error: error.message,
        stack: error.stack,
        inputKeys: Object.keys(inputs)
      });
      
      await this.handleError(error, inputs);
      throw error;
    }
  }

  /**
   * Validate input data
   * @param {Object} inputs - Input data to validate
   * @throws {ValidationError} If validation fails
   */
  validateInputs(inputs) {
    // Override in subclasses for specific validation
    if (this.config.requiredInputs) {
      const missing = this.config.requiredInputs.filter(key => !(key in inputs));
      if (missing.length > 0) {
        throw new ValidationError(`Missing required inputs: ${missing.join(', ')}`, {
          agentId: this.id,
          missing,
          provided: Object.keys(inputs)
        });
      }
    }
  }

  /**
   * Execute main processing logic (must be implemented by subclasses)
   * @param {Object} inputs - Input data
   * @returns {Promise<Object>} Raw processing results
   */
  async execute(inputs) {
    throw new Error(`${this.constructor.name} must implement execute() method`);
  }

  /**
   * Format raw results into standardized output
   * @param {Object} rawResult - Raw processing results
   * @returns {Object} Formatted output
   */
  formatOutput(rawResult) {
    // Default implementation - return as-is
    return rawResult;
  }

  /**
   * Calculate confidence score for results
   * @param {Object} result - Processing results
   * @param {Object} inputs - Original inputs
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(result, inputs) {
    // Default implementation - override in subclasses
    return result.confidence || 0.8;
  }

  /**
   * Handle processing errors
   * @param {Error} error - Error that occurred
   * @param {Object} inputs - Original inputs
   * @returns {Promise<void>}
   */
  async handleError(error, inputs) {
    // Structured error logging
    logger.error('Agent error handler invoked', {
      agentId: this.id,
      agentType: this.constructor.name,
      errorType: error.constructor.name,
      error: error.message,
      inputKeys: Object.keys(inputs),
      config: this.config
    });

    // Could implement retry logic, fallback processing, etc.
    // For now, just log and allow error to propagate
  }

  /**
   * Cleanup agent resources
   * @returns {Promise<void>}
   */
  async cleanup() {
this.initialized = false;
  }

  /**
   * Get agent metadata
   * @returns {Object} Agent metadata
   */
  getMetadata() {
    return {
      id: this.id,
      type: this.constructor.name,
      config: this.config,
      capabilities: this.getCapabilities(),
      version: this.getVersion()
    };
  }

  /**
   * Get agent capabilities
   * @returns {string[]} Array of capability descriptions
   */
  getCapabilities() {
    // Override in subclasses
    return ['Basic processing'];
  }

  /**
   * Get agent version
   * @returns {string} Version string
   */
  getVersion() {
    // Override in subclasses
    return '1.0.0';
  }

  /**
   * Hook for subclass initialization
   * @returns {Promise<void>}
   */
  async onInitialize() {
    // Override in subclasses for custom initialization
  }
}

module.exports = BaseAgent;
