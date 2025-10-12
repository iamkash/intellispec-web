/**
 * Workflow Model - MongoDB schema for workflow metadata
 *
 * Stores workflow definitions, configurations, and metadata
 * for the LangGraph workflow factory system.
 */

const mongoose = require('mongoose');

const WorkflowSchema = new mongoose.Schema({
  // Basic identification
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },

  // Workflow metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },

  // Workflow configuration
  version: {
    type: Number,
    default: 1
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'deprecated'],
    default: 'active'
  },

  // Execution configuration
  executionConfig: {
    timeout: {
      type: Number,
      default: 300000 // 5 minutes
    },
    maxRetries: {
      type: Number,
      default: 3
    },
    enableCheckpoints: {
      type: Boolean,
      default: true
    }
  },

  // Statistics
  executionCount: {
    type: Number,
    default: 0
  },
  averageExecutionTime: {
    type: Number,
    default: 0
  },
  successRate: {
    type: Number,
    default: 0
  },
  lastExecutedAt: {
    type: Date
  },

  // Categories and tags
  category: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],

  // Audit fields
  createdBy: {
    type: String,
    required: true
  },
  updatedBy: {
    type: String
  },
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'workflows'
});

// Indexes
WorkflowSchema.index({ status: 1, updatedAt: -1 });
WorkflowSchema.index({ category: 1 });
WorkflowSchema.index({ tags: 1 });
WorkflowSchema.index({ createdBy: 1 });

// Instance methods (simple getters only - no database operations)
WorkflowSchema.methods.getSummary = function() {
  return {
    id: this.id,
    name: this.name,
    description: this.description,
    version: this.version,
    status: this.status,
    category: this.category,
    tags: this.tags,
    executionCount: this.executionCount,
    averageExecutionTime: this.averageExecutionTime,
    successRate: this.successRate,
    lastExecutedAt: this.lastExecutedAt,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

WorkflowSchema.methods.isExecutable = function() {
  return this.status === 'active' && !this.deleted;
};

// Note: Database operations and business logic moved to WorkflowService and WorkflowRepository
// Use WorkflowService for:
// - incrementExecutionCount() -> WorkflowService.incrementExecutionCount(workflowId)
// - updateExecutionStats() -> WorkflowService.updateExecutionStats(workflowId, executionTime)
// - recordError() -> WorkflowService.recordError(workflowId, errorMessage)
//
// Use WorkflowRepository for:
// - getStatistics() -> WorkflowRepository.getStatistics()

module.exports = mongoose.model('Workflow', WorkflowSchema);