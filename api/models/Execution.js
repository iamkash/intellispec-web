/**
 * Execution Model - MongoDB schema for workflow execution tracking
 *
 * Stores execution records, checkpoints, and performance metrics
 * for the LangGraph workflow execution system.
 */

const mongoose = require('mongoose');

const CheckpointSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  node: {
    type: String,
    required: true
  },
  message: {
    type: String
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, { _id: false });

const ExecutionSchema = new mongoose.Schema({
  // Execution identification
  executionId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  workflowId: {
    type: String,
    required: true,
    index: true
  },
  workflow: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workflow',
    required: true
  },

  // Execution status
  status: {
    type: String,
    enum: ['pending', 'running', 'paused', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },

  // Execution data
  initialState: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  currentState: {
    type: mongoose.Schema.Types.Mixed
  },
  finalResult: {
    type: mongoose.Schema.Types.Mixed
  },

  // Configuration snapshot
  configSnapshot: {
    workflowVersion: Number,
    executionConfig: mongoose.Schema.Types.Mixed,
    agentConfigs: mongoose.Schema.Types.Mixed
  },

  // Checkpoints and progress
  checkpoints: [CheckpointSchema],

  // Timing
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  pausedAt: {
    type: Date
  },
  duration: {
    type: Number // in milliseconds
  },

  // Metrics
  metrics: {
    totalNodes: {
      type: Number,
      default: 0
    },
    completedNodes: {
      type: Number,
      default: 0
    },
    failedNodes: {
      type: Number,
      default: 0
    },
    agentCalls: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    }
  },

  // Error handling
  errorMessage: {
    type: String
  },
  errorDetails: {
    type: mongoose.Schema.Types.Mixed
  },

  // Context and metadata
  initiatedBy: {
    type: String,
    required: true
  },
  tenantId: {
    type: String
  },
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Human-in-the-loop
  humanInterventions: [{
    interventionId: String,
    requestedAt: Date,
    completedAt: Date,
    requestedBy: String,
    approvedBy: String,
    decision: String,
    comments: String,
    metadata: mongoose.Schema.Types.Mixed
  }],

  // Audit
  deleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  collection: 'executions'
});

// Indexes
ExecutionSchema.index({ workflowId: 1, status: 1 });
ExecutionSchema.index({ status: 1, createdAt: -1 });
ExecutionSchema.index({ initiatedBy: 1 });
ExecutionSchema.index({ tenantId: 1 });
ExecutionSchema.index({ 'humanInterventions.requestedAt': 1 });

// Instance methods (simple getters only - no database operations)
ExecutionSchema.methods.getSummary = function() {
  return {
    executionId: this.executionId,
    workflowId: this.workflowId,
    status: this.status,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    duration: this.duration,
    initiatedBy: this.initiatedBy,
    metrics: this.metrics
  };
};

// Note: All state transitions and database operations moved to ExecutionService and ExecutionRepository
// Use ExecutionService for state transitions:
// - start() -> ExecutionService.start(executionId, userId, tenantId)
// - complete() -> ExecutionService.complete(executionId, result, userId, tenantId)
// - fail() -> ExecutionService.fail(executionId, error, userId, tenantId)
// - pause() -> ExecutionService.pause(executionId, reason, userId, tenantId)
// - resume() -> ExecutionService.resume(executionId, userId, tenantId)
// - cancel() -> ExecutionService.cancel(executionId, userId, tenantId)
// - addCheckpoint() -> ExecutionService.addCheckpoint(executionId, state, node, message, metadata, userId, tenantId)
// - updateMetrics() -> ExecutionService.updateMetrics(executionId, metrics, userId, tenantId)
//
// Use ExecutionRepository for queries:
// - getStatistics() -> ExecutionRepository.getStatistics()
// - findByWorkflow() -> ExecutionRepository.findByWorkflow(workflowId)
// - findByStatus() -> ExecutionRepository.findByStatus(status)

module.exports = mongoose.model('Execution', ExecutionSchema);