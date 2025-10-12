/**
 * Membership Model
 * 
 * Represents user-tenant membership relationships
 * Defines which users belong to which tenants and their roles
 * 
 * Used for:
 * - Multi-tenant access control
 * - User-tenant assignments
 * - Role-based permissions per tenant
 * - Tenant switching for multi-tenant users
 */

const mongoose = require('mongoose');

const MembershipSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  tenantId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    required: true,
    enum: ['tenant_admin', 'user', 'viewer', 'editor'],
    default: 'user',
    index: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  createdBy: {
    type: String
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String
  },
  // Soft delete support
  deleted: {
    type: Boolean,
    default: false,
    index: true
  },
  deletedAt: {
    type: Date
  },
  deletedBy: {
    type: String
  }
}, {
  collection: 'memberships',
  timestamps: false // We handle timestamps manually
});

// Compound indexes for efficient queries
MembershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });
MembershipSchema.index({ tenantId: 1, role: 1 });
MembershipSchema.index({ userId: 1, status: 1 });
MembershipSchema.index({ deleted: 1, status: 1 });

// Pre-save middleware to update timestamps
MembershipSchema.pre('save', function(next) {
  if (this.isNew) {
    this.createdAt = new Date();
  }
  this.updatedAt = new Date();
  next();
});

// Instance methods (simple getters only - no database operations)
MembershipSchema.methods = {
  /**
   * Check if membership is active
   * Simple getter - no database operations
   */
  isActive() {
    return this.status === 'active' && !this.deleted;
  },

  /**
   * Check if user is admin for this tenant
   * Simple getter - no database operations
   */
  isAdmin() {
    return this.role === 'tenant_admin';
  }
};

// Note: Database operations and queries moved to MembershipRepository
// Use MembershipRepository for:
// - softDelete() -> repository.delete(id)
// - findActiveByUserAndTenant() -> repository.findByUserAndTenant()
// - getUserTenants() -> repository.getUserTenants()
// - getTenantUsers() -> repository.getTenantUsers()
// - isTenantAdmin() -> repository.isTenantAdmin()

// Prevent model overwrite during development
const MembershipModel = mongoose.models.Membership || mongoose.model('Membership', MembershipSchema);

module.exports = MembershipModel;

