/**
 * Authentication Service
 * 
 * Centralized authentication logic for JWT token verification,
 * user/tenant context loading, and role/permission management
 * 
 * Design Patterns:
 * - Service Layer Pattern (business logic)
 * - Facade Pattern (simplified interface)
 * - Strategy Pattern (different auth strategies)
 * 
 * Features:
 * - JWT token verification
 * - User context loading from database
 * - Tenant context loading
 * - Role and permission aggregation
 * - Platform admin detection
 * - Multi-tenant support
 */

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { logger } = require('./Logger');
const { AuthenticationError, NotFoundError } = require('./ErrorHandler');

class AuthService {
  static JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

  /**
   * Authenticate user from JWT token
   * Main authentication method that verifies token and loads complete context
   * 
   * @param {String} token - JWT token
   * @returns {Promise<Object>} Authentication result with user/tenant context
   */
  static async authenticate(token) {
    try {
      // 1. Verify JWT token
      const payload = await AuthService.verifyToken(token);

      // 2. Load user context (with roles and permissions)
      const userContext = await AuthService.loadUserContext(
        payload.userId,
        payload.tenantId
      );

      // 3. Load tenant context
      const tenantContext = await AuthService.loadTenantContext(payload.tenantId);

      return {
        success: true,
        user: userContext,
        tenant: tenantContext,
        payload
      };
    } catch (error) {
      logger.error('Authentication failed', {
        error: error.message,
        stack: error.stack
      });

      return {
        success: false,
        error: error.message,
        code: error.code || 'AUTH_ERROR'
      };
    }
  }

