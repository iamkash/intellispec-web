/**
 * Cache Manager
 * 
 * Multi-level caching system:
 * - In-memory (fast, limited capacity)
 * - Redis (distributed, persistent)
 * - Cache-aside pattern
 * 
 * Design Patterns:
 * - Strategy Pattern (different cache backends)
 * - Proxy Pattern (cache-aside)
 * - Decorator Pattern (cache wrapper)
 */

const { logger } = require('./Logger');
const { metrics } = require('./Metrics');

/**
 * In-Memory Cache (LRU)
 */
class InMemoryCache {
  constructor(maxSize = 1000, ttlMs = 300000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = ttlMs;
    this.accessOrder = new Map(); // For LRU
  }
  
  /**
   * Get value from cache
   */
  async get(key) {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }
    
    // Update access order (LRU)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, Date.now());
    
    return entry.value;
  }
  
  /**
   * Set value in cache
   */
  async set(key, value, ttlMs = null) {
    // Evict oldest if at max size
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.accessOrder.keys().next().value;
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
    
    const ttl = ttlMs !== null ? ttlMs : this.defaultTtl;
    const expiresAt = ttl > 0 ? Date.now() + ttl : null;
    
    this.cache.set(key, { value, expiresAt });
    this.accessOrder.set(key, Date.now());
  }
  
  /**
   * Delete value from cache
   */
  async delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }
  
  /**
   * Clear all cache
   */
  async clear() {
    this.cache.clear();
    this.accessOrder.clear();
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize
    };
  }
}

/**
 * Cache Manager
 */
class CacheManager {
  constructor(options = {}) {
    this.options = {
      defaultTtl: options.defaultTtl || 300000, // 5 minutes
      keyPrefix: options.keyPrefix || 'app:',
      enableMetrics: options.enableMetrics !== false
    };
    
    // Primary cache (in-memory)
    this.primary = new InMemoryCache(
      options.maxSize || 1000,
      this.options.defaultTtl
    );
    
    // Secondary cache (Redis - if configured)
    this.secondary = options.redis || null;
    
    // Metrics
    if (this.options.enableMetrics) {
      this.hits = metrics.createCounter(
        'cache_hits_total',
        'Cache hits',
        ['cache_name', 'tenant_id']
      );
      
      this.misses = metrics.createCounter(
        'cache_misses_total',
        'Cache misses',
        ['cache_name', 'tenant_id']
      );
    }
  }
  
  /**
   * Build cache key
   */
  _buildKey(key, tenantId = null) {
    const prefix = this.options.keyPrefix;
    return tenantId ? `${prefix}${tenantId}:${key}` : `${prefix}${key}`;
  }
  
  /**
   * Get from cache
   */
  async get(key, tenantId = null) {
    const cacheKey = this._buildKey(key, tenantId);
    
    // Try primary cache first
    let value = await this.primary.get(cacheKey);
    
    if (value !== null) {
      this._recordHit('primary', tenantId);
      return value;
    }
    
    // Try secondary cache (Redis)
    if (this.secondary) {
      try {
        const redisValue = await this.secondary.get(cacheKey);
        if (redisValue !== null) {
          // Promote to primary cache
          const parsed = JSON.parse(redisValue);
          await this.primary.set(cacheKey, parsed);
          this._recordHit('secondary', tenantId);
          return parsed;
        }
      } catch (error) {
        logger.error('Redis cache get failed', error, { key: cacheKey });
      }
    }
    
    this._recordMiss('all', tenantId);
    return null;
  }
  
  /**
   * Set in cache
   */
  async set(key, value, ttlMs = null, tenantId = null) {
    const cacheKey = this._buildKey(key, tenantId);
    const ttl = ttlMs !== null ? ttlMs : this.options.defaultTtl;
    
    // Set in primary cache
    await this.primary.set(cacheKey, value, ttl);
    
    // Set in secondary cache (Redis)
    if (this.secondary) {
      try {
        const serialized = JSON.stringify(value);
        if (ttl > 0) {
          await this.secondary.setex(cacheKey, Math.ceil(ttl / 1000), serialized);
        } else {
          await this.secondary.set(cacheKey, serialized);
        }
      } catch (error) {
        logger.error('Redis cache set failed', error, { key: cacheKey });
      }
    }
  }
  
