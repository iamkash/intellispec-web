/**
 * Reference Data Management API Routes
 * 
 * Provides CRUD operations for managing reference data lists and options.
 * This serves as the single source of truth for all dropdown/select options.
 */

const { logger } = require('../core/Logger');
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const { 
  ErrorTypes, 
  APIError, 
  handleError, 
  asyncHandler, 
  validateRequired,
  safeDbOperation 
} = require('../core/ErrorHandler');
const { requireAuth } = require('../core/AuthMiddleware');

async function registerReferenceDataRoutes(fastify, options) {
  // Use centralized authentication middleware from core/AuthMiddleware.js
  // This handles JWT verification, user lookup, and tenant context automatically

  // ===================== LIST TYPES MANAGEMENT =====================
  
  // Get all list types (for left panel search/selection)
  fastify.get('/reference-data/list-types', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }
      
      const { search, category } = request.query;
      const listTypesCol = db.collection('referenceListTypes');
      
      // Build query
      let query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } }
        ];
      }
      if (category) {
        query.category = category;
      }
      
      const listTypes = await listTypesCol.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'referenceListOptions',
            localField: '_id',
            foreignField: 'listTypeId',
            as: 'options'
          }
        },
        {
          $addFields: {
            optionCount: { $size: '$options' },
            lastUpdated: { $max: '$options.updatedAt' }
          }
        },
        {
          $project: {
            options: 0 // Don't return full options, just count
          }
        },
        {
          $sort: { category: 1, name: 1 }
        }
      ]).toArray();
      
      return reply.send({ data: listTypes });
    } catch (error) {
      fastify.log.error('Error fetching list types:', error);
      return reply.code(500).send({ error: 'Failed to fetch list types' });
    }
  });
  
  // Create new list type
  fastify.post('/reference-data/list-types', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const listTypesCol = db.collection('referenceListTypes');
      
      const { name, description, category, sortBy, allowCustom } = request.body;
      
      // Check if list type already exists
      const existing = await listTypesCol.findOne({ name: name.toLowerCase() });
      if (existing) {
        return reply.code(400).send({ error: 'List type already exists' });
      }
      
      const newListType = {
        name: name.toLowerCase(),
        displayName: name,
        description: description || '',
        category: category || 'general',
        sortBy: sortBy || 'label',
        allowCustom: allowCustom || false,
        createdBy: request.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await listTypesCol.insertOne(newListType);
      const created = await listTypesCol.findOne({ _id: result.insertedId });
      
      return reply.send(created);
    } catch (error) {
      fastify.log.error('Error creating list type:', error);
      return reply.code(500).send({ error: 'Failed to create list type' });
    }
  });
  
  // Update list type
  fastify.put('/reference-data/list-types/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const listTypesCol = db.collection('referenceListTypes');
      
      const { id } = request.params;
      const { displayName, description, category, sortBy, allowCustom } = request.body;
      
      const updateData = {
        displayName,
        description,
        category,
        sortBy,
        allowCustom,
        updatedAt: new Date()
      };
      
      const result = await listTypesCol.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: 'List type not found' });
      }
      
      const updated = await listTypesCol.findOne({ _id: new ObjectId(id) });
      return reply.send(updated);
    } catch (error) {
      fastify.log.error('Error updating list type:', error);
      return reply.code(500).send({ error: 'Failed to update list type' });
    }
  });
  
  // Delete list type (and all its options)
  fastify.delete('/reference-data/list-types/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const listTypesCol = db.collection('referenceListTypes');
      const optionsCol = db.collection('referenceListOptions');
      
      const { id } = request.params;
      
      // Delete all options for this list type
      await optionsCol.deleteMany({ listTypeId: new ObjectId(id) });
      
      // Delete the list type
      const result = await listTypesCol.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: 'List type not found' });
      }
      
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Error deleting list type:', error);
      return reply.code(500).send({ error: 'Failed to delete list type' });
    }
  });

  // ===================== LIST OPTIONS MANAGEMENT =====================
  
  // DEBUG: Temporary endpoint without auth to test data
  fastify.get('/reference-data/debug/list-options/:listTypeName', async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      const listTypesCol = db.collection('referenceListTypes');
      
      const { listTypeName } = request.params;
// Get list type info
      const listType = await listTypesCol.findOne({ name: listTypeName });
if (!listType) {
return reply.code(404).send({ error: 'List type not found' });
      }

      // Build query for options
      let query = {
        listTypeId: listType._id,
        isActive: true
      };
const options = await optionsCol.find(query).sort({ label: 1 }).toArray();
// Format for form dropdowns
      const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        color: opt.color,
        icon: opt.icon,
        parentGroup: opt.parentGroup
      }));
      
      return reply.send({ 
        debug: true,
        listType: listType,
        query: query,
        rawCount: options.length,
        data: formattedOptions 
      });
    } catch (error) {
      logger.error('[DEBUG] Error:', error);
      return reply.code(500).send({ error: 'Failed to fetch list options', details: error.message });
    }
  });

  // Get options by list type name (for form dropdowns)
  fastify.get('/reference-data/list-options/:listTypeName', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      const listTypesCol = db.collection('referenceListTypes');
      
      const { listTypeName } = request.params;
      const { parentValue, format } = request.query;
// Get list type info
      const listType = await listTypesCol.findOne({ name: listTypeName });
if (!listType) {
return reply.code(404).send({ error: 'List type not found' });
      }

      // Build query for options
      let query = {
        listTypeId: listType._id,
        isActive: true
      };
      
      // Add parent filter if specified
      if (parentValue && listType.parentType) {
        query.parentValue = parentValue;
      }
// Build sort criteria
      let sort = {};
      switch (listType.sortBy) {
        case 'value':
          sort = { value: 1 };
          break;
        case 'order':
          sort = { sortOrder: 1, label: 1 };
          break;
        default:
          sort = { label: 1 };
      }
      
      const options = await optionsCol.find(query).sort(sort).toArray();
// Format for form dropdowns
      const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        color: opt.color,
        icon: opt.icon,
        parentGroup: opt.parentGroup
      }));
