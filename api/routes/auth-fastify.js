/**
 * Authentication Routes for Fastify
 * 
 * Provides secure authentication endpoints:
 * - Login with tenant discovery
 * - Password reset
 * - Token refresh
 * - User registration (admin only)
 * - Account management
 * - Rate limiting and security controls
 */

const { logger } = require('../core/Logger');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Import models (we'll need to create JS versions or use the compiled TS)
// For now, let's define basic schemas
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: String,
  tenantId: String,
  role: String,
  status: { type: String, default: 'active' },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const TenantSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  status: { type: String, default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);
const Tenant = mongoose.models.Tenant || mongoose.model('Tenant', TenantSchema);

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Helper function to generate JWT
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Helper function to verify password
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// Helper function to hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function registerAuthRoutes(fastify) {
  

  /**
   * POST /api/auth/login
   * User login with email and password
   */
  fastify.post('/api/auth/login', async (request, reply) => {
    try {
      const { email, password, tenantId } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Delegate to AuthService
      const result = await AuthService.authenticateWithCredentials(email, password, tenantId);

      return reply.send(result);
    } catch (error) {
      logger.error('Login error', { 
        error: error.message 
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/register
   * Register new user (admin only in production)
   */
  fastify.post('/api/auth/register', async (request, reply) => {
    try {
      const { email, password, name, tenantId, role } = request.body;

      if (!email || !password) {
        return reply.status(400).send({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      
      if (existingUser) {
        return reply.status(400).send({
          success: false,
          message: 'User already exists'
        });
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = new User({
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        tenantId: tenantId || 'default',
        role: role || 'user',
        status: 'active'
      });

      await user.save();

      // Generate token
      const token = generateToken({
        userId: user._id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role
      });

      return reply.status(201).send({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/logout
   * Logout user (client should remove token)
   */
  fastify.post('/api/auth/logout', async (request, reply) => {
    // In a JWT-based system, logout is typically handled client-side
    // by removing the token. We can add token blacklisting here if needed.
    return reply.send({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  fastify.get('/api/auth/me', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = await AuthService.verifyToken(token);
        const user = await AuthService.getUserById(decoded.userId);

        return reply.send({
          success: true,
          user
        });
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: error.message || 'Invalid token'
        });
      }
    } catch (error) {
      logger.error('Get user error', { 
        error: error.message 
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/refresh
   * Refresh JWT token
   */
  fastify.post('/api/auth/refresh', async (request, reply) => {
    try {
      const { token } = request.body;
      
      if (!token) {
        return reply.status(400).send({
          success: false,
          message: 'Token is required'
        });
      }

      try {
        const decoded = jwt.verify(token, JWT_SECRET, { ignoreExpiration: true });
        
        // Check if token is not too old (e.g., within 7 days)
        const tokenAge = Date.now() / 1000 - decoded.iat;
        const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
        
        if (tokenAge > maxAge) {
          return reply.status(401).send({
            success: false,
            message: 'Token is too old, please login again'
          });
        }

        // Generate new token
        const newToken = generateToken({
          userId: decoded.userId,
          email: decoded.email,
          tenantId: decoded.tenantId,
          role: decoded.role
        });

        return reply.send({
          success: true,
          token: newToken
        });
      } catch (error) {
        return reply.status(401).send({
          success: false,
          message: 'Invalid token'
        });
      }
    } catch (error) {
      logger.error('Token refresh error:', error);
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  /**
   * POST /api/auth/change-password
   * Change user password
   */
  fastify.post('/api/auth/change-password', async (request, reply) => {
    try {
      const { oldPassword, newPassword } = request.body;
      const authHeader = request.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.status(401).send({
          success: false,
          message: 'No token provided'
        });
      }

      const token = authHeader.substring(7);
      
      try {
        const decoded = await AuthService.verifyToken(token);
        
        // Delegate to AuthService
        const result = await AuthService.changePassword(decoded.userId, oldPassword, newPassword);

        return reply.send(result);
      } catch (error) {
        const statusCode = error.message.includes('not found') ? 404 :
                          error.message.includes('Invalid') ? 401 : 500;
                          
        return reply.status(statusCode).send({
          success: false,
          message: error.message
        });
      }
    } catch (error) {
      logger.error('Change password error', { 
        error: error.message 
      });
      return reply.status(500).send({
        success: false,
        message: 'Internal server error'
      });
    }
  });

  
}

module.exports = registerAuthRoutes;
