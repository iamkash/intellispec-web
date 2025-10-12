/**
 * Tenant-Scoped Data Routes
 * 
 * Example routes showing how tenant admins access their data
 * while Super Admin can access all tenant data.
 * 
 * Uses tenant-scope middleware to enforce access control.
 */

const { enforceTenantScope, applyTenantFilter, requireTenantAdmin } = require('../middleware/tenant-scope');
const AuditTrail = require('../core/AuditTrail');
const DocumentModel = require('../models/Document');

/**
 * Register tenant-scoped data routes
 */
async function registerTenantDataRoutes(fastify, options) {

  /**
   * GET /api/tenant-scoped/documents
   * Get documents - automatically filtered by tenant
   * 
   * Behavior:
   * - Super Admin: Returns all documents from all tenants
   * - Tenant Admin: Returns only documents from their tenant(s)
   */
  fastify.get('/documents', { preHandler: enforceTenantScope() }, async (request, reply) => {
    try {
      const page = parseInt(request.query.page) || 1;
      const limit = parseInt(request.query.limit) || 50;
      const skip = (page - 1) * limit;

      // Build base query
      let query = {
        deleted: { $ne: true }
      };

      // Apply tenant filter (automatically restricts to user's tenants)
      query = applyTenantFilter(query, request);

      // Add any additional filters from query params
      if (request.query.type) {
        query.type = request.query.type;
      }

      // Fetch documents
      const [documents, total] = await Promise.all([
        DocumentModel.find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        DocumentModel.countDocuments(query)
      ]);

      return reply.send({
        success: true,
        data: documents,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        meta: {
          tenantScoped: request.tenantScoped,
          allowedTenants: request.allowedTenants === 'all' ? 'all' : request.allowedTenants.length
        }
      });

    } catch (error) {
      fastify.log.error('Error fetching documents:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch documents'
      });
    }
  });

  /**
   * GET /api/tenant-data/documents/:id
   * Get specific document - validates tenant access
   */
  fastify.get('/documents/:id', { preHandler: enforceTenantScope() }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Build query
      let query = { id };

      // Apply tenant filter
      query = applyTenantFilter(query, request);

      const document = await DocumentModel.findOne(query).lean();

      if (!document) {
        return reply.code(404).send({
          success: false,
          error: 'Document not found or access denied'
        });
      }

      return reply.send({
        success: true,
        data: document
      });

    } catch (error) {
      fastify.log.error('Error fetching document:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch document'
      });
    }
  });

  /**
   * POST /api/tenant-data/documents
   * Create document in tenant
   * Requires tenant admin role
   */
  fastify.post('/documents', { preHandler: [enforceTenantScope(), requireTenantAdmin] }, async (request, reply) => {
    try {
      const { tenantId, type, title, data } = request.body;

      // Validate tenant access (already checked by middleware)
      if (!tenantId) {
        return reply.code(400).send({
          success: false,
          error: 'Tenant ID is required'
        });
      }

      // Create document
      const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const document = await DocumentModel.create({
        id: documentId,
        tenantId,
        type,
        title,
        data,
        createdAt: new Date(),
        createdBy: request.user?.id || 'unknown'
      });

      // Log to audit trail
      const context = {
        userId: request.user?.id || 'unknown',
        tenantId: tenantId,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logCreate(context, 'document', documentId, document, { type });

      return reply.code(201).send({
        success: true,
        data: document
      });

    } catch (error) {
      fastify.log.error('Error creating document:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to create document'
      });
    }
  });

  /**
   * PUT /api/tenant-data/documents/:id
   * Update document - validates tenant access
   */
  fastify.put('/documents/:id', { preHandler: [enforceTenantScope(), requireTenantAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      // Build query with tenant filter
      let query = { id };
      query = applyTenantFilter(query, request);

      // Get current document
      const current = await DocumentModel.findOne(query);

      if (!current) {
        return reply.code(404).send({
          success: false,
          error: 'Document not found or access denied'
        });
      }

      // Update document
      const updated = await DocumentModel.findOneAndUpdate(
        query,
        {
          ...updates,
          updatedAt: new Date()
        },
        { new: true }
      );

      // Log to audit trail
      const context = {
        userId: request.user?.id || 'unknown',
        tenantId: current.tenantId,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logUpdate(context, 'document', id, current.toObject(), updated.toObject());

      return reply.send({
        success: true,
        data: updated
      });

    } catch (error) {
      fastify.log.error('Error updating document:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to update document'
      });
    }
  });

  /**
   * DELETE /api/tenant-data/documents/:id
   * Delete document - validates tenant access
   */
  fastify.delete('/documents/:id', { preHandler: [enforceTenantScope(), requireTenantAdmin] }, async (request, reply) => {
    try {
      const { id } = request.params;

      // Build query with tenant filter
      let query = { id };
      query = applyTenantFilter(query, request);

      // Get current document
      const current = await DocumentModel.findOne(query);

      if (!current) {
        return reply.code(404).send({
          success: false,
          error: 'Document not found or access denied'
        });
      }

      // Soft delete
      await DocumentModel.findOneAndUpdate(
        query,
        {
          deleted: true,
          deletedAt: new Date(),
          deletedBy: request.user?.id || 'unknown'
        }
      );

      // Log to audit trail
      const context = {
        userId: request.user?.id || 'unknown',
        tenantId: current.tenantId,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.headers['user-agent']
      };
      await AuditTrail.logDelete(context, 'document', id, current.toObject());

      return reply.send({
        success: true,
        message: 'Document deleted successfully'
      });

    } catch (error) {
      fastify.log.error('Error deleting document:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to delete document'
      });
    }
  });

  /**
   * GET /api/tenant-data/stats
   * Get tenant statistics
   * Returns stats for user's tenant(s) only
   */
  fastify.get('/stats', { preHandler: enforceTenantScope() }, async (request, reply) => {
    try {
      // Build base query with tenant filter
      let query = {
        deleted: { $ne: true }
      };
      query = applyTenantFilter(query, request);

      // Get statistics
      const [
        totalDocuments,
        documentsByType,
        recentDocuments
      ] = await Promise.all([
        DocumentModel.countDocuments(query),
        
        DocumentModel.aggregate([
          { $match: query },
          { $group: { _id: '$type', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]),
        
        DocumentModel.find(query)
          .sort({ createdAt: -1 })
          .limit(5)
          .lean()
      ]);

      return reply.send({
        success: true,
        stats: {
          totalDocuments,
          documentsByType: documentsByType.map(d => ({
            type: d._id,
            count: d.count
          })),
          recentDocuments
        },
        meta: {
          tenantScoped: request.tenantScoped,
          tenantCount: request.allowedTenants === 'all' ? 'all' : request.allowedTenants.length
        }
      });

    } catch (error) {
      fastify.log.error('Error fetching stats:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to fetch statistics'
      });
    }
  });
}

module.exports = registerTenantDataRoutes;

