/**
 * Rate Limiting System
 * 
 * Provides multi-level rate limiting:
 * - Per tenant
 * - Per user
 * - Per endpoint
 * - Per IP address
 * 
 * Algorithms:
 * - Token Bucket
 * - Sliding Window
 * 
 * Design Patterns:
 * - Strategy Pattern (different rate limit strategies)
 * - Decorator Pattern (wrap endpoints with limits)
 * - Factory Pattern (create limiters)
 */

const { RateLimitError } = require('./ErrorHandler');
const { logger } = require('./Logger');
const { metrics } = require('./Metrics');

/**
 * In-Memory Rate Limiter (Token Bucket Algorithm)
 * 
 * For production, use Redis-based implementation
 */
class InMemoryRateLimiter {
  constructor() {
    this.buckets = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }
  
  /**
   * Check and consume tokens
   * 
   * @param {string} key - Rate limit key (tenant:endpoint, user:endpoint, etc.)
   * @param {number} maxTokens - Maximum tokens in bucket
   * @param {number} refillRate - Tokens added per second
   * @param {number} tokensToConsume - Tokens to consume (default: 1)
   * @returns {Object} { allowed, remaining, resetTime }
   */
  async consume(key, maxTokens, refillRate, tokensToConsume = 1) {
    const now = Date.now();
    let bucket = this.buckets.get(key);
    
    // Initialize bucket if doesn't exist
    if (!bucket) {
      bucket = {
        tokens: maxTokens,
        lastRefill: now
      };
      this.buckets.set(key, bucket);
    }
    
    // Calculate tokens to add based on time elapsed
    const timeElapsed = (now - bucket.lastRefill) / 1000; // seconds
    const tokensToAdd = timeElapsed * refillRate;
    bucket.tokens = Math.min(maxTokens, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
    
    // Check if enough tokens
    if (bucket.tokens >= tokensToConsume) {
      bucket.tokens -= tokensToConsume;
      
      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetTime: now + ((maxTokens - bucket.tokens) / refillRate) * 1000
      };
    } else {
      // Calculate when enough tokens will be available
      const tokensNeeded = tokensToConsume - bucket.tokens;
      const resetTime = now + (tokensNeeded / refillRate) * 1000;
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: Math.ceil(resetTime),
        retryAfter: Math.ceil(tokensNeeded / refillRate)
      };
    }
  }
  
  /**
   * Cleanup old buckets
   */
  cleanup() {
    const now = Date.now();
    const maxAge = 3600000; // 1 hour
    
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(key);
      }
    }
  }
  
  /**
   * Reset rate limit for key
   */
  reset(key) {
    this.buckets.delete(key);
  }
  
  /**
   * Get current state for key
   */
  get(key) {
    return this.buckets.get(key);
  }
  
  /**
   * Shutdown
   */
  shutdown() {
    clearInterval(this.cleanupInterval);
  }
}

/**
 * Rate Limiter Manager
 */
class RateLimiter {
  constructor(storage = null) {
    this.storage = storage || new InMemoryRateLimiter();
    
    // Read from environment or use defaults
    // In development, use much higher limits to prevent blocking dashboard loads
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (isDevelopment ? 10000 : 100);
    const windowSeconds = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000') / 1000;
    
    // Default limits
    this.defaults = {
      global: {
        requests: maxRequests * 10,
        windowSeconds: windowSeconds
      },
      perTenant: {
        requests: maxRequests,
        windowSeconds: windowSeconds
      },
      perUser: {
        requests: maxRequests,
        windowSeconds: windowSeconds
      },
      perEndpoint: {
        requests: Math.floor(maxRequests / 2),
        windowSeconds: windowSeconds
      }
    };
    
    // Log configuration in development
    if (isDevelopment) {
      logger.info('[Rate Limiter] Configuration loaded', {
        perTenant: `${this.defaults.perTenant.requests} req/${windowSeconds}s`,
        perUser: `${this.defaults.perUser.requests} req/${windowSeconds}s`,
        perEndpoint: `${this.defaults.perEndpoint.requests} req/${windowSeconds}s`,
        source: process.env.RATE_LIMIT_MAX_REQUESTS ? 'environment' : 'default'
      });
    }
  }
  
  /**
   * Check rate limit for tenant
   */
  async checkTenantLimit(tenantId, endpoint = null) {
    const key = endpoint 
      ? `tenant:${tenantId}:${endpoint}`
      : `tenant:${tenantId}`;
    
    const limit = this.defaults.perTenant;
    const refillRate = limit.requests / limit.windowSeconds;
    
    return await this.storage.consume(key, limit.requests, refillRate);
  }
  
  /**
   * Check rate limit for user
   */
  async checkUserLimit(userId, endpoint = null) {
    const key = endpoint 
      ? `user:${userId}:${endpoint}`
      : `user:${userId}`;
    
    const limit = this.defaults.perUser;
    const refillRate = limit.requests / limit.windowSeconds;
    
    return await this.storage.consume(key, limit.requests, refillRate);
  }
  
