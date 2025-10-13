/**
 * User Model
 *
 * Centralized Mongoose schema for user documents so repositories and
 * services can reliably access the users collection.
 */

const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    id: { type: String, index: true },
    userId: { type: String, index: true },
    tenantId: { type: String, index: true },
    email: { type: String, required: true, lowercase: true, index: true },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    name: { type: String },
    platformRole: { type: String, default: 'user', index: true },
    status: { type: String, default: 'active', index: true },
    roleIds: { type: [mongoose.Schema.Types.Mixed], default: [] },
    deleted: { type: Boolean, default: false },
    deleted_at: { type: Date },
    deleted_by: { type: String },
    last_password_reset_at: { type: Date },
  },
  {
    collection: 'users',
    timestamps: {
      createdAt: 'created_date',
      updatedAt: 'last_updated',
    },
  }
);

module.exports =
  mongoose.models.User || mongoose.model('User', UserSchema);
