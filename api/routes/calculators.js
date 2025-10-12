const { requireAuth } = require('../core/AuthMiddleware');
const TenantContextFactory = require('../core/TenantContextFactory');
const CalculatorRepository = require('../repositories/CalculatorRepository');

/**
 * Calculator API routes
 * Provides endpoints for inspection calculators backed by the repository layer.
 */
async function registerCalculatorRoutes(fastify) {
  fastify.get('/calculators', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new CalculatorRepository(tenantContext, request.context);

      const { module, search, category, limit, page } = request.query;
      const calculators = await repository.listCalculators({
        module,
        search,
        category,
        limit,
        page
      });

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
        count: actions.length,
        filters: {
          module: module || null,
          search: search || null,
          category: category || null
        }
      });
    } catch (error) {
      request.log.error({ err: error }, 'Error fetching calculators');
      return reply.code(500).send({
        error: 'Failed to fetch calculators',
        details: error.message
      });
    }
  });

  fastify.get('/calculators/:id/metadata', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new CalculatorRepository(tenantContext, request.context);
      const { id } = request.params;

      const calculator = await repository.getByExternalId(id);

      if (!calculator) {
        return reply.code(404).send({
          error: 'Calculator not found',
          id
        });
      }

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
        uiDefinition,
        calculations: calculator.calculations || calculator.calculationEngine?.calculations || [],
        aiPrompts: calculator.aiPrompts || calculator.calculationEngine?.prompts || {},
        aiPrompt: calculator.aiPrompt || ''
      };

      return reply.send(responseData);
    } catch (error) {
      request.log.error({ err: error }, 'Error fetching calculator metadata');
      return reply.code(500).send({
        error: 'Failed to fetch calculator metadata',
        details: error.message
      });
    }
  });

  fastify.post('/calculators/:id/calculate', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new CalculatorRepository(tenantContext, request.context);
      const { id } = request.params;
      const inputData = request.body;

      const calculator = await repository.getByExternalId(id);
      if (!calculator) {
        return reply.code(404).send({
          error: 'Calculator not found',
          id
        });
      }

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
      request.log.error({ err: error }, 'Error executing calculator');
      return reply.code(500).send({
        error: 'Failed to execute calculator',
        details: error.message
      });
    }
  });
}

module.exports = { registerCalculatorRoutes };
