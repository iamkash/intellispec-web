/**
 * WorkflowRouter - Creates dynamic routing and connections between workflow agents
 *
 * Handles conditional routing, data mapping, and state transitions between workflow nodes.
 * 
 * Note: Previously named ConnectionBuilder.js - renamed for clarity (not about database connections)
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ErrorHandler for standardized errors
 * - Safe expression evaluation (no eval)
 */

const { logger } = require('../../core/Logger');
const { ValidationError } = require('../../core/ErrorHandler');

class WorkflowRouter {
  constructor() {
    this.conditionCache = new Map();
  }

  /**
   * Create condition function from string expression
   * @param {string} conditionExpression - Condition expression
   * @returns {Function} Condition evaluation function
   */
  createConditionFunction(conditionExpression) {
    // Cache compiled conditions for performance
    if (this.conditionCache.has(conditionExpression)) {
      return this.conditionCache.get(conditionExpression);
    }

    const conditionFunction = this.compileCondition(conditionExpression);
    this.conditionCache.set(conditionExpression, conditionFunction);

    logger.debug('Condition function compiled and cached', {
      expression: conditionExpression
    });

    return conditionFunction;
  }

  /**
   * Compile condition expression into executable function
   * @param {string} expression - Condition expression
   * @returns {Function} Compiled condition function
   */
  compileCondition(expression) {
    // Parse simple conditions like "confidence > 0.7"
    const conditionFunction = (state) => {
      try {
        // Simple property access like "agent.confidence > 0.7"
        if (expression.includes('>') || expression.includes('<') || expression.includes('==') || expression.includes('!=')) {
          return this.evaluateComparison(expression, state);
        }

        // Boolean property check like "hasErrors"
        if (expression in state) {
          return Boolean(state[expression]);
        }

        // Default to true if condition can't be parsed
        logger.warn('Could not parse condition, defaulting to true', {
          expression,
          stateKeys: Object.keys(state)
        });
        return true;

      } catch (error) {
        logger.error('Error evaluating condition', {
          expression,
          error: error.message,
          stateKeys: Object.keys(state)
        });
        return false;
      }
    };

    return conditionFunction;
  }

  /**
   * Evaluate comparison expressions
   * @param {string} expression - Comparison expression
   * @param {Object} state - Workflow state
   * @returns {boolean} Evaluation result
   */
  evaluateComparison(expression, state) {
    // Parse expressions like "confidence > 0.7" or "agent.result.status == 'success'"

    // Handle dot notation access
    const parseValue = (path, context) => {
      return path.split('.').reduce((obj, key) => obj?.[key], context);
    };

    // Simple comparison operators
    const operators = {
      '>': (a, b) => a > b,
      '<': (a, b) => a < b,
      '>=': (a, b) => a >= b,
      '<=': (a, b) => a <= b,
      '==': (a, b) => a == b,  // eslint-disable-line eqeqeq
      '===': (a, b) => a === b,
      '!=': (a, b) => a != b,  // eslint-disable-line eqeqeq
      '!==': (a, b) => a !== b
    };

    // Find operator in expression
    for (const [op, func] of Object.entries(operators)) {
      if (expression.includes(op)) {
        const [left, right] = expression.split(op).map(s => s.trim());

        let leftValue = parseValue(left, state);
        let rightValue = right;

        // Try to parse right side as number
        if (!isNaN(right)) {
          rightValue = parseFloat(right);
        }
        // Handle string literals
        else if (right.startsWith("'") && right.endsWith("'")) {
          rightValue = right.slice(1, -1);
        }
        // Handle boolean literals
        else if (right === 'true') {
          rightValue = true;
        }
        else if (right === 'false') {
          rightValue = false;
        }
        // Try to parse as property path
        else {
          rightValue = parseValue(right, state);
        }

        const result = func(leftValue, rightValue);
        
        logger.debug('Comparison evaluated', {
          expression,
          leftValue,
          rightValue,
          result
        });

        return result;
      }
    }

    throw new ValidationError(`Unsupported comparison in expression: ${expression}`, {
      expression,
      availableOperators: Object.keys(operators)
    });
  }

  /**
   * Create data mapping function
   * @param {Object} mapping - Data mapping configuration
   * @returns {Function} Data transformation function
   */
  createDataMapper(mapping) {
    return (sourceData, targetData = {}) => {
      const result = { ...targetData };

      if (mapping.source && mapping.target) {
        const sourceValue = this.getNestedValue(sourceData, mapping.source);
        this.setNestedValue(result, mapping.target, sourceValue);
        
        logger.debug('Data mapped', {
          source: mapping.source,
          target: mapping.target,
          valueType: typeof sourceValue
        });
      }

      return result;
    };
  }

  /**
   * Get nested value from object using dot notation
   * @param {Object} obj - Source object
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   */
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Set nested value in object using dot notation
   * @param {Object} obj - Target object
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);

    target[lastKey] = value;
  }

  /**
   * Clear condition cache
   */
  clearCache() {
    const cacheSize = this.conditionCache.size;
    this.conditionCache.clear();
    
    logger.info('Condition cache cleared', {
      cachedConditions: cacheSize
    });
  }
}

module.exports = WorkflowRouter;

