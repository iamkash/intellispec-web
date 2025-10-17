/**
 * Platform Admin Routes
 * 
 * These routes are only accessible to users with platformRole: 'platform_admin'
 * Used for managing tenants, organizations, system-wide settings, etc.
 */

const mongoose = require('mongoose');
const { requirePlatformAdmin } = require('../middleware/platform-admin');

// Lazy-load models
const getTenantModel = () => mongoose.model('Tenant');
const getUserModel = () => mongoose.model('User');
const getSubscriptionModel = () => mongoose.model('Subscription');
const getTenantEntitlementsModel = () => mongoose.model('TenantEntitlements');

const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Register platform admin routes
 */
async function registerPlatformAdminRoutes(fastify) {
  
  /**
   * GET /api/platform/tenants
   * List all tenants (platform admins only)
   */
  fastify.get('/platform/tenants', {
    preHandler: requirePlatformAdmin
  }, async (request, reply) => {
    try {
      const { status, limit = 100, skip = 0 } = request.query;
      
      const TenantModel = getTenantModel();
      const SubscriptionModel = getSubscriptionModel();
      const TenantEntitlementsModel = getTenantEntitlementsModel();
      
      const filter = status ? { status } : {};
      
      const tenants = await TenantModel.find(filter)
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .sort({ createdAt: -1 })
        .lean();
      
      // Enrich with subscription and entitlements
      const enrichedTenants = await Promise.all(tenants.map(async (tenant) => {
        const subscription = await SubscriptionModel.findOne({ tenantId: tenant.id }).lean();
        const entitlements = await TenantEntitlementsModel.findOne({ tenantId: tenant.id }).lean();
        
        return {
          ...tenant,
          subscription,
          entitlements
        };
      }));
      
      const total = await TenantModel.countDocuments(filter);
      
      return reply.send({
        tenants: enrichedTenants,
        pagination: {
          total,
          limit: parseInt(limit),
          skip: parseInt(skip),
          hasMore: (parseInt(skip) + enrichedTenants.length) < total
        }
      });
      
    } catch (error) {
      fastify.log.error('Platform list tenants error:', error);
      return reply.code(500).send({ 
        error: 'Failed to list tenants',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * POST /api/platform/tenants
   * Create a new tenant (platform admins only)
   */
  fastify.post('/platform/tenants', {
    preHandler: requirePlatformAdmin
  }, async (request, reply) => {
    try {
      const { 
        orgId,
        name, 
        slug, 
        plan = 'IntelliFlex',
        tenantType = 'facility-based',
        maxUsers,
        maxFacilities,
        modules = ['system'],
        trialEnabled = false,
        trialDays = 30
      } = request.body;
      
      if (!name || !slug) {
        return reply.code(400).send({ 
          error: 'Name and slug are required' 
        });
      }
      
      const TenantModel = getTenantModel();
      const SubscriptionModel = getSubscriptionModel();
      const TenantEntitlementsModel = getTenantEntitlementsModel();
      
      // Check if slug already exists
      const existing = await TenantModel.findOne({ slug });
      if (existing) {
        return reply.code(409).send({ 
          error: 'Tenant with this slug already exists' 
        });
      }
      
      // Create tenant
      const tenantId = generateId('t');
      const tenant = await TenantModel.create({
        id: tenantId,
        orgId,
        name,
        slug,
        status: 'active',
        plan,
        tenantType,
        maxUsers,
        maxFacilities,
        trial: {
          enabled: trialEnabled,
          trialDays,
          startMode: 'auto',
          gracePeriodDays: 7
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: request.user.userId
      });
      
      // Create subscription
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year subscription
      
      const subscription = await SubscriptionModel.create({
        id: generateId('subscription'),
        tenantId,
        termStartAt: startDate,
        termEndAt: endDate,
        autoRenew: true,
        gracePeriodDays: 7,
        lifecycleStatus: trialEnabled ? 'trialing' : 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // Create entitlements
      const entitlements = await TenantEntitlementsModel.create({
        id: generateId('entitlements'),
        tenantId,
        modules,
        sitesAllowed: maxFacilities || 1,
        unlimitedUsers: !maxUsers,
        effectiveAt: new Date(),
        version: 1,
        changedBy: request.user.userId,
        createdAt: new Date()
      });
      
      return reply.code(201).send({
        message: 'Tenant created successfully',
        tenant: {
          ...tenant.toObject(),
          subscription,
          entitlements
        }
      });
      
    } catch (error) {
      fastify.log.error('Platform create tenant error:', error);
      return reply.code(500).send({ 
        error: 'Failed to create tenant',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * PUT /api/platform/tenants/:tenantId
   * Update tenant (platform admins only)
   */
  fastify.put('/platform/tenants/:tenantId', {
    preHandler: requirePlatformAdmin
  }, async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const updates = request.body;
      
      const TenantModel = getTenantModel();
      
      const tenant = await TenantModel.findOneAndUpdate(
        { id: tenantId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date(),
            lastModifiedBy: request.user.userId
          } 
        },
        { new: true }
      );
      
      if (!tenant) {
        return reply.code(404).send({ error: 'Tenant not found' });
      }
      
      return reply.send({
        message: 'Tenant updated successfully',
        tenant
      });
      
    } catch (error) {
      fastify.log.error('Platform update tenant error:', error);
      return reply.code(500).send({ 
        error: 'Failed to update tenant',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * DELETE /api/platform/tenants/:tenantId
   * Soft delete tenant (platform admins only)
   */
  fastify.delete('/platform/tenants/:tenantId', {
    preHandler: requirePlatformAdmin
  }, async (request, reply) => {
    try {
      const { tenantId } = request.params;
      const { hard = false } = request.query;
      
      const TenantModel = getTenantModel();
      
      if (hard) {
        // Hard delete - actually remove from database (dangerous!)
        await TenantModel.deleteOne({ id: tenantId });
        return reply.send({ 
          message: 'Tenant permanently deleted' 
        });
      } else {
        // Soft delete - just mark as inactive
        const tenant = await TenantModel.findOneAndUpdate(
          { id: tenantId },
          { 
            $set: { 
              status: 'inactive',
              updatedAt: new Date(),
              lastModifiedBy: request.user.userId
            } 
          },
          { new: true }
        );
        
        if (!tenant) {
          return reply.code(404).send({ error: 'Tenant not found' });
        }
        
        return reply.send({ 
          message: 'Tenant deactivated',
          tenant
        });
      }
      
    } catch (error) {
      fastify.log.error('Platform delete tenant error:', error);
      return reply.code(500).send({ 
        error: 'Failed to delete tenant',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  /**
   * GET /api/platform/stats
   * Get platform-wide statistics (platform admins only)
   */
  fastify.get('/platform/stats', {
    preHandler: requirePlatformAdmin
  }, async (request, reply) => {
    try {
      const TenantModel = getTenantModel();
      const UserModel = getUserModel();
      const [
        totalTenants,
        activeTenants,
        suspendedTenants,
        totalUsers,
        platformAdmins
      ] = await Promise.all([
        TenantModel.countDocuments(),
        TenantModel.countDocuments({ status: 'active' }),
        TenantModel.countDocuments({ status: 'suspended' }),
        UserModel.countDocuments(),
        UserModel.countDocuments({ platformRole: 'platform_admin' })
      ]);
      
      return reply.send({
        tenants: {
          total: totalTenants,
          active: activeTenants,
          suspended: suspendedTenants,
          inactive: totalTenants - activeTenants - suspendedTenants
        },
        users: {
          total: totalUsers,
          platformAdmins
        }
      });
      
    } catch (error) {
      fastify.log.error('Platform stats error:', error);
      return reply.code(500).send({ 
        error: 'Failed to get platform stats',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });
}

module.exports = registerPlatformAdminRoutes;
