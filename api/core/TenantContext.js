/**
 * Tenant Context
 * 
 * Encapsulates tenant information and access permissions.
 * Immutable object passed through the call chain.
 * 
 * Design Patterns:
 * - Value Object Pattern
 * - Strategy Pattern (different behaviors for platform admin vs user)
 */

class TenantContext {
  constructor(options = {}) {
    this._userId = options.userId;
    this._tenantId = options.tenantId;
    this._isPlatformAdmin = options.isPlatformAdmin || false;
    this._allowedTenants = options.allowedTenants || [];
    
    // Make immutable
    Object.freeze(this);
  }

  /**
   * Create context from JWT payload
   */
  static fromJWT(payload) {
    return new TenantContext({
      userId: payload.userId,
      tenantId: payload.tenantId,
      isPlatformAdmin: payload.platformRole === 'platform_admin',
      allowedTenants: payload.allowedTenants || []
    });
  }

  /**
   * Create context from request headers (legacy support)
   */
  static fromHeaders(headers) {
    return new TenantContext({
      userId: headers['x-user-id'] || 'default-user',
      tenantId: headers['x-tenant-id'] || 'default-tenant',
      isPlatformAdmin: false,
      allowedTenants: []
    });
  }

  /**
   * Create platform admin context (unrestricted access)
   */
  static platformAdmin(userId) {
    return new TenantContext({
      userId,
      tenantId: null,
      isPlatformAdmin: true,
      allowedTenants: []
    });
  }

  // Getters
  get userId() { return this._userId; }
  get tenantId() { return this._tenantId; }
  get isPlatformAdmin() { return this._isPlatformAdmin; }
  get allowedTenants() { return this._allowedTenants; }

  /**
   * Check if context has unrestricted access
   */
  hasUnrestrictedAccess() {
    return this._isPlatformAdmin;
  }

  /**
   * Check if context has access to specific tenant
   */
  hasAccessToTenant(tenantId) {
    if (this._isPlatformAdmin) return true;
    if (this._tenantId === tenantId) return true;
    return this._allowedTenants.includes(tenantId);
  }

  /**
   * Get tenant filter for MongoDB queries
   * Returns null for platform admins (no filtering)
   */
  getTenantFilter() {
    if (this._isPlatformAdmin) {
      return null; // No filter - see all data
    }

    // Single tenant
    if (this._tenantId && this._allowedTenants.length === 0) {
      return { tenantId: this._tenantId };
    }

    // Multiple tenants (user with multiple memberships)
    if (this._allowedTenants.length > 0) {
      const tenants = [this._tenantId, ...this._allowedTenants].filter(Boolean);
      return { tenantId: { $in: tenants } };
    }

    // Fallback
    return { tenantId: this._tenantId };
  }

  /**
   * Convert to plain object for logging
   */
  toJSON() {
    return {
      userId: this._userId,
      tenantId: this._tenantId,
      isPlatformAdmin: this._isPlatformAdmin,
      hasAccess: this.hasUnrestrictedAccess() ? 'all' : 'scoped'
    };
  }
}

module.exports = TenantContext;

