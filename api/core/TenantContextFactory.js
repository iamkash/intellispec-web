/**
 * Tenant Context Factory
 * 
 * Factory for creating TenantContext from various sources.
 * Centralized extraction logic following Chain of Responsibility pattern.
 * 
 * Design Patterns:
 * - Factory Pattern
 * - Chain of Responsibility (try JWT -> Headers -> Default)
 * - Strategy Pattern (different extraction strategies)
 */

const jwt = require('jsonwebtoken');
const TenantContext = require('./TenantContext');
const { logger } = require('./Logger');

class TenantContextFactory {
  /**
   * Extract TenantContext from Fastify request
   * 
   * Chain of Responsibility:
   * 1. Try JWT token (preferred)
   * 2. Try headers (legacy)
   * 3. Default context
   * 
   * @param {Object} request - Fastify request object
   * @returns {TenantContext}
   */
  static fromRequest(request) {
    // Strategy 1: JWT Authentication (preferred)
    const jwtContext = this._tryExtractFromJWT(request);
    if (jwtContext) {
      return jwtContext;
    }

    // Strategy 1b: Auth middleware populated request.user
    const userContext = this._tryExtractFromRequestUser(request);
    if (userContext) {
      return userContext;
    }

    // Strategy 2: Header-based (legacy)
    const headerContext = this._tryExtractFromHeaders(request);
    if (headerContext) {
      return headerContext;
    }

    // Strategy 3: Default (unauthenticated)
    return this._defaultContext();
  }

  /**
   * Try to extract context from JWT token
   * @private
   */
  static _tryExtractFromJWT(request) {
    try {
      const auth = request.headers['authorization'] || '';
      
      // Extract Bearer token
      if (typeof auth !== 'string' || !auth.startsWith('Bearer ')) {
        return null;
      }

      const token = auth.slice(7);
      if (!token) {
        return null;
      }

      // Verify and decode JWT
      const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
      const payload = jwt.verify(token, JWT_SECRET);

      // Create context from JWT payload
      return TenantContext.fromJWT(payload);
    } catch (error) {
      // Invalid token - continue to next strategy
      logger.warn('JWT verification failed', { error: error.message });
      return null;
    }
  }

  /**
   * Try to extract context from request.user
   * (populated by centralized auth middleware)
   * @private
   */
  static _tryExtractFromRequestUser(request) {
    const user = request.user;
    if (!user || !user.userId) {
      return null;
    }

    return new TenantContext({
      userId: user.userId,
      tenantId: user.tenantId || null,
      isPlatformAdmin: user.platformRole === 'platform_admin' || user.isPlatformAdmin === true,
      allowedTenants: Array.isArray(user.allowedTenants) ? user.allowedTenants : (user.tenants || [])
    });
  }

  /**
   * Try to extract context from headers (legacy)
   * @private
   */
  static _tryExtractFromHeaders(request) {
    const tenantId = request.headers['x-tenant-id'];
    const userId = request.headers['x-user-id'];

    if (!tenantId && !userId) {
      return null;
    }

    return TenantContext.fromHeaders(request.headers);
  }

  /**
   * Create default unauthenticated context
   * @private
   */
  static _defaultContext() {
    logger.warn('[TenantContextFactory] Falling back to anonymous tenant context. Upstream authentication missing or invalid.');
    if (process.env.ENFORCE_AUTH === 'true') {
      throw new Error('Authentication required: TenantContextFactory could not derive tenant context from the request');
    }
    return new TenantContext({
      userId: 'anonymous',
      tenantId: 'default-tenant',
      isPlatformAdmin: false
    });
  }

  /**
   * Create context from JWT payload directly
   * (for use in non-HTTP contexts)
   */
  static fromJWTPayload(payload) {
    return TenantContext.fromJWT(payload);
  }

  /**
   * Create platform admin context
   * (for system operations)
   */
  static createPlatformAdmin(userId = 'system') {
    return TenantContext.platformAdmin(userId);
  }
}

module.exports = TenantContextFactory;