  /**
   * Delete from cache
   */
  async delete(key, tenantId = null) {
    const cacheKey = this._buildKey(key, tenantId);
    
    // Delete from primary
    await this.primary.delete(cacheKey);
    
    // Delete from secondary
    if (this.secondary) {
      try {
        await this.secondary.del(cacheKey);
      } catch (error) {
        logger.error('Redis cache delete failed', error, { key: cacheKey });
      }
    }
  }
  
  /**
   * Clear all cache for tenant
   */
  async clearTenant(tenantId) {
    // Clear primary cache entries for tenant
    await this.primary.clear(); // Simple approach - clear all
    
    // Clear Redis keys for tenant
    if (this.secondary) {
      try {
        const pattern = this._buildKey('*', tenantId);
        const keys = await this.secondary.keys(pattern);
        if (keys.length > 0) {
          await this.secondary.del(...keys);
        }
      } catch (error) {
        logger.error('Redis cache clear failed', error, { tenantId });
      }
    }
    
    logger.info('Cache cleared for tenant', { tenantId });
  }
  
  /**
   * Wrap function with caching (cache-aside pattern)
   */
  wrap(fn, options = {}) {
    const {
      keyGenerator = (...args) => JSON.stringify(args),
      ttl = this.options.defaultTtl,
      getTenantId = () => null
    } = options;
    
    return async (...args) => {
      const tenantId = getTenantId(...args);
      const key = keyGenerator(...args);
      
      // Try cache first
      const cached = await this.get(key, tenantId);
      if (cached !== null) {
        return cached;
      }
      
      // Execute function
      const result = await fn(...args);
      
      // Store in cache
      await this.set(key, result, ttl, tenantId);
      
      return result;
    };
  }
  
  /**
   * Record cache hit
   * @private
   */
  _recordHit(cacheName, tenantId) {
    if (this.options.enableMetrics && this.hits) {
      this.hits.inc({
        cache_name: cacheName,
        tenant_id: tenantId || 'unknown'
      });
    }
  }
  
  /**
   * Record cache miss
   * @private
   */
  _recordMiss(cacheName, tenantId) {
    if (this.options.enableMetrics && this.misses) {
      this.misses.inc({
        cache_name: cacheName,
        tenant_id: tenantId || 'unknown'
      });
    }
  }
  
  /**
   * Get cache stats
   */
  getStats() {
    return {
      primary: this.primary.getStats(),
      secondary: this.secondary ? 'connected' : 'not configured'
    };
  }
}

/**
 * Cache Decorators
 */
class CacheDecorators {
  /**
   * Cache repository method results
   */
  static cached(options = {}) {
    const { ttl = 300000, keyGenerator } = options;
    
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const cache = this.cache || global.cache;
        if (!cache) {
          return await originalMethod.apply(this, args);
        }
        
        const tenantId = this.context?.tenantId;
        const key = keyGenerator 
          ? keyGenerator(...args)
          : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;
        
        // Try cache
        const cached = await cache.get(key, tenantId);
        if (cached !== null) {
          return cached;
        }
        
        // Execute method
        const result = await originalMethod.apply(this, args);
        
        // Cache result
        await cache.set(key, result, ttl, tenantId);
        
        return result;
      };
      
      return descriptor;
    };
  }
  
  /**
   * Invalidate cache after method execution
   */
  static invalidate(keys) {
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = async function(...args) {
        const result = await originalMethod.apply(this, args);
        
        const cache = this.cache || global.cache;
        if (cache) {
          const tenantId = this.context?.tenantId;
          
          for (const key of keys) {
            await cache.delete(key, tenantId);
          }
        }
        
        return result;
      };
      
      return descriptor;
    };
  }
}

/**
 * Global cache instance
 */
let globalCache = null;

/**
 * Initialize cache
 */
function initializeCache(options = {}) {
  if (!globalCache) {
    globalCache = new CacheManager(options);
    global.cache = globalCache;
    logger.info('Cache manager initialized');
  }
  return globalCache;
}

/**
 * Get global cache instance
 */
function getCache() {
  if (!globalCache) {
    return initializeCache();
  }
  return globalCache;
}

module.exports = {
  CacheManager,
  CacheDecorators,
  InMemoryCache,
  initializeCache,
  getCache
};

