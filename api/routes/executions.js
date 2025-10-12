/**
 * Executions API Routes
 *
 * RESTful endpoints for managing workflow executions,
 * checkpoints, human interventions, and execution control.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ExecutionEngine for workflow execution lifecycle
 * - Uses ExecutionRepository for data access
 * - Uses TenantContextFactory for tenant isolation
 */

const { logger } = require('../core/Logger');
const ExecutionEngine = require('../workflows/execution/ExecutionEngine');
const ExecutionRepository = require('../repositories/ExecutionRepository');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const TenantContextFactory = require('../core/TenantContextFactory');
const { NotFoundError, ValidationError } = require('../core/ErrorHandler');

async function registerExecutionRoutes(fastify) {
  /**
   * GET /api/executions
   * List executions with optional filtering
   */
  fastify.get('/', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const {
        status,
        workflowId,
        initiatedBy,
        limit = 50,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = request.query;

      // Build filters
      const filters = {};
      if (status) filters.status = status;
      if (workflowId) filters.workflowId = workflowId;
      if (initiatedBy) filters.initiatedBy = initiatedBy;

      // Use repository for paginated query with automatic tenant filtering
      const { data: executions, total } = await repository.findWithPagination(
        filters,
        {
          limit: parseInt(limit),
          offset: parseInt(offset),
          sortBy,
          sortOrder
        }
      );

      reply.send({
        executions,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      logger.error('Error fetching executions', {
        error: error.message,
        query: request.query
      });
      reply.code(500).send({
        error: 'Failed to fetch executions',
        message: error.message
      });
    }
  });

  /**
   * GET /api/executions/:executionId
   * Get execution details
   */
  fastify.get('/:executionId', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      // Use repository to fetch execution (automatic tenant filtering)
      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found', {
          executionId: request.params.executionId
        });
      }

      // No manual tenant check needed - repository handles it automatically
      reply.send(execution);

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          error: error.message
        });
      }

      logger.error('Error fetching execution', {
        error: error.message,
        executionId: request.params.executionId
      });
      reply.code(500).send({
        error: 'Failed to fetch execution',
        message: error.message
      });
    }
  });

  /**
   * GET /api/executions/:executionId/state
   * Get current execution state
   */
  fastify.get('/:executionId/state', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      // Use repository to fetch execution with tenant filtering
      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found', {
          executionId: request.params.executionId
        });
      }

      reply.send({
        executionId: execution.id,
        status: execution.status,
        currentState: execution.currentState,
        lastCheckpoint: execution.checkpoints?.[execution.checkpoints.length - 1]
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          error: error.message
        });
      }

      logger.error('Error fetching execution state', {
        error: error.message,
        executionId: request.params.executionId
      });
      reply.code(500).send({
        error: 'Failed to fetch execution state',
        message: error.message
      });
    }
  });

  /**
   * GET /api/executions/:executionId/checkpoints
   * Get execution checkpoints
   */
  fastify.get('/:executionId/checkpoints', async (request, reply) => {
    try {
      const { limit = 20, offset = 0 } = request.query;

      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      // Use repository to fetch execution with tenant filtering
      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found', {
          executionId: request.params.executionId
        });
      }

      const checkpoints = (execution.checkpoints || [])
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map(cp => ({
          timestamp: cp.timestamp,
          node: cp.node,
          message: cp.message,
          metadata: cp.metadata
        }));

      reply.send({
        executionId: execution.id,
        checkpoints,
        total: execution.checkpoints?.length || 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({
          error: error.message
        });
      }

      logger.error('Error fetching checkpoints', {
        error: error.message,
        executionId: request.params.executionId
      });
      reply.code(500).send({
        error: 'Failed to fetch checkpoints',
        message: error.message
      });
    }
  });

  /**
   * POST /api/executions/:executionId/pause
   * Pause execution
   */
  fastify.post('/:executionId/pause', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found');
      }

      if (execution.status !== 'running') {
        throw new ValidationError('Execution is not running', {
          status: execution.status
        });
      }

      const updated = await repository.update(execution.id, {
        status: 'paused',
        pausedAt: new Date()
      });

      reply.send({
        executionId: updated.id,
        status: 'paused',
        pausedAt: updated.pausedAt
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return reply.code(400).send({ error: error.message, details: error.details });
      }
      
      logger.error('Error pausing execution', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to pause execution',
        message: error.message
      });
    }
  });

  /**
   * POST /api/executions/:executionId/resume
   * Resume execution
   */
  fastify.post('/:executionId/resume', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found');
      }

      if (execution.status !== 'paused') {
        throw new ValidationError('Execution is not paused', {
          status: execution.status
        });
      }

      const updated = await repository.update(execution.id, {
        status: 'running',
        resumedAt: new Date()
      });

      reply.send({
        executionId: updated.id,
        status: 'running',
        resumedAt: updated.resumedAt
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }
      if (error instanceof ValidationError) {
        return reply.code(400).send({ error: error.message, details: error.details });
      }

      logger.error('Error resuming execution', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to resume execution',
        message: error.message
      });
    }
  });

  /**
   * POST /api/executions/:executionId/cancel
   * Cancel execution
   */
  fastify.post('/:executionId/cancel', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found');
      }

      const updated = await repository.update(execution.id, {
        status: 'cancelled',
        completedAt: new Date()
      });

      reply.send({
        executionId: updated.id,
        status: 'cancelled',
        cancelledAt: updated.completedAt
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }

      logger.error('Error cancelling execution', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to cancel execution',
        message: error.message
      });
    }
  });

  /**
   * POST /api/executions/:executionId/human-response
   * Submit human intervention response
   */
  fastify.post('/:executionId/human-response', async (request, reply) => {
    try {
      const { interventionId, response, decision } = request.body;

      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found');
      }

      // Update the specific intervention in the humanInterventions array
      const humanInterventions = execution.humanInterventions || [];
      const interventionIndex = humanInterventions.findIndex(hi => hi.id === interventionId);

      if (interventionIndex === -1) {
        throw new NotFoundError('Intervention not found');
      }

      humanInterventions[interventionIndex].completedAt = new Date();
      humanInterventions[interventionIndex].response = response;
      humanInterventions[interventionIndex].respondedBy = request.user?.id || 'system';

      const updated = await repository.update(execution.id, {
        humanInterventions
      });

      reply.send({
        executionId: updated.id,
        interventionId,
        status: updated.status,
        message: 'Human intervention completed'
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }

      logger.error('Error processing human response', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to process human response',
        message: error.message
      });
    }
  });

  /**
   * GET /api/executions/:executionId/human-interventions
   * Get pending human interventions
   */
  fastify.get('/:executionId/human-interventions', async (request, reply) => {
    try {
      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      const execution = await repository.findById(request.params.executionId);

      if (!execution) {
        throw new NotFoundError('Execution not found');
      }

      const pendingInterventions = (execution.humanInterventions || []).filter(hi => !hi.completedAt);

      reply.send({
        executionId: execution.id,
        interventions: pendingInterventions
      });

    } catch (error) {
      if (error instanceof NotFoundError) {
        return reply.code(404).send({ error: error.message });
      }

      logger.error('Error fetching human interventions', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to fetch human interventions',
        message: error.message
      });
    }
  });

