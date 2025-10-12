/**
 * Structured Logger
 * 
 * Centralized logging system with:
 * - Contextual logging (tenant, user, request ID)
 * - Log levels (debug, info, warn, error)
 * - Structured output (JSON for production)
 * - Performance tracking
 * - Error tracking
 * 
 * Design Patterns:
 * - Singleton Pattern
 * - Decorator Pattern (adds context to logs)
 * - Strategy Pattern (different outputs for dev/prod)
 */

const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

class Logger {
  constructor() {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += `\n${JSON.stringify(meta, null, 2)}`;
        }
        return msg;
      })
    );
    
    // JSON format for production
    const jsonFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );
    
    // Create Winston logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
      format: isDevelopment ? consoleFormat : jsonFormat,
      transports: [
        new winston.transports.Console(),
        // Add file transports for production
        ...(isDevelopment ? [] : [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' })
        ])
      ]
    });
  }
  
  /**
   * Create child logger with context
   * 
   * @param {Object} context - Context to add to all logs
   * @returns {ContextLogger}
   */
  child(context) {
    return new ContextLogger(this, context);
  }
  
  /**
   * Log debug message
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }
  
  /**
   * Log info message
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }
  
  /**
   * Log warning
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }
  
  /**
   * Log error
   */
  error(message, error = null, meta = {}) {
    const errorMeta = {
      ...meta,
      ...(error ? {
        errorMessage: error.message,
        errorStack: error.stack,
        errorCode: error.code
      } : {})
    };
    this.logger.error(message, errorMeta);
  }
  
  /**
   * Log performance metric
   */
  performance(operation, durationMs, meta = {}) {
    this.logger.info('Performance', {
      operation,
      durationMs,
      ...meta
    });
  }
}

/**
 * Context Logger
 * 
 * Adds contextual information to all logs
 */
class ContextLogger {
  constructor(parentLogger, context) {
    this.parentLogger = parentLogger;
    this.context = context;
  }
  
  _addContext(meta) {
    return { ...this.context, ...meta };
  }
  
  debug(message, meta = {}) {
    this.parentLogger.debug(message, this._addContext(meta));
  }
  
  info(message, meta = {}) {
    this.parentLogger.info(message, this._addContext(meta));
  }
  
  warn(message, meta = {}) {
    this.parentLogger.warn(message, this._addContext(meta));
  }
  
  error(message, error = null, meta = {}) {
    this.parentLogger.error(message, error, this._addContext(meta));
  }
  
  performance(operation, durationMs, meta = {}) {
    this.parentLogger.performance(operation, durationMs, this._addContext(meta));
  }
  
  /**
   * Create nested child logger with additional context
   */
  child(additionalContext) {
    return new ContextLogger(this.parentLogger, {
      ...this.context,
      ...additionalContext
    });
  }
}

// Singleton instance
const logger = new Logger();

/**
 * Create logger with request context
 * 
 * @param {Object} request - Fastify request object
 * @param {TenantContext} tenantContext - Tenant context
 * @returns {ContextLogger}
 */
function createRequestLogger(request, tenantContext) {
  const requestId = request.id || uuidv4();
  
  return logger.child({
    requestId,
    method: request.method,
    url: request.url,
    userId: tenantContext?.userId,
    tenantId: tenantContext?.tenantId,
    isPlatformAdmin: tenantContext?.isPlatformAdmin,
    timestamp: new Date().toISOString()
  });
}

/**
 * Performance tracking wrapper
 * 
 * @param {Function} fn - Function to track
 * @param {string} operationName - Operation name for logging
 * @param {ContextLogger} logger - Logger instance
 * @returns {Function}
 */
function withPerformanceTracking(fn, operationName, logger) {
  return async function(...args) {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const duration = Date.now() - startTime;
      
      if (duration > 1000) { // Log slow operations
        logger.warn(`Slow operation: ${operationName}`, { durationMs: duration });
      } else {
        logger.performance(operationName, duration);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`Operation failed: ${operationName}`, error, { durationMs: duration });
      throw error;
    }
  };
}

module.exports = {
  logger,
  Logger,
  ContextLogger,
  createRequestLogger,
  withPerformanceTracking
};

