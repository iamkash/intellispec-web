/**
 * Execution Repository
 * 
 * Data access layer for workflow execution tracking
 * Extends BaseRepository for automatic tenant scoping and audit logging
 * 
 * Features:
 * - CRUD operations for executions
 * - Status-based queries
 * - Statistics and aggregations
 * - Human intervention tracking
 */

const BaseRepository = require('../core/BaseRepository');
const ExecutionModel = require('../models/Execution');

class ExecutionRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(ExecutionModel, tenantContext, requestContext);
  }

  /**
   * Get execution statistics
   * Aggregates data across all executions
   * 
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const stats = await this.model.aggregate([
      {
        $match: this.buildBaseQuery({})
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          running: {
            $sum: { $cond: [{ $eq: ['$status', 'running'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          totalDuration: { $sum: '$duration' }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      running: 0,
      completed: 0,
      failed: 0,
      avgDuration: 0,
      totalDuration: 0
    };
  }

  /**
   * Find executions by workflow ID
   * 
   * @param {String} workflowId - Workflow ID
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of executions
   */
  async findByWorkflow(workflowId, options = {}) {
    const { limit = 100, skip = 0, sort = { createdAt: -1 } } = options;

    return await this.model
      .find(this.buildBaseQuery({ workflowId }))
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Find executions by status
   * 
   * @param {String} status - Execution status
   * @returns {Promise<Array>} Array of executions
   */
  async findByStatus(status) {
    return await this.find({ status });
  }

  /**
   * Find running executions
   * 
   * @returns {Promise<Array>} Array of running executions
   */
  async findRunning() {
    return await this.find({ status: 'running' });
  }

  /**
   * Find pending executions
   * 
   * @returns {Promise<Array>} Array of pending executions
   */
  async findPending() {
    return await this.find({ status: 'pending' });
  }

  /**
   * Find failed executions
   * 
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of failed executions
   */
  async findFailed(options = {}) {
    const { limit = 100, skip = 0 } = options;

    return await this.model
      .find(this.buildBaseQuery({ status: 'failed' }))
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  /**
   * Find executions by initiator
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Array of executions
   */
  async findByInitiator(userId) {
    return await this.find({ initiatedBy: userId });
  }

  /**
   * Find executions requiring human intervention
   * 
   * @returns {Promise<Array>} Array of executions
   */
  async findRequiringHumanIntervention() {
    return await this.find({
      status: 'paused',
      'humanInterventions.completedAt': { $exists: false }
    });
  }

  /**
   * Find recent executions
   * 
   * @param {Number} limit - Number of executions to return
   * @returns {Promise<Array>} Array of recent executions
   */
  async findRecent(limit = 10) {
    return await this.model
      .find(this.buildBaseQuery({}))
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Get execution statistics by workflow
   * 
   * @param {String} workflowId - Workflow ID
   * @returns {Promise<Object>} Statistics object
   */
  async getStatisticsByWorkflow(workflowId) {
    const stats = await this.model.aggregate([
      {
        $match: this.buildBaseQuery({ workflowId })
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' },
          successRate: {
            $avg: {
              $cond: [{ $eq: ['$status', 'completed'] }, 100, 0]
            }
          }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      completed: 0,
      failed: 0,
      avgDuration: 0,
      successRate: 0
    };
  }

  /**
   * Get execution timeline
   * Groups executions by date
   * 
   * @param {Number} days - Number of days to include
   * @returns {Promise<Array>} Array of daily statistics
   */
  async getTimeline(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return await this.model.aggregate([
      {
        $match: this.buildBaseQuery({
          createdAt: { $gte: startDate }
        })
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          avgDuration: { $avg: '$duration' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
  }

  /**
   * Count executions by status
   * 
   * @returns {Promise<Object>} Status counts
   */
  async countByStatus() {
    const result = await this.model.aggregate([
      {
        $match: this.buildBaseQuery({})
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }
}

module.exports = ExecutionRepository;

