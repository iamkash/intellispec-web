/**
 * Password Reset Token Model
 *
 * Stores hashed reset tokens with metadata for auditing and expiry management.
 */

const mongoose = require('mongoose');

const PasswordResetTokenSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, index: true },
    tenantSlug: { type: String },
    email: { type: String, required: true, lowercase: true, index: true },
    tokenHash: { type: String, required: true, unique: true, index: true },
    expiresAt: { type: Date, required: true, index: true },
    usedAt: { type: Date },
    usedIp: { type: String },
    usedUserAgent: { type: String },
    requestIp: { type: String },
    requestUserAgent: { type: String },
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
    deleted_by: { type: String },
  },
  {
    collection: 'password_reset_tokens',
    timestamps: {
      createdAt: 'created_date',
      updatedAt: 'last_updated',
    },
  }
);

PasswordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports =
  mongoose.models.PasswordResetToken ||
  mongoose.model('PasswordResetToken', PasswordResetTokenSchema);
