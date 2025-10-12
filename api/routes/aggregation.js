/**
 * Generic Aggregation API
 * 
 * Completely metadata-driven aggregation endpoint that can perform any database
 * aggregation based on metadata configuration. NO hardcoded business logic.
 * 
 * Supports:
 * - Complex aggregation pipelines
 * - Dynamic filtering
 * - Multiple data sources
 * - Generic calculations
 * - Custom formulas
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 */

const mongoose = require('mongoose');
const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');
const TenantContextFactory = require('../core/TenantContextFactory');
const DocumentRepository = require('../repositories/DocumentRepository');

/**
 * Process date placeholders in pipeline (e.g., "now", "now+30d")
 */
function processDatePlaceholders(obj) {
  if (!obj) return obj;
  
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      processDatePlaceholders(obj[key]);
    } else if (typeof obj[key] === 'string') {
      const value = obj[key];
      const now = new Date();
      
      if (value === 'now') {
        obj[key] = now.toISOString();
      } else {
        const match = value.match(/^now([+-])(\d+)([d])$/);
        if (match) {
          const operator = match[1];
          const amount = parseInt(match[2], 10);
          const unit = match[3];
          let date = new Date();
          
          if (unit === 'd') {
            date.setDate(date.getDate() + (operator === '+' ? amount : -amount));
          }
          
          if (key === '$lte') {
            date.setHours(23, 59, 59, 999);
          }
          
          obj[key] = date.toISOString();
        }
      }
    }
  }
  
  return obj;
}

/**
 * Build MongoDB aggregation pipeline from metadata configuration
 */
