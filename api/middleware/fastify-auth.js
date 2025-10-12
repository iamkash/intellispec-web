/**
 * Fastify Authentication Middleware
 * 
 * Thin middleware layer that delegates to AuthService
 * Extracts token and calls service for authentication
 */

const AuthService = require('../core/AuthService');
const { logger } = require('../core/Logger');

/**
 * Extract JWT token from request headers
 * @private
 */
function extractToken(request) {
  const authHeader = request.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.slice(7); // Remove 'Bearer ' prefix
}

/**
 * Fastify authentication middleware
 * Validates JWT token and adds user/tenant context to request
 */
async function authenticateToken(request, reply) {
  try {
    // Extract token
    const token = extractToken(request);
    
    if (!token) {
      return reply.code(401).send({
        error: 'Authentication required - Missing or invalid Authorization header',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Authenticate via service
    const result = await AuthService.authenticate(token);

    if (!result.success) {
      return reply.code(401).send({
        error: result.error,
        code: result.code
      });
    }

    // Add user and tenant context to request
    request.user = {
      ...result.user,
      tenantSlug: result.tenant.slug // For backward compatibility
    };
    
    request.tenant = result.tenant;

    // Authentication successful - continue to next handler

  } catch (error) {
    logger.error('Authentication middleware error', {
      error: error.message,
      url: request.url,
      method: request.method
    });
    return reply.code(500).send({
      error: 'Authentication failed',
      code: 'AUTH_ERROR'
    });
  }
}

/**
 * Middleware to verify Super Admin access
 * Deprecated: Use platform-admin.js middleware instead
 */
async function verifySuperAdmin(request, reply) {
  try {
    const token = extractToken(request);
    
    if (!token) {
      return reply.code(401).send({ error: 'No token provided', code: 'NO_TOKEN' });
    }

    // Verify token
    const payload = await AuthService.verifyToken(token);
    
    // Check if user has platform admin role
    if (payload.platformRole !== 'platform_admin') {
      return reply.code(403).send({
        error: 'Platform admin access required',
        code: 'PLATFORM_ADMIN_REQUIRED'
      });
    }

    request.user = payload;
  } catch (error) {
    return reply.code(401).send({
      error: error.message || 'Invalid or expired token',
      code: error.code || 'INVALID_TOKEN'
    });
  }
}

/**
 * Fastify plugin for authentication
 */
async function authPlugin(fastify) {
  fastify.decorate('authenticate', authenticateToken);
  fastify.decorate('verifySuperAdmin', verifySuperAdmin);
}

module.exports = {
  authenticateToken,
  verifySuperAdmin,
  authPlugin
};
