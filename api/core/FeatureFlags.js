/**
 * Feature Flags System
 * 
 * Enables:
 * - Feature toggles per tenant
 * - A/B testing
 * - Gradual rollouts
 * - Kill switches
 * 
 * Design Patterns:
 * - Strategy Pattern (different evaluation strategies)
 * - Repository Pattern (flag storage)
 * - Observer Pattern (flag changes)
 */

const mongoose = require('mongoose');
const { logger } = require('./Logger');
const { getCache } = require('./CacheManager');

/**
 * Feature Flag Schema
 */
const FeatureFlagSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  description: String,
  
  // Flag type
  type: {
    type: String,
    enum: ['boolean', 'percentage', 'whitelist', 'experiment'],
    default: 'boolean'
  },
  
  // Global default
  enabled: { type: Boolean, default: false },
  
  // Percentage rollout (0-100)
  percentage: { type: Number, default: 0, min: 0, max: 100 },
  
  // Whitelist/blacklist
  whitelist: {
    tenants: [String],
    users: [String]
  },
  blacklist: {
    tenants: [String],
    users: [String]
  },
  
  // Experiment configuration
  experiment: {
    variants: [String], // ['control', 'variant-a', 'variant-b']
    weights: [Number]   // [50, 25, 25]
  },
  
  // Tenant overrides
  tenantOverrides: {
    type: Map,
    of: {
      enabled: Boolean,
      variant: String
    }
  },
  
  // User overrides
  userOverrides: {
    type: Map,
    of: {
      enabled: Boolean,
      variant: String
    }
  },
  
  // Metadata
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  createdBy: String,
  updatedBy: String
}, {
  collection: 'feature_flags',
  timestamps: false
});

// Index for efficient queries
FeatureFlagSchema.index({ enabled: 1, type: 1 });
FeatureFlagSchema.index({ tags: 1 });

const FeatureFlagModel = mongoose.model('FeatureFlag', FeatureFlagSchema);

/**
 * Feature Flags Manager
 */
class FeatureFlags {
  constructor() {
    this.cache = getCache();
    this.cachePrefix = 'feature_flags:';
    this.cacheTtl = 60000; // 1 minute
  }
  
  /**
   * Check if feature is enabled
   * 
   * @param {string} key - Feature flag key
   * @param {Object} context - Evaluation context (tenantId, userId)
   * @returns {Promise<boolean>}
   */
  async isEnabled(key, context = {}) {
    const evaluation = await this.evaluate(key, context);
    return evaluation.enabled;
  }
  
  /**
   * Get variant for experiment
   * 
   * @param {string} key - Feature flag key
   * @param {Object} context - Evaluation context
   * @returns {Promise<string>} Variant name
   */
  async getVariant(key, context = {}) {
    const evaluation = await this.evaluate(key, context);
    return evaluation.variant || 'control';
  }
  
  /**
   * Evaluate feature flag
   * 
   * @param {string} key - Feature flag key
   * @param {Object} context - { tenantId, userId, customAttributes }
   * @returns {Promise<Object>} { enabled, variant, reason }
   */
  async evaluate(key, context = {}) {
    try {
      // Try cache first
      const cacheKey = `${this.cachePrefix}${key}`;
      const cached = await this.cache.get(cacheKey);
      
      let flag;
      if (cached) {
        flag = cached;
      } else {
        // Fetch from database
        flag = await FeatureFlagModel.findOne({ key }).lean();
        
        if (!flag) {
          return {
            enabled: false,
            variant: 'control',
            reason: 'flag_not_found'
          };
        }
        
        // Cache flag
        await this.cache.set(cacheKey, flag, this.cacheTtl);
      }
      
      // Check user override first (highest priority)
      if (context.userId && flag.userOverrides?.has(context.userId)) {
        const override = flag.userOverrides.get(context.userId);
        return {
          enabled: override.enabled,
          variant: override.variant || 'control',
          reason: 'user_override'
        };
      }
      
      // Check tenant override
      if (context.tenantId && flag.tenantOverrides?.has(context.tenantId)) {
        const override = flag.tenantOverrides.get(context.tenantId);
        return {
          enabled: override.enabled,
          variant: override.variant || 'control',
          reason: 'tenant_override'
        };
      }
      
      // Check blacklist
      if (this._isBlacklisted(flag, context)) {
        return {
          enabled: false,
          variant: 'control',
          reason: 'blacklisted'
        };
      }
      
      // Check whitelist
      if (this._isWhitelisted(flag, context)) {
        return {
          enabled: true,
          variant: flag.experiment?.variants?.[0] || 'control',
          reason: 'whitelisted'
        };
      }
      
      // Evaluate based on type
      switch (flag.type) {
        case 'boolean':
          return {
            enabled: flag.enabled,
            variant: 'control',
            reason: 'global_setting'
          };
          
        case 'percentage':
          const enabled = this._evaluatePercentage(flag, context);
          return {
            enabled,
            variant: enabled ? 'enabled' : 'control',
            reason: 'percentage_rollout'
          };
          
        case 'experiment':
          const variant = this._selectVariant(flag, context);
          return {
            enabled: variant !== 'control',
            variant,
            reason: 'experiment'
          };
          
        default:
          return {
            enabled: flag.enabled,
            variant: 'control',
            reason: 'default'
          };
      }
      
    } catch (error) {
      logger.error('Feature flag evaluation failed', error, { key, context });
      
      // Fail closed (disabled by default)
      return {
        enabled: false,
        variant: 'control',
        reason: 'evaluation_error'
      };
    }
  }
  
