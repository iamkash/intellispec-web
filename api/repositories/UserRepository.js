const mongoose = require('mongoose');
const BaseRepository = require('../core/BaseRepository');
const UserModel = require('../models/User');
const { NotFoundError } = require('../core/ErrorHandler');

class UserRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(UserModel, tenantContext, requestContext);
  }

  /**
   * Find a user by email (case-insensitive)
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    if (!email) {
      return null;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const query = this.buildBaseQuery({ email: normalizedEmail });
    return this.model.findOne(query).lean().exec();
  }

  /**
   * Update password for user using any of the supported identifiers.
   *
   * @param {Object} user - User document
   * @param {string} hashedPassword - Already hashed password
   * @param {Object} metadata - Additional metadata (performedBy, reason)
   * @returns {Promise<Object>} Updated user document
   */
  async updatePasswordForUser(user, hashedPassword, metadata = {}) {
    if (!user) {
      throw new NotFoundError('User');
    }

    const identifiers = this._buildIdentifierQuery(user);
    const baseQuery = this.buildBaseQuery({});

    const query = {
      ...baseQuery,
      ...identifiers,
    };

    const performedBy =
      metadata.performedBy ||
      this.context.userId ||
      'system-password-reset';

    const updateResult = await this.model
      .findOneAndUpdate(
        query,
        {
          $set: {
            password: hashedPassword,
            last_password_reset_at: new Date(),
            last_updated: new Date(),
            last_updated_by: performedBy,
          },
        },
        { new: true }
      )
      .lean()
      .exec();

    if (!updateResult) {
      throw new NotFoundError('User');
    }

    return updateResult;
  }

  /**
   * Build identifier query supporting multiple schema variants.
   * @private
   */
  _buildIdentifierQuery(user) {
    const ors = [];

    if (user.id) {
      ors.push({ id: String(user.id) });
    }
    if (user.userId) {
      ors.push({ userId: String(user.userId) });
    }
    if (user.email) {
      ors.push({ email: String(user.email).toLowerCase() });
    }
    if (user._id) {
      if (mongoose.Types.ObjectId.isValid(String(user._id))) {
        ors.push({ _id: new mongoose.Types.ObjectId(String(user._id)) });
      } else {
        ors.push({ _id: user._id });
      }
    }

    if (ors.length === 0) {
      throw new NotFoundError('User');
    }

    return { $or: ors };
  }
}

module.exports = UserRepository;
