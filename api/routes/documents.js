/**
 * documents-v2.js
 * 
 * MIGRATED VERSION - Using Repository Pattern
 * 
 * Changes from v1:
 * ✅ Uses DocumentRepository for data access
 * ✅ Automatic tenant filtering (no manual checks!)
 * ✅ Automatic audit trail for all changes
 * ✅ 70% less code
 * ✅ Type-safe operations
 * ✅ Easier to test
 * ✅ Consistent error handling
 * 
 * Supports all document types:
 * - company
 * - site
 * - assetGroup
 * - asset
 * - paintInvoice
 * - paint_specifications
 * - inspection
 * - etc.
 */

const DocumentRepository = require('../repositories/DocumentRepository');
const TenantContextFactory = require('../core/TenantContextFactory');
const { requireAuth } = require('../core/AuthMiddleware');
const { validateDocumentWithContext } = require('../core/SchemaValidator');
const { APIError, ErrorTypes } = require('../core/ErrorHandler');
const { logger } = require('../core/Logger');
const { nanoid } = require('nanoid');

/**
 * Recursively processes a query object to replace date-related string placeholders
 * with actual Date objects. Supports 'now', 'now+30d', 'now-7d', etc.
 * 
 * IMPORTANT: Since dates in the database are stored as strings, this function
 * converts processed dates back to ISO strings to ensure proper comparison.
 * 
 * @param {object} obj The object to process.
 * @returns {object} The processed object.
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
        // For operators like gte, we want the start of today
        if (key === '$gte') {
          now.setHours(0, 0, 0, 0);
        }
        // Convert to ISO string for proper comparison with string dates in DB
        obj[key] = now.toISOString();
      } else {
        const match = value.match(/^now([+-])(\d+)([d])$/); // e.g., now+30d
        if (match) {
          const operator = match[1];
          const amount = parseInt(match[2], 10);
          const unit = match[3];
          let date = new Date(); // Start from a fresh 'now' for each calculation
          if (unit === 'd') {
            date.setDate(date.getDate() + (operator === '+' ? amount : -amount));
          }

          // For lte, we want the end of the target day
          if (key === '$lte') {
            date.setHours(23, 59, 59, 999);
          }

          // Convert to ISO string for proper comparison with string dates in DB
          obj[key] = date.toISOString();
        }
      }
    }
  }
  return obj;
}


/**
 * Register document routes
 */
