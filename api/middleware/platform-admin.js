/**
 * Platform Admin Middleware
 * 
 * Verifies that the authenticated user has platform_admin role
 * Used for routes that manage tenants, create organizations, system settings, etc.
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware to verify platform admin access
 */
async function requirePlatformAdmin(request, reply) {
  try {
    // Get token from Authorization header
    const auth = request.headers['authorization'] || '';
    const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
    
    if (!token) {
      return reply.code(401).send({ 
        error: 'Authentication required', 
        code: 'NOT_AUTHENTICATED' 
      });
    }

    // Verify JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    let payload;
    
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return reply.code(401).send({ 
        error: 'Invalid token', 
        code: 'INVALID_TOKEN' 
      });
    }

    // Check if user has platform_admin role
    if (payload.platformRole !== 'platform_admin') {
      return reply.code(403).send({ 
        error: 'Access denied. Platform administrator privileges required.', 
        code: 'PLATFORM_ADMIN_REQUIRED' 
      });
    }

    // Attach user info to request for downstream use
    request.user = {
      userId: payload.userId,
      email: payload.email,
      platformRole: payload.platformRole,
      tenantId: payload.tenantId,
      tenantSlug: payload.tenantSlug
    };

  } catch (error) {
    request.log.error({ err: error }, 'Platform admin middleware error');
    return reply.code(500).send({ 
      error: 'Internal server error', 
      code: 'INTERNAL_ERROR' 
    });
  }
}

module.exports = {
  requirePlatformAdmin,
  verifyPlatformAdmin: requirePlatformAdmin // Alias for compatibility
};