  /**
   * Create or update feature flag
   */
  async set(key, config, updatedBy = 'system') {
    const flag = await FeatureFlagModel.findOneAndUpdate(
      { key },
      {
        $set: {
          ...config,
          updatedAt: new Date(),
          updatedBy
        },
        $setOnInsert: {
          key,
          createdAt: new Date(),
          createdBy: updatedBy
        }
      },
      { upsert: true, new: true }
    );
    
    // Invalidate cache
    await this.cache.delete(`${this.cachePrefix}${key}`);
    
    logger.info('Feature flag updated', { key, config });
    
    return flag;
  }
  
  /**
   * Delete feature flag
   */
  async delete(key) {
    await FeatureFlagModel.deleteOne({ key });
    await this.cache.delete(`${this.cachePrefix}${key}`);
    
    logger.info('Feature flag deleted', { key });
  }
  
  /**
   * Get all feature flags
   */
  async getAll(options = {}) {
    const query = {};
    
    if (options.tags) {
      query.tags = { $in: options.tags };
    }
    
    if (options.enabled !== undefined) {
      query.enabled = options.enabled;
    }
    
    return await FeatureFlagModel.find(query).lean();
  }
  
  /**
   * Set tenant override
   */
  async setTenantOverride(key, tenantId, enabled, variant = null) {
    await FeatureFlagModel.updateOne(
      { key },
      {
        $set: {
          [`tenantOverrides.${tenantId}`]: { enabled, variant }
        }
      }
    );
    
    await this.cache.delete(`${this.cachePrefix}${key}`);
    
    logger.info('Tenant override set', { key, tenantId, enabled, variant });
  }
  
  /**
   * Set user override
   */
  async setUserOverride(key, userId, enabled, variant = null) {
    await FeatureFlagModel.updateOne(
      { key },
      {
        $set: {
          [`userOverrides.${userId}`]: { enabled, variant }
        }
      }
    );
    
    await this.cache.delete(`${this.cachePrefix}${key}`);
    
    logger.info('User override set', { key, userId, enabled, variant });
  }
  
  /**
   * Check if context is whitelisted
   * @private
   */
  _isWhitelisted(flag, context) {
    if (context.tenantId && flag.whitelist?.tenants?.includes(context.tenantId)) {
      return true;
    }
    
    if (context.userId && flag.whitelist?.users?.includes(context.userId)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if context is blacklisted
   * @private
   */
  _isBlacklisted(flag, context) {
    if (context.tenantId && flag.blacklist?.tenants?.includes(context.tenantId)) {
      return true;
    }
    
    if (context.userId && flag.blacklist?.users?.includes(context.userId)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Evaluate percentage rollout
   * @private
   */
  _evaluatePercentage(flag, context) {
    // Deterministic hash based on user/tenant ID
    const id = context.userId || context.tenantId || 'default';
    const hash = this._hash(id);
    const bucket = hash % 100;
    
    return bucket < flag.percentage;
  }
  
  /**
   * Select variant for experiment
   * @private
   */
  _selectVariant(flag, context) {
    if (!flag.experiment || !flag.experiment.variants) {
      return 'control';
    }
    
    const variants = flag.experiment.variants;
    const weights = flag.experiment.weights || variants.map(() => 100 / variants.length);
    
    // Deterministic selection
    const id = context.userId || context.tenantId || 'default';
    const hash = this._hash(id);
    const bucket = hash % 100;
    
    let cumulative = 0;
    for (let i = 0; i < variants.length; i++) {
      cumulative += weights[i];
      if (bucket < cumulative) {
        return variants[i];
      }
    }
    
    return variants[0] || 'control';
  }
  
  /**
   * Simple hash function
   * @private
   */
  _hash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Decorate request context with feature flags
   */
  static registerMiddleware(fastify) {
    const featureFlags = new FeatureFlags();
    
    // Add feature flags to request context
    fastify.decorateRequest('featureFlags', null);
    
    fastify.addHook('onRequest', async (request, reply) => {
      const context = request.context;
      if (!context) return;
      
      // Create feature flags helper
      request.featureFlags = {
        isEnabled: (key) => featureFlags.isEnabled(key, {
          tenantId: context.tenantId,
          userId: context.userId
        }),
        getVariant: (key) => featureFlags.getVariant(key, {
          tenantId: context.tenantId,
          userId: context.userId
        })
      };
    });
    
    // Make global instance available
    fastify.decorate('featureFlags', featureFlags);
    
    logger.info('Feature flags middleware registered');
  }
}

module.exports = {
  FeatureFlags,
  FeatureFlagModel
};