  /**
   * Verify JWT token
   * 
   * @param {String} token - JWT token string
   * @returns {Promise<Object>} Decoded JWT payload
   * @throws {AuthenticationError} If token is invalid or expired
   */
  static async verifyToken(token) {
    if (!token) {
      throw new AuthenticationError('No token provided', { code: 'NO_TOKEN' });
    }

    try {
      const payload = jwt.verify(token, AuthService.JWT_SECRET);
      return payload;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new AuthenticationError('Token expired', { code: 'TOKEN_EXPIRED' });
      }
      if (error.name === 'JsonWebTokenError') {
        throw new AuthenticationError('Invalid token', { code: 'INVALID_TOKEN' });
      }
      throw new AuthenticationError('Token verification failed', { code: 'TOKEN_ERROR' });
    }
  }

  /**
   * Load user context from database
   * Includes user data, roles, and permissions
   * 
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} User context
   * @throws {NotFoundError} If user not found
   */
  static async loadUserContext(userId, tenantId) {
    const db = mongoose.connection;

    if (!db || db.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const usersCol = db.collection('users');

    // Load user document
    const userDoc = await usersCol.findOne({
      userId: userId,
      tenantId: tenantId
    });

    if (!userDoc) {
      throw new NotFoundError('User', userId);
    }

    // Load roles and permissions
    const rolesAndPermissions = await AuthService.loadRolesAndPermissions(userDoc.roleIds || []);

    // Build user context
    return {
      id: userDoc._id.toString(),
      userId: userDoc.userId,
      tenantId: userDoc.tenantId.toString(),
      email: userDoc.email,
      name: userDoc.name,
      platformRole: userDoc.platformRole || 'user',
      isPlatformAdmin: userDoc.platformRole === 'platform_admin',
      roles: rolesAndPermissions.roles,
      permissions: rolesAndPermissions.permissions,
      isExternalCustomer: rolesAndPermissions.isExternalCustomer
    };
  }

  /**
   * Load tenant context from database
   * 
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Tenant context
   * @throws {NotFoundError} If tenant not found
   */
  static async loadTenantContext(tenantId) {
    const db = mongoose.connection;

    if (!db || db.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const tenantsCol = db.collection('tenants');

    // Load tenant document
    const tenantDoc = await tenantsCol.findOne({
      _id: new mongoose.Types.ObjectId(tenantId)
    });

    if (!tenantDoc) {
      throw new NotFoundError('Tenant', tenantId);
    }

    return {
      id: tenantDoc._id.toString(),
      slug: tenantDoc.tenantSlug || tenantDoc.slug,
      name: tenantDoc.name,
      status: tenantDoc.status
    };
  }

  /**
   * Load roles and permissions for a user
   * 
   * @param {Array} roleIds - Array of role IDs
   * @returns {Promise<Object>} Roles and permissions
   */
  static async loadRolesAndPermissions(roleIds) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) {
      return {
        roles: [],
        permissions: [],
        isExternalCustomer: false
      };
    }

    const db = mongoose.connection;
    const rolesCol = db.collection('roles');

    // Load role documents
    const roles = await rolesCol.find({
      _id: { $in: roleIds.map(id => new mongoose.Types.ObjectId(id)) }
    }).toArray();

    // Extract permissions from roles
    const permissions = roles.reduce((acc, role) => {
      if (Array.isArray(role.permissions)) {
        acc.push(...role.permissions);
      }
      return acc;
    }, []);

    // Check if any role is external customer
    const isExternalCustomer = roles.some(r => r.isExternalCustomer === true);

    return {
      roles,
      permissions: [...new Set(permissions)], // Remove duplicates
      isExternalCustomer
    };
  }

  /**
   * Generate JWT token
   * 
   * @param {Object} payload - Token payload
   * @param {Object} options - JWT options (expiresIn, etc.)
   * @returns {String} JWT token
   */
  static generateToken(payload, options = {}) {
    const defaultOptions = {
      expiresIn: options.expiresIn || '24h'
    };

    return jwt.sign(payload, AuthService.JWT_SECRET, defaultOptions);
  }

  /**
   * Refresh authentication token
   * Generates a new token with updated expiry
   * 
   * @param {String} oldToken - Existing token
   * @returns {Promise<String>} New JWT token
   */
  static async refreshToken(oldToken) {
    // Verify old token (even if expired, we can refresh)
    try {
      const payload = jwt.verify(oldToken, AuthService.JWT_SECRET, {
        ignoreExpiration: true
      });

      // Generate new token with same payload
      delete payload.iat;
      delete payload.exp;

      return AuthService.generateToken(payload);
    } catch (error) {
      throw new AuthenticationError('Cannot refresh invalid token');
    }
  }

  /**
   * Validate token without full authentication
   * Useful for quick token checks
   * 
   * @param {String} token - JWT token
   * @returns {Boolean} True if token is valid
   */
  static isTokenValid(token) {
    try {
      jwt.verify(token, AuthService.JWT_SECRET);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Decode token without verification
   * Useful for debugging or extracting claims
   * 
   * @param {String} token - JWT token
   * @returns {Object|null} Decoded payload or null
   */
  static decodeToken(token) {
    try {
      return jwt.decode(token);
    } catch (error) {
      return null;
    }
  }

  /**
   * Authenticate with email/password
   * For login endpoints
   * 
   * @param {String} email - User email
   * @param {String} password - User password
   * @param {String} tenantId - Tenant ID (optional)
   * @returns {Promise<Object>} Authentication result with token
   */
  static async authenticateWithCredentials(email, password, tenantId = null) {
    const bcrypt = require('bcryptjs');
    const db = mongoose.connection;

    if (!db || db.readyState !== 1) {
      throw new Error('Database not connected');
    }

    // Find user by email
    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Check user status
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Verify tenant if provided
    if (tenantId && user.tenantId !== tenantId) {
      throw new Error('Invalid tenant');
    }

    // Update last login
    await usersCol.updateOne(
      { _id: user._id },
      { 
        $set: { 
          lastLogin: new Date(),
          updatedAt: new Date()
        } 
      }
    );

    // Generate token
    const token = AuthService.generateToken({
      userId: user._id.toString(),
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      platformRole: user.platformRole
    });

    return {
      success: true,
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
        platformRole: user.platformRole
      }
    };
  }

  /**
   * Generate JWT token
   * 
   * @param {Object} payload - Token payload
   * @returns {String} JWT token
   */
  static generateToken(payload) {
    const JWT_EXPIRES_IN = '24h';
    return jwt.sign(payload, AuthService.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Hash password
   * 
   * @param {String} password - Plain text password
   * @returns {Promise<String>} Hashed password
   */
  static async hashPassword(password) {
    const bcrypt = require('bcryptjs');
    return bcrypt.hash(password, 10);
  }

  /**
   * Verify password
   * 
   * @param {String} password - Plain text password
   * @param {String} hash - Hashed password
   * @returns {Promise<Boolean>} True if password matches
   */
  static async verifyPassword(password, hash) {
    const bcrypt = require('bcryptjs');
    return bcrypt.compare(password, hash);
  }

  /**
   * Change user password
   * 
   * @param {String} userId - User ID
   * @param {String} oldPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<Object>} Result
   */
  static async changePassword(userId, oldPassword, newPassword) {
    const db = mongoose.connection;

    if (!db || db.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ _id: mongoose.Types.ObjectId(userId) });
    
    if (!user) {
      throw new Error('User not found');
    }

    // Verify old password
    const isValidPassword = await AuthService.verifyPassword(oldPassword, user.password);
    
    if (!isValidPassword) {
      throw new Error('Invalid old password');
    }

    // Hash and save new password
    const hashedPassword = await AuthService.hashPassword(newPassword);
    await usersCol.updateOne(
      { _id: user._id },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  /**
   * Get user by ID
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User object
   */
  static async getUserById(userId) {
    const db = mongoose.connection;

    if (!db || db.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const usersCol = db.collection('users');
    const user = await usersCol.findOne({ 
      $or: [
        { _id: mongoose.Types.ObjectId.isValid(userId) ? mongoose.Types.ObjectId(userId) : null },
        { userId: userId }
      ]
    });
    
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      tenantId: user.tenantId,
      platformRole: user.platformRole,
      status: user.status
    };
  }
}

module.exports = AuthService;

