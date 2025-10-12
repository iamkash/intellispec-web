/**
 * MongoDB Schemas for Multi-Tenant B2B SaaS
 * 
 * Mongoose schemas with validation, indexes, and middleware
 * for tenant management system.
 */

import mongoose, { Schema, Document } from 'mongoose';
import { 
  Organization, 
  Tenant, 
  TenantEntitlements, 
  Subscription, 
  User, 
  Membership,
  Module,
  EntitlementsHistory,
  SubscriptionHistory
} from './models';

// Organization Schema
const organizationSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
  notes: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'organizations'
});

organizationSchema.index({ status: 1 });
organizationSchema.index({ name: 'text' });

// Tenant Schema
const tenantSchema = new Schema({
  id: { type: String, required: true, unique: true },
  orgId: { type: String, ref: 'Organization' },
  name: { type: String, required: true, trim: true, maxlength: 100 },
  slug: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: /^[a-z0-9-]+$/,
    maxlength: 50
  },
  status: { type: String, enum: ['active', 'archived', 'suspended'], default: 'active' },
  notes: { type: String, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'tenants'
});

tenantSchema.index({ slug: 1 }, { unique: true });
tenantSchema.index({ orgId: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ name: 'text', slug: 'text' });

// TenantEntitlements Schema
const tenantEntitlementsSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, ref: 'Tenant' },
  modules: [{ type: String, required: true }],
  sitesAllowed: { type: Number, required: true, min: 1 },
  unlimitedUsers: { type: Boolean, default: true },
  effectiveAt: { type: Date, required: true },
  version: { type: Number, required: true, min: 1 },
  changedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'tenant_entitlements'
});

tenantEntitlementsSchema.index({ tenantId: 1, version: -1 });
tenantEntitlementsSchema.index({ effectiveAt: 1 });

// Ensure System Admin module is always included
tenantEntitlementsSchema.pre('save', function() {
  if (!this.modules.includes('system')) {
    this.modules.unshift('system');
  }
});

// Subscription Schema
const subscriptionSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, ref: 'Tenant', unique: true },
  termStartAt: { type: Date, required: true },
  termEndAt: { type: Date, required: true },
  autoRenew: { type: Boolean, default: false },
  gracePeriodDays: { type: Number, default: 0, min: 0, max: 30 },
  lifecycleStatus: { 
    type: String, 
    enum: ['trialing', 'active', 'grace', 'expired', 'cancelled', 'suspended'],
    default: 'active'
  },
  cancelledAt: { type: Date },
  suspendedAt: { type: Date },
  terminatedAt: { type: Date },
  lastLifecycleCheckAt: { type: Date },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'subscriptions'
});

subscriptionSchema.index({ tenantId: 1 }, { unique: true });
subscriptionSchema.index({ lifecycleStatus: 1 });
subscriptionSchema.index({ termEndAt: 1 });
subscriptionSchema.index({ lastLifecycleCheckAt: 1 });

// Validate term dates
subscriptionSchema.pre('save', function() {
  if (this.termEndAt <= this.termStartAt) {
    throw new Error('Term end date must be after start date');
  }
});

// User Schema
const userSchema = new Schema({
  id: { type: String, required: true, unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  name: { type: String, trim: true, maxlength: 100 },
  status: { type: String, enum: ['active', 'invited', 'disabled'], default: 'invited' },
  authProviderId: { type: String },
  avatar: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
}, {
  timestamps: true,
  collection: 'users'
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ status: 1 });
userSchema.index({ email: 'text', name: 'text' });

// Membership Schema
const membershipSchema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, ref: 'User' },
  tenantId: { type: String, required: true, ref: 'Tenant' },
  role: { 
    type: String, 
    enum: ['tenant_admin', 'user', 'viewer', 'custom'], 
    default: 'user' 
  },
  permissions: [{ type: String }], // For custom roles
  createdAt: { type: Date, default: Date.now },
  createdBy: { type: String, required: true }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'memberships'
});

membershipSchema.index({ userId: 1 });
membershipSchema.index({ tenantId: 1 });
membershipSchema.index({ userId: 1, tenantId: 1 }, { unique: true });

// Module Schema (from existing system)
const moduleSchema = new Schema({
  key: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived', 'deprecated'], default: 'active' },
  category: { type: String, required: true },
  defaultIncludedInFlex: { type: Boolean, default: false },
  icon: { type: String, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'modules'
});

moduleSchema.index({ key: 1 }, { unique: true });
moduleSchema.index({ status: 1 });
moduleSchema.index({ category: 1 });

// EntitlementsHistory Schema
const entitlementsHistorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, ref: 'Tenant' },
  version: { type: Number, required: true },
  changeType: { type: String, enum: ['created', 'updated', 'archived'], required: true },
  changedBy: { type: String, required: true },
  changeReason: { type: String },
  beforeSnapshot: { type: Object },
  afterSnapshot: { type: Object, required: true },
  diff: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'entitlements_history'
});

entitlementsHistorySchema.index({ tenantId: 1, createdAt: -1 });
entitlementsHistorySchema.index({ changedBy: 1 });

// SubscriptionHistory Schema
const subscriptionHistorySchema = new Schema({
  id: { type: String, required: true, unique: true },
  tenantId: { type: String, required: true, ref: 'Tenant' },
  changeType: { 
    type: String, 
    enum: ['created', 'updated', 'extended', 'suspended', 'resumed', 'cancelled'], 
    required: true 
  },
  changedBy: { type: String, required: true },
  changeReason: { type: String },
  beforeSnapshot: { type: Object },
  afterSnapshot: { type: Object, required: true },
  diff: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, {
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'subscription_history'
});

subscriptionHistorySchema.index({ tenantId: 1, createdAt: -1 });
subscriptionHistorySchema.index({ changedBy: 1 });

// Export Models
export const OrganizationModel = mongoose.model('Organization', organizationSchema);
export const TenantModel = mongoose.model('Tenant', tenantSchema);
export const TenantEntitlementsModel = mongoose.model('TenantEntitlements', tenantEntitlementsSchema);
export const SubscriptionModel = mongoose.model('Subscription', subscriptionSchema);
export const UserModel = mongoose.model('User', userSchema);
export const MembershipModel = mongoose.model('Membership', membershipSchema);
export const ModuleModel = mongoose.model('Module', moduleSchema);
export const EntitlementsHistoryModel = mongoose.model('EntitlementsHistory', entitlementsHistorySchema);
export const SubscriptionHistoryModel = mongoose.model('SubscriptionHistory', subscriptionHistorySchema);

// Utility function to generate IDs
export const generateId = (prefix: string): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
