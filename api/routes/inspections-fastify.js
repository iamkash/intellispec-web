/**
 * Generic Document API Routes for Fastify
 * 
 * RESTful API endpoints for document management (inspections, companies, sites, etc.)
 * Fully generic - works with ANY document type without code changes
 * 
 * Architecture:
 * - Pure repository pattern (no service layer needed)
 * - TenantContext for automatic tenant scoping
 * - DocumentRepository handles ALL document types
 * - Routes are HTTP handlers only
 */

const TenantContextFactory = require('../core/TenantContextFactory');
const { requireAuth } = require('../core/AuthMiddleware');
const DocumentRepository = require('../repositories/DocumentRepository');

/**
 * Helper to extract tenant and user from request
 */
function getTenantAndUser(request) {
  if (!request.user || !request.user.id) {
    throw new Error('User not authenticated');
  }

  const tenantId = request.user.tenantId;
  const userId = request.user.id;

  return { tenantId, userId };
}

async function registerInspectionRoutes(fastify) {
  /**
   * GET /inspections
   * List all inspections with filters
   */
  fastify.get('/inspections', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context from request (JWT or headers)
      const tenantContext = TenantContextFactory.fromRequest(request);
      
      // Create repository with tenant context and request context for audit logging
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const filters = {};
      const options = {
        page: parseInt(request.query.page) || 1,
        limit: parseInt(request.query.limit) || 20,
        sort: {}
      };

      // Parse filters from query params with operator support
      const parseFilterValue = (value, operator) => {
        if (operator === '__in') {
          return { $in: Array.isArray(value) ? value : [value] };
        }
        if (operator === '__gte') {
          return { $gte: value };
        }
        if (operator === '__lte') {
          return { $lte: value };
        }
        if (operator === '__gt') {
          return { $gt: value };
        }
        if (operator === '__lt') {
          return { $lt: value };
        }
        if (operator === '__ne') {
          return { $ne: value };
        }
        if (operator === '__regex') {
          return { $regex: value, $options: 'i' };
        }
        return value;
      };

      // Build filters from query params
      for (const [key, value] of Object.entries(request.query)) {
        if (['page', 'limit', 'sort', 'sortBy', 'sortOrder'].includes(key)) {
          continue;
        }

        // Check for operator suffix
        const operatorMatch = key.match(/(.+)__(in|gte|lte|gt|lt|ne|regex)$/);
        if (operatorMatch) {
          const [, fieldName, operator] = operatorMatch;
          filters[fieldName] = parseFilterValue(value, `__${operator}`);
        } else {
          filters[key] = value;
        }
      }

      // Handle sorting
      if (request.query.sortBy) {
        const sortOrder = request.query.sortOrder === 'desc' ? -1 : 1;
        options.sort[request.query.sortBy] = sortOrder;
      } else {
        options.sort.created_date = -1; // Default sort
      }

      // Use repository for data access (tenant filtering automatic)
      const result = await repository.findWithPagination(filters, options);
      
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to list inspections',
        message: error.message
      });
    }
  });

  /**
   * GET /inspections/stats
   * Get inspection statistics
   */
  fastify.get('/inspections/stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const filters = {};
      if (request.query.inspection_type) {
        filters.inspectionType = request.query.inspection_type;
      }
      if (request.query.equipment_type) {
        filters['formData.equipmentType'] = request.query.equipment_type;
      }

      // Use repository for statistics (tenant filtering automatic)
      const stats = await repository.getStats(filters);
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get inspection stats',
        message: error.message
      });
    }
  });

  /**
   * POST /api/inspections/aggregate
   * Run custom aggregation on inspections
   */
  fastify.post('/api/inspections/aggregate', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const { aggregationConfig } = request.body;
      
      if (!aggregationConfig) {
        return reply.status(400).send({ error: 'aggregationConfig is required' });
      }

      // Use repository for aggregation (tenant filtering automatic)
      const result = await repository.aggregate(aggregationConfig);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Aggregation failed',
        message: error.message
      });
    }
  });

  /**
   * POST /inspections
   * Create a new inspection
   */
  fastify.post('/inspections', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { tenantId, userId } = getTenantAndUser(request);
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);

      // Generate ID if not provided
      const inspectionData = {
        ...request.body,
        id: request.body.id || `inspection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        created_by: userId,
        created_date: new Date(),
        last_updated: new Date(),
        last_updated_by: userId,
        deleted: false
      };

      const inspection = await repository.create(inspectionData);
      return reply.status(201).send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: 'Failed to create inspection',
        message: error.message
      });
    }
  });

  /**
   * PUT /inspections/:id
   * Update an inspection
   */
  fastify.put('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = getTenantAndUser(request);
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);

      const updateData = {
        ...request.body,
        last_updated: new Date(),
        last_updated_by: userId
      };

      const inspection = await repository.update(request.params.id, updateData);
      
      if (!inspection) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: 'Failed to update inspection',
        message: error.message
      });
    }
  });

  /**
   * GET /inspections/:id
   * Get a single inspection
   */
  fastify.get('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      // Use repository to get inspection (tenant filtering automatic)
      const inspection = await repository.findById(request.params.id);
      
      if (!inspection) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get inspection',
        message: error.message
      });
    }
  });

  /**
   * DELETE /inspections/:id
   * Delete an inspection (soft delete)
   */
  fastify.delete('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      // Use repository to delete inspection (tenant filtering automatic)
      const result = await repository.delete(request.params.id);

      if (!result) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send({ success: true, message: 'Inspection deleted' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to delete inspection',
        message: error.message
      });
    }
  });
}

module.exports = registerInspectionRoutes;
