/**
 * Hierarchy Search API
 * 
 * Cross-hierarchy search endpoint for finding documents across
 * company → site → asset group → asset hierarchy with automatic
 * parent path resolution for tree expansion.
 */

const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');
const DocumentRepository = require('../repositories/DocumentRepository');
const TenantContextFactory = require('../core/TenantContextFactory');
const { ValidationError } = require('../core/ErrorHandler');

async function registerHierarchySearchRoutes(fastify) {
  /**
   * Search across hierarchy
   * GET /api/search/hierarchy?q=<query>&types=company,site,asset_group,asset
   * 
   * Returns matched documents with their parent path for tree expansion
   */
  fastify.get('/search/hierarchy', { preHandler: requireAuth }, async (request, reply) => {
    const { q: query, types } = request.query;

    if (!query || query.trim().length === 0) {
      throw new ValidationError('Search query is required', { field: 'q' });
    }

    const tenantContext = TenantContextFactory.fromRequest(request);
    const searchTypes = types ? types.split(',') : ['company', 'site', 'asset_group', 'asset'];

    logger.info('Searching hierarchy', {
      query,
      types: searchTypes,
      tenantId: tenantContext.tenantId
    });

    try {
      // ✅ Search across all specified types
      const results = [];

      for (const docType of searchTypes) {
        const repository = new DocumentRepository(tenantContext, docType, request.context);

        // ✅ Search by name, code, or tags (case-insensitive)
        const matches = await repository.find({
          $or: [
            { name: { $regex: query, $options: 'i' } },
            { code: { $regex: query, $options: 'i' } },
            { tags: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
          ]
        });

        // ✅ For each match, build the parent path for tree expansion
        for (const match of matches) {
          const path = await buildParentPath(match, tenantContext, request.context);
          
          results.push({
            ...match,
            nodeType: docType,
            path // Array of parent IDs: [companyId, siteId, groupId] (depending on level)
          });
        }
      }

      logger.info('Hierarchy search complete', {
        query,
        resultsCount: results.length
      });

      return reply.send({
        success: true,
        query,
        results,
        count: results.length
      });

    } catch (error) {
      logger.error('Hierarchy search failed', {
        error: error.message,
        query,
        types: searchTypes
      });
      throw error;
    }
  });
}

/**
 * Build parent path for a document
 * Returns array of parent IDs from root to this document
 * 
 * @param {Object} doc - The document
 * @param {Object} tenantContext - Tenant context
 * @param {Object} requestContext - Request context
 * @returns {Promise<string[]>} Array of parent IDs
 */
async function buildParentPath(doc, tenantContext, requestContext) {
  const path = [];

  try {
    // ✅ Asset: company_id → site_id → asset_group_id
    if (doc.type === 'asset') {
      if (doc.asset_group_id) {
        const groupRepo = new DocumentRepository(tenantContext, 'asset_group', requestContext);
        const group = await groupRepo.findById(doc.asset_group_id);
        if (group) {
          if (group.site_id) {
            const siteRepo = new DocumentRepository(tenantContext, 'site', requestContext);
            const site = await siteRepo.findById(group.site_id);
            if (site) {
              if (site.company_id) {
                path.push(site.company_id);
              }
              path.push(group.site_id);
            }
          }
          path.push(doc.asset_group_id);
        }
      }
    }
    // ✅ Asset Group: company_id → site_id
    else if (doc.type === 'asset_group') {
      if (doc.site_id) {
        const siteRepo = new DocumentRepository(tenantContext, 'site', requestContext);
        const site = await siteRepo.findById(doc.site_id);
        if (site) {
          if (site.company_id) {
            path.push(site.company_id);
          }
          path.push(doc.site_id);
        }
      }
    }
    // ✅ Site: company_id
    else if (doc.type === 'site') {
      if (doc.company_id) {
        path.push(doc.company_id);
      }
    }
    // ✅ Company: no parent

  } catch (error) {
    logger.warn('Failed to build parent path', {
      docId: doc.id,
      docType: doc.type,
      error: error.message
    });
  }

  return path;
}

module.exports = registerHierarchySearchRoutes;
