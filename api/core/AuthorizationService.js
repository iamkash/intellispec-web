/**
 * Authorization Service
 * 
 * Centralized authorization logic for role checking, permission validation,
 * and tenant access control
 * 
 * Design Patterns:
 * - Service Layer Pattern (business logic)
 * - Strategy Pattern (different authorization strategies)
 * 
 * Features:
 * - Platform admin detection
 * - Role validation
 * - Tenant access control
 * - Permission checking
 * - User tenant management
 */

const TenantContext = require('./TenantContext');
const MembershipRepository = require('../repositories/MembershipRepository');
const { logger } = require('./Logger');

class AuthorizationService {
  /**
   * Check if user is a Platform Admin
   * 
   * @param {Object} user - User object from request
   * @returns {boolean} True if user is platform admin
   */
  static isPlatformAdmin(user) {
    return user?.platformRole === 'platform_admin' || 
           user?.isPlatformAdmin === true;
  }

  /**
   * Check if user is a Super Admin (legacy support)
   * 
   * @param {Object} user - User object from request
   * @returns {boolean} True if user is super admin
   */
  static isSuperAdmin(user) {
    // Check if user has platform_admin role (new) or super_admin (legacy)
    return AuthorizationService.isPlatformAdmin(user) ||
           user?.role === 'super_admin' || 
           user?.roles?.includes('super_admin');
  }

  /**
   * Check if user is tenant admin for a specific tenant
   * 
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<boolean>} True if user is tenant admin
   */
  static async isTenantAdmin(userId, tenantId) {
    const tenantContext = TenantContext.platformAdmin(userId);
    const membershipRepo = new MembershipRepository(tenantContext);
    return await membershipRepo.isTenantAdmin(userId, tenantId);
  }

  /**
   * Get all tenants a user has access to
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of tenant IDs
   */
  static async getUserTenants(userId) {
    const tenantContext = TenantContext.platformAdmin(userId);
    const membershipRepo = new MembershipRepository(tenantContext);
    return await membershipRepo.getUserTenants(userId);
  }

  /**
   * Get user's default tenant
   * Useful for auto-selecting tenant in multi-tenant UIs
   * 
   * @param {string} userId - User ID
   * @returns {Promise<string|null>} Default tenant ID or null
   */
  static async getUserDefaultTenant(userId) {
    const tenantContext = TenantContext.platformAdmin(userId);
    const membershipRepo = new MembershipRepository(tenantContext);
    return await membershipRepo.getUserDefaultTenant(userId);
  }

  /**
   * Check if user has access to a specific tenant
   * 
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID to check
   * @returns {Promise<boolean>} True if user has access
   */
  static async hasAccessToTenant(userId, tenantId) {
    // Platform admins have access to all tenants
    const user = { id: userId };
    if (AuthorizationService.isPlatformAdmin(user)) {
      return true;
    }

    const userTenants = await AuthorizationService.getUserTenants(userId);
    return userTenants.includes(tenantId);
  }

  /**
   * Check if user has specific permission
   * 
   * @param {Object} user - User object with permissions
   * @param {string} permission - Permission to check
   * @returns {boolean} True if user has permission
   */
  static hasPermission(user, permission) {
    if (!user || !user.permissions) return false;
    if (AuthorizationService.isPlatformAdmin(user)) return true; // Platform admins have all permissions
    return user.permissions.includes(permission);
  }

  /**
   * Check if user has any of the specified permissions
   * 
   * @param {Object} user - User object with permissions
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has any permission
   */
  static hasAnyPermission(user, permissions) {
    if (!user || !user.permissions) return false;
    if (AuthorizationService.isPlatformAdmin(user)) return true;
    return permissions.some(perm => user.permissions.includes(perm));
  }

  /**
   * Check if user has all of the specified permissions
   * 
   * @param {Object} user - User object with permissions
   * @param {Array<string>} permissions - Array of permissions to check
   * @returns {boolean} True if user has all permissions
   */
  static hasAllPermissions(user, permissions) {
    if (!user || !user.permissions) return false;
    if (AuthorizationService.isPlatformAdmin(user)) return true;
    return permissions.every(perm => user.permissions.includes(perm));
  }

  /**
   * Check if user has any of the specified roles
   * 
   * @param {Object} user - User object with roles
   * @param {Array<string>} roleNames - Array of role names
   * @returns {boolean} True if user has any role
   */
  static hasAnyRole(user, roleNames) {
    if (!user || !user.roles) return false;
    if (AuthorizationService.isPlatformAdmin(user)) return true;
    return user.roles.some(role => roleNames.includes(role.name));
  }

  /**
   * Get user membership for a specific tenant
   * 
   * @param {string} userId - User ID
   * @param {string} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Membership object or null
   */
  static async getUserMembership(userId, tenantId) {
    const tenantContext = TenantContext.platformAdmin(userId);
    const membershipRepo = new MembershipRepository(tenantContext);
    return await membershipRepo.findByUserAndTenant(userId, tenantId);
  }

  /**
   * Get all user memberships
   * 
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of membership objects
   */
  static async getUserMemberships(userId) {
    const tenantContext = TenantContext.platformAdmin(userId);
    const membershipRepo = new MembershipRepository(tenantContext);
    return await membershipRepo.getUserMemberships(userId);
  }

  /**
   * Apply tenant filter to query
   * Helper for building tenant-scoped queries
   * 
   * @deprecated Use BaseRepository instead for automatic tenant filtering
   * @param {Object} query - Base query object
   * @param {string|Array} allowedTenants - Tenant ID(s) to filter by
   * @returns {Object} Query with tenant filter
   */
  static applyTenantFilter(query, allowedTenants) {
    logger.warn('applyTenantFilter is deprecated', {
      message: 'Use BaseRepository for automatic tenant filtering'
    });

    if (!query) {
      query = {};
    }

    if (allowedTenants === 'all') {
      // No tenant filter for platform admins
      return query;
    }

    if (Array.isArray(allowedTenants)) {
      if (allowedTenants.length === 1) {
        query.tenantId = allowedTenants[0];
      } else if (allowedTenants.length > 1) {
        query.tenantId = { $in: allowedTenants };
      }
    } else if (allowedTenants) {
      query.tenantId = allowedTenants;
    }

    return query;
  }

  /**
   * Validate that results belong to allowed tenants
   * 
   * @deprecated Use BaseRepository which ensures tenant isolation automatically
   * @param {Array} results - Query results
   * @param {string|Array} allowedTenants - Allowed tenant ID(s)
   * @returns {boolean} True if all results are valid
   */
  static validateResultsTenant(results, allowedTenants) {
    logger.warn('validateResultsTenant is deprecated', {
      message: 'Use BaseRepository which automatically ensures tenant isolation'
    });

    if (!Array.isArray(results)) return true;
    if (allowedTenants === 'all') return true;

    const allowed = Array.isArray(allowedTenants) ? allowedTenants : [allowedTenants];

    const invalidResults = results.filter(doc => 
      doc.tenantId && !allowed.includes(doc.tenantId)
    );

    if (invalidResults.length > 0) {
      logger.error('SECURITY VIOLATION: Cross-tenant data detected', {
        allowedTenants: allowed,
        invalidResults: invalidResults.map(r => ({ id: r.id, tenantId: r.tenantId }))
      });
      return false;
    }

    return true;
  }
}

module.exports = AuthorizationService;

