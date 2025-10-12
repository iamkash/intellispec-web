/**
 * WorkflowFactory - Creates LangGraph workflows dynamically from metadata
 *
 * This factory reads workflow metadata and creates StateGraph instances
 * with dynamically registered agents and connections.
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 * - Uses ErrorHandler for standardized errors
 * - Uses WorkflowRouter (formerly ConnectionBuilder) for routing
 */

const { StateGraph, START, END } = require('@langchain/langgraph');
const { z } = require('zod');
const { logger } = require('../../core/Logger');
const { ValidationError } = require('../../core/ErrorHandler');

class WorkflowFactory {
  constructor(agentRegistry, workflowRouter) {
    this.agentRegistry = agentRegistry;
    this.workflowRouter = workflowRouter; // Renamed from connectionBuilder
  }

  /**
   * Create a workflow from metadata
   * @param {Object} metadata - Workflow metadata
   * @returns {StateGraph} Compiled LangGraph workflow
   */
  createWorkflow(metadata) {
    logger.info('Creating workflow from metadata', {
      workflowId: metadata.id,
      agentCount: metadata.agents?.length || 0,
      connectionCount: metadata.connections?.length || 0
    });

    // Define the state schema for the workflow
    const stateSchema = z.object({
      messages: z.array(z.any()).optional(),
      current_step: z.string().optional(),
      workflow_data: z.any().optional(),
      agent_outputs: z.record(z.any()).optional(),
      human_decisions: z.record(z.any()).optional(),
      final_result: z.any().optional(),
      errors: z.array(z.string()).optional()
    });

    const workflow = new StateGraph(stateSchema);

    // Add nodes (agents) dynamically
    metadata.agents.forEach(agentDef => {
      const agent = this.agentRegistry.createAgent(agentDef);
      // Use the Runnable version for LangGraph compatibility
      workflow.addNode(agentDef.id, agent.getRunnable());
      
      logger.debug('Agent node added to workflow', {
        workflowId: metadata.id,
        agentId: agentDef.id,
        agentType: agentDef.type
      });
    });

    // Add edges (connections) dynamically
    if (metadata.connections && metadata.connections.length > 0) {
      metadata.connections.forEach(conn => {
        if (conn.condition) {
          workflow.addConditionalEdge(
            conn.from,
            conn.to,
            this.workflowRouter.createConditionFunction(conn.condition)
          );
          
          logger.debug('Conditional edge added', {
            workflowId: metadata.id,
            from: conn.from,
            to: conn.to,
            condition: conn.condition
          });
        } else {
          workflow.addEdge(conn.from, conn.to);
          
          logger.debug('Direct edge added', {
            workflowId: metadata.id,
            from: conn.from,
            to: conn.to
          });
        }
      });
    } else if (metadata.agents && metadata.agents.length > 0) {
      // If no connections defined but agents exist, create a simple linear flow
      logger.debug('Creating linear workflow flow', {
        workflowId: metadata.id,
        agentCount: metadata.agents.length
      });
      
      let previousNode = START;
      metadata.agents.forEach(agentDef => {
        workflow.addEdge(previousNode, agentDef.id);
        previousNode = agentDef.id;
      });
      workflow.addEdge(previousNode, END);
    }

    // Set entry point - ALWAYS required for LangGraph
    if (metadata.entryPoint) {
      workflow.setEntryPoint(metadata.entryPoint);
    } else {
      // Default entry point is always START for LangGraph
      workflow.setEntryPoint(START);
    }

    // Set finish point
    if (metadata.finishPoint) {
      workflow.setFinishPoint(metadata.finishPoint);
    }

    logger.info('Workflow created successfully', {
      workflowId: metadata.id,
      entryPoint: metadata.entryPoint || START
    });

    return workflow;
  }

  /**
   * Compile workflow with optional checkpointer
   * @param {StateGraph} workflow - Raw workflow
   * @param {Object} options - Compilation options
   * @returns {CompiledGraph} Compiled workflow
   */
  compileWorkflow(workflow, options = {}) {
let compiled = workflow;

    // Note: Checkpointer should be set up when creating the StateGraph
    // For now, we'll skip checkpointer setup to avoid API compatibility issues
    if (options.checkpointer) {
}

    if (options.interrupt) {
}

    return compiled.compile();
  }

  /**
   * Validate workflow metadata
   * @param {Object} metadata - Workflow metadata to validate
   * @returns {Object} Validation result
   * @throws {ValidationError} If metadata is critically invalid
   */
  validateMetadata(metadata) {
    const errors = [];

    logger.debug('Validating workflow metadata', {
      workflowId: metadata?.id
    });

    // Check required fields
    if (!metadata.id) errors.push('Missing workflow ID');
    if (!metadata.agents || !Array.isArray(metadata.agents)) {
      errors.push('Missing or invalid agents array');
    }
    if (!metadata.connections || !Array.isArray(metadata.connections)) {
      errors.push('Missing or invalid connections array');
    }

    // Validate agents
    if (metadata.agents) {
      metadata.agents.forEach((agent, index) => {
        if (!agent.id) errors.push(`Agent ${index}: Missing ID`);
        if (!agent.type) errors.push(`Agent ${index}: Missing type`);
        if (!this.agentRegistry.hasAgent(agent.type)) {
          errors.push(`Agent ${index}: Unknown agent type '${agent.type}'`);
        }
      });
    }

    // Validate connections
    if (metadata.connections) {
      const agentIds = new Set(metadata.agents?.map(a => a.id) || []);
      metadata.connections.forEach((conn, index) => {
        if (!conn.from || !conn.to) {
          errors.push(`Connection ${index}: Missing from/to`);
        }
        if (!agentIds.has(conn.from)) {
          errors.push(`Connection ${index}: Unknown source agent '${conn.from}'`);
        }
        if (!agentIds.has(conn.to)) {
          errors.push(`Connection ${index}: Unknown target agent '${conn.to}'`);
        }
      });
    }

    const isValid = errors.length === 0;

    if (isValid) {
      logger.info('Workflow metadata validation passed', {
        workflowId: metadata.id
      });
    } else {
      logger.error('Workflow metadata validation failed', {
        workflowId: metadata?.id,
        errorCount: errors.length,
        errors
      });
    }

    return {
      isValid,
      errors
    };
  }
}

module.exports = WorkflowFactory;
