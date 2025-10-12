/**
 * RBAC Service - Role-Based Access Control System
 * 
 * Provides comprehensive role-based access control for the SaaS B2B multitenant app:
 * - Tenant isolation at all levels
 * - External customer restrictions to dashboard routes only
 * - Hierarchical permission system
 * - Dynamic route access control
 * - Permission inheritance and composition
 * - Audit logging for access decisions
 * 
 * Features:
 * - Fine-grained permissions with wildcard support
 * - Role composition and inheritance
 * - Dynamic permission evaluation
 * - Resource-level access control
 * - Tenant-scoped data isolation
 * - External customer limitations
 * - Comprehensive logging and monitoring
 */

import { User, Role, Tenant, AuthLog, IUser, IRole, ITenant } from '../models';
import mongoose from 'mongoose';

// ==================== TYPES AND INTERFACES ====================

/**
 * Permission structure with resource and action
 */
export interface Permission {
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
}

/**
 * Permission condition for dynamic evaluation
 */
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists' | 'regex';
  value: any;
}

/**
 * Access context for permission evaluation
 */
export interface AccessContext {
  user: {
    id: string;
    tenantId: string;
    tenantSlug: string;
    userId: string;
    email: string;
    roles: IRole[];
    isExternalCustomer: boolean;
  };
  resource?: {
    type: string;
    id?: string;
    tenantId?: string;
    metadata?: Record<string, any>;
  };
  action: string;
  route?: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Access decision result
 */
export interface AccessDecision {
  granted: boolean;
  reason: string;
  permissions: string[];
  conditions?: PermissionCondition[];
  restrictions?: string[];
}

/**
 * Role hierarchy configuration
 */
export interface RoleHierarchy {
  [roleName: string]: {
    inherits?: string[];
    excludes?: string[];
    overrides?: string[];
  };
}

/**
 * Permission registry for predefined permissions
 */
export interface PermissionRegistry {
  [permission: string]: {
    description: string;
    resource: string;
    action: string;
    category: string;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

// ==================== PERMISSION REGISTRY ====================

/**
 * Standard permission definitions
 */
export const PERMISSIONS: PermissionRegistry = {
  // User Management
  'user.read': {
    description: 'View user information',
    resource: 'user',
    action: 'read',
    category: 'user_management',
    riskLevel: 'low'
  },
  'user.read_own': {
    description: 'View own user information',
    resource: 'user',
    action: 'read_own',
    category: 'user_management',
    riskLevel: 'low'
  },
  'user.write': {
    description: 'Create and modify users',
    resource: 'user',
    action: 'write',
    category: 'user_management',
    riskLevel: 'high'
  },
  'user.delete': {
    description: 'Delete users',
    resource: 'user',
    action: 'delete',
    category: 'user_management',
    riskLevel: 'critical'
  },

  // Role Management
  'role.read': {
    description: 'View roles and permissions',
    resource: 'role',
    action: 'read',
    category: 'role_management',
    riskLevel: 'medium'
  },
  'role.write': {
    description: 'Create and modify roles',
    resource: 'role',
    action: 'write',
    category: 'role_management',
    riskLevel: 'high'
  },
  'role.delete': {
    description: 'Delete roles',
    resource: 'role',
    action: 'delete',
    category: 'role_management',
    riskLevel: 'critical'
  },

  // Dashboard Access
  'dashboard.read': {
    description: 'Access dashboard and reports',
    resource: 'dashboard',
    action: 'read',
    category: 'analytics',
    riskLevel: 'low'
  },
  'dashboard.write': {
    description: 'Modify dashboard configuration',
    resource: 'dashboard',
    action: 'write',
    category: 'analytics',
    riskLevel: 'medium'
  },

  // Reports
  'reports.read': {
    description: 'View reports',
    resource: 'reports',
    action: 'read',
    category: 'analytics',
    riskLevel: 'low'
  },
  'reports.generate': {
    description: 'Generate new reports',
    resource: 'reports',
    action: 'generate',
    category: 'analytics',
    riskLevel: 'medium'
  },
  'reports.export': {
    description: 'Export report data',
    resource: 'reports',
    action: 'export',
    category: 'analytics',
    riskLevel: 'medium'
  },

  // Settings
  'settings.read': {
    description: 'View system settings',
    resource: 'settings',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'settings.write': {
    description: 'Modify system settings',
    resource: 'settings',
    action: 'write',
    category: 'administration',
    riskLevel: 'high'
  },

  // AI RAG
  'rag.read': {
    description: 'Search and access RAG documents',
    resource: 'rag',
    action: 'read',
    category: 'ai_features',
    riskLevel: 'low'
  },
  'rag.write': {
    description: 'Upload and manage RAG documents',
    resource: 'rag',
    action: 'write',
    category: 'ai_features',
    riskLevel: 'medium'
  },
  'rag.delete': {
    description: 'Delete RAG documents',
    resource: 'rag',
    action: 'delete',
    category: 'ai_features',
    riskLevel: 'high'
  },

  // Audit Logs
  'audit.read': {
    description: 'View audit logs',
    resource: 'audit',
    action: 'read',
    category: 'security',
    riskLevel: 'medium'
  },

  // Tenant Management
  'admin.tenants.view': {
    description: 'View tenant information',
    resource: 'tenants',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin.tenants.create': {
    description: 'Create new tenants',
    resource: 'tenants',
    action: 'create',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.tenants.update': {
    description: 'Update tenant information',
    resource: 'tenants',
    action: 'update',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.tenants.delete': {
    description: 'Delete tenants',
    resource: 'tenants',
    action: 'delete',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.tenants.manage': {
    description: 'Full tenant management access',
    resource: 'tenants',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.tenants.suspend': {
    description: 'Suspend tenant accounts',
    resource: 'tenants',
    action: 'suspend',
    category: 'administration',
    riskLevel: 'high'
  },

  // User Management
  'admin.users.view': {
    description: 'View user information across tenants',
    resource: 'users',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin.users.create': {
    description: 'Create new users',
    resource: 'users',
    action: 'create',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.users.update': {
    description: 'Update user information',
    resource: 'users',
    action: 'update',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.users.delete': {
    description: 'Delete users',
    resource: 'users',
    action: 'delete',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.users.manage': {
    description: 'Full user management access',
    resource: 'users',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.users.suspend': {
    description: 'Suspend user accounts',
    resource: 'users',
    action: 'suspend',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.users.impersonate': {
    description: 'Impersonate users',
    resource: 'users',
    action: 'impersonate',
    category: 'administration',
    riskLevel: 'critical'
  },

  // Role Management
  'admin.roles.view': {
    description: 'View roles and permissions',
    resource: 'roles',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin.roles.create': {
    description: 'Create new roles',
    resource: 'roles',
    action: 'create',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.roles.update': {
    description: 'Update roles and permissions',
    resource: 'roles',
    action: 'update',
    category: 'administration',
    riskLevel: 'high'
  },
  'admin.roles.delete': {
    description: 'Delete roles',
    resource: 'roles',
    action: 'delete',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.roles.manage': {
    description: 'Full role management access',
    resource: 'roles',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.roles.assign': {
    description: 'Assign roles to users',
    resource: 'roles',
    action: 'assign',
    category: 'administration',
    riskLevel: 'high'
  },

  // System Administration
  'admin.view': {
    description: 'View admin dashboard',
    resource: 'admin',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin.config.global': {
    description: 'Manage global system configuration',
    resource: 'config',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.licenses.manage': {
    description: 'Manage system licenses',
    resource: 'licenses',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },
  'admin.monitoring.view': {
    description: 'View system monitoring data',
    resource: 'monitoring',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin.audit.view': {
    description: 'View audit logs',
    resource: 'audit',
    action: 'read',
    category: 'administration',
    riskLevel: 'medium'
  },
  'admin': {
    description: 'Full administrative access',
    resource: '*',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  },

  // Wildcard permissions
  '*': {
    description: 'All permissions',
    resource: '*',
    action: '*',
    category: 'administration',
    riskLevel: 'critical'
  }
};

/**
 * External customer allowed routes
 */
export const EXTERNAL_CUSTOMER_ROUTES = [
  '/dashboard',
  '/dashboard/*',
  '/profile',
  '/profile/*',
  '/api/auth/me',
  '/api/auth/logout',
  '/api/auth/change-password',
  '/api/dashboard/*'
];

// ==================== RBAC SERVICE CLASS ====================

export class RBACService {
  private static instance: RBACService;
  private permissionCache = new Map<string, AccessDecision>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): RBACService {
    if (!RBACService.instance) {
      RBACService.instance = new RBACService();
    }
    return RBACService.instance;
  }

  /**
   * Check if user has permission to perform action
   */
  async checkPermission(context: AccessContext): Promise<AccessDecision> {
    try {
      // Generate cache key
      const cacheKey = this.generateCacheKey(context);
      
      // Check cache first
      const cached = this.permissionCache.get(cacheKey);
      if (cached && Date.now() - (cached as any).timestamp < this.cacheTimeout) {
        return cached;
      }

      // Perform permission check
      const decision = await this.evaluatePermission(context);
      
      // Cache result
      (decision as any).timestamp = Date.now();
      this.permissionCache.set(cacheKey, decision);
      
      // Log access decision
      await this.logAccessDecision(context, decision);
      
      return decision;
    } catch (error) {
      console.error('Permission check failed:', error);
      return {
        granted: false,
        reason: 'Permission evaluation failed',
        permissions: []
      };
    }
  }

  /**
   * Evaluate permission based on context
   */
  private async evaluatePermission(context: AccessContext): Promise<AccessDecision> {
    const { user, action, resource, route } = context;

    // Step 1: Check tenant isolation
    if (resource && resource.tenantId && resource.tenantId !== user.tenantId) {
      return {
        granted: false,
        reason: 'Access denied: Resource belongs to different tenant',
        permissions: []
      };
    }

    // Step 2: Check external customer restrictions
    if (user.isExternalCustomer) {
      const routeAllowed = this.isRouteAllowedForExternalCustomer(route);
      if (!routeAllowed) {
        return {
          granted: false,
          reason: 'Access denied: Route restricted for external customers',
          permissions: [],
          restrictions: EXTERNAL_CUSTOMER_ROUTES
        };
      }
    }

    // Step 3: Get all user permissions
    const userPermissions = await this.getUserPermissions(user);

    // Step 4: Check for wildcard permission
    if (userPermissions.includes('*')) {
      return {
        granted: true,
        reason: 'Access granted: Wildcard permission',
        permissions: ['*']
      };
    }

    // Step 5: Check specific permissions
    const requiredPermission = this.constructPermission(action, resource?.type);
    const hasPermission = this.hasRequiredPermission(userPermissions, requiredPermission);

    if (hasPermission) {
      // Step 6: Evaluate conditions if any
      const conditionsResult = await this.evaluateConditions(context, userPermissions);
      
      return {
        granted: conditionsResult.granted,
        reason: conditionsResult.granted ? 
          'Access granted: Permission and conditions satisfied' : 
          conditionsResult.reason,
        permissions: userPermissions.filter(p => 
          p === requiredPermission || 
          p === '*' || 
          this.isPermissionMatch(p, requiredPermission)
        ),
        conditions: conditionsResult.conditions
      };
    }

    return {
      granted: false,
      reason: `Access denied: Missing permission '${requiredPermission}'`,
      permissions: userPermissions
    };
  }

  /**
   * Get all permissions for a user including role inheritance
   */
  private async getUserPermissions(user: AccessContext['user']): Promise<string[]> {
    const permissions = new Set<string>();

    for (const role of user.roles) {
      // Add direct role permissions
      role.permissions.forEach(permission => permissions.add(permission));
      
      // Add inherited permissions (if role hierarchy is implemented)
      const inheritedPermissions = await this.getInheritedPermissions(role);
      inheritedPermissions.forEach(permission => permissions.add(permission));
    }

    return Array.from(permissions);
  }

  /**
   * Get inherited permissions from role hierarchy
   */
  private async getInheritedPermissions(role: IRole): Promise<string[]> {
    // This can be extended to support role hierarchy
    // For now, return empty array as roles are independent
    return [];
  }

  /**
   * Check if user has the required permission
   */
  private hasRequiredPermission(userPermissions: string[], requiredPermission: string): boolean {
    return userPermissions.some(permission => 
      permission === '*' || 
      permission === requiredPermission ||
      this.isPermissionMatch(permission, requiredPermission)
    );
  }

  /**
   * Check if a permission pattern matches the required permission
   */
  private isPermissionMatch(pattern: string, required: string): boolean {
    if (pattern === '*') return true;
    
    // Support wildcard patterns like "user.*", "*.read"
    const patternParts = pattern.split('.');
    const requiredParts = required.split('.');
    
    if (patternParts.length !== requiredParts.length) {
      return false;
    }
    
    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] !== '*' && patternParts[i] !== requiredParts[i]) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Construct permission string from action and resource
   */
  private constructPermission(action: string, resourceType?: string): string {
    if (!resourceType) return action;
    return `${resourceType}.${action}`;
  }

  /**
   * Evaluate permission conditions
   */
  private async evaluateConditions(
    context: AccessContext, 
    permissions: string[]
  ): Promise<{ granted: boolean; reason: string; conditions?: PermissionCondition[] }> {
    // For now, return true as basic implementation
    // This can be extended to support complex condition evaluation
    return {
      granted: true,
      reason: 'Conditions satisfied'
    };
  }

  /**
   * Check if route is allowed for external customers
   */
  private isRouteAllowedForExternalCustomer(route?: string): boolean {
    if (!route) return true;
    
    return EXTERNAL_CUSTOMER_ROUTES.some(allowedRoute => {
      if (allowedRoute.endsWith('*')) {
        const prefix = allowedRoute.slice(0, -1);
        return route.startsWith(prefix);
      }
      return route === allowedRoute;
    });
  }

  /**
   * Generate cache key for permission check
   */
  private generateCacheKey(context: AccessContext): string {
    const keyComponents = [
      context.user.id,
      context.user.tenantId,
      context.action,
      context.resource?.type || 'null',
      context.resource?.id || 'null',
      context.route || 'null'
    ];
    return keyComponents.join('|');
  }

  /**
   * Log access decision for audit trail
   */
  private async logAccessDecision(context: AccessContext, decision: AccessDecision): Promise<void> {
    try {
      await AuthLog.create({
        tenantSlug: context.user.tenantSlug,
        userId: context.user.userId,
        email: context.user.email,
        action: decision.granted ? 'access_granted' : 'access_denied',
        ipAddress: context.ipAddress || 'unknown',
        userAgent: context.userAgent,
        metadata: {
          resource: context.resource?.type,
          resourceId: context.resource?.id,
          requiredAction: context.action,
          route: context.route,
          reason: decision.reason,
          permissions: decision.permissions,
          isExternalCustomer: context.user.isExternalCustomer
        },
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log access decision:', error);
    }
  }

  /**
   * Clear permission cache for user
   */
  clearUserCache(userId: string): void {
    const keysToDelete = Array.from(this.permissionCache.keys())
      .filter(key => key.startsWith(userId));
    
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  /**
   * Clear all permission cache
   */
  clearCache(): void {
    this.permissionCache.clear();
  }
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Create a new role with permissions
 */
export async function createRole(
  tenantId: string,
  roleName: string,
  permissions: string[],
  options: {
    description?: string;
    isExternalCustomer?: boolean;
    allowedRoutes?: string[];
  } = {}
): Promise<any> {
  // Validate permissions
  const validPermissions = permissions.filter(permission => 
    PERMISSIONS[permission] || permission === '*' || permission.includes('.')
  );

  if (validPermissions.length !== permissions.length) {
    throw new Error('Invalid permissions provided');
  }

  const role = new Role({
    tenantId: new mongoose.Types.ObjectId(tenantId),
    name: roleName,
    description: options.description,
    permissions: validPermissions,
    isSystemRole: false,
    isExternalCustomer: options.isExternalCustomer || false,
    allowedRoutes: options.allowedRoutes || (options.isExternalCustomer ? EXTERNAL_CUSTOMER_ROUTES : [])
  });

  return await (role.save() as any);
}

/**
 * Assign role to user
 */
export async function assignRoleToUser(userId: string, roleId: string): Promise<IUser | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const userDoc = user as any;
  const roleIds = (userDoc.roleIds as mongoose.Types.ObjectId[]) || [];
  const roleObjId = new mongoose.Types.ObjectId(roleId);
  if (!roleIds.some((id: mongoose.Types.ObjectId) => id.toString() === roleObjId.toString())) {
    roleIds.push(roleObjId);
    userDoc.roleIds = roleIds;
    await user.save();
    
    // Clear user's permission cache
    RBACService.getInstance().clearUserCache(userId);
  }

  return user as unknown as IUser;
}

/**
 * Remove role from user
 */
export async function removeRoleFromUser(userId: string, roleId: string): Promise<IUser | null> {
  const user = await User.findById(userId);
  if (!user) return null;

  const userDoc = user as any;
  const roleIds = (userDoc.roleIds as mongoose.Types.ObjectId[]) || [];
  userDoc.roleIds = roleIds.filter((id: mongoose.Types.ObjectId) => id.toString() !== roleId);
  await userDoc.save();
  
  // Clear user's permission cache
  RBACService.getInstance().clearUserCache(userId);

  return userDoc as unknown as IUser;
}

/**
 * Check if user has specific permission
 */
export async function hasPermission(
  userId: string,
  action: string,
  resourceType?: string,
  resourceId?: string
): Promise<boolean> {
  const user = await User.findById(userId).populate('roleIds');
  if (!user) return false;

  const userDoc = user as any;
  const tenant = (await Tenant.findById(userDoc.tenantId)) as unknown as { tenantSlug: string } | null;
  if (!tenant) return false;

  // Fetch the full role objects
  const roles = (await Role.find({ _id: { $in: (userDoc.roleIds as mongoose.Types.ObjectId[]) || [] } })) as any[];
  const isExternalCustomer = roles.some((role: any) => role.isExternalCustomer);

  const context: AccessContext = {
    user: {
      id: String((userDoc._id as mongoose.Types.ObjectId).toString()),
      tenantId: String((userDoc.tenantId as mongoose.Types.ObjectId).toString()),
      tenantSlug: String((tenant as any).tenantSlug),
      userId: String(userDoc.userId),
      email: String(userDoc.email),
      roles: roles as any,
      isExternalCustomer
    },
    action,
    resource: resourceType ? {
      type: resourceType,
      id: resourceId,
      tenantId: String((userDoc.tenantId as mongoose.Types.ObjectId).toString())
    } : undefined
  };

  const decision = await RBACService.getInstance().checkPermission(context);
  return decision.granted;
}

/**
 * Get all permissions for a user
 */
export async function getUserPermissions(userId: string): Promise<string[]> {
  const user = await User.findById(userId).populate('roleIds');
  if (!user) return [];

  // Fetch the full role objects
  const roles = (await Role.find({ _id: { $in: (user as any).roleIds || [] } })) as any[];
  const permissions = new Set<string>();

  roles.forEach((role: any) => {
    (role.permissions as string[]).forEach((permission: string) => permissions.add(permission));
  });

  return Array.from(permissions);
}

/**
 * Create tenant with default roles
 */
export async function initializeTenantRBAC(tenantId: string): Promise<IRole[]> {
  const { createDefaultRoles } = await import('../models');
  return await createDefaultRoles(new mongoose.Types.ObjectId(tenantId));
}

// Export singleton instance
export const rbacService = RBACService.getInstance();

export default {
  RBACService,
  rbacService,
  PERMISSIONS,
  EXTERNAL_CUSTOMER_ROUTES,
  createRole,
  assignRoleToUser,
  removeRoleFromUser,
  hasPermission,
  getUserPermissions,
  initializeTenantRBAC
};
