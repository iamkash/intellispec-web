const { logger } = require('../core/Logger');
const mongoose = require('mongoose');
const { optionalAuth } = require('../core/AuthMiddleware');

/**
 * Calculator API routes
 * Provides endpoints for inspection calculators
 */

async function registerCalculatorRoutes(fastify) {

  // GET /api/calculators - Get calculators with optional filtering
  fastify.get('/calculators', { preHandler: optionalAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('calculators');
      const tenantId = (request.user && request.user.tenantId) || 'default';
// Build query with optional filtering
      const query = {
        tenantId: { $in: [tenantId, 'system'] },
        deleted: { $ne: true }
      };

      // Filter by module if provided
      const { module, search, category } = request.query;
      if (module) {
        query.module = module;
      }

      // Filter by category if provided
      if (category) {
        query.category = category;
      }

      // Search functionality
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ];
      }
// Get calculators from collection
      const calculatorsRaw = await collection.find(query)
        .sort({ name: 1 })
        .toArray();
// Deduplicate by id, prefer tenant-specific over system
      const byId = new Map();
      for (const calc of calculatorsRaw) {
        const existing = byId.get(calc.id);
        if (!existing || (existing.tenantId === 'system' && calc.tenantId === tenantId)) {
          byId.set(calc.id, calc);
        }
      }
      const calculators = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));

      // Format for action panel display (use module-aware workspace path)
      const moduleToWorkspacePrefix = {
        inspect: 'intelliINSPECT',
        ndt: 'intelliNDT',
        scaffolding: 'intelliSCAFF'
      };
      const actions = calculators.map(calc => {
        const prefix = moduleToWorkspacePrefix[calc.module] || 'intelliINSPECT';
        return {
          key: calc.id,
          label: calc.name,
          description: calc.description,
          icon: calc.icon || 'CalculatorOutlined',
          type: 'workspace',
          workspace: `${prefix}/calculators/${calc.id}`,
          category: calc.category,
          tags: calc.tags || []
        };
      });

      return reply.send({
        success: true,
        calculators: actions,
        count: calculators.length,
        filters: {
          module: module || null,
          search: search || null,
          category: category || null
        }
      });

    } catch (error) {
      fastify.log.error('Error fetching calculators:', error);
      return reply.code(500).send({
        error: 'Failed to fetch calculators',
        details: error.message
      });
    }
  });

  // GET /api/calculators/:id/metadata - Get calculator metadata for dynamic rendering
  fastify.get('/calculators/:id/metadata', { preHandler: optionalAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('calculators');
      const tenantId = (request.user && request.user.tenantId) || 'default';
      const { id } = request.params;
// Get calculator metadata (prefer tenant, fallback to system)
      let calculator = await collection.findOne({
        tenantId: tenantId,
        id: id,
        deleted: { $ne: true }
      });
      if (!calculator) {
        calculator = await collection.findOne({
          tenantId: 'system',
          id: id,
          deleted: { $ne: true }
        });
      }

      if (!calculator) {
        return reply.code(404).send({
          error: 'Calculator not found',
          id: id
        });
      }
// Return calculator metadata for dynamic rendering
      // Use uiDefinition if available, otherwise convert formConfig to uiDefinition
      const uiDefinition = calculator.uiDefinition || {
        sections: calculator.formConfig?.gadgetOptions?.filter(item => item.type === 'section') || [],
        groups: calculator.formConfig?.gadgetOptions?.filter(item => item.type === 'group') || [],
        fields: calculator.formConfig?.gadgetOptions?.filter(item => !['section', 'group'].includes(item.type)) || []
      };

      const responseData = {
        id: calculator.id,
        name: calculator.name,
        description: calculator.description,
        category: calculator.category,
        icon: calculator.icon,
        tags: calculator.tags,
        uiDefinition: uiDefinition,
        calculations: calculator.calculations || calculator.calculationEngine?.calculations || [],
        aiPrompts: calculator.aiPrompts || calculator.calculationEngine?.prompts || {},

        // Flat metadata - single AI prompt
        aiPrompt: calculator.aiPrompt || ''
      };
logger.debug('  aiPrompt exists in calculator:', 'aiPrompt' in calculator);
logger.debug('  aiPrompt in responseData:', 'aiPrompt' in responseData);
return reply.send(responseData);

    } catch (error) {
      fastify.log.error('Error fetching calculator metadata:', error);
      return reply.code(500).send({
        error: 'Failed to fetch calculator metadata',
        details: error.message
      });
    }
  });

  // POST /api/calculators/:id/calculate - Execute calculator with input data
  fastify.post('/calculators/:id/calculate', { preHandler: optionalAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('calculators');
      const tenantId = (request.user && request.user.tenantId) || 'default';
      const { id } = request.params;
      const inputData = request.body;
logger.debug(`📥 Input data: ${JSON.stringify(inputData, null, 2)}`);

      // Get calculator definition (prefer tenant, fallback to system)
      let calculator = await collection.findOne({
        tenantId: tenantId,
        id: id,
        deleted: { $ne: true }
      });
      if (!calculator) {
        calculator = await collection.findOne({
          tenantId: 'system',
          id: id,
          deleted: { $ne: true }
        });
      }

      if (!calculator) {
        return reply.code(404).send({
          error: 'Calculator not found',
          id: id
        });
      }

      // For now, return mock calculation results
      // In production, this would integrate with formula engine and AI
      const mockResults = {
        success: true,
        calculator: calculator.name,
        input: inputData,
        results: {
          calculated_value: 42,
          status: 'success',
          rationale: 'Mock calculation completed',
          steps: ['Step 1: Processed input', 'Step 2: Applied formula', 'Step 3: Generated result']
        },
        timestamp: new Date().toISOString()
      };
return reply.send(mockResults);

    } catch (error) {
      fastify.log.error('Error executing calculator:', error);
      return reply.code(500).send({
        error: 'Failed to execute calculator',
        details: error.message
      });
    }
  });

}

module.exports = { registerCalculatorRoutes };
