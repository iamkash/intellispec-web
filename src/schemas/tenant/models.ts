/**
 * Multi-Tenant B2B SaaS Data Models
 * 
 * Core data structures for tenant management, entitlements, subscriptions,
 * and user memberships in a single-domain multi-tenant architecture.
 */

export interface Organization {
  id: string;
  name: string;
  status: 'active' | 'archived';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  orgId?: string; // Optional organization grouping
  name: string;
  slug: string; // URL-safe identifier for routing
  status: 'active' | 'archived' | 'suspended';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  organization?: Organization;
  subscription?: Subscription;
  entitlements?: TenantEntitlements;
  userCount?: number;
}

export interface TenantEntitlements {
  id: string;
  tenantId: string;
  modules: string[]; // Module keys - System Admin always included
  sitesAllowed: number; // Minimum 1
  unlimitedUsers: boolean; // Always true per requirements
  effectiveAt: Date;
  version: number; // Incremented on each change
  changedBy: string; // User email who made the change
  createdAt: Date;
  // Computed fields
  moduleDetails?: Module[];
}

export interface Subscription {
  id: string;
  tenantId: string;
  termStartAt: Date;
  termEndAt: Date;
  autoRenew: boolean;
  gracePeriodDays: number;
  lifecycleStatus: 'trialing' | 'active' | 'grace' | 'expired' | 'cancelled' | 'suspended';
  cancelledAt?: Date;
  suspendedAt?: Date;
  terminatedAt?: Date;
  lastLifecycleCheckAt?: Date;
  metadata?: Record<string, any>; // For trial flags, etc.
  createdAt: Date;
  updatedAt: Date;
  // Computed fields
  daysRemaining?: number;
  isInGrace?: boolean;
  canAccess?: boolean;
}

export interface User {
  id: string;
  email: string; // Globally unique
  name?: string;
  status: 'active' | 'invited' | 'disabled';
  authProviderId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Computed fields
  memberships?: Membership[];
}

export interface Membership {
  id: string;
  userId: string;
  tenantId: string;
  role: 'tenant_admin' | 'user' | 'viewer' | 'custom';
  permissions?: string[]; // For custom roles
  createdAt: Date;
  createdBy: string; // User ID who created this membership
  // Computed fields
  user?: User;
  tenant?: Tenant;
}

export interface Module {
  key: string;
  name: string;
  status: 'active' | 'archived' | 'deprecated';
  category: string;
  defaultIncludedInFlex: boolean;
  icon: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Audit and History Models
export interface EntitlementsHistory {
  id: string;
  tenantId: string;
  version: number;
  changeType: 'created' | 'updated' | 'archived';
  changedBy: string;
  changeReason?: string;
  beforeSnapshot?: Partial<TenantEntitlements>;
  afterSnapshot: TenantEntitlements;
  diff: string; // Human-readable summary of changes
  createdAt: Date;
}

export interface SubscriptionHistory {
  id: string;
  tenantId: string;
  changeType: 'created' | 'updated' | 'extended' | 'suspended' | 'resumed' | 'cancelled';
  changedBy: string;
  changeReason?: string;
  beforeSnapshot?: Partial<Subscription>;
  afterSnapshot: Subscription;
  diff: string;
  createdAt: Date;
}

// API Request/Response Types
export interface CreateTenantRequest {
  name: string;
  slug: string;
  orgId?: string;
  status?: 'active' | 'archived';
  notes?: string;
  // Entitlements
  sitesAllowed: number;
  modules: string[];
  // First user
  firstUserEmail: string;
  firstUserName?: string;
  firstUserRole?: 'tenant_admin' | 'user';
  sendInvite?: boolean;
  // Subscription
  termStartAt?: Date;
  termEndAt?: Date;
  autoRenew?: boolean;
  gracePeriodDays?: number;
}

export interface UpdateTenantRequest {
  name?: string;
  slug?: string;
  orgId?: string;
  status?: 'active' | 'archived' | 'suspended';
  notes?: string;
}

export interface UpdateEntitlementsRequest {
  modules: string[];
  sitesAllowed: number;
  changeReason?: string;
}

export interface UpdateSubscriptionRequest {
  termStartAt?: Date;
  termEndAt?: Date;
  autoRenew?: boolean;
  gracePeriodDays?: number;
  changeReason?: string;
}

export interface ExtendSubscriptionRequest {
  days: number;
  changeReason?: string;
}

// Session and Auth Types
export interface UserSession {
  userId: string;
  email: string;
  name?: string;
  activeTenantId?: string;
  activeTenantSlug?: string;
  memberships: {
    tenantId: string;
    tenantSlug: string;
    tenantName: string;
    orgName?: string;
    role: string;
  }[];
  isSuperAdmin: boolean;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  tenantName: string;
  orgName?: string;
  userRole: string;
  canAccess: boolean;
  lifecycleStatus: string;
  entitlements: {
    modules: string[];
    sitesAllowed: number;
  };
}

// Lifecycle and Gating
export interface AccessGate {
  canAccess: boolean;
  reason?: string;
  allowedModules: string[];
  isReadOnly: boolean;
  bannerMessage?: string;
}

// Notification Types
export interface NotificationEvent {
  type: 'subscription_expiring' | 'subscription_expired' | 'subscription_grace' | 'subscription_suspended' | 'subscription_resumed';
  tenantId: string;
  daysUntilExpiry?: number;
  metadata?: Record<string, any>;
}