/**
 * GET /api/executions/stats
 * Get execution statistics
 */
fastify.get('/stats', async (request, reply) => {
  try {
    const stats = await Execution.getStatistics();

    // Add additional metrics
    const recentStats = await Execution.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    reply.send({
      overall: stats,
      recent: recentStats.reduce((acc, stat) => {
        acc[stat._id] = {
          count: stat.count,
          avgDuration: stat.avgDuration
        };
        return acc;
      }, {})
    });

  } catch (error) {
    logger.error('Error fetching execution statistics:', error);
    reply.code(500).send({
      error: 'Failed to fetch execution statistics',
      message: error.message
    });
  }
});

  /**
   * POST /api/executions/cleanup
   * Clean up old executions (admin only)
   */
  fastify.post('/cleanup', async (request, reply) => {
    try {
      // Check if user is admin
      if (!request.user?.isAdmin && !request.user?.isPlatformAdmin) {
        return reply.code(403).send({
          error: 'Admin access required'
        });
      }

      // Create tenant context
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new ExecutionRepository(tenantContext, request.context);

      // Delete executions older than 90 days with completed/cancelled/failed status
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 90);

      const filters = {
        status: { $in: ['completed', 'cancelled', 'failed'] },
        completedAt: { $lt: cutoffDate }
      };

      // Use repository to find and delete old executions
      const oldExecutions = await repository.find(filters);
      
      let deletedCount = 0;
      for (const execution of oldExecutions) {
        await repository.delete(execution.id);
        deletedCount++;
      }

      reply.send({
        message: 'Cleanup completed',
        deletedCount
      });

    } catch (error) {
      logger.error('Error during cleanup', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to cleanup executions',
        message: error.message
      });
    }
  });

}

module.exports = registerExecutionRoutes;
