/**
 * Execution Service
 * 
 * Business logic for workflow execution management
 * Handles execution state transitions, checkpoints, and metrics
 * 
 * Design Patterns:
 * - Service Layer Pattern (business logic)
 * - State Machine Pattern (execution states)
 * - Repository Pattern (data access)
 * 
 * Features:
 * - State transitions (start, complete, fail, pause, resume, cancel)
 * - Checkpoint management
 * - Metrics tracking
 * - Human intervention handling
 */

const { logger } = require('../core/Logger');
const TenantContext = require('../core/TenantContext');
const ExecutionRepository = require('../repositories/ExecutionRepository');
const WorkflowService = require('./WorkflowService');

class ExecutionService {
  /**
   * Start execution
   * Transitions from pending to running
   * 
   * @param {String} executionId - Execution ID
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async start(executionId, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      if (execution.status !== 'pending') {
        throw new Error(`Cannot start execution in status: ${execution.status}`);
      }

      execution.status = 'running';
      execution.startedAt = new Date();

      const updated = await repository.update(executionId, execution);

      logger.info('Execution started', {
        executionId,
        workflowId: execution.workflowId,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to start execution', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Complete execution
   * Transitions to completed status with final result
   * 
   * @param {String} executionId - Execution ID
   * @param {Object} result - Execution result
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async complete(executionId, result, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      execution.status = 'completed';
      execution.finalResult = result;
      execution.completedAt = new Date();
      
      if (execution.startedAt) {
        execution.duration = execution.completedAt - execution.startedAt;
      }

      const updated = await repository.update(executionId, execution);

      // Update workflow stats
      if (execution.workflowId) {
        await WorkflowService.updateExecutionStats(
          execution.workflowId,
          execution.duration,
          userId,
          tenantId
        );
        await WorkflowService.updateSuccessRate(execution.workflowId, true, userId, tenantId);
      }

      logger.info('Execution completed', {
        executionId,
        workflowId: execution.workflowId,
        duration: execution.duration,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to complete execution', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Fail execution
   * Transitions to failed status with error details
   * 
   * @param {String} executionId - Execution ID
   * @param {Error|String} error - Error object or message
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async fail(executionId, error, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      execution.status = 'failed';
      execution.errorMessage = typeof error === 'string' ? error : error.message;
      execution.errorDetails = typeof error === 'object' ? error : { message: error };
      execution.completedAt = new Date();
      
      if (execution.startedAt) {
        execution.duration = execution.completedAt - execution.startedAt;
      }

      const updated = await repository.update(executionId, execution);

      // Update workflow stats
      if (execution.workflowId) {
        await WorkflowService.recordError(
          execution.workflowId,
          execution.errorMessage,
          execution.errorDetails,
          userId,
          tenantId
        );
      }

      logger.error('Execution failed', {
        executionId,
        workflowId: execution.workflowId,
        errorMessage: execution.errorMessage,
        duration: execution.duration,
        userId,
        tenantId
      });

      return updated;
    } catch (err) {
      logger.error('Failed to mark execution as failed', {
        executionId,
        error: err.message,
        userId,
        tenantId
      });
      throw err;
    }
  }

  /**
   * Pause execution
   * Transitions to paused status (e.g., for human intervention)
   * 
   * @param {String} executionId - Execution ID
   * @param {String} reason - Reason for pause
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async pause(executionId, reason, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      if (execution.status !== 'running') {
        throw new Error(`Cannot pause execution in status: ${execution.status}`);
      }

      execution.status = 'paused';
      execution.pausedAt = new Date();
      
      if (reason) {
        execution.context = execution.context || {};
        execution.context.pauseReason = reason;
      }

      const updated = await repository.update(executionId, execution);

      logger.info('Execution paused', {
        executionId,
        workflowId: execution.workflowId,
        reason,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to pause execution', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Resume execution
   * Transitions from paused to running
   * 
   * @param {String} executionId - Execution ID
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async resume(executionId, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      if (execution.status !== 'paused') {
        throw new Error(`Cannot resume execution in status: ${execution.status}`);
      }

      execution.status = 'running';
      execution.pausedAt = null;

      const updated = await repository.update(executionId, execution);

      logger.info('Execution resumed', {
        executionId,
        workflowId: execution.workflowId,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to resume execution', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Cancel execution
   * Transitions to cancelled status
   * 
   * @param {String} executionId - Execution ID
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async cancel(executionId, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      execution.status = 'cancelled';
      execution.completedAt = new Date();
      
      if (execution.startedAt) {
        execution.duration = execution.completedAt - execution.startedAt;
      }

      const updated = await repository.update(executionId, execution);

      logger.info('Execution cancelled', {
        executionId,
        workflowId: execution.workflowId,
        duration: execution.duration,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to cancel execution', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Add checkpoint to execution
   * Records execution progress at a specific node
   * 
   * @param {String} executionId - Execution ID
   * @param {Object} state - Current state
   * @param {String} node - Node name
   * @param {String} message - Checkpoint message
   * @param {Object} metadata - Additional metadata
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async addCheckpoint(executionId, state, node, message, metadata, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      // Add checkpoint
      if (!execution.checkpoints) {
        execution.checkpoints = [];
      }
      
      execution.checkpoints.push({
        timestamp: new Date(),
        node: node || 'system',
        message: message,
        metadata: metadata
      });

      // Update current state
      execution.currentState = state;

      const updated = await repository.update(executionId, execution);

      logger.debug('Checkpoint added', {
        executionId,
        node,
        checkpointCount: execution.checkpoints.length,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to add checkpoint', {
        executionId,
        node,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Update execution metrics
   * Updates various metrics for execution tracking
   * 
   * @param {String} executionId - Execution ID
   * @param {Object} metrics - Metrics to update
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated execution
   */
  static async updateMetrics(executionId, metrics, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new ExecutionRepository(tenantContext);

    try {
      const execution = await repository.findById(executionId);
      
      if (!execution) {
        throw new Error(`Execution ${executionId} not found`);
      }

      // Merge metrics
      execution.metrics = {
        ...execution.metrics,
        ...metrics
      };

      const updated = await repository.update(executionId, execution);

      logger.debug('Execution metrics updated', {
        executionId,
        metrics,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to update execution metrics', {
        executionId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Get execution summary
   * Returns a simplified execution object
   * 
   * @param {Object} execution - Execution object
   * @returns {Object} Execution summary
   */
  static getSummary(execution) {
    return {
      executionId: execution.executionId,
      workflowId: execution.workflowId,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      duration: execution.duration,
      initiatedBy: execution.initiatedBy,
      metrics: execution.metrics
    };
  }
}

module.exports = ExecutionService;

