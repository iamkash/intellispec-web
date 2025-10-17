/**
 * Tenant Usage Monitoring & Quota Management
 * 
 * Tracks resource usage per tenant for:
 * - Billing
 * - Quota enforcement
 * - Usage analytics
 * - Cost allocation
 * 
 * Design Patterns:
 * - Observer Pattern (track events)
 * - Strategy Pattern (different quota strategies)
 * - Repository Pattern (usage data storage)
 */

const mongoose = require('mongoose');
const { logger } = require('./Logger');
const { metrics } = require('./Metrics');

/**
 * Tenant Usage Schema
 */
const TenantUsageSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, index: true },
  period: { type: String, required: true, index: true }, // YYYY-MM or YYYY-MM-DD
  periodType: { type: String, enum: ['daily', 'monthly'], default: 'monthly' },
  
  // API usage
  apiCalls: { type: Number, default: 0 },
  apiCallsByEndpoint: { type: Map, of: Number, default: {} },
  
  // Storage usage (bytes)
  storageUsed: { type: Number, default: 0 },
  documentsCount: { type: Number, default: 0 },
  documentsByType: { type: Map, of: Number, default: {} },
  
  // Compute usage
  computeTimeMs: { type: Number, default: 0 },
  
  // User activity
  activeUsers: { type: Number, default: 0 },
  totalUsers: { type: Number, default: 0 },
  
  // Feature usage
  featuresUsed: { type: Map, of: Number, default: {} },
  
  // Costs (if applicable)
  estimatedCost: { type: Number, default: 0 },
  
  // Metadata
  lastUpdated: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'tenant_usage',
  timestamps: false
});

// Compound index for efficient queries
TenantUsageSchema.index({ tenantId: 1, period: 1 }, { unique: true });
TenantUsageSchema.index({ period: 1, tenantId: 1 });

const TenantUsageModel = mongoose.model('TenantUsage', TenantUsageSchema);

/**
 * Tenant Quota Schema
 */
const TenantQuotaSchema = new mongoose.Schema({
  tenantId: { type: String, required: true, unique: true, index: true },
  
  // API quotas
  apiCallsPerMonth: { type: Number, default: 100000 },
  apiCallsPerMinute: { type: Number, default: 100 },
  
  // Storage quotas (bytes)
  maxStorage: { type: Number, default: 10737418240 }, // 10GB default
  maxDocuments: { type: Number, default: 100000 },
  
  // User quotas
  maxUsers: { type: Number, default: 50 },
  
  // Feature access
  allowedFeatures: [String],
  
  // Rate limits
  rateLimits: {
    type: Map,
    of: {
      requests: Number,
      windowMs: Number
    }
  },
  
  // Metadata
  plan: { type: String, default: 'free' }, // free, starter, pro, enterprise
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  collection: 'tenant_quotas',
  timestamps: false
});

const TenantQuotaModel = mongoose.model('TenantQuota', TenantQuotaSchema);

/**
 * Tenant Usage Monitor
 */
