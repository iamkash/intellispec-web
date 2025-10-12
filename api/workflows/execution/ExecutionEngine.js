/**
 * ExecutionEngine - Production-ready workflow execution manager
 *
 * Handles workflow execution, state management, error recovery, and monitoring.
 * Integrates with ExecutionRepository and WorkflowService for persistence.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ErrorHandler for standardized errors
 * - Uses Metrics for execution tracking
 * - Uses AuditTrail for compliance logging
 * - Uses ExecutionRepository for persistence
 */

const { logger } = require('../../core/Logger');
const { AppError, ValidationError } = require('../../core/ErrorHandler');
const { AuditTrail } = require('../../core/AuditTrail');
const ExecutionRepository = require('../../repositories/ExecutionRepository');
const TenantContextFactory = require('../../core/TenantContextFactory');

class ExecutionEngine {
  constructor(workflowFactory) {
    this.workflowFactory = workflowFactory;
    this.activeExecutions = new Map(); // In-memory tracking of running executions
  }

  /**
   * Execute a workflow with full lifecycle management
   * @param {Object} workflowMetadata - Workflow definition
   * @param {Object} inputs - Initial workflow inputs
   * @param {Object} context - Execution context (user, tenant, request)
   * @returns {Promise<Object>} Execution result
   */
  async executeWorkflow(workflowMetadata, inputs, context) {
    const startTime = Date.now();
    let executionId = null;
    let execution = null;

    try {
      // Validate metadata
      const validation = this.workflowFactory.validateMetadata(workflowMetadata);
      if (!validation.isValid) {
        throw new ValidationError('Invalid workflow metadata', {
          errors: validation.errors,
          workflowId: workflowMetadata.id
        });
      }

      // Create tenant context
      const tenantContext = context.tenantId 
        ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
        : TenantContextFactory.fromRequest(context.request);

      // Initialize execution repository
      const repository = new ExecutionRepository(tenantContext, context.request?.context);

      // Create execution record
      execution = await repository.create({
        workflowId: workflowMetadata.id,
        workflowName: workflowMetadata.name || workflowMetadata.id,
        status: 'running',
        inputs,
        outputs: null,
        startedAt: new Date(),
        completedAt: null,
        error: null,
        metadata: {
          agentCount: workflowMetadata.agents?.length || 0,
          userId: context.userId,
          requestId: context.request?.context?.requestId
        }
      });

      executionId = execution.id;
      this.activeExecutions.set(executionId, { execution, startTime });

      logger.info('Workflow execution started', {
        executionId,
        workflowId: workflowMetadata.id,
        tenantId: tenantContext.tenantId,
        userId: context.userId
      });

      // Audit trail
      await AuditTrail.logCreate('workflow_execution_started', {
        executionId,
        workflowId: workflowMetadata.id,
        workflowName: workflowMetadata.name
      }, {
        userId: context.userId || 'system',
        tenantId: tenantContext.tenantId || 'system'
      });

      // Create and compile workflow
      const workflow = this.workflowFactory.createWorkflow(workflowMetadata);
      const compiled = this.workflowFactory.compileWorkflow(workflow);

      // Execute workflow
      const result = await compiled.invoke(inputs, {
        userId: context.userId,
        tenantId: tenantContext.tenantId,
        executionId
      });

      // Calculate metrics
      const duration = Date.now() - startTime;

      // Update execution record with success
      await repository.update(executionId, {
        status: 'completed',
        outputs: result,
        completedAt: new Date(),
        metadata: {
          ...execution.metadata,
          duration,
          successfulAgents: this.countSuccessfulAgents(result),
          finalConfidence: result.confidence || 0
        }
      });

      logger.info('Workflow execution completed successfully', {
        executionId,
        workflowId: workflowMetadata.id,
        duration,
        tenantId: tenantContext.tenantId
      });

      // Audit trail
      await AuditTrail.logUpdate('workflow_execution_completed', executionId, {
        duration,
        status: 'completed'
      }, {
        userId: context.userId || 'system',
        tenantId: tenantContext.tenantId || 'system'
      });

      // Clean up active executions
      this.activeExecutions.delete(executionId);

      return {
        executionId,
        status: 'completed',
        result,
        duration,
        metadata: execution.metadata
      };

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error('Workflow execution failed', {
        executionId,
        workflowId: workflowMetadata?.id,
        error: error.message,
        duration,
        stack: error.stack
      });

      // Update execution record with failure
      if (executionId && execution) {
        try {
          const tenantContext = context.tenantId 
            ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
            : TenantContextFactory.fromRequest(context.request);

          const repository = new ExecutionRepository(tenantContext, context.request?.context);

          await repository.update(executionId, {
            status: 'failed',
            completedAt: new Date(),
            error: {
              message: error.message,
              type: error.constructor.name,
              stack: error.stack
            },
            metadata: {
              ...execution.metadata,
              duration
            }
          });

          // Audit trail
          await AuditTrail.logUpdate('workflow_execution_failed', executionId, {
            error: error.message,
            duration
          }, {
            userId: context.userId || 'system',
            tenantId: tenantContext.tenantId || 'system'
          });

        } catch (updateError) {
          logger.error('Failed to update execution record with error', {
            executionId,
            updateError: updateError.message
          });
        }
      }

      // Clean up active executions
      if (executionId) {
        this.activeExecutions.delete(executionId);
      }

      throw error;
    }
  }

