/**
 * Admin Statistics API
 * 
 * Provides system-wide statistics for the Super Admin dashboard
 */

const { logger } = require('../core/Logger');
const mongoose = require('mongoose');

// Helper to get or create models
function getOrCreateModel(name) {
  try {
    return mongoose.model(name);
  } catch (error) {
    // Model doesn't exist, return null and let the route handle it
    return null;
  }
}

async function registerAdminStatsRoutes(fastify) {
  /**
   * GET /api/admin/system/stats
   * Get system-wide statistics for admin dashboard
   */
  fastify.get('/system/stats', async (request, reply) => {
    try {
      // Get models
      const TenantModel = getOrCreateModel('Tenant');
      const UserModel = getOrCreateModel('User');
      const OrganizationModel = getOrCreateModel('Organization');
      const SubscriptionModel = getOrCreateModel('Subscription');

      if (!TenantModel || !UserModel || !OrganizationModel || !SubscriptionModel) {
        return reply.send({
          stats: [
            { id: 'total-tenants', title: 'Total Tenants', value: 0 },
            { id: 'active-tenants', title: 'Active Tenants', value: 0 },
            { id: 'total-users', title: 'Total Users', value: 0 },
            { id: 'total-organizations', title: 'Organizations', value: 0 },
            { id: 'active-subscriptions', title: 'Active Subscriptions', value: 0 },
            { id: 'expiring-soon', title: 'Expiring Soon', value: 0 }
          ]
        });
      }

      // Calculate stats in parallel
      const [
        totalTenants,
        activeTenants,
        totalUsers,
        totalOrganizations,
        activeSubscriptions,
        expiringSoon
      ] = await Promise.all([
        TenantModel.countDocuments({}),
        TenantModel.countDocuments({ status: 'active' }),
        UserModel.countDocuments({ status: { $ne: 'deleted' } }),
        OrganizationModel.countDocuments({ status: 'active' }),
        SubscriptionModel.countDocuments({ lifecycleStatus: 'active' }),
        SubscriptionModel.countDocuments({
          lifecycleStatus: 'active',
          termEndAt: {
            $gte: new Date(),
            $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        })
      ]);

      // Return stats in the format expected by GenericKPIGadget
      const statsResponse = {
        stats: [
          {
            id: 'total-tenants',
            title: 'Total Tenants',
            value: totalTenants,
            icon: 'FaBuilding',
            color: 'blue'
          },
          {
            id: 'active-tenants',
            title: 'Active Tenants',
            value: activeTenants,
            icon: 'FaCheckCircle',
            color: 'green'
          },
          {
            id: 'total-users',
            title: 'Total Users',
            value: totalUsers,
            icon: 'FaUsers',
            color: 'purple'
          },
          {
            id: 'total-organizations',
            title: 'Organizations',
            value: totalOrganizations,
            icon: 'FaSitemap',
            color: 'orange'
          },
          {
            id: 'active-subscriptions',
            title: 'Active Subscriptions',
            value: activeSubscriptions,
            icon: 'FaCalendarCheck',
            color: 'cyan'
          },
          {
            id: 'expiring-soon',
            title: 'Expiring Soon',
            value: expiringSoon,
            icon: 'FaClock',
            color: 'red'
          }
        ]
      };

      logger.debug('📊 Admin Stats Response:', JSON.stringify(statsResponse, null, 2));
      return reply.send(statsResponse);
    } catch (error) {
      fastify.log.error('Error fetching system stats:', error);
      return reply.code(500).send({
        error: 'Failed to fetch system statistics',
        message: error.message
      });
    }
  });
}

module.exports = registerAdminStatsRoutes;

