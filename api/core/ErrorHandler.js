/**
 * Centralized Error Handling
 * 
 * Features:
 * - Standard error codes
 * - User-friendly messages
 * - Detailed logging
 * - Stack trace management
 * - Error recovery strategies
 * 
 * Design Patterns:
 * - Factory Pattern (error creation)
 * - Strategy Pattern (different handlers for different errors)
 * - Chain of Responsibility (error handling pipeline)
 */

const { logger } = require('./Logger');
const { AuditTrail } = require('./AuditTrail');

/**
 * Application Error Types
 */
class AppError extends Error {
  constructor(message, code, statusCode = 500, details = {}) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Operational vs programming errors
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      error: this.message,
      code: this.code,
      details: this.details
    };
  }
}

/**
 * Validation Error (400)
 */
class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

/**
 * Authentication Error (401)
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication required', details = {}) {
    super(message, 'AUTHENTICATION_ERROR', 401, details);
  }
}

/**
 * Authorization Error (403)
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied', details = {}) {
    super(message, 'AUTHORIZATION_ERROR', 403, details);
  }
}

/**
 * Not Found Error (404)
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource', id = null) {
    const message = id ? `${resource} ${id} not found` : `${resource} not found`;
    super(message, 'NOT_FOUND', 404, { resource, id });
  }
}

/**
 * Conflict Error (409)
 */
class ConflictError extends AppError {
  constructor(message, details = {}) {
    super(message, 'CONFLICT', 409, details);
  }
}

/**
 * Rate Limit Error (429)
 */
class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Too many requests', 'RATE_LIMIT_EXCEEDED', 429, { retryAfter });
  }
}

/**
 * Internal Server Error (500)
 */
class InternalServerError extends AppError {
  constructor(message = 'Internal server error', details = {}) {
    super(message, 'INTERNAL_SERVER_ERROR', 500, details);
  }
}

/**
 * Database Error (503)
 */
class DatabaseError extends AppError {
  constructor(message = 'Database error', details = {}) {
    super(message, 'DATABASE_ERROR', 503, details);
  }
}

/**
 * Error Handler
 */
class ErrorHandler {
  /**
   * Register error handling middleware
   * 
   * @param {FastifyInstance} fastify - Fastify instance
   */
  static registerMiddleware(fastify) {
    // Global error handler
    fastify.setErrorHandler(async (error, request, reply) => {
      const context = request.context;
      
      // Log error with context
      if (context) {
        context.logger.error('Error in request', error, {
          url: request.url,
          method: request.method,
          userId: context.userId,
          tenantId: context.tenantId
        });
      } else {
        logger.error('Error in request (no context)', error, {
          url: request.url,
          method: request.method
        });
      }
      
      // Determine error response
      const errorResponse = this.buildErrorResponse(error);
      
      // Log to audit trail if needed
      if (error instanceof AuthorizationError && context) {
        await AuditTrail.logPermissionDenied(
          context.tenantContext,
          error.details.resourceType || 'unknown',
          error.details.resourceId || 'unknown',
          error.details.action || 'access',
          context.getAuditMetadata()
        );
      }
      
      // Send error response
      return reply.status(errorResponse.statusCode).send(errorResponse.body);
    });
    
    // Handle not found (404)
    fastify.setNotFoundHandler(async (request, reply) => {
      const context = request.context;
      
      if (context) {
        context.logger.warn('Route not found', {
          url: request.url,
          method: request.method
        });
      }
      
      return reply.status(404).send({
        error: 'Route not found',
        code: 'NOT_FOUND',
        path: request.url
      });
    });
  }
  
