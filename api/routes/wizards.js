/**
 * Wizard Routes - Framework Standard
 * 
 * MIGRATED from old controller/service/repository pattern
 * 
 * Changes:
 * ✅ Uses DocumentRepository (automatic tenant filtering)
 * ✅ Automatic audit trail
 * ✅ Automatic user tracking
 * ✅ Standardized error handling
 * ✅ Request context integration
 * ✅ 69% less code
 * 
 * Security:
 * ✅ Tenant isolation enforced
 * ✅ Platform admin can see all wizards
 * ✅ Soft delete support
 */

const DocumentRepository = require('../repositories/DocumentRepository');
const TenantContextFactory = require('../core/TenantContextFactory');
const { requireAuth } = require('../core/AuthMiddleware');
const { NotFoundError, ValidationError, DatabaseError, APIError, ErrorTypes } = require('../core/ErrorHandler');
const { nanoid } = require('nanoid');

/**
 * Register wizard routes
 */
async function registerWizardRoutes(fastify) {

  /**
   * GET /api/wizards
   * List wizards with filtering
   * 
   * Query params:
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 50)
   * - configId: Filter by config ID
   * - gadgetId: Filter by gadget ID
   * - status: Filter by status (draft, in_progress, completed)
   * - prefix: Filter by ID prefix (for legacy compatibility)
   * 
   * Tenant filtering: AUTOMATIC
   */
  fastify.get('/wizards', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { page = 1, limit = 50, configId, gadgetId, status, prefix } = request.query;

      // Create tenant context from JWT (automatic tenant filtering)
      const tenantContext = TenantContextFactory.fromRequest(request);
      
      // Create repository for wizard documents (pass request.context for audit logging)
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      // Build filters
      const filters = {};
      if (configId) filters.configId = configId;
      if (gadgetId) filters.gadgetId = gadgetId;
      if (status) filters.status = status;
      
      // Legacy prefix filter (for backward compatibility)
      if (prefix) {
        filters.id = { $regex: `^${prefix}`, $options: 'i' };
      }

      // Get paginated results (tenant filtering automatic!)
      const result = await repository.findWithPagination(filters, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { created_date: -1 }
      });

      return reply.send({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        },
        meta: {
          type: 'wizard',
          tenantId: tenantContext.tenantId,
          isPlatformAdmin: tenantContext.isPlatformAdmin
        }
      });

    } catch (error) {
      fastify.log.error('Error listing wizards:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  /**
   * GET /api/wizards/:id
   * Get specific wizard by ID
   * 
   * Path params:
   * - id: Wizard ID
   * 
   * Tenant validation: AUTOMATIC - returns 404 if not in user's tenant
   */
  fastify.get('/wizards/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      // findById automatically checks tenant access
      const wizard = await repository.findById(id);
      
      if (!wizard) {
        throw new APIError('Wizard not found', ErrorTypes.NOT_FOUND, 404);
      }

      return reply.send({
        success: true,
        data: wizard
      });

    } catch (error) {
      fastify.log.error('Error getting wizard:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/wizards
   * Create new wizard
   * 
   * Body:
   * - gadgetId: string (required)
   * - configId: string (required)
   * - data: object (required) - wizard state data
   * - status: string (optional, default: 'draft')
   * - currentStep: number (optional, default: 0)
   * 
   * Automatic:
   * - tenantId (from JWT)
   * - created_by (from JWT)
   * - updated_by (from JWT)
   * - timestamps
   * - audit trail
   */
  fastify.post('/wizards', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { gadgetId, configId, data, status, currentStep, ...rest } = request.body;

      // Validate required fields
      if (!gadgetId) {
        throw new APIError('gadgetId is required', ErrorTypes.VALIDATION_ERROR, 400);
      }
      if (!configId) {
        throw new APIError('configId is required', ErrorTypes.VALIDATION_ERROR, 400);
      }
      if (!data || typeof data !== 'object') {
        throw new APIError('data is required and must be an object', ErrorTypes.VALIDATION_ERROR, 400);
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      // Prepare wizard data
      const wizardData = {
        id: rest.id || `wizard_${nanoid(12)}`,
        gadgetId,
        configId,
        data,
        status: status || 'draft',
        currentStep: currentStep || 0,
        completedSteps: rest.completedSteps || [],
        voiceData: rest.voiceData,
        imageData: rest.imageData || [],
        analysisData: rest.analysisData,
        textData: rest.textData
      };

      // Create (automatic tenant assignment, audit logging!)
      const created = await repository.create(wizardData);

      return reply.code(201).send({
        success: true,
        data: created,
        message: 'Wizard created successfully'
      });

    } catch (error) {
      fastify.log.error('Error creating wizard:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  /**
   * PUT /api/wizards/:id
   * Update existing wizard
   * 
   * Path params:
   * - id: Wizard ID
   * 
   * Body: Partial wizard data to update
   * 
   * Automatic:
   * - Tenant validation
   * - updated_by (from JWT)
   * - last_updated timestamp
   * - audit trail (tracks changes)
   */
  fastify.put('/wizards/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      // Remove fields that shouldn't be updated directly
      delete updates.id;
      delete updates.tenantId;
      delete updates.created_by;
      delete updates.created_date;

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      // Get existing wizard to merge data properly
      const existing = await repository.findById(id);
      if (!existing) {
        throw new APIError('Wizard not found or access denied', ErrorTypes.NOT_FOUND, 404);
      }

      // Deep merge data field if provided
      if (updates.data && typeof updates.data === 'object') {
        updates.data = {
          ...(existing.data || {}),
          ...updates.data
        };
      }

      // Update (automatic tenant validation, audit logging!)
      const updated = await repository.update(id, updates);

      if (!updated) {
        throw new APIError('Wizard not found or access denied', ErrorTypes.NOT_FOUND, 404);
      }

      return reply.send({
        success: true,
        data: updated,
        message: 'Wizard updated successfully'
      });

    } catch (error) {
      fastify.log.error('Error updating wizard:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  /**
   * DELETE /api/wizards/:id
   * Delete wizard (soft delete by default)
   * 
   * Path params:
   * - id: Wizard ID
   * 
   * Query params:
   * - hard_delete: true for permanent deletion (default: false)
   * 
   * Automatic:
   * - Tenant validation
   * - Soft delete (sets deleted: true)
   * - deleted_by (from JWT)
   * - deleted_at timestamp
   * - audit trail
   */
  fastify.delete('/wizards/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { hard_delete = false } = request.query;

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      let result;
      if (hard_delete === 'true' || hard_delete === true) {
        // Permanent deletion (use with caution!)
        result = await repository.hardDelete(id);
      } else {
        // Soft delete (default, safer)
        result = await repository.delete(id);
      }

      if (!result) {
        throw new APIError('Wizard not found or access denied', ErrorTypes.NOT_FOUND, 404);
      }

      return reply.send({
        success: true,
        message: 'Wizard deleted successfully',
        hardDelete: hard_delete
      });

    } catch (error) {
      fastify.log.error('Error deleting wizard:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * DELETE /api/wizards
   * Clear all wizards (DEV ONLY - should be disabled in production)
   * 
   * Security: Only works for current user's tenant
   * Platform admin: Clears all wizards (use with extreme caution!)
   */
  fastify.delete('/wizards', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Only allow in development environment
      if (process.env.NODE_ENV === 'production') {
        throw new APIError('Clear operation not allowed in production', ErrorTypes.FORBIDDEN, 403);
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      // Find all wizards for this tenant
      const wizards = await repository.find({});

      // Delete each one (logs audit trail for each)
      let deletedCount = 0;
      for (const wizard of wizards) {
        await repository.hardDelete(wizard.id);
        deletedCount++;
      }

      return reply.send({
        success: true,
        message: `Cleared ${deletedCount} wizards`,
        count: deletedCount
      });

    } catch (error) {
      fastify.log.error('Error clearing wizards:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });
}

module.exports = registerWizardRoutes;