  /**
   * Get execution status
   * @param {string} executionId - Execution ID
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Execution status
   */
  async getExecutionStatus(executionId, context) {
    try {
      const tenantContext = context.tenantId 
        ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
        : TenantContextFactory.fromRequest(context.request);

      const repository = new ExecutionRepository(tenantContext, context.request?.context);
      const execution = await repository.findById(executionId);

      if (!execution) {
        throw new AppError('Execution not found', 404, { executionId });
      }

      // Check if still active in memory
      const active = this.activeExecutions.get(executionId);
      if (active) {
        const runningTime = Date.now() - active.startTime;
        return {
          ...execution,
          isActive: true,
          runningTime
        };
      }

      return {
        ...execution,
        isActive: false
      };

    } catch (error) {
      logger.error('Failed to get execution status', {
        executionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Cancel a running execution
   * @param {string} executionId - Execution ID
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelExecution(executionId, context) {
    try {
      const active = this.activeExecutions.get(executionId);
      if (!active) {
        throw new AppError('Execution not active or not found', 404, { executionId });
      }

      logger.info('Cancelling workflow execution', { executionId });

      // Mark as cancelled in database
      const tenantContext = context.tenantId 
        ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
        : TenantContextFactory.fromRequest(context.request);

      const repository = new ExecutionRepository(tenantContext, context.request?.context);

      await repository.update(executionId, {
        status: 'cancelled',
        completedAt: new Date(),
        metadata: {
          ...active.execution.metadata,
          duration: Date.now() - active.startTime,
          cancelledBy: context.userId
        }
      });

      // Audit trail
      await AuditTrail.logUpdate('workflow_execution_cancelled', executionId, {
        cancelledBy: context.userId
      }, {
        userId: context.userId || 'system',
        tenantId: tenantContext.tenantId || 'system'
      });

      // Clean up
      this.activeExecutions.delete(executionId);

      return {
        executionId,
        status: 'cancelled',
        message: 'Execution cancelled successfully'
      };

    } catch (error) {
      logger.error('Failed to cancel execution', {
        executionId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List recent executions
   * @param {Object} filters - Filter criteria
   * @param {Object} context - Request context
   * @returns {Promise<Object>} List of executions
   */
  async listExecutions(filters, context) {
    try {
      const tenantContext = context.tenantId 
        ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
        : TenantContextFactory.fromRequest(context.request);

      const repository = new ExecutionRepository(tenantContext, context.request?.context);

      const result = await repository.findWithPagination(filters, {
        page: filters.page || 1,
        limit: filters.limit || 20,
        sort: { startedAt: -1 }
      });

      logger.debug('Executions listed', {
        count: result.data.length,
        page: result.page,
        tenantId: tenantContext.tenantId
      });

      return result;

    } catch (error) {
      logger.error('Failed to list executions', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get execution statistics
   * @param {Object} filters - Filter criteria
   * @param {Object} context - Request context
   * @returns {Promise<Object>} Execution statistics
   */
  async getExecutionStats(filters, context) {
    try {
      const tenantContext = context.tenantId 
        ? TenantContextFactory.create(context.tenantId, context.userId, context.isPlatformAdmin)
        : TenantContextFactory.fromRequest(context.request);

      const repository = new ExecutionRepository(tenantContext, context.request?.context);
      const stats = await repository.getStatistics(filters);

      logger.debug('Execution statistics retrieved', {
        totalExecutions: stats.total,
        tenantId: tenantContext.tenantId
      });

      return stats;

    } catch (error) {
      logger.error('Failed to get execution statistics', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Count successful agents in execution result
   * @param {Object} result - Execution result
   * @returns {number} Count of successful agents
   */
  countSuccessfulAgents(result) {
    if (!result || !result.agent_outputs) return 0;
    
    return Object.values(result.agent_outputs).filter(output => 
      output && output.confidence && output.confidence > 0.5
    ).length;
  }

  /**
   * Get active executions count
   * @returns {number} Number of currently running executions
   */
  getActiveExecutionsCount() {
    return this.activeExecutions.size;
  }

  /**
   * Clear all active executions (for cleanup/shutdown)
   */
  clearActiveExecutions() {
    const count = this.activeExecutions.size;
    this.activeExecutions.clear();
    
    logger.info('Active executions cleared', { count });
  }
}

module.exports = ExecutionEngine;

