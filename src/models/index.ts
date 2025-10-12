/**
 * MongoDB Models for SaaS B2B Multitenant App with AI RAG
 * 
 * This module provides strongly typed MongoDB models for:
 * - Multitenant architecture with tenant isolation
 * - RBAC (Role-Based Access Control) system
 * - User authentication with security features
 * - Comprehensive audit logging
 * - AI RAG enablement for document search and analysis
 * 
 * Security Features:
 * - Password hashing with bcrypt
 * - Account lockout after failed attempts
 * - Rate limiting support
 * - Comprehensive audit logging
 * 
 * AI RAG Features:
 * - Vector embeddings for semantic search
 * - Document metadata for context
 * - RAG-ready document structure
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==================== INTERFACES ====================

/**
 * Tenant interface - represents a SaaS tenant organization
 */
export interface ITenant extends Document {
  tenantSlug: string;
  name: string;
  domain?: string;
  status: 'active' | 'suspended' | 'inactive';
  subscription: {
    plan: string;
    status: 'active' | 'trial' | 'expired' | 'cancelled';
    startDate: Date;
    endDate?: Date;
  };
  settings: {
    maxUsers: number;
    features: string[];
    customBranding?: {
      logo?: string;
      primaryColor?: string;
      companyName?: string;
    };
  };
  aiRagSettings: {
    enabled: boolean;
    maxDocuments: number;
    vectorDimensions: number;
    embeddingModel: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Role interface - defines permissions for RBAC
 */
export interface IRole extends Document {
  tenantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  isExternalCustomer: boolean; // Flag for external customer role restrictions
  allowedRoutes: string[];     // Restricted routes for external customers
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User interface - represents a user in the system
 */
export interface IUser extends Document {
  tenantId: mongoose.Types.ObjectId;
  userId: string;             // Unique user identifier for tenant discovery
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'locked' | 'pending';
  roleIds: mongoose.Types.ObjectId[];
  
  // Security fields
  loginAttempts: number;
  lockUntil?: Date;
  lastLogin?: Date;
  passwordChangedAt: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  
  // AI RAG user preferences
  aiPreferences: {
    preferredLanguage: string;
    ragSearchEnabled: boolean;
    maxSearchResults: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  isAccountLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

/**
 * Authentication Log interface - tracks all auth events
 */
export interface IAuthLog extends Document {
  tenantSlug: string;
  userId: string;
  email?: string;
  action: 'login_success' | 'login_failure' | 'logout' | 'password_reset' | 'account_locked' | 'token_refresh';
  ipAddress: string;
  userAgent?: string;
  metadata?: any;
  timestamp: Date;
}

/**
 * RAG Document interface - for AI-enabled document search
 */
export interface IRagDocument extends Document {
  tenantId: mongoose.Types.ObjectId;
  title: string;
  content: string;
  metadata: {
    documentType: string;
    tags: string[];
    author?: string;
    category?: string;
    confidentialityLevel: 'public' | 'internal' | 'confidential' | 'restricted';
  };
  vectorEmbedding: number[];  // Vector embeddings for semantic search
  textChunks: Array<{
    chunkId: string;
    content: string;
    embedding: number[];
    startPosition: number;
    endPosition: number;
  }>;
  accessControl: {
    roleIds: mongoose.Types.ObjectId[];
    userIds: mongoose.Types.ObjectId[];
    isPublic: boolean;
  };
  ragMetrics: {
    searchCount: number;
    lastAccessed?: Date;
    relevanceScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// ==================== SCHEMAS ====================

const TenantSchema = new Schema<any>({
  tenantSlug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[a-z0-9-]+$/,
    minlength: 2,
    maxlength: 50
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  domain: {
    type: String,
    sparse: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'inactive'],
    default: 'active'
  },
  subscription: {
    plan: {
      type: String,
      required: true,
      default: 'trial'
    },
    status: {
      type: String,
      enum: ['active', 'trial', 'expired', 'cancelled'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date
  },
  settings: {
    maxUsers: {
      type: Number,
      default: 10
    },
    features: [String],
    customBranding: {
      logo: String,
      primaryColor: String,
      companyName: String
    }
  },
  aiRagSettings: {
    enabled: {
      type: Boolean,
      default: false
    },
    maxDocuments: {
      type: Number,
      default: 1000
    },
    vectorDimensions: {
      type: Number,
      default: 1536  // OpenAI text-embedding-ada-002 dimensions
    },
    embeddingModel: {
      type: String,
      default: 'text-embedding-ada-002'
    }
  }
}, {
  timestamps: true
});

// Add indexes for performance
TenantSchema.index({ tenantSlug: 1 });
TenantSchema.index({ domain: 1 });
TenantSchema.index({ status: 1 });

const RoleSchema = new Schema<any>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  description: {
    type: String,
    maxlength: 200
  },
  permissions: [{
    type: String,
    required: true
  }],
  isSystemRole: {
    type: Boolean,
    default: false
  },
  isExternalCustomer: {
    type: Boolean,
    default: false
  },
  allowedRoutes: [{
    type: String
  }]
}, {
  timestamps: true
});

// Compound index for tenant-scoped role queries
RoleSchema.index({ tenantId: 1, name: 1 }, { unique: true });
RoleSchema.index({ tenantId: 1, isExternalCustomer: 1 });

const UserSchema = new Schema<any>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  userId: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: String,
  status: {
    type: String,
    enum: ['active', 'inactive', 'locked', 'pending'],
    default: 'pending'
  },
  roleIds: [{
    type: Schema.Types.ObjectId,
    ref: 'Role'
  }],
  
  // Security fields
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  lastLogin: Date,
  passwordChangedAt: {
    type: Date,
    default: Date.now
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // AI RAG user preferences
  aiPreferences: {
    preferredLanguage: {
      type: String,
      default: 'en'
    },
    ragSearchEnabled: {
      type: Boolean,
      default: true
    },
    maxSearchResults: {
      type: Number,
      default: 10
    }
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  // Use proper typing for mongoose document
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    this.passwordChangedAt = new Date();
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance methods
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isAccountLocked = function(): boolean {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

UserSchema.methods.incrementLoginAttempts = async function(): Promise<void> {
  // If previous lock has expired, reset attempts
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates: any = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 30 minutes
  if (this.loginAttempts + 1 >= 5 && !this.isAccountLocked()) {
    updates.$set = { lockUntil: Date.now() + 30 * 60 * 1000 }; // 30 minutes
  }
  
  return this.updateOne(updates);
};

UserSchema.methods.resetLoginAttempts = async function(): Promise<void> {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Indexes for performance and uniqueness
UserSchema.index({ tenantId: 1, userId: 1 }, { unique: true });
UserSchema.index({ tenantId: 1, email: 1 }, { unique: true });
UserSchema.index({ email: 1 }); // For tenant discovery
UserSchema.index({ tenantId: 1, status: 1 });
UserSchema.index({ lockUntil: 1 });

const AuthLogSchema = new Schema<any>({
  tenantSlug: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  },
  action: {
    type: String,
    enum: ['login_success', 'login_failure', 'logout', 'password_reset', 'account_locked', 'token_refresh'],
    required: true
  },
  ipAddress: {
    type: String,
    required: true
  },
  userAgent: String,
  metadata: Schema.Types.Mixed,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Indexes for efficient log querying
AuthLogSchema.index({ tenantSlug: 1, timestamp: -1 });
AuthLogSchema.index({ userId: 1, timestamp: -1 });
AuthLogSchema.index({ ipAddress: 1, timestamp: -1 });
AuthLogSchema.index({ action: 1, timestamp: -1 });

const RagDocumentSchema = new Schema<any>({
  tenantId: {
    type: Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  metadata: {
    documentType: {
      type: String,
      required: true
    },
    tags: [String],
    author: String,
    category: String,
    confidentialityLevel: {
      type: String,
      enum: ['public', 'internal', 'confidential', 'restricted'],
      default: 'internal'
    }
  },
  vectorEmbedding: [{
    type: Number
  }],
  textChunks: [{
    chunkId: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    embedding: [Number],
    startPosition: Number,
    endPosition: Number
  }],
  accessControl: {
    roleIds: [{
      type: Schema.Types.ObjectId,
      ref: 'Role'
    }],
    userIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  ragMetrics: {
    searchCount: {
      type: Number,
      default: 0
    },
    lastAccessed: Date,
    relevanceScore: Number
  }
}, {
  timestamps: true
});

// Indexes for vector search and access control
RagDocumentSchema.index({ tenantId: 1, 'metadata.documentType': 1 });
RagDocumentSchema.index({ tenantId: 1, 'metadata.tags': 1 });
RagDocumentSchema.index({ tenantId: 1, 'metadata.confidentialityLevel': 1 });
RagDocumentSchema.index({ 'accessControl.isPublic': 1 });
RagDocumentSchema.index({ 'accessControl.roleIds': 1 });
RagDocumentSchema.index({ 'accessControl.userIds': 1 });

// ==================== MODELS ====================

export const Tenant = mongoose.model('Tenant', TenantSchema);
export const Role = mongoose.model('Role', RoleSchema);
export const User = mongoose.model('User', UserSchema);
export const AuthLog = mongoose.model('AuthLog', AuthLogSchema);
export const RagDocument = mongoose.model('RagDocument', RagDocumentSchema);

// ==================== DEFAULT ROLES ====================

/**
 * Creates default roles for a tenant
 */
export const createDefaultRoles = async (tenantId: mongoose.Types.ObjectId): Promise<any[]> => {
  const defaultRoles = [
    {
      tenantId,
      name: 'Super Admin',
      description: 'Full system access',
      permissions: ['*'],
      isSystemRole: true,
      isExternalCustomer: false,
      allowedRoutes: ['*']
    },
    {
      tenantId,
      name: 'Admin',
      description: 'Administrative access within tenant',
      permissions: [
        'user.read', 'user.write', 'role.read', 'role.write',
        'dashboard.read', 'reports.read', 'settings.read', 'settings.write'
      ],
      isSystemRole: true,
      isExternalCustomer: false,
      allowedRoutes: ['/dashboard', '/users', '/roles', '/reports', '/settings']
    },
    {
      tenantId,
      name: 'Internal User',
      description: 'Standard internal user access',
      permissions: ['dashboard.read', 'reports.read', 'user.read_own'],
      isSystemRole: true,
      isExternalCustomer: false,
      allowedRoutes: ['/dashboard', '/reports', '/profile']
    },
    {
      tenantId,
      name: 'External Customer',
      description: 'Limited access for external customers',
      permissions: ['dashboard.read'],
      isSystemRole: true,
      isExternalCustomer: true,
      allowedRoutes: ['/dashboard'] // Only dashboard routes
    }
  ];

  const roles = await Role.insertMany(defaultRoles as any[]);
  return roles as any[];
};

export default {
  Tenant,
  Role,
  User,
  AuthLog,
  RagDocument,
  createDefaultRoles
};
