/**
 * Audit Trail System
 * 
 * Automatically tracks all data changes for compliance and debugging.
 * 
 * Features:
 * - Automatic event logging
 * - Who, What, When, Where tracking
 * - Change history
 * - Compliance-ready
 * 
 * Design Patterns:
 * - Observer Pattern (observes repository operations)
 * - Strategy Pattern (different storage strategies)
 * - Repository Pattern (for audit log storage)
 */

const mongoose = require('mongoose');
const { logger } = require('./Logger');

/**
 * Audit Event Schema
 */
const AuditEventSchema = new mongoose.Schema({
  // Event identification
  eventId: { type: String, required: true, unique: true, index: true },
  eventType: { type: String, required: true, enum: [
    'CREATE', 'READ', 'UPDATE', 'DELETE', 'HARD_DELETE',
    'LOGIN', 'LOGOUT', 'AUTH_FAILURE',
    'PERMISSION_DENIED', 'DATA_EXPORT', 'SYSTEM_CHANGE'
  ], index: true },
  
  // Actor (who did it)
  userId: { type: String, required: true, index: true },
  userEmail: String,
  userName: String,
  isPlatformAdmin: { type: Boolean, default: false },
  
  // Context (where/when)
  tenantId: { type: String, index: true },
  requestId: String,
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now, index: true },
  
  // Target (what was affected)
  resourceType: String,  // 'inspection', 'company', 'user', etc.
  resourceId: String,
  
  // Change details
  action: String,  // Human-readable description
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  metadata: mongoose.Schema.Types.Mixed,
  
  // Result
  success: { type: Boolean, default: true },
  errorMessage: String,
  
  // Retention
  expiresAt: { type: Date, index: true }  // For automatic cleanup
}, {
  collection: 'audit_events',
  timestamps: false
});

// Index for efficient queries
AuditEventSchema.index({ tenantId: 1, timestamp: -1 });
AuditEventSchema.index({ userId: 1, timestamp: -1 });
AuditEventSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

const AuditEventModel = mongoose.model('AuditEvent', AuditEventSchema);

/**
 * Audit Trail Manager
 */
class AuditTrail {
  /**
   * Log audit event
   * 
   * @param {Object} event - Audit event details
   */
  static async log(event) {
    try {
      const { v4: uuidv4 } = require('uuid');
      
      const auditEvent = {
        eventId: event.eventId || uuidv4(),
        eventType: event.eventType,
        userId: event.userId,
        userEmail: event.userEmail,
        userName: event.userName,
        isPlatformAdmin: event.isPlatformAdmin || false,
        tenantId: event.tenantId,
        requestId: event.requestId,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        timestamp: new Date(),
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        action: event.action,
        changes: event.changes,
        metadata: event.metadata,
        success: event.success !== false,
        errorMessage: event.errorMessage,
        expiresAt: event.retentionDays ? 
          new Date(Date.now() + event.retentionDays * 24 * 60 * 60 * 1000) : 
          null
      };
      
      await AuditEventModel.create(auditEvent);
      
      logger.debug('Audit event logged', {
        eventId: auditEvent.eventId,
        eventType: auditEvent.eventType,
        userId: auditEvent.userId,
        resourceType: auditEvent.resourceType
      });
    } catch (error) {
      // Don't fail the operation if audit logging fails
      logger.error('Failed to log audit event', error, event);
    }
  }
  