  /**
   * Check rate limit for IP
   */
  async checkIpLimit(ipAddress, endpoint = null) {
    const key = endpoint 
      ? `ip:${ipAddress}:${endpoint}`
      : `ip:${ipAddress}`;
    
    const limit = this.defaults.perEndpoint;
    const refillRate = limit.requests / limit.windowSeconds;
    
    return await this.storage.consume(key, limit.requests, refillRate);
  }
  
  /**
   * Check all applicable rate limits
   */
  async check(context, endpoint) {
    const checks = [];
    
    // Check tenant limit
    if (context.tenantId) {
      checks.push({
        name: 'tenant',
        result: await this.checkTenantLimit(context.tenantId, endpoint)
      });
    }
    
    // Check user limit
    if (context.userId) {
      checks.push({
        name: 'user',
        result: await this.checkUserLimit(context.userId, endpoint)
      });
    }
    
    // Check IP limit
    if (context.ipAddress) {
      checks.push({
        name: 'ip',
        result: await this.checkIpLimit(context.ipAddress, endpoint)
      });
    }
    
    // Find first failed check
    const failed = checks.find(check => !check.result.allowed);
    
    if (failed) {
      // Record rate limit hit
      metrics.createCounter('rate_limit_hits_total', 'Rate limit hits', ['type', 'tenant_id'])
        .inc({ type: failed.name, tenant_id: context.tenantId || 'unknown' });
      
      return {
        allowed: false,
        limitType: failed.name,
        retryAfter: failed.result.retryAfter,
        resetTime: failed.result.resetTime
      };
    }
    
    // Find minimum remaining
    const minRemaining = Math.min(...checks.map(c => c.result.remaining));
    
    return {
      allowed: true,
      remaining: minRemaining,
      checks: checks.map(c => ({
        type: c.name,
        remaining: c.result.remaining
      }))
    };
  }
  
  /**
   * Configure custom limits
   */
  configure(config) {
    Object.assign(this.defaults, config);
  }
  
  /**
   * Reset rate limit for key
   */
  reset(key) {
    this.storage.reset(key);
  }
  
  /**
   * Register rate limiting middleware
   */
  static registerMiddleware(fastify, config = {}) {
    const rateLimiter = new RateLimiter();
    
    // Apply custom configuration
    if (config.limits) {
      rateLimiter.configure(config.limits);
    }
    
    // Skip rate limiting for certain paths
    const skipPaths = config.skipPaths || ['/health', '/ready', '/alive', '/metrics'];
    
    // Rate limiting hook
    fastify.addHook('preHandler', async (request, reply) => {
      // Skip for certain paths
      if (skipPaths.some(path => request.url.startsWith(path))) {
        return;
      }
      
      const context = request.context;
      if (!context) return;
      
      const endpoint = request.routerPath || request.url;
      
      try {
        const result = await rateLimiter.check(context, endpoint);
        
        // Add rate limit headers
        reply.header('X-RateLimit-Limit', rateLimiter.defaults.perTenant.requests);
        reply.header('X-RateLimit-Remaining', result.remaining || 0);
        
        if (!result.allowed) {
          reply.header('X-RateLimit-Reset', result.resetTime);
          reply.header('Retry-After', result.retryAfter);
          
          logger.warn('Rate limit exceeded', {
            tenantId: context.tenantId,
            userId: context.userId,
            endpoint,
            limitType: result.limitType
          });
          
          throw new RateLimitError(result.retryAfter);
        }
        
      } catch (error) {
        if (error instanceof RateLimitError) {
          throw error;
        }
        // Don't block request if rate limiting fails
        logger.error('Rate limiting check failed', error);
      }
    });
    
    // Make rate limiter available
    fastify.decorate('rateLimiter', rateLimiter);
    
    logger.info('Rate limiting middleware registered');
  }
}

/**
 * Rate Limit Decorators
 */
class RateLimitDecorators {
  /**
   * Apply rate limit to specific route
   * 
   * @param {Object} options - Rate limit options
   * @returns {Function} Fastify preHandler hook
   */
  static rateLimit(options = {}) {
    const {
      requests = 10,
      windowSeconds = 60,
      keyGenerator = (request) => request.context.userId
    } = options;
    
    const limiter = new InMemoryRateLimiter();
    const refillRate = requests / windowSeconds;
    
    return async (request, reply) => {
      const key = keyGenerator(request);
      if (!key) return; // Skip if no key
      
      const result = await limiter.consume(key, requests, refillRate);
      
      reply.header('X-RateLimit-Limit', requests);
      reply.header('X-RateLimit-Remaining', result.remaining);
      
      if (!result.allowed) {
        reply.header('X-RateLimit-Reset', result.resetTime);
        reply.header('Retry-After', result.retryAfter);
        
        throw new RateLimitError(result.retryAfter);
      }
    };
  }
  
  /**
   * Expensive operation rate limit
   */
  static expensive() {
    return this.rateLimit({
      requests: 5,
      windowSeconds: 60
    });
  }
  
  /**
   * Authentication rate limit
   */
  static auth() {
    return this.rateLimit({
      requests: 5,
      windowSeconds: 300, // 5 attempts per 5 minutes
      keyGenerator: (request) => request.context.ipAddress
    });
  }
}

module.exports = {
  RateLimiter,
  RateLimitDecorators,
  InMemoryRateLimiter
};

