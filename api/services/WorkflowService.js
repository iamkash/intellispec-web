/**
 * Workflow Service
 * 
 * Business logic for workflow operations
 * Handles workflow state management, statistics, and execution tracking
 * 
 * Design Patterns:
 * - Service Layer Pattern (business logic)
 * - Repository Pattern (data access via WorkflowRepository)
 * 
 * Features:
 * - Workflow execution tracking
 * - Statistics updates
 * - Error logging
 * - State management
 */

const { logger } = require('../core/Logger');
const TenantContext = require('../core/TenantContext');
const WorkflowRepository = require('../repositories/WorkflowRepository');

class WorkflowService {
  /**
   * Increment execution count for a workflow
   * Called when a workflow execution starts
   * 
   * @param {String} workflowId - Workflow ID
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated workflow
   */
  static async incrementExecutionCount(workflowId, userId, tenantId) {
    const tenantContext = tenantId 
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new WorkflowRepository(tenantContext);

    try {
      const workflow = await repository.findById(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Increment count and update last execution time
      workflow.executionCount = (workflow.executionCount || 0) + 1;
      workflow.lastExecutedAt = new Date();

      const updated = await repository.update(workflowId, workflow);

      logger.info('Workflow execution count incremented', {
        workflowId,
        executionCount: workflow.executionCount,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to increment workflow execution count', {
        workflowId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Update workflow execution statistics
   * Called when a workflow execution completes
   * 
   * @param {String} workflowId - Workflow ID
   * @param {Number} executionTime - Execution time in milliseconds
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated workflow
   */
  static async updateExecutionStats(workflowId, executionTime, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new WorkflowRepository(tenantContext);

    try {
      const workflow = await repository.findById(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Calculate new average execution time
      const currentCount = workflow.executionCount || 1;
      const currentAvg = workflow.averageExecutionTime || 0;
      const totalTime = (currentAvg * (currentCount - 1)) + executionTime;
      workflow.averageExecutionTime = totalTime / currentCount;

      const updated = await repository.update(workflowId, workflow);

      logger.info('Workflow execution stats updated', {
        workflowId,
        averageExecutionTime: workflow.averageExecutionTime,
        executionTime,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to update workflow execution stats', {
        workflowId,
        executionTime,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Update workflow success rate
   * Called when a workflow execution completes (success or failure)
   * 
   * @param {String} workflowId - Workflow ID
   * @param {Boolean} success - Whether execution was successful
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Updated workflow
   */
  static async updateSuccessRate(workflowId, success, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const repository = new WorkflowRepository(tenantContext);

    try {
      const workflow = await repository.findById(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Calculate new success rate (simple moving average)
      const currentRate = workflow.successRate || 0;
      const currentCount = workflow.executionCount || 1;
      const successValue = success ? 100 : 0;
      
      // Weighted average giving more weight to recent executions
      const weight = 0.8; // 80% weight to new value
      workflow.successRate = (weight * successValue) + ((1 - weight) * currentRate);

      const updated = await repository.update(workflowId, workflow);

      logger.info('Workflow success rate updated', {
        workflowId,
        successRate: workflow.successRate,
        success,
        userId,
        tenantId
      });

      return updated;
    } catch (error) {
      logger.error('Failed to update workflow success rate', {
        workflowId,
        success,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Record workflow error
   * Logs error details for workflow failures
   * 
   * @param {String} workflowId - Workflow ID
   * @param {String} errorMessage - Error message
   * @param {Object} errorDetails - Additional error details
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<void>}
   */
  static async recordError(workflowId, errorMessage, errorDetails = {}, userId, tenantId) {
    logger.error('Workflow execution error', {
      workflowId,
      errorMessage,
      errorDetails,
      userId,
      tenantId,
      timestamp: new Date()
    });

    // Update success rate to reflect failure
    await WorkflowService.updateSuccessRate(workflowId, false, userId, tenantId);
  }

  /**
   * Get workflow with statistics
   * Retrieves workflow along with calculated statistics
   * 
   * @param {String} workflowId - Workflow ID
   * @param {String} userId - User ID
   * @param {String} tenantId - Tenant ID
   * @returns {Promise<Object>} Workflow with statistics
   */
  static async getWorkflowWithStats(workflowId, userId, tenantId) {
    const tenantContext = tenantId
      ? new TenantContext(tenantId, userId, false)
      : TenantContext.platformAdmin(userId);
    
    const workflowRepo = new WorkflowRepository(tenantContext);

    try {
      const workflow = await workflowRepo.findById(workflowId);
      
      if (!workflow) {
        throw new Error(`Workflow ${workflowId} not found`);
      }

      // Get execution statistics from ExecutionRepository
      const ExecutionRepository = require('../repositories/ExecutionRepository');
      const executionRepo = new ExecutionRepository(tenantContext);
      const executionStats = await executionRepo.getStatisticsByWorkflow(workflowId);

      return {
        ...workflow,
        executionStats
      };
    } catch (error) {
      logger.error('Failed to get workflow with stats', {
        workflowId,
        error: error.message,
        userId,
        tenantId
      });
      throw error;
    }
  }

  /**
   * Check if workflow is executable
   * Validates workflow can be executed
   * 
   * @param {Object} workflow - Workflow object
   * @returns {Boolean} True if workflow can be executed
   */
  static isExecutable(workflow) {
    return workflow && workflow.status === 'active' && !workflow.deleted;
  }

  /**
   * Get workflow summary
   * Returns a simplified workflow object
   * 
   * @param {Object} workflow - Workflow object
   * @returns {Object} Workflow summary
   */
  static getSummary(workflow) {
    return {
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      status: workflow.status,
      category: workflow.category,
      tags: workflow.tags,
      executionCount: workflow.executionCount,
      averageExecutionTime: workflow.averageExecutionTime,
      successRate: workflow.successRate,
      lastExecutedAt: workflow.lastExecutedAt,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt
    };
  }
}

module.exports = WorkflowService;