class TenantUsageMonitor {
  /**
   * Track API call
   */
  static async trackApiCall(tenantId, endpoint, durationMs) {
    const period = this._getCurrentPeriod('monthly');
    
    try {
      await TenantUsageModel.findOneAndUpdate(
        { tenantId, period, periodType: 'monthly' },
        {
          $inc: {
            apiCalls: 1,
            [`apiCallsByEndpoint.${endpoint}`]: 1,
            computeTimeMs: durationMs
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
      
      // Update metrics
      metrics.createCounter('tenant_api_calls_total', 'API calls by tenant', ['tenant_id', 'endpoint'])
        .inc({ tenant_id: tenantId, endpoint });
      
    } catch (error) {
      logger.error('Failed to track API call', error, { tenantId, endpoint });
    }
  }
  
  /**
   * Track storage usage
   */
  static async trackStorage(tenantId, documentType, sizeBytes, operation = 'add') {
    const period = this._getCurrentPeriod('monthly');
    const increment = operation === 'add' ? 1 : -1;
    
    try {
      await TenantUsageModel.findOneAndUpdate(
        { tenantId, period, periodType: 'monthly' },
        {
          $inc: {
            storageUsed: increment * sizeBytes,
            documentsCount: increment,
            [`documentsByType.${documentType}`]: increment
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
      
      // Update metrics
      metrics.createGauge('tenant_storage_bytes', 'Storage used by tenant', ['tenant_id'])
        .set({ tenant_id: tenantId }, sizeBytes);
      
    } catch (error) {
      logger.error('Failed to track storage', error, { tenantId, documentType });
    }
  }
  
  /**
   * Track user activity
   */
  static async trackUserActivity(tenantId, activeUserIds) {
    const period = this._getCurrentPeriod('monthly');
    
    try {
      await TenantUsageModel.findOneAndUpdate(
        { tenantId, period, periodType: 'monthly' },
        {
          $set: {
            activeUsers: activeUserIds.size,
            lastUpdated: new Date()
          }
        },
        { upsert: true, new: true }
      );
      
      // Update metrics
      metrics.setActiveUsers(activeUserIds.size, tenantId);
      
    } catch (error) {
      logger.error('Failed to track user activity', error, { tenantId });
    }
  }
  
  /**
   * Track feature usage
   */
  static async trackFeatureUsage(tenantId, featureName) {
    const period = this._getCurrentPeriod('monthly');
    
    try {
      await TenantUsageModel.findOneAndUpdate(
        { tenantId, period, periodType: 'monthly' },
        {
          $inc: {
            [`featuresUsed.${featureName}`]: 1
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      logger.error('Failed to track feature usage', error, { tenantId, featureName });
    }
  }
  
  /**
   * Get current usage for tenant
   */
  static async getCurrentUsage(tenantId) {
    const period = this._getCurrentPeriod('monthly');
    
    const usage = await TenantUsageModel.findOne({
      tenantId,
      period,
      periodType: 'monthly'
    }).lean();
    
    return usage || {
      tenantId,
      period,
      apiCalls: 0,
      storageUsed: 0,
      documentsCount: 0,
      activeUsers: 0
    };
  }
  
  /**
   * Get usage history
   */
  static async getUsageHistory(tenantId, months = 12) {
    const periods = [];
    for (let i = 0; i < months; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      periods.push(date.toISOString().substring(0, 7));
    }
    
    const usage = await TenantUsageModel.find({
      tenantId,
      period: { $in: periods },
      periodType: 'monthly'
    }).sort({ period: -1 }).lean();
    
    return usage;
  }
  
  /**
   * Check if tenant is within quota
   */
  static async checkQuota(tenantId, resource) {
    const [quota, usage] = await Promise.all([
      this.getQuota(tenantId),
      this.getCurrentUsage(tenantId)
    ]);
    
    if (!quota) {
      return { allowed: true, reason: 'No quota defined' };
    }
    
    switch (resource) {
      case 'apiCall':
        if (usage.apiCalls >= quota.apiCallsPerMonth) {
          return {
            allowed: false,
            reason: 'Monthly API call quota exceeded',
            current: usage.apiCalls,
            limit: quota.apiCallsPerMonth
          };
        }
        break;
        
      case 'storage':
        if (usage.storageUsed >= quota.maxStorage) {
          return {
            allowed: false,
            reason: 'Storage quota exceeded',
            current: usage.storageUsed,
            limit: quota.maxStorage
          };
        }
        break;
        
      case 'documents':
        if (usage.documentsCount >= quota.maxDocuments) {
          return {
            allowed: false,
            reason: 'Document count quota exceeded',
            current: usage.documentsCount,
            limit: quota.maxDocuments
          };
        }
        break;
        
      default:
        break;
    }
    
    return { allowed: true };
  }
  
  /**
   * Get or create quota for tenant
   */
  static async getQuota(tenantId) {
    let quota = await TenantQuotaModel.findOne({ tenantId }).lean();
    
    if (!quota) {
      // Create default quota
      quota = await TenantQuotaModel.create({
        tenantId,
        plan: 'free'
      });
    }
    
    return quota;
  }
  
  /**
   * Update quota for tenant
   */
  static async updateQuota(tenantId, updates) {
    const quota = await TenantQuotaModel.findOneAndUpdate(
      { tenantId },
      {
        $set: {
          ...updates,
          updatedAt: new Date()
        }
      },
      { upsert: true, new: true }
    );
    
    logger.info('Tenant quota updated', { tenantId, updates });
    
    return quota;
  }
  
  /**
   * Get all tenant usage (for platform admin)
   */
  static async getAllTenantsUsage(period = null) {
    const query = period 
      ? { period, periodType: 'monthly' }
      : { period: this._getCurrentPeriod('monthly'), periodType: 'monthly' };
    
    const usage = await TenantUsageModel.find(query)
      .sort({ apiCalls: -1 })
      .lean();
    
    return usage;
  }
  
  /**
   * Calculate estimated cost
   */
  static async calculateCost(tenantId) {
    const usage = await this.getCurrentUsage(tenantId);
    
    // Example pricing (customize as needed)
    const pricing = {
      apiCallsPer1000: 0.10,
      storagePerGB: 0.02,
      computePerHour: 0.05
    };
    
    const cost = 
      (usage.apiCalls / 1000) * pricing.apiCallsPer1000 +
      (usage.storageUsed / 1024 / 1024 / 1024) * pricing.storagePerGB +
      (usage.computeTimeMs / 1000 / 60 / 60) * pricing.computePerHour;
    
    // Update usage with cost
    await TenantUsageModel.updateOne(
      { tenantId, period: this._getCurrentPeriod('monthly') },
      { $set: { estimatedCost: cost } }
    );
    
    return cost;
  }
  
  /**
   * Get current period string
   * @private
   */
  static _getCurrentPeriod(type = 'monthly') {
    const now = new Date();
    if (type === 'monthly') {
      return now.toISOString().substring(0, 7); // YYYY-MM
    } else {
      return now.toISOString().substring(0, 10); // YYYY-MM-DD
    }
  }
  
  /**
   * Register middleware to track usage
   */
  static registerMiddleware(fastify) {
    // Track API calls
    fastify.addHook('onResponse', async (request, reply) => {
      const context = request.context;
      if (!context || !context.tenantId) return;
      
      const duration = context.getDuration();
      const endpoint = request.routerPath || request.url;
      
      // Track asynchronously (don't block response)
      setImmediate(() => {
        this.trackApiCall(context.tenantId, endpoint, duration)
          .catch(error => logger.error('Failed to track API call', error));
      });
    });
    
    logger.info('Tenant usage monitoring middleware registered');
  }
}

module.exports = {
  TenantUsageMonitor,
  TenantUsageModel,
  TenantQuotaModel
};