return reply.send({ data: formattedOptions });
    } catch (error) {
      logger.error('[AUTH] Error fetching list options:', error);
      fastify.log.error('Error fetching list options:', error);
      return reply.code(500).send({ error: 'Failed to fetch list options' });
    }
  });

  // Get dependent options based on parent entity (for hierarchical dropdowns)
  fastify.get('/reference-data/list-options/site_types_by_company/:companyId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const companiesCol = db.collection('documents');
      const optionsCol = db.collection('referenceListOptions');
      
      const { companyId } = request.params;
      
      // Get company to determine industry
      const company = await companiesCol.findOne({ 
        id: companyId,
        type: 'company',
        tenantId: request.user.tenantId || 'default',
        deleted: { $ne: true }
      });
      
      if (!company) {
        return reply.code(404).send({ error: 'Company not found' });
      }
      
      // Get site types for this industry
      const listTypeName = `site_types_${company.industry || 'manufacturing'}`;
const options = await optionsCol.find({ 
        listType: listTypeName,
        isActive: true
      }).sort({ sortOrder: 1, label: 1 }).toArray();
const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        color: opt.color
      }));
      
      return reply.send({ data: formattedOptions });
    } catch (error) {
      fastify.log.error('Error fetching site types by company:', error);
      return reply.code(500).send({ error: 'Failed to fetch site types' });
    }
  });

  // Get asset group types based on site's company industry
  fastify.get('/reference-data/list-options/asset_group_types_by_site/:siteId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const documentsCol = db.collection('documents');
      const optionsCol = db.collection('referenceListOptions');
      
      const { siteId } = request.params;
      
      // Get site and its company
      const site = await documentsCol.findOne({ 
        id: siteId,
        type: 'site',
        deleted: { $ne: true }
      });
      
      if (!site) {
        return reply.code(404).send({ error: 'Site not found' });
      }
      
      // Get company to determine industry
      const company = await documentsCol.findOne({ 
        id: site.company_id,
        type: 'company',
        deleted: { $ne: true }
      });
      
      if (!company) {
        return reply.code(404).send({ error: 'Company not found for site' });
      }
      
      // Get asset group types for this industry
      const listTypeName = `asset_group_types_${company.industry || 'manufacturing'}`;
      const options = await optionsCol.find({ 
        listType: listTypeName,
        isActive: true
      }).sort({ sortOrder: 1, label: 1 }).toArray();
      
      const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        color: opt.color
      }));
      
      return reply.send({ data: formattedOptions });
    } catch (error) {
      fastify.log.error('Error fetching asset group types by site:', error);
      return reply.code(500).send({ error: 'Failed to fetch asset group types' });
    }
  });

  // Get asset types based on asset group and industry
  fastify.get('/reference-data/list-options/asset_types_by_group/:assetGroupId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const documentsCol = db.collection('documents');
      const optionsCol = db.collection('referenceListOptions');
      
      const { assetGroupId } = request.params;
      
      // Get asset group, site, and company
      const assetGroup = await documentsCol.findOne({ 
        id: assetGroupId,
        type: 'asset_group',
        tenantId: request.user.tenantId || 'default',
        deleted: { $ne: true }
      });
      
      if (!assetGroup) {
        return reply.code(404).send({ error: 'Asset group not found' });
      }
      
      const site = await documentsCol.findOne({ 
        id: assetGroup.site_id,
        type: 'site',
        tenantId: request.user.tenantId || 'default',
        deleted: { $ne: true }
      });
      
      if (!site) {
        return reply.code(404).send({ error: 'Site not found for asset group' });
      }
      
      const company = await documentsCol.findOne({ 
        id: site.company_id,
        type: 'company',
        tenantId: request.user.tenantId || 'default',
        deleted: { $ne: true }
      });
      
      if (!company) {
        return reply.code(404).send({ error: 'Company not found for site' });
      }
      
      // Get asset types for this industry and group
      const listTypeName = `asset_types_${company.industry || 'manufacturing'}`;
let query = { 
        listType: listTypeName,
        isActive: true
      };
      
      // Filter by parent group if asset group type is specified
      if (assetGroup.group_type) {
        query.parentGroup = assetGroup.group_type;
      }
      
      const options = await optionsCol.find(query).sort({ sortOrder: 1, label: 1 }).toArray();
const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        description: opt.description,
        color: opt.color,
        parentGroup: opt.parentGroup
      }));
      
      return reply.send({ data: formattedOptions });
    } catch (error) {
      fastify.log.error('Error fetching asset types by group:', error);
      return reply.code(500).send({ error: 'Failed to fetch asset types' });
    }
  });

  // Get options for a specific list type (for right panel grid)
  fastify.get('/reference-data/options/:listTypeId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      const listTypesCol = db.collection('referenceListTypes');
      
      const { listTypeId } = request.params;
      const { format } = request.query;
      
      // Get list type info for sorting
      const listType = await listTypesCol.findOne({ _id: new ObjectId(listTypeId) });
      if (!listType) {
        return reply.code(404).send({ error: 'List type not found' });
      }
      
      // Build sort criteria
      let sort = {};
      switch (listType.sortBy) {
        case 'value':
          sort = { value: 1 };
          break;
        case 'order':
          sort = { sortOrder: 1, label: 1 };
          break;
        default:
          sort = { label: 1 };
      }
      
      const options = await optionsCol.find({ 
        listTypeId: new ObjectId(listTypeId) 
      }).sort(sort).toArray();
      
      // Return format for dropdowns
      if (format === 'options') {
        const formattedOptions = options.map(opt => ({
          value: opt.value,
          label: opt.label,
          key: opt.value
        }));
        return reply.send(formattedOptions);
      }
      
      // Default format for management grid
      return reply.send({ data: options });
    } catch (error) {
      fastify.log.error('Error fetching options:', error);
      return reply.code(500).send({ error: 'Failed to fetch options' });
    }
  });
  
  // Create new option
  fastify.post('/reference-data/options/:listTypeId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      
      const { listTypeId } = request.params;
      const { label, value, description, sortOrder, isActive, metadata } = request.body;
      
      // Check if value already exists for this list type
      const existing = await optionsCol.findOne({ 
        listTypeId: new ObjectId(listTypeId),
        value: value
      });
      if (existing) {
        return reply.code(400).send({ error: 'Option value already exists for this list type' });
      }
      
      const newOption = {
        listTypeId: new ObjectId(listTypeId),
        label: label,
        value: value,
        description: description || '',
        sortOrder: sortOrder || 0,
        isActive: isActive !== false, // Default to true
        metadata: metadata || {},
        createdBy: request.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await optionsCol.insertOne(newOption);
      const created = await optionsCol.findOne({ _id: result.insertedId });
      
      return reply.send(created);
    } catch (error) {
      fastify.log.error('Error creating option:', error);
      return reply.code(500).send({ error: 'Failed to create option' });
    }
  });
  
  // Update option
  fastify.put('/reference-data/options/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      
      const { id } = request.params;
      const { label, value, description, sortOrder, isActive, metadata } = request.body;
      
      const updateData = {
        label,
        value,
        description,
        sortOrder,
        isActive,
        metadata,
        updatedAt: new Date()
      };
      
      const result = await optionsCol.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );
      
      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: 'Option not found' });
      }
      
      const updated = await optionsCol.findOne({ _id: new ObjectId(id) });
      return reply.send(updated);
    } catch (error) {
      fastify.log.error('Error updating option:', error);
      return reply.code(500).send({ error: 'Failed to update option' });
    }
  });
  
  // Delete option
  fastify.delete('/reference-data/options/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const optionsCol = db.collection('referenceListOptions');
      
      const { id } = request.params;
      
      const result = await optionsCol.deleteOne({ _id: new ObjectId(id) });
      
      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: 'Option not found' });
      }
      
      return reply.send({ success: true });
    } catch (error) {
      fastify.log.error('Error deleting option:', error);
      return reply.code(500).send({ error: 'Failed to delete option' });
    }
  });

  // ===================== AI GENERATION =====================
  
  // AI-powered option generation
  fastify.post('/reference-data/ai-generate/:listTypeId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      fastify.log.info('AI generation request received', { 
        listTypeId: request.params.listTypeId, 
        body: request.body 
      });

      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        fastify.log.error('Database not connected');
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const listTypesCol = db.collection('referenceListTypes');
      const optionsCol = db.collection('referenceListOptions');
      
      const { listTypeId } = request.params;
      const { prompt, count = 10, replaceExisting = false } = request.body;
      
      fastify.log.info('Processing AI generation', { listTypeId, prompt, count, replaceExisting });
      
      // Validate listTypeId format
      if (!ObjectId.isValid(listTypeId)) {
        return reply.code(400).send({ error: 'Invalid list type ID format' });
      }
      
      // Get list type info
      const listType = await listTypesCol.findOne({ _id: new ObjectId(listTypeId) });
      if (!listType) {
        fastify.log.error('List type not found', { listTypeId });
        return reply.code(404).send({ error: 'List type not found' });
      }

      fastify.log.info('Found list type', { 
        listTypeId, 
        displayName: listType.displayName,
        category: listType.category 
      });
      
      // Load AI configuration and utilities with hybrid approach
      let generateWithAI, generateIntelligentFallback, getAIConfigForGadget;
      let aiConfig;
      
      try {
        const openaiUtils = require('../core/AIService');
        generateWithAI = openaiUtils.generateWithAI;
        generateIntelligentFallback = openaiUtils.generateIntelligentFallback;
        getAIConfigForGadget = openaiUtils.getAIConfigForGadget;
        
        // Get gadget-specific AI configuration from request metadata
        const gadgetAIConfig = request.body.aiConfig || {};
        
        // Load base AI configuration and merge with gadget overrides
        const path = require('path');
        const baseConfigPath = path.join(__dirname, '../../public/data/ai-config/reference-data-generation.json');
        aiConfig = getAIConfigForGadget(baseConfigPath, gadgetAIConfig);
        
        fastify.log.info('AI utilities and hybrid configuration loaded successfully', {
          hasGadgetConfig: Object.keys(gadgetAIConfig).length > 0,
          useCase: gadgetAIConfig.useCase || 'default'
        });
      } catch (importError) {
        fastify.log.error('Failed to load AI utilities or configuration:', importError);
        return reply.code(500).send({ 
          error: 'AI service unavailable',
          details: 'Failed to load AI utilities or configuration'
        });
      }
      
      let generatedOptions = [];
      
      try {
        // Check if OpenAI is available (has API key)
        const hasOpenAI = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key';
        
        if (hasOpenAI) {
          fastify.log.info('Attempting AI generation with OpenAI using metadata configuration');
          
          // Build context for AI generation from metadata
          const context = {
            count,
            displayName: listType.displayName,
            category: listType.category || 'General',
            description: listType.description || 'No specific description provided',
            name: listType.name,
            sortBy: listType.sortBy || 'alphabetical',
            allowCustom: listType.allowCustom ? 'Yes' : 'No',
            userPrompt: prompt || ''
          };
          
          // Use metadata-driven AI generation
          const aiResponse = await generateWithAI(aiConfig.aiGeneration, context);
          
          try {
            const parsed = JSON.parse(aiResponse);
            // Handle both array format and object with options property
            generatedOptions = Array.isArray(parsed) ? parsed : parsed.options || [];
          } catch (parseError) {
            // Try to extract JSON from response if it's wrapped in text
            const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              generatedOptions = Array.isArray(parsed) ? parsed : parsed.options || [];
            } else {
              throw new Error('Invalid JSON response from AI');
            }
          }
          
          if (!Array.isArray(generatedOptions)) {
            throw new Error('AI response does not contain a valid options array');
          }
          
          fastify.log.info(`AI generated ${generatedOptions.length} options for ${listType.displayName}`);
        } else {
          fastify.log.info('OpenAI not configured, using fallback generation');
          throw new Error('OpenAI not available');
        }
        
      } catch (aiError) {
        fastify.log.error('AI generation error, using intelligent fallback:', aiError.message);
        
        // Use intelligent fallback generation with metadata configuration
        try {
          const fallbackContext = {
            listType,
            count
          };
          
          const fallbackResponse = generateIntelligentFallback(aiConfig.fallbackGeneration, fallbackContext);
          const parsed = JSON.parse(fallbackResponse);
          generatedOptions = parsed.options || [];
          
          fastify.log.info(`Generated ${generatedOptions.length} fallback options for ${listType.displayName}`);
        } catch (fallbackError) {
          fastify.log.error('Fallback generation also failed:', fallbackError);
          return reply.code(500).send({ 
            error: 'Both AI and fallback generation failed', 
            details: `AI Error: ${aiError.message}, Fallback Error: ${fallbackError.message}`
          });
        }
      }

      // Validate we have options to insert
      if (!generatedOptions || generatedOptions.length === 0) {
        return reply.code(400).send({ 
          error: 'No options were generated',
          details: 'Both AI and fallback generation returned empty results'
        });
      }

      // Clear existing options if requested
      if (replaceExisting) {
        await optionsCol.deleteMany({ listTypeId: new ObjectId(listTypeId) });
      }
      
      // Insert generated options
      const optionsToInsert = generatedOptions.map((opt, index) => ({
        listTypeId: new ObjectId(listTypeId),
        label: opt.label || `Option ${index + 1}`,
        value: opt.value || `option_${index + 1}`,
        description: opt.description || '',
        sortOrder: index,
        isActive: true,
        metadata: { generatedByAI: true },
        createdBy: request.user._id,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      const result = await optionsCol.insertMany(optionsToInsert);
      
      return reply.send({
        success: true,
        generated: result.insertedCount,
        options: optionsToInsert
      });
      
    } catch (error) {
      fastify.log.error('Error in AI generation:', {
        error: error.message,
        stack: error.stack,
        listTypeId: request.params.listTypeId
      });
      return reply.code(500).send({ 
        error: 'Failed to generate options',
        details: error.message 
      });
    }
  });

  // Test endpoint for AI generation (fallback only)
  fastify.post('/reference-data/test-generate/:listTypeId', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const listTypesCol = db.collection('referenceListTypes');
      
      const { listTypeId } = request.params;
      const { count = 5 } = request.body;
      
      // Get list type info
      const listType = await listTypesCol.findOne({ _id: new ObjectId(listTypeId) });
      if (!listType) {
        return reply.code(404).send({ error: 'List type not found' });
      }
      
      // Load AI configuration and test fallback generation only
      const { generateIntelligentFallback, loadAIConfig } = require('../core/AIService');
      const path = require('path');
      const configPath = path.join(__dirname, '../../public/data/ai-config/reference-data-generation.json');
      const aiConfig = loadAIConfig(configPath);
      
      const fallbackContext = {
        listType,
        count
      };
      
      const fallbackResponse = generateIntelligentFallback(aiConfig.fallbackGeneration, fallbackContext);
      const parsed = JSON.parse(fallbackResponse);
      const generatedOptions = parsed.options || [];
      
      return reply.send({
        success: true,
        listType: listType.displayName,
        generated: generatedOptions.length,
        options: generatedOptions,
        method: 'fallback'
      });
      
    } catch (error) {
      fastify.log.error('Error in test generation:', error);
      return reply.code(500).send({ 
        error: 'Failed to test generate options',
        details: error.message 
      });
    }
  });

     // ===================== SEED DATA =====================
   
   // Create initial seed data for common list types
   fastify.post('/reference-data/seed', { preHandler: requireAuth }, async (request, reply) => {
     try {
       const db = mongoose.connection;
       const listTypesCol = db.collection('referenceListTypes');
       const optionsCol = db.collection('referenceListOptions');
       
       // Check if seed data already exists
       const existingCount = await listTypesCol.countDocuments();
       if (existingCount > 0) {
         return reply.send({ message: 'Seed data already exists', count: existingCount });
       }
       
       // Common list types to create
       const seedListTypes = [
         {
           name: 'user_status',
           displayName: 'User Status',
           description: 'Status options for user accounts',
           category: 'user',
           sortBy: 'label',
           allowCustom: false
         },
         {
           name: 'tenant_status',
           displayName: 'Tenant Status',
           description: 'Status options for tenant accounts',
           category: 'system',
           sortBy: 'label',
           allowCustom: false
         },
         {
           name: 'subscription_plan',
           displayName: 'Subscription Plan',
           description: 'Available subscription plans',
           category: 'business',
           sortBy: 'order',
           allowCustom: false
         },
         {
           name: 'priority_level',
           displayName: 'Priority Level',
           description: 'Priority levels for tasks and issues',
           category: 'workflow',
           sortBy: 'order',
           allowCustom: false
         },
         {
           name: 'department',
           displayName: 'Department',
           description: 'Organizational departments',
           category: 'user',
           sortBy: 'label',
           allowCustom: true
         },
         {
           name: 'module_status',
           displayName: 'Module Status',
           description: 'Status options for B2B SaaS modules',
           category: 'system',
           sortBy: 'order',
           allowCustom: false
         },
         {
           name: 'module_category',
           displayName: 'Module Category',
           description: 'Categories for organizing B2B SaaS modules',
           category: 'system',
           sortBy: 'label',
           allowCustom: false
         }
       ];
       
       // Insert list types
       const listTypeResults = [];
       for (const listTypeData of seedListTypes) {
         const listType = {
           ...listTypeData,
           createdBy: request.user._id,
           createdAt: new Date(),
           updatedAt: new Date()
         };
         
         const result = await listTypesCol.insertOne(listType);
         listTypeResults.push({ ...listType, _id: result.insertedId });
       }
       
       // Create options for each list type using intelligent fallback
       const { generateIntelligentFallback } = require('../core/AIService');
       let totalOptionsCreated = 0;
       
       for (const listType of listTypeResults) {
         try {
           const fallbackResponse = generateIntelligentFallback(listType, 8);
           const parsed = JSON.parse(fallbackResponse);
           const generatedOptions = parsed.options || [];
           
           if (generatedOptions.length > 0) {
             const optionsToInsert = generatedOptions.map((opt, index) => ({
               listTypeId: listType._id,
               label: opt.label,
               value: opt.value,
               description: opt.description || '',
               sortOrder: index,
               isActive: true,
               metadata: { seedData: true },
               createdBy: request.user._id,
               createdAt: new Date(),
               updatedAt: new Date()
             }));
             
             await optionsCol.insertMany(optionsToInsert);
             totalOptionsCreated += optionsToInsert.length;
           }
         } catch (error) {
           fastify.log.error(`Failed to generate options for ${listType.name}:`, error);
         }
       }
       
       return reply.send({
         success: true,
         message: 'Seed data created successfully',
         listTypesCreated: listTypeResults.length,
         optionsCreated: totalOptionsCreated,
         listTypes: listTypeResults.map(lt => ({ name: lt.name, displayName: lt.displayName }))
       });
       
     } catch (error) {
       fastify.log.error('Error creating seed data:', error);
       return reply.code(500).send({ error: 'Failed to create seed data' });
     }
   });

   // ===================== GENERIC OPTIONS API =====================
   
   // Generic endpoint for getting options by list type name (for forms)
  fastify.get('/reference-data/options-by-type/:listTypeName', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const listTypesCol = db.collection('referenceListTypes');
      const optionsCol = db.collection('referenceListOptions');
      
      const { listTypeName } = request.params;
      const { format } = request.query;
      
      // Find list type by name
      const listType = await listTypesCol.findOne({ name: listTypeName.toLowerCase() });
      if (!listType) {
        return reply.code(404).send({ error: 'List type not found' });
      }
      
      // Get options
      let sort = {};
      switch (listType.sortBy) {
        case 'value':
          sort = { value: 1 };
          break;
        case 'order':
          sort = { sortOrder: 1, label: 1 };
          break;
        default:
          sort = { label: 1 };
      }
      
      const options = await optionsCol.find({ 
        listTypeId: listType._id,
        isActive: true
      }).sort(sort).toArray();
      
      // Return format for dropdowns (default)
      const formattedOptions = options.map(opt => ({
        value: opt.value,
        label: opt.label,
        key: opt.value
      }));
      
      return reply.send(formattedOptions);
    } catch (error) {
      fastify.log.error('Error fetching options by type:', error);
      return reply.code(500).send({ error: 'Failed to fetch options' });
    }
  });
}

module.exports = registerReferenceDataRoutes;
