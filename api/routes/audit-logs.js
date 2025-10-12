/**
 * Audit Logs API
 * 
 * Provides access to system audit logs for Super Admin
 */

const { AuditTrail, AuditEventModel } = require('../core/AuditTrail');
const { requirePlatformAdmin } = require('../core/AuthMiddleware');

async function registerAuditLogsRoutes(fastify) {
  /**
   * GET /api/audit-logs
   * Get audit logs with filtering and pagination
   */
  fastify.get('/', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const {
        eventType,
        resourceType,
        resourceId,
        userId,
        tenantId,
        startDate,
        endDate,
        page = 1,
        limit = 10
      } = request.query;

      const filters = {
        eventType,
        resourceType,
        resourceId,
        userId,
        tenantId,
        startDate,
        endDate,
        page: parseInt(page),
        limit: parseInt(limit)
      };

      const result = await AuditTrail.queryLogs(filters);

      // Format for SGridSearchGadget
      return reply.send({
        data: result.data.map(event => ({
          id: event.eventId,
          timestamp: event.timestamp,
          eventType: event.eventType,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          userId: event.userId,
          tenantId: event.tenantId,
          changes: event.changes,
          metadata: event.metadata,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        })),
        pagination: result.pagination,
        total: result.pagination.total
      });
    } catch (error) {
      fastify.log.error('Error fetching audit logs:', error);
      return reply.code(500).send({
        error: 'Failed to fetch audit logs',
        message: error.message
      });
    }
  });

  /**
   * GET /api/audit-logs/stats
   * Get audit log statistics
   */
  fastify.get('/stats', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const stats = await AuditTrail.getStats();
      return reply.send(stats);
    } catch (error) {
      fastify.log.error('Error fetching audit stats:', error);
      return reply.code(500).send({
        error: 'Failed to fetch audit statistics',
        message: error.message
      });
    }
  });

  /**
   * GET /api/audit-logs/:id
   * Get a specific audit log by ID
   */
  fastify.get('/:id', { preHandler: requirePlatformAdmin }, async (request, reply) => {
    try {
      const { id } = request.params;
      
      const event = await AuditEventModel.findOne({ eventId: id }).lean();
      
      if (!event) {
        return reply.code(404).send({ error: 'Audit log not found' });
      }

      return reply.send(event);
    } catch (error) {
      fastify.log.error('Error fetching audit log:', error);
      return reply.code(500).send({
        error: 'Failed to fetch audit log',
        message: error.message
      });
    }
  });
}

module.exports = registerAuditLogsRoutes;