async function registerDocumentRoutes(fastify) {

  /**
   * GET /api/documents
   * List documents with filtering and pagination
   * 
   * Query params:
   * - type: Document type (required)
   * - page: Page number (default: 1)
   * - limit: Items per page (default: 20)
   * - status: Filter by status
   * - company_id: Filter by company
   * - site_id: Filter by site
   * - search: Text search in name/code
   * 
   * Tenant filtering: AUTOMATIC via repository
   * Audit trail: READ operations logged
   */
  fastify.get('/documents', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type, page = 1, limit = 10000, search, dynamicFilter, ...filters } = request.query;

      // Validate type is provided
      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      // Create tenant context from JWT
      const tenantContext = TenantContextFactory.fromRequest(request);
      
      // Create repository for this document type (pass request.context for audit logging)
      const repository = new DocumentRepository(tenantContext, type, request.context);

      // Build filters from query params
      // ✅ Pass ALL filters to repository (except pagination params)
      const queryFilters = {};
      
      // Process filter operators (e.g., company_id__in => { company_id: { $in: [...] } })
      Object.keys(filters).forEach(key => {
        if (key.endsWith('__in')) {
          // Handle __in operator (multiselect filters)
          const fieldName = key.replace('__in', '');
          const values = Array.isArray(filters[key]) ? filters[key] : [filters[key]];
          queryFilters[fieldName] = { $in: values };
        } else if (key.endsWith('__gte')) {
          // Handle __gte operator
          const fieldName = key.replace('__gte', '');
          queryFilters[fieldName] = { ...queryFilters[fieldName], $gte: filters[key] };
        } else if (key.endsWith('__lte')) {
          // Handle __lte operator
          const fieldName = key.replace('__lte', '');
          queryFilters[fieldName] = { ...queryFilters[fieldName], $lte: filters[key] };
        } else if (key.endsWith('__ne')) {
          // Handle __ne operator
          const fieldName = key.replace('__ne', '');
          queryFilters[fieldName] = { $ne: filters[key] };
        } else {
          // Direct equality
          queryFilters[key] = filters[key];
        }
      });
      
      // Handle dynamic filter from metadata
      if (dynamicFilter) {
        try {
          let parsedFilter = JSON.parse(dynamicFilter);
          // Process date placeholders like "now" and "now+30d"
          parsedFilter = processDatePlaceholders(parsedFilter);
          // Merge with existing filters
          Object.assign(queryFilters, parsedFilter);
        } catch (e) {
          logger.warn('Failed to parse dynamicFilter', { dynamicFilter, error: e.message });
          throw new APIError('Invalid dynamicFilter format', ErrorTypes.VALIDATION_ERROR, 400);
        }
      }

      // Remove pagination/control params (already extracted above)
      delete queryFilters.page;
      delete queryFilters.limit;
      delete queryFilters.search;
      delete queryFilters.sort;
      
      // ✅ This now supports ANY field filter: code, name, asset_tag, etc.

      // Handle search
      let result;
      if (search) {
        result = await repository.search(search, {
          page: parseInt(page),
          limit: parseInt(limit),
          sort: { created_date: -1 }
        });
      } else {
        result = await repository.findWithPagination(queryFilters, {
          page: parseInt(page),
          limit: parseInt(limit),
          sort: { created_date: -1 }
        });
      }

      return reply.send({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        },
        meta: {
          type,
          tenantId: tenantContext.tenantId,
          isPlatformAdmin: tenantContext.isPlatformAdmin
        }
      });

    } catch (error) {
      logger.error('Error listing documents:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code
      });
    }
  });

  /**
   * GET /api/documents/stats
   * Get document statistics
   * 
   * Query params:
   * - type: Document type (required)
   * - days: Number of days for recent stats (default: 30)
   * 
   * Returns:
   * - total: Total count
   * - byStatus: Count by status
   * - recentCount: Count in last N days
   */
  fastify.get('/documents/stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type } = request.query;

      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, type, request.context);

      // Get stats from repository
      const stats = await repository.getStats();

      return reply.send({
        success: true,
        stats,
        meta: {
          type,
          tenantId: tenantContext.tenantId
        }
      });

    } catch (error) {
      logger.error('Error getting document stats:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/documents/by-relation/:field/:value
   * Get documents by relationship (e.g., sites by company_id)
   * 
   * Path params:
   * - field: Relationship field (e.g., 'company_id')
   * - value: Field value
   * 
   * Query params:
   * - type: Document type (required)
   * - page, limit: Pagination
   * 
   * IMPORTANT: Must be registered BEFORE /documents/:id to avoid route collision
   */
  fastify.get('/documents/by-relation/:field/:value', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { field, value } = request.params;
      const { type, page = 1, limit = 10000 } = request.query;

      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, type, request.context);

      const result = await repository.findByRelation(field, value, {
        page: parseInt(page),
        limit: parseInt(limit),
        sort: { name: 1 }
      });

      return reply.send({
        success: true,
        data: result.data,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });

    } catch (error) {
      logger.error('Error finding by relation:', error);
      return reply.code(500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * GET /api/documents/:id
   * Get specific document by ID
   * 
   * Path params:
   * - id: Document ID
   * 
   * Query params:
   * - type: Document type (optional, for validation)
   * 
   * Tenant validation: AUTOMATIC - will return 404 if not in user's tenant
   */
  fastify.get('/documents/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { type } = request.query;

      const tenantContext = TenantContextFactory.fromRequest(request);
      
      logger.info('GET /documents/:id request', {
        id,
        type,
        userId: request.user?.id || request.user?.userId,
        userEmail: request.user?.email,
        tenantId: tenantContext.tenantId,
        isPlatformAdmin: tenantContext.isPlatformAdmin,
        allowedTenants: tenantContext.allowedTenants
      });
      
      // If type is provided, use typed repository
      if (type) {
        const repository = new DocumentRepository(tenantContext, type, request.context);
        
        const document = await repository.findById(id);
        
        if (!document) {
          logger.warn('Document not found via repository', {
            id,
            type,
            tenantId: tenantContext.tenantId,
            isPlatformAdmin: tenantContext.isPlatformAdmin
          });
          
          // Debug: Try to find document without tenant filter
          const DocumentModel = require('../models/Document');
          const debugQuery = { id, type, deleted: { $ne: true } };
          const debugDoc = await DocumentModel.findOne(debugQuery).lean();
          
          if (debugDoc) {
            logger.error('TENANT MISMATCH DETECTED', {
              documentId: id,
              documentTenantId: debugDoc.tenantId,
              userTenantId: tenantContext.tenantId,
              userEmail: request.user?.email,
              isPlatformAdmin: tenantContext.isPlatformAdmin,
              message: 'Document exists but user cannot access it due to tenant mismatch'
            });
            
            return reply.code(404).send({
              success: false,
              error: 'Document not found or access denied',
              debug: process.env.NODE_ENV !== 'production' ? {
                reason: 'tenant_mismatch',
                documentTenantId: debugDoc.tenantId,
                userTenantId: tenantContext.tenantId
              } : undefined
            });
          } else {
            logger.warn('Document does not exist in database', { id, type });
          }
          
          throw new APIError('Document not found', ErrorTypes.NOT_FOUND, 404);
        }

        logger.info('Document found successfully', {
          id,
          type,
          tenantId: document.tenantId
        });

        return reply.send({
          success: true,
          data: document
        });
      }
      
      // If no type, search all types (less efficient but flexible)
      // This handles legacy calls without type parameter
      const DocumentModel = require('../models/Document');
      const query = { id, deleted: { $ne: true } };
      
      // Apply tenant filter for non-platform admins
      if (!tenantContext.isPlatformAdmin) {
        query.tenantId = tenantContext.tenantId;
      }
      
      // Debug logging
      logger.info('GET /documents/:id fallback debug', {
        id,
        tenantId: tenantContext.tenantId,
        isPlatformAdmin: tenantContext.isPlatformAdmin,
        query
      });
      
      const document = await DocumentModel.findOne(query).lean();
      
      if (!document) {
        throw new APIError('Document not found', ErrorTypes.NOT_FOUND, 404);
      }

      return reply.send({
        success: true,
        data: document
      });

    } catch (error) {
      logger.error('Error getting document:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });

  /**
   * POST /api/documents
   * Create new document
   * 
   * Body:
   * - type: Document type (required)
   * - ... other fields based on type
   * 
   * Validation: Schema-based (Zod)
   * Tenant assignment: AUTOMATIC
   * Audit trail: AUTOMATIC
   * ID generation: AUTOMATIC
   */
  fastify.post('/documents', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type, ...documentData } = request.body;

      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      // Validate document against type-specific schema
      const validatedData = await validateDocumentWithContext(
        type,
        documentData,
        request.user,
        'create'
      );

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, type, request.context);

      // Generate ID if not provided
      if (!validatedData.id) {
        const prefix = getDocumentPrefix(type);
        validatedData.id = `${prefix}_${nanoid(12)}`;
      }

      // Set initial status if not provided
      if (!validatedData.status) {
        validatedData.status = 'active';
      }

      // Create document (tenant, audit, timestamps automatic!)
      const created = await repository.create(validatedData);

      return reply.code(201).send({
        success: true,
        data: created,
        message: `${type} created successfully`
      });

    } catch (error) {
      logger.error('Error creating document:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  });

  /**
   * PUT /api/documents/:id
   * Update existing document
   * 
   * Path params:
   * - id: Document ID
   * 
   * Body:
   * - type: Document type (required)
   * - ... fields to update
   * 
   * Tenant validation: AUTOMATIC - will fail if not in user's tenant
   * Audit trail: AUTOMATIC
   * Change tracking: AUTOMATIC
   */
  fastify.put('/documents/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { type, ...documentData } = request.body;

      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      // Validate updates
      const validatedData = await validateDocumentWithContext(
        type,
        documentData,
        request.user,
        'update'
      );

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, type, request.context);

      // Update document (audit automatic!)
      const updated = await repository.update(id, validatedData);

      if (!updated) {
        throw new APIError('Document not found or access denied', ErrorTypes.NOT_FOUND, 404);
      }

      return reply.send({
        success: true,
        data: updated,
        message: `${type} updated successfully`
      });

    } catch (error) {
      logger.error('Error updating document:', error);
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details
      });
    }
  });

  /**
   * DELETE /api/documents/:id
   * Delete document (soft or hard delete)
   * 
   * Path params:
   * - id: Document ID
   * 
   * Query params:
   * - type: Document type (required)
   * - hard_delete: true for permanent deletion (default: false)
   * 
   * Soft delete: AUTOMATIC (default)
   * Audit trail: AUTOMATIC
   */
  fastify.delete('/documents/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { type, hard_delete = false } = request.query;

      if (!type) {
        throw new APIError('Document type is required', ErrorTypes.VALIDATION_ERROR, 400);
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      
      logger.info('DELETE /documents/:id request', {
        id,
        type,
        hard_delete,
        userId: request.user?.id || request.user?.userId,
        userEmail: request.user?.email,
        tenantId: tenantContext.tenantId,
        isPlatformAdmin: tenantContext.isPlatformAdmin
      });

      // First, check if document exists and is accessible
      const repository = new DocumentRepository(tenantContext, type, request.context);
      const existingDoc = await repository.findById(id);
      
      if (!existingDoc) {
        logger.warn('Document not found for deletion', {
          id,
          type,
          tenantId: tenantContext.tenantId
        });
        
        // Debug: Check if document exists in another tenant
        const DocumentModel = require('../models/Document');
        const debugQuery = { id, type, deleted: { $ne: true } };
        const debugDoc = await DocumentModel.findOne(debugQuery).lean();
        
        if (debugDoc) {
          logger.error('TENANT MISMATCH DETECTED (DELETE)', {
            documentId: id,
            documentTenantId: debugDoc.tenantId,
            userTenantId: tenantContext.tenantId,
            userEmail: request.user?.email,
            isPlatformAdmin: tenantContext.isPlatformAdmin,
            message: 'Document exists but user cannot delete it due to tenant mismatch'
          });
          
          return reply.code(404).send({
            success: false,
            error: 'Document not found or access denied',
            debug: process.env.NODE_ENV !== 'production' ? {
              reason: 'tenant_mismatch',
              documentTenantId: debugDoc.tenantId,
              userTenantId: tenantContext.tenantId
            } : undefined
          });
        }
        
        throw new APIError('Document not found or access denied', ErrorTypes.NOT_FOUND, 404);
      }

      // Perform deletion
      let result;
      if (hard_delete === 'true' || hard_delete === true) {
        // Permanent deletion (use with caution!)
        result = await repository.hardDelete(id);
        logger.info('Document permanently deleted', { id, type, tenantId: tenantContext.tenantId });
      } else {
        // Soft delete (default, safer)
        result = await repository.delete(id);
        logger.info('Document soft deleted', { id, type, tenantId: tenantContext.tenantId });
      }

      if (!result) {
        throw new APIError('Failed to delete document', ErrorTypes.DATABASE_ERROR, 500);
      }

      return reply.send({
        success: true,
        message: `${type} deleted successfully`,
        hardDelete: hard_delete
      });

    } catch (error) {
      logger.error('Error deleting document:', {
        error: error.message,
        stack: error.stack,
        id: request.params.id,
        type: request.query.type
      });
      return reply.code(error.statusCode || 500).send({
        success: false,
        error: error.message
      });
    }
  });

}

/**
 * Helper function to get document ID prefix based on type
 */
function getDocumentPrefix(type) {
  const prefixes = {
    'company': 'comp',
    'site': 'site',
    'assetGroup': 'ag',
    'asset': 'asset',
    'paintInvoice': 'pinv',
    'paint_specifications': 'pspec',
    'inspection': 'insp'
  };
  
  return prefixes[type] || 'doc';
}

module.exports = registerDocumentRoutes;