function buildAggregationPipeline(config, filters = {}) {
  

  // If config has a custom pipeline, use it with filters applied
  if (config.pipeline) {
    // Process date placeholders in the custom pipeline
    const processedPipeline = JSON.parse(JSON.stringify(config.pipeline)); // Deep clone
    processDatePlaceholders(processedPipeline);
    
    const pipeline = [];
    
    // Separate base filters from line item filters
    const baseMatchStage = {
      ...(config.baseFilter || {})
    };
    
    const lineItemMatchStage = {};
    let hasLineItemFilters = false;
    
    // Process filters and separate base vs line item filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        // Handle operator suffixes (e.g., company_id__in => company_id with $in operator)
        let filterKey = key;
        let operator = null;
        
        if (key.includes('__')) {
          const parts = key.split('__');
          filterKey = parts[0];
          operator = parts[1]; // 'in', 'gte', 'lte', etc.
        }
        
        const mappedField = config.fieldMappings?.[filterKey] || filterKey;
        
        
        // Check if this is a line item filter
        if (mappedField.includes('.') && mappedField.startsWith('lineItems.')) {
          const nestedField = mappedField.split('.')[1]; // Get 'paintSpecId' from 'lineItems.paintSpecId'
          if (operator === 'in' || Array.isArray(value)) {
            lineItemMatchStage[nestedField] = { $in: Array.isArray(value) ? value : [value] };
          } else {
            lineItemMatchStage[nestedField] = value;
          }
          hasLineItemFilters = true;
          
        } else {
          // Handle regular filters (company, site, date, etc.)
          if (filterKey === 'date_range' && typeof value === 'string') {
            const now = new Date();
            let startDate, endDate;
            
            switch (value) {
              case 'YTD':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
              case 'QTD':
                const currentQuarter = Math.floor(now.getMonth() / 3);
                startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
                endDate = now;
                break;
              case 'MTD':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
              default:
                baseMatchStage[mappedField] = value;
                return;
            }
            
            baseMatchStage[mappedField] = {
              $gte: startDate,
              $lte: endDate
            };
          } else {
            // Regular field mapping with operator support
            if (operator === 'in' || Array.isArray(value)) {
              baseMatchStage[mappedField] = { $in: Array.isArray(value) ? value : [value] };
            } else if (operator === 'gte') {
              baseMatchStage[mappedField] = { ...baseMatchStage[mappedField], $gte: value };
            } else if (operator === 'lte') {
              baseMatchStage[mappedField] = { ...baseMatchStage[mappedField], $lte: value };
            } else if (operator === 'ne') {
              baseMatchStage[mappedField] = { $ne: value };
            } else {
              baseMatchStage[mappedField] = value;
            }
            
          }
        }
      }
    });
    
    // Build the pipeline with proper filter placement
    logger.info('Aggregation pipeline base match stage:', {
      config: config.name,
      baseMatchStage,
      filters: Object.keys(filters),
      filterValues: filters
    });
    
    pipeline.push({ $match: baseMatchStage });
    
    
    // Insert line item filters after $unwind if needed
    const modifiedPipeline = [];
    let unwindFound = false;
    
    processedPipeline.forEach(stage => {
      modifiedPipeline.push(stage);
      
      // If we just added an $unwind stage and we have line item filters, add the line item match
      if (stage.$unwind && hasLineItemFilters && !unwindFound) {
        modifiedPipeline.push({ $match: lineItemMatchStage });
unwindFound = true;
      }
    });
    
    pipeline.push(...modifiedPipeline);
    logger.debug('Pipeline base match stage', { baseMatchStage });
    return pipeline;
  }

  const pipeline = [];

  // 1. Match stage - base filtering
  const matchStage = {
    ...(config.baseFilter || {})
  };

  

  // Add dynamic filters with metadata-driven field mapping
  
  Object.entries(filters).forEach(([key, value]) => {
    
    if (value !== undefined && value !== null && value !== '') {
      if (key.includes('__')) {
        const [field, operator] = key.split('__');
        
        // Check if there's a field mapping in config
        const mappedField = config.fieldMappings?.[field] || field;
        
        switch (operator) {
          case 'in':
            matchStage[mappedField] = { $in: Array.isArray(value) ? value : value.split(',') };
            break;
          case 'gte':
            matchStage[mappedField] = { ...matchStage[mappedField], $gte: value };
            break;
          case 'lte':
            matchStage[mappedField] = { ...matchStage[mappedField], $lte: value };
            break;
          case 'like':
            matchStage[mappedField] = { $regex: value, $options: 'i' };
            break;
          case 'exists':
            matchStage[mappedField] = { $exists: Boolean(value) };
            break;
          default:
            matchStage[key] = value;
        }
      } else {
        // Check if there's a field mapping in config
        const mappedField = config.fieldMappings?.[key] || key;
        
        
        // Special handling for nested array fields (like lineItems.paintSpecId)
        if (mappedField.includes('.') && mappedField.startsWith('lineItems.')) {
          const nestedField = mappedField.split('.')[1]; // Get 'paintSpecId' from 'lineItems.paintSpecId'
          if (Array.isArray(value)) {
            matchStage[`lineItems.${nestedField}`] = { $in: value };
          } else {
            matchStage[`lineItems.${nestedField}`] = value;
          }
          
        }
        // Special handling for date_range presets
        else if (key === 'date_range' && typeof value === 'string') {
          const now = new Date();
          let startDate, endDate;
          
          switch (value) {
            case 'YTD':
              startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
              endDate = new Date(now.getFullYear(), 11, 31); // December 31st of current year
              break;
            case 'QTD':
              const currentQuarter = Math.floor(now.getMonth() / 3);
              startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
              endDate = now;
              break;
            case 'MTD':
              startDate = new Date(now.getFullYear(), now.getMonth(), 1);
              endDate = now;
              break;
            default:
              // If it's not a preset, treat as direct value
              matchStage[mappedField] = value;
              return;
          }
          
          // Apply date range filter
          matchStage[mappedField] = {
            $gte: startDate,
            $lte: endDate
          };
        } else {
          // Regular field mapping
          if (Array.isArray(value)) {
            matchStage[mappedField] = { $in: value };
          } else {
            matchStage[mappedField] = value;
          }
          
        }
      }
    }
  });

  
  pipeline.push({ $match: matchStage });

  // 2. Unwind stages - expand arrays
  if (config.unwind) {
    const unwindStage = {
      $unwind: {
        path: config.unwind.path
      }
    };

    // Add preserveNullAndEmptyArrays if specified
    if (config.unwind.preserveNullAndEmptyArrays !== undefined) {
      unwindStage.$unwind.preserveNullAndEmptyArrays = config.unwind.preserveNullAndEmptyArrays;
    }

    pipeline.push(unwindStage);
  }

  // 4. Lookup stages - join with other collections
  if (config.lookups && Array.isArray(config.lookups)) {
    config.lookups.forEach(lookup => {
      const lookupStage = {
        $lookup: {
          from: lookup.from || 'documents',
          as: lookup.as
        }
      };

      // Handle different lookup formats
      if (lookup.let && lookup.pipeline) {
        // Advanced lookup with let and pipeline (for complex joins)
        lookupStage.$lookup.let = lookup.let;
        lookupStage.$lookup.pipeline = lookup.pipeline;
      } else if (lookup.localField && lookup.foreignField) {
        // Simple lookup with localField/foreignField
        lookupStage.$lookup.localField = lookup.localField;
        lookupStage.$lookup.foreignField = lookup.foreignField;
      } else {
        // Default to simple lookup if neither format is provided
        logger.warn('Lookup configuration missing required fields', { lookup });
        return;
      }

      pipeline.push(lookupStage);

      // Unwind if specified
      if (lookup.unwind) {
        const unwindStage = {
          $unwind: {
            path: `$${lookup.as}`
          }
        };

        // Add preserveNullAndEmptyArrays if specified
        if (lookup.preserveNullAndEmptyArrays !== undefined) {
          unwindStage.$unwind.preserveNullAndEmptyArrays = lookup.preserveNullAndEmptyArrays;
        }

        pipeline.push(unwindStage);
      }
    });
  }

  // 5. Additional match stages after lookups
  if (config.postLookupFilter) {
    pipeline.push({ $match: config.postLookupFilter });
  }

  // 6. Group stage - aggregation logic
  if (config.groupBy) {
    const groupStage = {
      _id: config.groupBy._id || null
    };

    // Add aggregation fields
    if (config.groupBy.fields) {
      Object.entries(config.groupBy.fields).forEach(([fieldName, aggregation]) => {
        if (typeof aggregation === 'string') {
          // Simple aggregation like { count: '$sum: 1' }
          groupStage[fieldName] = { [`$${aggregation}`]: 1 };
        } else if (aggregation.operator && aggregation.field) {
          // Complex aggregation like { totalAmount: { operator: 'sum', field: '$amount' } }
          groupStage[fieldName] = { [`$${aggregation.operator}`]: aggregation.field };
        } else if (aggregation.expression) {
          // Custom expression like { calculated_value: { expression: { $multiply: ['$field1', '$field2'] } } }
          groupStage[fieldName] = aggregation.expression;
        } else if (typeof aggregation === 'object' && aggregation !== null) {
          // Direct accumulator object like { $sum: 1 } or { $avg: '$field' }
          groupStage[fieldName] = aggregation;
        }
      });
    }

    pipeline.push({ $group: groupStage });
  }

  // 7. Project stage - field selection and calculations
  if (config.project) {
    pipeline.push({ $project: config.project });
  }

  // 8. Sort stage
  if (config.sort) {
    pipeline.push({ $sort: config.sort });
  }

  // 9. Limit stage
  if (config.limit) {
    pipeline.push({ $limit: config.limit });
  }

  return pipeline;
}

