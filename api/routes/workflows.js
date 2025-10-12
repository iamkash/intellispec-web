/**
 * Workflows API Routes
 *
 * RESTful endpoints for workflow CRUD operations,
 * execution management, and metadata handling.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses WorkflowRouter (renamed from ConnectionBuilder)
 * - Uses ExecutionEngine for workflow execution
 */

const mongoose = require('mongoose');
const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');

// Import models
const Workflow = require('../models/Workflow');
const Execution = require('../models/Execution');

// Import workflow components
const WorkflowFactory = require('../workflows/factory/WorkflowFactory');
const AgentRegistry = require('../workflows/agents/AgentRegistry');
const WorkflowRouter = require('../workflows/factory/WorkflowRouter');
const DataAggregatorAgent = require('../workflows/agents/DataAggregatorAgent');
const ExecutionEngine = require('../workflows/execution/ExecutionEngine');

// Initialize workflow components
const agentRegistry = new AgentRegistry();
const workflowRouter = new WorkflowRouter();
const workflowFactory = new WorkflowFactory(agentRegistry, workflowRouter);
const executionEngine = new ExecutionEngine(workflowFactory);

// Register sample agents
agentRegistry.registerAgent('DataAggregatorAgent', DataAggregatorAgent);

async function registerWorkflowRoutes(fastify) {
  logger.info('Workflow routes initialization started', {
    hasWorkflow: !!Workflow,
    hasAgentRegistry: !!AgentRegistry,
    hasExecutionEngine: !!ExecutionEngine
  });

  // Test route to verify registration
  fastify.get('/test', { preHandler: requireAuth }, async (request, reply) => {
    reply.send({
      message: 'Workflow routes registered successfully',
      timestamp: new Date().toISOString(),
      status: 'OK',
      components: {
        workflowFactory: !!workflowFactory,
        executionEngine: !!executionEngine,
        agentRegistry: !!agentRegistry
      }
    });
  });
  
  logger.info('Workflow routes registered', {
    routeCount: 'multiple',
    executionEngineEnabled: true,
    routes: [
      'GET /api/workflows/ - List workflows',
      'GET /api/workflows/:id - Get workflow by ID',
      'DELETE /api/workflows/:id - Delete workflow'
    ]
  });

    /**
     * GET /api/workflows/
     * List all workflows with optional filtering
     */
    fastify.get('/', { preHandler: requireAuth }, async (request, reply) => {
try {
    const {
      status = 'active',
      category,
      tags,
      limit = 50,
      offset = 0,
      search
    } = request.query;

    let query = {};

    // Apply filters
    if (status !== 'all') {
      query.status = status;
    }

    if (category) {
      query.category = category;
    }

    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const workflows = await Workflow
      .find(query)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-metadata'); // Exclude large metadata from list

    const total = await Workflow.countDocuments(query);
reply.send({
      workflows: workflows.map(w => w.getSummary()),
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    logger.error('Error fetching workflows', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to fetch workflows',
      message: error.message
    });
  }
  });

  /**
   * GET /api/workflows/:id
   * Get workflow by ID
   */
  fastify.get('/:id', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const workflow = await Workflow.findOne({ id: request.params.id });

    if (!workflow) {
      return reply.code(404).send({
        error: 'Workflow not found'
      });
    }

    reply.send(workflow);

  } catch (error) {
    logger.error('Error fetching workflow', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to fetch workflow',
      message: error.message
    });
  }
  });

  /**
   * POST /api/workflows/
   * Create new workflow
   */
  fastify.post('/', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const { metadata, ...workflowData } = request.body;

    // Validate metadata if provided
    if (metadata) {
      const validation = workflowFactory.validateMetadata(metadata);
      if (!validation.isValid) {
        return reply.code(400).send({
          error: 'Invalid workflow metadata',
          validationErrors: validation.errors
        });
      }
    }

    const workflow = new Workflow({
      ...workflowData,
      metadata,
      createdBy: request.user?.id || 'system',
      updatedBy: request.user?.id || 'system'
    });

    await workflow.save();
reply.code(201).send(workflow);

  } catch (error) {
    logger.error('Error creating workflow', {
      error: error.message,
      code: error.code
    });

    if (error.code === 11000) {
      return reply.code(409).send({
        error: 'Workflow ID already exists'
      });
    }

    reply.code(500).send({
      error: 'Failed to create workflow',
      message: error.message
    });
  }
  });

  /**
   * PUT /api/workflows/:id
   * Update workflow
   */
  fastify.put('/:id', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const { metadata, ...updateData } = request.body;

    // Validate metadata if provided
    if (metadata) {
      const validation = workflowFactory.validateMetadata(metadata);
      if (!validation.isValid) {
        return reply.code(400).send({
          error: 'Invalid workflow metadata',
          validationErrors: validation.errors
        });
      }
    }

    const workflow = await Workflow.findOneAndUpdate(
      { id: request.params.id },
      {
        ...updateData,
        metadata,
        updatedBy: request.user?.id || 'system',
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!workflow) {
      return reply.code(404).send({
        error: 'Workflow not found'
      });
    }
reply.send(workflow);

  } catch (error) {
    logger.error('Error updating workflow', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to update workflow',
      message: error.message
    });
  }
  });

  /**
   * DELETE /api/workflows/:id
   * Delete workflow
   */
  fastify.delete('/:id', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const workflow = await Workflow.findOneAndDelete({ id: request.params.id });

    if (!workflow) {
      return reply.code(404).send({
        error: 'Workflow not found'
      });
    }

    // Also delete related executions
    await Execution.deleteMany({ workflowId: request.params.id });
reply.send({
      message: 'Workflow deleted successfully',
      workflowId: workflow.id
    });

  } catch (error) {
    logger.error('Error deleting workflow', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to delete workflow',
      message: error.message
    });
  }
  });

  /**
   * POST /api/workflows/:id/validate
   * Validate workflow metadata
   */
  fastify.post('/:id/validate', { preHandler: requireAuth }, async (request, reply) => {
  try {
    const workflow = await Workflow.findOne({ id: request.params.id });

    if (!workflow) {
      return reply.code(404).send({
        error: 'Workflow not found'
      });
    }

    const validation = workflowFactory.validateMetadata(workflow.metadata);

    reply.send({
      workflowId: workflow.id,
      isValid: validation.isValid,
      errors: validation.errors,
      summary: {
        agentCount: workflow.metadata?.agents?.length || 0,
        connectionCount: workflow.metadata?.connections?.length || 0
      }
    });

  } catch (error) {
    logger.error('Error validating workflow', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to validate workflow',
      message: error.message
    });
  }
  });

  /**
   * POST /api/workflows/:id/execute
   * Execute workflow
   */
  fastify.post('/:id/execute', { preHandler: requireAuth }, async (request, reply) => {
  try {
    // First try to find workflow in database
    let workflow = await Workflow.findOne({ id: request.params.id });

    // If not found in database, try to load from wizard metadata
    if (!workflow) {
// Try to load from wizard JSON files
      const fs = require('fs').promises;
      const path = require('path');

      const wizardPaths = [
        path.join(__dirname, '../../public/data/workspaces/inspection/piping-inspection-wizard.json'),
        path.join(__dirname, '../../public/data/workspaces/inspection/ai-inspection-assistant.json')
      ];

      for (const wizardPath of wizardPaths) {
        try {
          const wizardData = JSON.parse(await fs.readFile(wizardPath, 'utf8'));

          // Look for workflow metadata in gadgets
      const workflowGadget = wizardData.gadgets?.find(g => g.id === 'workflow-metadata' && g.workflowConfig);
      if (workflowGadget && workflowGadget.workflowConfig.workflowId === request.params.id) {
// Create workflow object from metadata
            workflow = {
              id: request.params.id,
              name: `Metadata Workflow: ${request.params.id}`,
              metadata: workflowGadget.workflowConfig,
              agents: workflowGadget.workflowConfig.agents || [],
              connections: workflowGadget.workflowConfig.connections || [],
              status: 'active',
              isExecutable: () => true,
              execute: async (input) => {
                // Extract data from Steps 1 and 2
                const voiceTranscript = input.voiceTranscript || input.transcription || input.text || '';
                const images = input.images || [];
                const imageUrls = input.imageUrls || [];

                logger.info('Workflow execution started', {
                  workflowId: request.params.id,
                  hasVoice: !!voiceTranscript,
                  imageCount: images.length,
                  agents: workflowGadget.workflowConfig.agents.length
                });

                // Create workflow from metadata using WorkflowFactory
                const workflowInstance = workflowFactory.createWorkflow({
                  id: request.params.id,
                  agents: workflowGadget.workflowConfig.agents,
                  connections: workflowGadget.workflowConfig.connections || [],
                  entryPoint: workflowGadget.workflowConfig.entryPoint,
                  finishPoint: workflowGadget.workflowConfig.finishPoint
                });

                // Execute workflow with combined Step 1 and Step 2 data
                const workflowInput = {
                  voiceTranscript,
                  images: imageUrls,
                  text: voiceTranscript, // For backward compatibility
                  imageUrls,
                  prompt: input.prompt || '',
                  systemPrompt: input.systemPrompt || '',
                  // Include any additional context from the wizard
                  wizardContext: {
                    workflowId: request.params.id,
                    executionMode: 'sequential'
                  }
                };

                const result = await workflowInstance.invoke(workflowInput);
return result;
              }
            };
            break;
          }
        } catch (error) {
}
      }
    }

    if (!workflow) {
      return reply.code(404).send({
        error: 'Workflow not found in database or wizard metadata'
      });
    }

    if (!workflow.isExecutable()) {
      return reply.code(400).send({
        error: 'Workflow is not executable',
        status: workflow.status
      });
    }

    // Create execution record
    const execution = new Execution({
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      workflowId: workflow.id,
      workflow: workflow._id,
      status: 'running',
      initialState: request.body.initialState || {},
      configSnapshot: {
        workflowVersion: workflow.version,
        executionConfig: workflow.executionConfig,
        agentConfigs: workflow.metadata?.agents?.reduce((acc, agent) => {
          acc[agent.id] = agent.config;
          return acc;
        }, {})
      },
      initiatedBy: request.user?.id || 'system',
      tenantId: request.user?.tenantId,
      context: request.body.context || {}
    });

    await execution.save();

    // Start execution asynchronously
    setImmediate(async () => {
      try {
        await executeWorkflow(workflow, execution, request.body.initialState || {});
      } catch (error) {
        logger.error('Workflow execution failed', {
          error: error.message
        });
        await execution.fail(error);
      }
    });
reply.code(202).send({
      executionId: execution.executionId,
      status: 'running',
      message: 'Workflow execution started'
    });

  } catch (error) {
    logger.error('Error starting workflow execution', {
      error: error.message
    });
    reply.code(500).send({
      error: 'Failed to start workflow execution',
      message: error.message
    });
  }
  });

  /**
   * GET /api/workflows/:id/executions
   * Get workflow executions
   */
  fastify.get('/:id/executions', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { limit = 20, offset = 0, status } = request.query;

      let query = { workflowId: request.params.id };
      if (status) {
        query.status = status;
      }

      const executions = await Execution
        .find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(offset))
        .select('executionId status startedAt completedAt duration metrics');

      const total = await Execution.countDocuments(query);

      reply.send({
        executions,
        total,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      logger.error('Error fetching workflow executions', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to fetch executions',
        message: error.message
      });
    }
  });

  /**
   * GET /api/workflows/stats
   * Get workflow statistics
   */
  fastify.get('/stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const workflowStats = await Workflow.getStatistics();
      const executionStats = await Execution.getStatistics();

      reply.send({
        workflows: workflowStats,
        executions: executionStats
      });

    } catch (error) {
      logger.error('Error fetching statistics', {
        error: error.message
      });
      reply.code(500).send({
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  });
}

/**
 * Async workflow execution function
 */
async function executeWorkflow(workflow, execution, initialState) {
  try {
// Create workflow instance
    const workflowInstance = workflowFactory.createWorkflow(workflow.metadata);

    // Compile workflow
    const compiledWorkflow = workflowFactory.compileWorkflow(workflowInstance, {
      // checkpointer: async (state) => {
      //   await execution.addCheckpoint(state);
      // }
    });

    // Execute workflow
    const startTime = Date.now();
    const result = await compiledWorkflow.invoke(initialState);
    const executionTime = Date.now() - startTime;

    // Update execution record
    await execution.complete(result);
    await execution.updateMetrics(executionTime);

    // Update workflow statistics
    await workflow.incrementExecutionCount();
    await workflow.updateExecutionStats(executionTime);
} catch (error) {
    logger.error('Workflow execution failed', {
      executionId: execution.executionId,
      error: error.message,
      stack: error.stack
    });
    await execution.fail(error);
    await workflow.recordError(error.message);
  }
}

module.exports = registerWorkflowRoutes;
