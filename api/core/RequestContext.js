/**
 * Request Context Manager
 * 
 * Manages request-scoped state including:
 * - Tenant context
 * - Logger
 * - Session information
 * - Request metadata
 * 
 * Design Patterns:
 * - Context Object Pattern
 * - Facade Pattern (simplified interface)
 * - Singleton per Request (via Fastify decorators)
 */

const { AsyncLocalStorage } = require('async_hooks');
const { v4: uuidv4 } = require('uuid');
const { createRequestLogger } = require('./Logger');
const TenantContextFactory = require('./TenantContextFactory');

/**
 * Async Local Storage for request context
 * Allows accessing context anywhere in the call chain
 */
const asyncLocalStorage = new AsyncLocalStorage();

/**
 * Request Context
 * 
 * Encapsulates all request-scoped information
 */
class RequestContext {
  constructor(request, reply, overrides = {}) {
    this.requestId = overrides.requestId || request.id || uuidv4();
    this.startTime = overrides.startTime || Date.now();
    
    // HTTP metadata
    this.method = request.method;
    this.url = request.url;
    this.path = request.routerPath;
    this.query = request.query;
    this.params = request.params;
    this.headers = request.headers;
    this.ipAddress = this._extractIpAddress(request);
    this.userAgent = request.headers['user-agent'];
    
    // Tenant context
    this.tenantContext = overrides.tenantContext || TenantContextFactory.fromRequest(request);
    
    // Logger with context
    this.logger = overrides.logger || createRequestLogger(request, this.tenantContext);
    
    // Session (if exists)
    this.session = request.session || overrides.session || null;
    
    // Custom data storage
    this.data = overrides.data instanceof Map ? new Map(overrides.data) : new Map();
    
    // Reply reference (for middleware)
    this._reply = overrides.reply || reply;
    
    // Track if response sent
    this.responseSent = false;
    
    // Freeze to prevent modification
    Object.freeze(this);
  }
  
  /**
   * Get user ID
   */
  get userId() {
    return this.tenantContext.userId;
  }
  
  /**
   * Get tenant ID
   */
  get tenantId() {
    return this.tenantContext.tenantId;
  }
  
  /**
   * Check if platform admin
   */
  get isPlatformAdmin() {
    return this.tenantContext.isPlatformAdmin;
  }
  
  /**
   * Get request duration in milliseconds
   */
  getDuration() {
    return Date.now() - this.startTime;
  }
  
  /**
   * Store custom data in request context
   */
  set(key, value) {
    this.data.set(key, value);
  }
  
  /**
   * Get custom data from request context
   */
  get(key) {
    return this.data.get(key);
  }
  
  /**
   * Check if data exists
   */
  has(key) {
    return this.data.has(key);
  }
  
  /**
   * Get metadata for audit logging
   */
  getAuditMetadata() {
    return {
      requestId: this.requestId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      method: this.method,
      url: this.url
    };
  }
  
  /**
   * Extract IP address from request
   * @private
   */
  _extractIpAddress(request) {
    return request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           request.headers['x-real-ip'] ||
           request.ip ||
           request.socket?.remoteAddress ||
           'unknown';
  }
  
  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      requestId: this.requestId,
      method: this.method,
      url: this.url,
      userId: this.userId,
      tenantId: this.tenantId,
      isPlatformAdmin: this.isPlatformAdmin,
      ipAddress: this.ipAddress,
      duration: this.getDuration()
    };
  }
}

/**
 * Request Context Manager
 */
class RequestContextManager {
  /**
   * Initialize request context middleware
   * 
   * @param {FastifyInstance} fastify - Fastify instance
   */
  static registerMiddleware(fastify) {
    // Decorate request with context
    fastify.decorateRequest('context', null);
    
    // Create context for each request
    fastify.addHook('onRequest', async (request, reply) => {
      const context = new RequestContext(request, reply);
      request.context = context;
      
      // Store in AsyncLocalStorage for access anywhere
      asyncLocalStorage.enterWith(context);
      
      // Log request started
      context.logger.info('Request started', {
        method: context.method,
        url: context.url,
        userId: context.userId,
        tenantId: context.tenantId
      });
    });
    
    // Log response
    fastify.addHook('onResponse', async (request, reply) => {
      const context = request.context;
      if (!context) return;
      
      const duration = context.getDuration();
      const statusCode = reply.statusCode;
      
      // Log based on status
      if (statusCode >= 500) {
        context.logger.error('Request failed', null, {
          statusCode,
          duration
        });
      } else if (statusCode >= 400) {
        context.logger.warn('Request error', {
          statusCode,
          duration
        });
      } else if (duration > 1000) {
        context.logger.warn('Slow request', {
          statusCode,
          duration
        });
      } else {
        context.logger.info('Request completed', {
          statusCode,
          duration
        });
      }
    });
    
    // Log errors
    fastify.addHook('onError', async (request, reply, error) => {
      const context = request.context;
      if (!context) return;
      
      context.logger.error('Request error', error, {
        statusCode: reply.statusCode,
        duration: context.getDuration()
      });
    });
  }
  
  /**
   * Get current request context from AsyncLocalStorage
   * 
   * @returns {RequestContext|null}
   */
  static getCurrentContext() {
    return asyncLocalStorage.getStore() || null;
  }

  /**
   * Rebuild request context after authentication or tenant changes
   *
   * @param {Object} request - Fastify request
   * @param {Object} [reply] - Fastify reply
   * @param {Object} [meta] - Additional logging metadata
   * @returns {RequestContext}
   */
  static refreshContext(request, reply, meta = {}) {
    const current = request.context || asyncLocalStorage.getStore() || null;
    const overrides = current
      ? {
          requestId: current.requestId,
          startTime: current.startTime,
          data: current.data,
          reply: current._reply,
          session: current.session
        }
      : {};

    const context = new RequestContext(
      request,
      reply || current?._reply || request.raw,
      overrides
    );

    request.context = context;
    asyncLocalStorage.enterWith(context);

    if (meta?.log !== false) {
      context.logger.debug('Request context refreshed', {
        userId: context.userId,
        tenantId: context.tenantId,
        reason: meta.reason || 'unknown'
      });
    }

    return context;
  }

  /**
   * Run function with specific context
   * 
   * @param {RequestContext} context - Request context
   * @param {Function} fn - Function to run
   */
  static async runWithContext(context, fn) {
    return asyncLocalStorage.run(context, fn);
  }
}

module.exports = {
  RequestContext,
  RequestContextManager
};