/**
 * Execute aggregation query and format results
 */
async function executeAggregation(collection, pipeline, config) {
  
  
  // Debug: Count documents before aggregation
  const matchStage = pipeline.find(stage => stage.$match);
  if (matchStage) {
    const docCount = await collection.countDocuments(matchStage.$match);
}
  
  let results;
  try {
    results = await collection.aggregate(pipeline).toArray();
  } catch (error) {
    logger.error('Aggregation pipeline error', {
      error: error.message,
      pipeline,
      stack: error.stack
    });
    throw error;
  }

  // Apply post-processing if specified
  if (config.postProcess && Array.isArray(results)) {
    return results.map(result => {
      const processed = { ...result };
      
      // Apply custom calculations
      if (config.postProcess.calculations) {
        Object.entries(config.postProcess.calculations).forEach(([fieldName, calculation]) => {
          try {
            if (calculation.formula) {
              // Simple formula evaluation (be careful with eval - this is a controlled environment)
              const formula = calculation.formula.replace(/\$(\w+)/g, (match, fieldName) => {
                return processed[fieldName] || 0;
              });
              processed[fieldName] = eval(formula);
            } else if (calculation.expression) {
              // MongoDB-style expression evaluation
              processed[fieldName] = evaluateExpression(calculation.expression, processed);
            }
          } catch (error) {
            logger.error('Error calculating field', {
              fieldName,
              error: error.message
            });
            processed[fieldName] = null;
          }
        });
      }

      // Apply formatting
      if (config.postProcess.formatting) {
        Object.entries(config.postProcess.formatting).forEach(([fieldName, format]) => {
          if (processed[fieldName] !== undefined && processed[fieldName] !== null) {
            switch (format.type) {
              case 'number':
                processed[fieldName] = Number(processed[fieldName]).toLocaleString(format.locale, format.options);
                break;
              case 'currency':
                processed[fieldName] = new Intl.NumberFormat(format.locale || 'en-US', {
                  style: 'currency',
                  currency: format.currency || 'USD',
                  ...format.options
                }).format(processed[fieldName]);
                break;
              case 'percentage':
                processed[fieldName] = `${(processed[fieldName] * 100).toFixed(format.decimals || 1)}%`;
                break;
              case 'date':
                processed[fieldName] = new Date(processed[fieldName]).toLocaleDateString(format.locale, format.options);
                break;
            }
          }
        });
      }

      return processed;
    });
  }

  return results;
}

