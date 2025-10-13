const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const TenantContextFactory = require('../core/TenantContextFactory');
const { logger } = require('../core/Logger');
const {
  ValidationError,
  NotFoundError,
  InternalServerError,
} = require('../core/ErrorHandler');
const UserRepository = require('../repositories/UserRepository');
const PasswordResetTokenRepository = require('../repositories/PasswordResetTokenRepository');
const EmailService = require('../core/EmailService');

class AuthPasswordResetService {
  constructor() {
    this.tokenTtlMinutes = Number(
      process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || 60
    );
    this.platformContext =
      TenantContextFactory.createPlatformAdmin('password-reset-service');
  }

  /**
   * Request a password reset for a user email.
   */
  async requestPasswordReset({ email, tenantSlug = null, requestContext }) {
    if (!email) {
      throw new ValidationError('Email address is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userRepo = new UserRepository(
      this.platformContext,
      requestContext || null
    );
    const tokenRepo = new PasswordResetTokenRepository(
      this.platformContext,
      requestContext || null
    );

    const user = await userRepo.findByEmail(normalizedEmail);

    if (!user || user.deleted === true) {
      logger.info('[PasswordReset] Request for unknown email suppressed', {
        email: normalizedEmail,
      });
      return { delivered: false, masked: true };
    }

    const userId = String(user.id || user.userId || user._id);
    const tenantContext = await this._resolveTenantContext(
      user,
      tenantSlug
    );

    await tokenRepo.invalidateActiveTokensForUser(userId);

    const { token, tokenHash, expiresAt } = this._generateToken();

    await tokenRepo.create({
      id: uuidv4(),
      userId,
      tenantId: tenantContext?.id || null,
      tenantSlug: tenantContext?.slug || null,
      email: normalizedEmail,
      tokenHash,
      expiresAt,
      requestIp: requestContext?.ipAddress,
      requestUserAgent: requestContext?.userAgent,
    });

    const resetUrl = this._buildResetUrl(token, tenantContext?.slug);

    await EmailService.sendPasswordResetEmail({
      to: normalizedEmail,
      resetUrl,
      expiresAt,
      userName:
        user.firstName && user.lastName
          ? `${user.firstName} ${user.lastName}`.trim()
          : user.name || null,
      tenantName: tenantContext?.name,
      requestIp: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    });

    return {
      delivered: true,
      expiresAt,
      resetUrl,
    };
  }

  /**
   * Validate a reset token and return metadata for UI display.
   */
  async validateResetToken(token) {
    if (!token) {
      throw new ValidationError('Reset token is required');
    }

    const tokenHash = this._hashToken(token);
    const tokenRepo = new PasswordResetTokenRepository(
      this.platformContext,
      null
    );

    const record = await tokenRepo.findActiveByHash(tokenHash);

    if (!record) {
      throw new NotFoundError('Password reset token');
    }

    return {
      email: record.email,
      tenantSlug: record.tenantSlug,
      expiresAt: record.expiresAt,
    };
  }

  /**
   * Reset password using token and the new password.
   */
  async resetPassword({ token, newPassword, requestContext }) {
    if (!token) {
      throw new ValidationError('Reset token is required');
    }
    if (!newPassword || newPassword.length < 8) {
      throw new ValidationError(
        'Password must be at least 8 characters long'
      );
    }

    const tokenHash = this._hashToken(token);
    const tokenRepo = new PasswordResetTokenRepository(
      this.platformContext,
      requestContext || null
    );
    const userRepo = new UserRepository(
      this.platformContext,
      requestContext || null
    );

    const record = await tokenRepo.findActiveByHash(tokenHash);

    if (!record) {
      throw new NotFoundError('Password reset token');
    }

    const user = await userRepo.findByEmail(record.email);

    if (!user) {
      throw new InternalServerError('Associated user not found for token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await userRepo.updatePasswordForUser(user, hashedPassword, {
      performedBy: 'password-reset-self-service',
    });

    await tokenRepo.markTokenUsed(record.id, {
      usedIp: requestContext?.ipAddress,
      usedUserAgent: requestContext?.userAgent,
    });

    await tokenRepo.invalidateActiveTokensForUser(record.userId);

    return {
      success: true,
    };
  }

  _generateToken() {
    const token = crypto.randomBytes(48).toString('hex');
    const tokenHash = this._hashToken(token);
    const expiresAt = new Date(
      Date.now() + this.tokenTtlMinutes * 60 * 1000
    );
    return { token, tokenHash, expiresAt };
  }

  _hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  _buildResetUrl(token, tenantSlug) {
    const baseCandidate =
      process.env.APP_BASE_URL ||
      process.env.CLIENT_APP_URL ||
      process.env.WEB_APP_BASE_URL ||
      process.env.FRONTEND_BASE_URL ||
      process.env.APP_URL ||
      process.env.PUBLIC_APP_URL;

    const derivedLocalPort =
      process.env.FRONTEND_PORT ||
      process.env.APP_FRONTEND_PORT ||
      process.env.CLIENT_PORT;

    let base = baseCandidate;
    if (!base && derivedLocalPort) {
      base = `http://localhost:${derivedLocalPort}`;
    }

    if (base && !/^https?:\/\//i.test(base)) {
      base = `http://${base}`;
    }

    if (!base) {
      base = 'http://localhost:3000';
    }

    const path =
      process.env.PASSWORD_RESET_PATH || '/reset-password';

    const url = new URL(base);
    const finalPath =
      path.startsWith('/') ? path : `/${path}`;
    url.pathname = finalPath.replace(/\/+/g, '/');
    url.searchParams.set('token', token);
    if (tenantSlug) {
      url.searchParams.set('tenant', tenantSlug);
    }
    return url.toString();
  }

  async _resolveTenantContext(user, requestedTenantSlug) {
    const db = mongoose.connection;
    if (!db || db.readyState !== 1) {
      return null;
    }

    const tenantsCollection = db.collection('tenants');

    if (requestedTenantSlug) {
      const tenant = await tenantsCollection.findOne({
        $or: [
          { slug: requestedTenantSlug },
          { tenantSlug: requestedTenantSlug },
        ],
      });
      if (tenant) {
        return {
          id: String(tenant.id || tenant._id),
          slug: tenant.slug || tenant.tenantSlug,
          name: tenant.name,
        };
      }
    }

    if (user.tenantId) {
      const tenant = await tenantsCollection.findOne({
        $or: [
          { id: user.tenantId },
          { _id: this._safeObjectId(user.tenantId) },
        ],
      });
      if (tenant) {
        return {
          id: String(tenant.id || tenant._id),
          slug: tenant.slug || tenant.tenantSlug,
          name: tenant.name,
        };
      }
    }

    return null;
  }

  _safeObjectId(value) {
    try {
      if (mongoose.Types.ObjectId.isValid(String(value))) {
        return new mongoose.Types.ObjectId(String(value));
      }
    } catch {
      return null;
    }
    return null;
  }
}

module.exports = new AuthPasswordResetService();
