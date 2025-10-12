/**
 * Workflow Repository
 * 
 * Data access layer for workflow operations
 * Extends BaseRepository for automatic tenant scoping and audit logging
 * 
 * Features:
 * - CRUD operations for workflows
 * - Statistics and aggregations
 * - Active workflow queries
 * - Category and tag filtering
 */

const BaseRepository = require('../core/BaseRepository');
const WorkflowModel = require('../models/Workflow');

class WorkflowRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(WorkflowModel, tenantContext, requestContext);
  }

  /**
   * Get workflow statistics
   * Aggregates data across all workflows
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
          active: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          totalExecutions: { $sum: '$executionCount' },
          avgExecutionTime: { $avg: '$averageExecutionTime' }
        }
      }
    ]);

    return stats[0] || {
      total: 0,
      active: 0,
      totalExecutions: 0,
      avgExecutionTime: 0
    };
  }

  /**
   * Find active workflows
   * 
   * @param {Object} additionalFilters - Additional query filters
   * @returns {Promise<Array>} Array of active workflows
   */
  async findActive(additionalFilters = {}) {
    return await this.find({
      status: 'active',
      deleted: false,
      ...additionalFilters
    });
  }

  /**
   * Find workflows by category
   * 
   * @param {String} category - Category name
   * @returns {Promise<Array>} Array of workflows
   */
  async findByCategory(category) {
    return await this.find({ category });
  }

  /**
   * Find workflows by tags
   * 
   * @param {Array<String>} tags - Array of tags
   * @returns {Promise<Array>} Array of workflows
   */
  async findByTags(tags) {
    return await this.find({
      tags: { $in: tags }
    });
  }

  /**
   * Find executable workflows
   * Workflows that are active and not deleted
   * 
   * @returns {Promise<Array>} Array of executable workflows
   */
  async findExecutable() {
    return await this.find({
      status: 'active',
      deleted: false
    });
  }

  /**
   * Get workflows by creator
   * 
   * @param {String} userId - User ID
   * @returns {Promise<Array>} Array of workflows
   */
  async findByCreator(userId) {
    return await this.find({ createdBy: userId });
  }

  /**
   * Get recently executed workflows
   * 
   * @param {Number} limit - Number of workflows to return
   * @returns {Promise<Array>} Array of workflows
   */
  async findRecentlyExecuted(limit = 10) {
    return await this.model
      .find(this.buildBaseQuery({ lastExecutedAt: { $exists: true } }))
      .sort({ lastExecutedAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Search workflows by name or description
   * 
   * @param {String} searchTerm - Search term
   * @returns {Promise<Array>} Array of matching workflows
   */
  async search(searchTerm) {
    return await this.find({
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    });
  }

  /**
   * Get workflow statistics by category
   * 
   * @returns {Promise<Array>} Array of category statistics
   */
  async getStatisticsByCategory() {
    return await this.model.aggregate([
      {
        $match: this.buildBaseQuery({})
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalExecutions: { $sum: '$executionCount' },
          avgExecutionTime: { $avg: '$averageExecutionTime' },
          successRate: { $avg: '$successRate' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);
  }
}

module.exports = WorkflowRepository;