/**
 * Simple expression evaluator for MongoDB-style expressions
 */
function evaluateExpression(expression, data) {
  if (typeof expression === 'object' && expression !== null) {
    const operator = Object.keys(expression)[0];
    const operands = expression[operator];

    switch (operator) {
      case '$multiply':
        return operands.reduce((acc, operand) => {
          const value = typeof operand === 'string' && operand.startsWith('$') 
            ? data[operand.substring(1)] 
            : operand;
          return acc * (value || 0);
        }, 1);
      
      case '$add':
        return operands.reduce((acc, operand) => {
          const value = typeof operand === 'string' && operand.startsWith('$') 
            ? data[operand.substring(1)] 
            : operand;
          return acc + (value || 0);
        }, 0);
      
      case '$divide':
        const [dividend, divisor] = operands;
        const dividendValue = typeof dividend === 'string' && dividend.startsWith('$') 
          ? data[dividend.substring(1)] 
          : dividend;
        const divisorValue = typeof divisor === 'string' && divisor.startsWith('$') 
          ? data[divisor.substring(1)] 
          : divisor;
        return divisorValue !== 0 ? dividendValue / divisorValue : 0;
      
      default:
        return expression;
    }
  }
  
  return expression;
}

async function registerAggregationRoutes(fastify) {

  // GET /api/aggregation/test - Simple test endpoint
  fastify.get('/aggregation/test', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      // Count paint invoice documents
      const paintInvoiceCount = await db.collection('documents').countDocuments({
        type: 'paintInvoice'
      });

      // Sample paint invoice
      const samplePaintInvoice = await db.collection('documents').findOne({
        type: 'paintInvoice'
      });

      return reply.send({
        status: 'Database connected',
        paintInvoiceCount,
        samplePaintInvoice: samplePaintInvoice ? {
          id: samplePaintInvoice.id,
          type: samplePaintInvoice.type,
          lineItemsCount: samplePaintInvoice.lineItems ? samplePaintInvoice.lineItems.length : 0,
          hasCompanyId: !!samplePaintInvoice.companyId,
          hasFacilityId: !!samplePaintInvoice.facilityId
        } : null
      });
    } catch (error) {
return reply.code(500).send({ error: error.message });
    }
  });

  // GET /api/aggregation/test-periods - Test different time period aggregations
  fastify.get('/aggregation/test-periods', { preHandler: requireAuth }, async (request, reply) => {
    try {
const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const results = {};

      // Test different period aggregations
      const periods = ['day', 'week', 'month', 'quarter', 'year'];

      for (const period of periods) {
        try {
          let groupBy, periodCalc;

          switch (period) {
            case 'day':
              groupBy = { $substr: ["$purchaseDate", 0, 10] };
              periodCalc = { $substr: ["$purchaseDate", 0, 10] };
              break;
            case 'week':
              // Handle both string and Date formats
              const weekDateExpr = {
                $cond: {
                  if: { $eq: [{ $type: "$purchaseDate" }, "date"] },
                  then: "$purchaseDate",
                  else: { $dateFromString: { dateString: "$purchaseDate" } }
                }
              };
              const weekDateStringExpr = {
                $cond: {
                  if: { $eq: [{ $type: "$purchaseDate" }, "date"] },
                  then: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
                  else: "$purchaseDate"
                }
              };
              groupBy = {
                $concat: [
                  { $substr: [{ $toString: weekDateStringExpr }, 0, 4] },
                  "-W",
                  {
                    $toString: {
                      $ceil: {
                        $divide: [
                          { $dayOfYear: weekDateExpr },
                          7
                        ]
                      }
                    }
                  }
                ]
              };
              periodCalc = groupBy;
              break;
            case 'month':
              groupBy = { $substr: ["$purchaseDate", 0, 7] };
              periodCalc = { $substr: ["$purchaseDate", 0, 7] };
              break;
            case 'quarter':
              // Handle both string and Date formats
              const quarterDateStringExpr = {
                $cond: {
                  if: { $eq: [{ $type: "$purchaseDate" }, "date"] },
                  then: { $dateToString: { format: "%Y-%m-%d", date: "$purchaseDate" } },
                  else: "$purchaseDate"
                }
              };
              groupBy = {
                $concat: [
                  { $substr: [{ $toString: quarterDateStringExpr }, 0, 4] },
                  "-Q",
                  {
                    $switch: {
                      branches: [
                        { case: { $lte: [{ $substr: [{ $toString: quarterDateStringExpr }, 5, 2] }, "03"] }, then: "1" },
                        { case: { $lte: [{ $substr: [{ $toString: quarterDateStringExpr }, 5, 2] }, "06"] }, then: "2" },
                        { case: { $lte: [{ $substr: [{ $toString: quarterDateStringExpr }, 5, 2] }, "09"] }, then: "3" }
                      ],
                      default: "4"
                    }
                  }
                ]
              };
              periodCalc = groupBy;
              break;
            case 'year':
              groupBy = { $substr: ["$purchaseDate", 0, 4] };
              periodCalc = { $substr: ["$purchaseDate", 0, 4] };
              break;
          }

          const pipeline = [
            { $match: { type: 'paintInvoice' } },
            { $unwind: "$lineItems" },
            {
              $group: {
                _id: groupBy,
                period: { $first: periodCalc },
                total_quantity: { $sum: "$lineItems.quantityPurchased" }
              }
            },
            { $sort: { _id: 1 } },
            { $limit: 5 } // Just get first 5 results for testing
          ];

          const periodResults = await db.collection('documents').aggregate(pipeline).toArray();

          results[period] = {
            count: periodResults.length,
            samplePeriods: periodResults.map(r => r.period),
            pipeline: pipeline
          };

        } catch (periodError) {
          results[period] = {
            error: periodError.message,
            pipeline: 'Failed to create pipeline'
          };
        }
      }

      return reply.send({
        status: 'Period testing completed',
        results: results,
        note: 'Compare the samplePeriods arrays - they should be different for each period type'
      });
    } catch (error) {
return reply.code(500).send({
        error: 'Period testing failed',
        details: error.message
      });
    }
  });

  // POST /api/aggregation - Generic aggregation endpoint
  // Debug endpoint to inspect available data
  fastify.get('/aggregation/debug', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { tenantId } = request.user;

      // Check paint invoices
      const paintInvoices = await request.mongo.db.collection('documents')
        .find({ tenantId, type: 'paintInvoice', deleted: { $ne: true } })
        .limit(5)
        .toArray();

      // Check paint specifications
      const paintSpecs = await request.mongo.db.collection('documents')
        .find({ tenantId, type: 'paint_specifications', deleted: { $ne: true } })
        .limit(5)
        .toArray();

      // Check sample paint invoice structure
      const sampleInvoice = paintInvoices.length > 0 ? paintInvoices[0] : null;

      reply.send({
        paintInvoices: {
          count: paintInvoices.length,
          sample: sampleInvoice,
          hasLineItems: sampleInvoice?.lineItems ? true : false,
          lineItemsCount: sampleInvoice?.lineItems?.length || 0
        },
        paintSpecifications: {
          count: paintSpecs.length,
          sample: paintSpecs.length > 0 ? paintSpecs[0] : null,
          hasVocContent: paintSpecs.length > 0 && paintSpecs[0]?.voc_content !== undefined
        }
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Debug endpoint failed',
        details: error.message
      });
    }
  });

  // Debug endpoint to check filter processing
  fastify.post('/aggregation/debug-filters', { preHandler: requireAuth }, async (request, reply) => {
    try {
const { config, filters = {} } = request.body;

      // Handle nested filters structure from GenericChartGadget
      let actualFilters = filters;
      if (!Object.keys(filters).length && config?.filters) {
actualFilters = config.filters;
      }

      // Test basic aggregation with filters
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection(config.collection || 'documents');
      const tenantId = request.user && request.user.tenantId ? request.user.tenantId : 'default';

      // Build test pipeline
      const testPipeline = buildAggregationPipeline(config, actualFilters, tenantId);
// Execute test query
      const testResults = await collection.aggregate(testPipeline).toArray();
return reply.send({
        received: {
          config: !!config,
          filters: filters,
          configFilters: config?.filters,
          actualFilters: actualFilters
        },
        processing: {
          filterCount: Object.keys(actualFilters).length,
          filterKeys: Object.keys(actualFilters),
          hasNestedFilters: !!config?.filters,
          nestedFilterCount: config?.filters ? Object.keys(config.filters).length : 0,
          pipelineStages: testPipeline.length
        },
        testResults: {
          count: testResults.length,
          sample: testResults.slice(0, 3),
          hasData: testResults.length > 0
        }
      });
    } catch (error) {
      logger.error('Filter debug error', {
        error: error.message,
        stack: error.stack
      });
      return reply.code(500).send({ error: error.message });
    }
  });

  // Simple test endpoint for basic aggregation without lookups
  fastify.get('/aggregation/test-simple', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { tenantId } = request.user;

      // Simple aggregation to count paint invoices by facility
      const result = await request.mongo.db.collection('documents').aggregate([
        { $match: { tenantId, type: 'paintInvoice', deleted: { $ne: true } } },
        { $unwind: { path: '$lineItems', preserveNullAndEmptyArrays: false } },
        {
          $group: {
            _id: '$facilityId',
            facilityId: { $first: '$facilityId' },
            total_quantity: { $sum: '$lineItems.quantityPurchased' },
            invoice_count: { $sum: 1 }
          }
        },
        { $sort: { total_quantity: -1 } },
        { $limit: 10 }
      ]).toArray();

      reply.send({
        success: true,
        data: result,
        count: result.length,
        message: 'Simple aggregation test completed'
      });
    } catch (error) {
      reply.code(500).send({
        error: 'Simple aggregation test failed',
        details: error.message
      });
    }
  });

  fastify.post('/aggregation', { preHandler: requireAuth }, async (request, reply) => {
    try {
      logger.info('Aggregation request received', {
        bodyKeys: Object.keys(request.body),
        hasFilters: 'filters' in request.body,
        filters: request.body.filters,
        configName: request.body.config?.name
      });
      if ('filters' in request.body) {
        logger.info('Filters found in request body', { filters: request.body.filters });
      }
      if (request.body.config && 'filters' in request.body.config) {
        logger.info('Filters found in config', { filters: request.body.config.filters });
}
// Add debugging for pipeline generation
const { config, filters = {} } = request.body;

      // Handle nested filters structure from GenericChartGadget
      let actualFilters = filters;
      if (!Object.keys(filters).length && config?.filters) {
actualFilters = config.filters;
      }

      if (!config) {
return reply.code(400).send({ error: 'Aggregation config is required' });
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      
      const documentType = config.baseFilter?.type;
      if (!documentType) {
        return reply.code(400).send({ error: 'Aggregation config must include a baseFilter with a document type' });
      }

      const repository = new DocumentRepository(tenantContext, documentType, request.context);

      logger.debug('Aggregation configuration', {
        filters,
        filterCount: Object.keys(actualFilters).length,
        baseFilter: config.baseFilter
      });

      // Build and execute aggregation pipeline
      const pipeline = buildAggregationPipeline(config, actualFilters);
      logger.debug('Pipeline built', { pipelineStages: pipeline.length });

      // The repository's aggregate method will automatically prepend the tenant and soft-delete filters
      const results = await repository.aggregate(pipeline);

      // Return results in consistent format
      const response = {
        data: results,
        meta: {
          count: results.length,
          config: config.name || 'unnamed',
          timestamp: new Date().toISOString(),
          filters: Object.keys(actualFilters).length > 0 ? actualFilters : undefined
        }
      };

      logger.info('Aggregation response prepared', {
        dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
        hasData: response.data && (Array.isArray(response.data) ? response.data.length > 0 : true)
      });

      return reply.send(response);

    } catch (error) {
fastify.log.error('Error executing aggregation:', error);
      return reply.code(500).send({
        error: 'Failed to execute aggregation',
        details: error.message
      });
    }
  });




}

module.exports = registerAggregationRoutes;