  /**
   * Build error response
   * 
   * @param {Error} error - Error object
   * @returns {Object} Error response
   */
  static buildErrorResponse(error) {
    const isDevelopment = process.env.NODE_ENV !== 'production';
    
    // AppError (our custom errors)
    if (error instanceof AppError) {
      return {
        statusCode: error.statusCode,
        body: {
          error: error.message,
          code: error.code,
          details: error.details,
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // Mongoose validation error
    if (error.name === 'ValidationError' && error.errors) {
      const validationErrors = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      
      return {
        statusCode: 400,
        body: {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { fields: validationErrors },
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // Mongoose cast error (invalid ID)
    if (error.name === 'CastError') {
      return {
        statusCode: 400,
        body: {
          error: 'Invalid ID format',
          code: 'INVALID_ID',
          details: { path: error.path, value: error.value },
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0];
      return {
        statusCode: 409,
        body: {
          error: 'Duplicate entry',
          code: 'DUPLICATE_ENTRY',
          details: { field },
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return {
        statusCode: 401,
        body: {
          error: 'Invalid token',
          code: 'INVALID_TOKEN',
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    if (error.name === 'TokenExpiredError') {
      return {
        statusCode: 401,
        body: {
          error: 'Token expired',
          code: 'TOKEN_EXPIRED',
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // Fastify validation error
    if (error.validation) {
      return {
        statusCode: 400,
        body: {
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { validation: error.validation },
          ...(isDevelopment && { stack: error.stack })
        }
      };
    }
    
    // Generic error
    const statusCode = error.statusCode || error.status || 500;
    return {
      statusCode,
      body: {
        error: isDevelopment ? error.message : 'Internal server error',
        code: error.code || 'INTERNAL_ERROR',
        ...(isDevelopment && { stack: error.stack })
      }
    };
  }
  
  /**
   * Wrap async route handlers with error handling
   * 
   * @param {Function} fn - Route handler
   * @returns {Function} Wrapped handler
   */
  static asyncHandler(fn) {
    return async (request, reply) => {
      try {
        return await fn(request, reply);
      } catch (error) {
        throw error; // Let Fastify error handler deal with it
      }
    };
  }
  
  /**
   * Assert condition or throw error
   * 
   * @param {boolean} condition - Condition to check
   * @param {string} message - Error message
   * @param {typeof AppError} ErrorClass - Error class to throw
   */
  static assert(condition, message, ErrorClass = ValidationError) {
    if (!condition) {
      throw new ErrorClass(message);
    }
  }
  
  /**
   * Validate required fields
   * 
   * @param {Object} data - Data object
   * @param {Array<string>} fields - Required field names
   */
  static validateRequired(data, fields) {
    const missing = fields.filter(field => {
      const value = data[field];
      return value === null || value === undefined || value === '';
    });
    
    if (missing.length > 0) {
      throw new ValidationError('Missing required fields', {
        missingFields: missing
      });
    }
  }
}

/**
 * Error Types (for backward compatibility)
 */
const ErrorTypes = {
  VALIDATION: 'VALIDATION_ERROR',
  AUTHENTICATION: 'AUTHENTICATION_ERROR',
  AUTHORIZATION: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  DATABASE: 'DATABASE_ERROR',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT_EXCEEDED',
  SYSTEM: 'INTERNAL_ERROR'
};

/**
 * Standalone error handler (backward compatibility)
 */
function handleError(error, request, reply) {
  const formatted = ErrorHandler.buildErrorResponse(error);
  return reply.code(formatted.statusCode).send(formatted.body);
}

/**
 * Async handler wrapper (backward compatibility)
 */
function asyncHandler(fn) {
  return ErrorHandler.asyncHandler(fn);
}

/**
 * Validate required fields (backward compatibility)
 */
function validateRequired(data, fields) {
  return ErrorHandler.validateRequired(data, fields);
}

/**
 * Validate with Zod schema (backward compatibility)
 */
function validateSchema(data, schema, schemaName = 'data') {
  const { z } = require('zod');
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(`${schemaName} validation failed`, {
        errors: error.errors
      });
    }
    throw error;
  }
}

/**
 * Safe database operation wrapper (backward compatibility)
 */
async function safeDbOperation(operation, operationName = 'database operation') {
  try {
    return await operation();
  } catch (error) {
    throw new DatabaseError(`Failed to ${operationName}`, {
      originalError: error.message
    });
  }
}

module.exports = {
  // Classes
  ErrorHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalServerError,
  DatabaseError,
  
  // Backward compatibility
  APIError: AppError,
  ErrorTypes,
  handleError,
  asyncHandler,
  validateRequired,
  validateSchema,
  safeDbOperation
};

