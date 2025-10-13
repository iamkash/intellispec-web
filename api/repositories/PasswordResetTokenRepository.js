const BaseRepository = require('../core/BaseRepository');
const PasswordResetTokenModel = require('../models/PasswordResetToken');

class PasswordResetTokenRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(PasswordResetTokenModel, tenantContext, requestContext);
  }

  /**
   * Find a token by hashed value that is still active.
   * @param {string} tokenHash
   */
  async findActiveByHash(tokenHash) {
    const query = this.buildBaseQuery({
      tokenHash,
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    return this.model.findOne(query).lean().exec();
  }

  /**
   * Soft delete (invalidate) all outstanding tokens for a user.
   * @param {string} userId
   */
  async invalidateActiveTokensForUser(userId) {
    if (!userId) return;

    const filter = this.buildBaseQuery({
      userId: String(userId),
      usedAt: { $exists: false },
      expiresAt: { $gt: new Date() },
    });

    await this.model.updateMany(filter, {
      $set: {
        deleted: true,
        deleted_at: new Date(),
        deleted_by: this.context.userId || 'system-password-reset',
      },
    });
  }

  /**
   * Mark a token as used.
   * @param {string} id - Token id
   * @param {Object} metadata - { usedIp, usedUserAgent }
   */
  async markTokenUsed(id, metadata = {}) {
    const query = this.buildBaseQuery({ id });

    await this.model.findOneAndUpdate(
      query,
      {
        $set: {
          usedAt: new Date(),
          usedIp: metadata.usedIp,
          usedUserAgent: metadata.usedUserAgent,
          last_updated: new Date(),
          last_updated_by: this.context.userId || 'system-password-reset',
        },
      },
      { new: false }
    );
  }
}

module.exports = PasswordResetTokenRepository;