  /**
   * Log create event
   */
  static async logCreate(context, resourceType, resourceId, data, metadata = {}) {
    await this.log({
      eventType: 'CREATE',
      userId: context.userId,
      tenantId: context.tenantId,
      isPlatformAdmin: context.isPlatformAdmin,
      resourceType,
      resourceId,
      action: `Created ${resourceType} ${resourceId}`,
      changes: {
        before: null,
        after: data
      },
      metadata,
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  }
  
  /**
   * Log update event
   */
  static async logUpdate(context, resourceType, resourceId, before, after, metadata = {}) {
    // Calculate what changed
    const changes = this._calculateChanges(before, after);
    
    await this.log({
      eventType: 'UPDATE',
      userId: context.userId,
      tenantId: context.tenantId,
      isPlatformAdmin: context.isPlatformAdmin,
      resourceType,
      resourceId,
      action: `Updated ${resourceType} ${resourceId}`,
      changes: {
        before: changes.before,
        after: changes.after
      },
      metadata: {
        ...metadata,
        fieldsChanged: Object.keys(changes.before)
      },
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  }
  
  /**
   * Log delete event
   */
  static async logDelete(context, resourceType, resourceId, data, metadata = {}) {
    await this.log({
      eventType: 'DELETE',
      userId: context.userId,
      tenantId: context.tenantId,
      isPlatformAdmin: context.isPlatformAdmin,
      resourceType,
      resourceId,
      action: `Deleted ${resourceType} ${resourceId}`,
      changes: {
        before: data,
        after: null
      },
      metadata,
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  }
  
  /**
   * Log authentication event
   */
  static async logAuth(userId, success, metadata = {}) {
    await this.log({
      eventType: success ? 'LOGIN' : 'AUTH_FAILURE',
      userId: userId || 'anonymous',
      userEmail: metadata.email,
      tenantId: metadata.tenantId,
      action: success ? 'User logged in' : 'Login attempt failed',
      success,
      errorMessage: metadata.errorMessage,
      metadata,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      requestId: metadata.requestId
    });
  }
  
  /**
   * Log permission denied
   */
  static async logPermissionDenied(context, resourceType, resourceId, action, metadata = {}) {
    await this.log({
      eventType: 'PERMISSION_DENIED',
      userId: context.userId,
      tenantId: context.tenantId,
      isPlatformAdmin: context.isPlatformAdmin,
      resourceType,
      resourceId,
      action: `Permission denied: ${action} on ${resourceType} ${resourceId}`,
      success: false,
      metadata,
      requestId: metadata.requestId,
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    });
  }
  
  /**
   * Get audit history for resource
   */
  static async getHistory(resourceType, resourceId, options = {}) {
    const query = {
      resourceType,
      resourceId
    };
    
    if (options.tenantId) {
      query.tenantId = options.tenantId;
    }
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    const events = await AuditEventModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    return events;
  }
  
  /**
   * Get audit trail for user
   */
  static async getUserActivity(userId, options = {}) {
    const query = { userId };
    
    if (options.eventType) {
      query.eventType = options.eventType;
    }
    
    if (options.startDate) {
      query.timestamp = { $gte: new Date(options.startDate) };
    }
    
    if (options.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
    }
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    const events = await AuditEventModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    return events;
  }
  
  /**
   * Get audit trail for tenant
   */
  static async getTenantActivity(tenantId, options = {}) {
    const query = { tenantId };
    
    if (options.eventType) {
      query.eventType = options.eventType;
    }
    
    if (options.startDate) {
      query.timestamp = { $gte: new Date(options.startDate) };
    }
    
    if (options.endDate) {
      query.timestamp = { ...query.timestamp, $lte: new Date(options.endDate) };
    }
    
    const limit = options.limit || 100;
    const skip = options.skip || 0;
    
    const events = await AuditEventModel
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .lean();
    
    return events;
  }
  
  /**
   * Calculate what changed between before/after
   * @private
   */
  static _calculateChanges(before, after) {
    const changes = { before: {}, after: {} };
    
    if (!before || !after) {
      return { before, after };
    }
    
    const allKeys = new Set([
      ...Object.keys(before),
      ...Object.keys(after)
    ]);
    
    for (const key of allKeys) {
      if (key === '_id' || key === '__v' || key === 'last_updated') {
        continue; // Skip these fields
      }
      
      const beforeValue = before[key];
      const afterValue = after[key];
      
      if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
        changes.before[key] = beforeValue;
        changes.after[key] = afterValue;
      }
    }
    
    return changes;
  }
  
  /**
   * Query audit logs with flexible filters
   */
  static async queryLogs(filters = {}) {
    const query = {};
    
    // Apply filters
    if (filters.eventType) query.eventType = filters.eventType;
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.resourceId) query.resourceId = filters.resourceId;
    if (filters.userId) query.userId = filters.userId;
    if (filters.tenantId) query.tenantId = filters.tenantId;
    
    // Date range filters
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
      if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
    }
    
    // Pagination
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Execute query
    const [events, total] = await Promise.all([
      AuditEventModel
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditEventModel.countDocuments(query)
    ]);
    
    return {
      data: events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Get audit statistics
   */
  static async getStats() {
    const [
      totalEvents,
      last24Hours,
      topEventTypes,
      topUsers
    ] = await Promise.all([
      // Total events
      AuditEventModel.countDocuments(),
      
      // Events in last 24 hours
      AuditEventModel.countDocuments({
        timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }),
      
      // Top 10 event types
      AuditEventModel.aggregate([
        {
          $group: {
            _id: '$eventType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]),
      
      // Top 10 users
      AuditEventModel.aggregate([
        {
          $group: {
            _id: '$userId',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);
    
    return {
      totalEvents,
      last24Hours,
      topEventTypes: topEventTypes.map(e => ({ eventType: e._id, count: e.count })),
      topUsers: topUsers.map(u => ({ userId: u._id, count: u.count }))
    };
  }
  
  /**
   * Cleanup old audit events based on retention policy
   */
  static async cleanup() {
    const result = await AuditEventModel.deleteMany({
      expiresAt: { $lte: new Date() }
    });
    
    logger.info('Audit trail cleanup completed', {
      deletedCount: result.deletedCount
    });
    
    return result.deletedCount;
  }
}

module.exports = {
  AuditTrail,
  AuditEventModel
};

