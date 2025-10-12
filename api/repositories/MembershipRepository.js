/**
 * Membership Repository
 * 
 * Data access layer for user-tenant membership operations
 * Extends BaseRepository for automatic tenant scoping and audit logging
 * 
 * Features:
 * - Automatic tenant filtering (via BaseRepository)
 * - Automatic audit trail (via BaseRepository)
 * - Soft delete support
 * - Role-based queries
 * - Multi-tenant user management
 */

const BaseRepository = require('../core/BaseRepository');
const MembershipModel = require('../models/Membership');

class MembershipRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(MembershipModel, tenantContext, requestContext);
  }

  /**
   * Get all active memberships for a user
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Array of memberships
   */
  async getUserMemberships(userId) {
    return await this.find({
      userId,
      status: 'active'
    });
  }

  /**
   * Get all tenant IDs for a user
   * Useful for multi-tenant access control
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Array of tenant IDs
   */
  async getUserTenants(userId) {
    const memberships = await this.find({
      userId,
      status: 'active'
    });
    return memberships.map(m => m.tenantId);
  }

  /**
   * Get all users for a tenant
   * 
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Array>} Array of user IDs
   */
  async getTenantUsers(tenantId) {
    const memberships = await this.find({
      tenantId,
      status: 'active'
    });
    return memberships.map(m => m.userId);
  }

  /**
   * Check if user is tenant admin for a specific tenant
   * 
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Boolean>} True if user is tenant admin
   */
  async isTenantAdmin(userId, tenantId) {
    const membership = await this.findOne({
      userId,
      tenantId,
      role: 'tenant_admin',
      status: 'active'
    });
    return !!membership;
  }

  /**
   * Get membership by user and tenant
   * 
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object|null>} Membership or null
   */
  async findByUserAndTenant(userId, tenantId) {
    return await this.findOne({
      userId,
      tenantId,
      status: 'active'
    });
  }

  /**
   * Get all admins for a tenant
   * 
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Array>} Array of admin memberships
   */
  async getTenantAdmins(tenantId) {
    return await this.find({
      tenantId,
      role: 'tenant_admin',
      status: 'active'
    });
  }

  /**
   * Update user role for a tenant
   * 
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @param {String} newRole - New role
   * @returns {Promise<Object>} Updated membership
   */
  async updateUserRole(userId, tenantId, newRole) {
    const membership = await this.findByUserAndTenant(userId, tenantId);
    
    if (!membership) {
      throw new Error('Membership not found');
    }

    return await this.update(membership.id, { role: newRole });
  }

  /**
   * Activate membership
   * 
   * @param {String} membershipId - Membership ID
   * @returns {Promise<Object>} Updated membership
   */
  async activate(membershipId) {
    return await this.update(membershipId, { status: 'active' });
  }

  /**
   * Suspend membership
   * 
   * @param {String} membershipId - Membership ID
   * @returns {Promise<Object>} Updated membership
   */
  async suspend(membershipId) {
    return await this.update(membershipId, { status: 'suspended' });
  }

  /**
   * Get membership statistics for a tenant
   * 
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Statistics object
   */
  async getTenantStats(tenantId) {
    const memberships = await this.find({ tenantId, status: 'active' });
    
    const stats = {
      total: memberships.length,
      byRole: {},
      active: memberships.filter(m => m.status === 'active').length,
      suspended: memberships.filter(m => m.status === 'suspended').length
    };

    // Count by role
    memberships.forEach(m => {
      stats.byRole[m.role] = (stats.byRole[m.role] || 0) + 1;
    });

    return stats;
  }

  /**
   * Bulk create memberships
   * Useful for adding multiple users to a tenant
   * 
   * @param {Array} memberships - Array of membership data
   * @returns {Promise<Array>} Created memberships
   */
  async bulkCreate(memberships) {
    const results = [];
    
    for (const membership of memberships) {
      try {
        const created = await this.create(membership);
        results.push({ success: true, membership: created });
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          membership
        });
      }
    }

    return results;
  }

  /**
   * Check if user has any admin memberships
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Boolean>} True if user is admin anywhere
   */
  async isAdminAnywhere(userId) {
    const adminMemberships = await this.find({
      userId,
      role: 'tenant_admin',
      status: 'active'
    });
    return adminMemberships.length > 0;
  }

  /**
   * Get user's default tenant
   * Returns first tenant where user is admin, or first tenant overall
   * 
   * @param {String} userId - User ID
   * @returns {Promise<String|null>} Tenant ID or null
   */
  async getUserDefaultTenant(userId) {
    // Try to find admin membership first
    const adminMembership = await this.findOne({
      userId,
      role: 'tenant_admin',
      status: 'active'
    });

    if (adminMembership) {
      return adminMembership.tenantId;
    }

    // Otherwise get first active membership
    const membership = await this.findOne({
      userId,
      status: 'active'
    });

    return membership ? membership.tenantId : null;
  }
}

module.exports = MembershipRepository;

