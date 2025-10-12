const mongoose = require('mongoose');
const { addTenantFilter, validateResultsTenant } = require('../middleware/tenant-security');
const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');

/**
 * Generic options API routes for dropdowns and filters
 * Provides dynamic options based on document types and fields
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 */

async function registerOptionsRoutes(fastify) {
  
  // GET /api/options/companies - Get all companies for dropdown
  fastify.get('/options/companies', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';
// Get companies from documents collection
      const companies = await collection.find({
        tenantId: tenantId,
        type: 'company'
      }).project({
        _id: 1,
        id: 1,
        name: 1,
        code: 1
      }).toArray();

      // Format for dropdown options
      const options = companies.map(company => ({
        value: company.id || company._id.toString(),
        label: company.name,
        code: company.code
      }));

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching companies:', error);
      return reply.code(500).send({
        error: 'Failed to fetch companies',
        details: error.message
      });
    }
  });

  // GET /api/options/sites - Get all sites for dropdown
  fastify.get('/options/sites', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';
// Build query with optional company filtering
      const query = {
        tenantId: tenantId,
        type: 'site'
      };

      // Filter by company if company_id is provided
      const { company_id } = request.query;
      if (company_id) {
        // Handle both single company and multiple companies
        if (Array.isArray(company_id)) {
          query.company_id = { $in: company_id };
        } else {
          query.company_id = company_id;
        }
}

      // Get sites from documents collection
      const sites = await collection.find(query).project({
        _id: 1,
        id: 1,
        name: 1,
        code: 1,
        companyId: 1
      }).toArray();

      // Format for dropdown options
      const options = sites.map(site => ({
        value: site.id || site._id.toString(),
        label: site.name,
        code: site.code,
        companyId: site.companyId
      }));

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching sites:', error);
      return reply.code(500).send({
        error: 'Failed to fetch sites',
        details: error.message
      });
    }
  });

  // GET /api/options/paint-specs - Get all paint specifications for dropdown
  fastify.get('/options/paint-specs', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';
// Get paint specs from documents collection
      const paintSpecs = await collection.find({
        tenantId: tenantId,
        $or: [
          { type: 'paint_spec' },
          { type: 'paint_specification' },
          { type: 'paint_specifications' }
        ]
      }).project({
        _id: 1,
        id: 1,
        name: 1,
        product_code: 1,
        productCode: 1,
        voc_g_L: 1,
        vocContent: 1
      }).toArray();

      // Format for dropdown options
      const options = paintSpecs.map(spec => ({
        value: spec.id || spec._id.toString(),
        label: spec.name,
        code: spec.product_code || spec.productCode,
        vocContent: spec.voc_g_L || spec.vocContent
      }));

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching paint specifications:', error);
      return reply.code(500).send({
        error: 'Failed to fetch paint specifications',
        details: error.message
      });
    }
  });

  // GET /api/options/asset-types - Get unique asset types from assets
  fastify.get('/options/asset-types', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { site_id } = request.query;
      
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';

      // Build filter for assets
      const filter = {
        tenantId: tenantId,
        type: 'asset',
        asset_type: { $exists: true, $ne: null }
      };

      // Filter by site if provided
      if (site_id) {
        const siteIds = Array.isArray(site_id) ? site_id : [site_id];
        filter.site_id = Array.isArray(site_id) ? { $in: siteIds } : site_id;
      }

      // Get distinct asset types
      const assetTypes = await collection.distinct('asset_type', filter);

      // Format for dropdown options
      const options = assetTypes
        .filter(type => type) // Remove null/empty values
        .sort()
        .map(type => ({
          value: type,
          label: type
        }));

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching asset types:', error);
      return reply.code(500).send({
        error: 'Failed to fetch asset types',
        details: error.message
      });
    }
  });

  // GET /api/options/asset-groups - Get asset groups filtered by facility
  fastify.get('/options/asset-groups', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { site_id, facility_id } = request.query;
      const siteIdValue = site_id || facility_id; // Handle both parameter names
      
      logger.debug('Asset Groups API request', {
        queryParams: { site_id, facility_id, siteIdValue },
        user: { 
          tenantId: request.user.tenantId,
          userId: request.user.userId,
          email: request.user.email 
        }
      });
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';

      // Build filter for asset groups with enhanced tenant security
      const baseFilter = {
        type: 'asset_group'
      };
      const filter = addTenantFilter(baseFilter, tenantId);

      // Only filter if site_id is provided - don't return all asset groups by default
      if (!siteIdValue) {
        logger.debug('No site_id provided, returning empty asset groups');
        return reply.send({
          success: true,
          data: [],
          count: 0,
          message: 'Please select a facility first'
        });
      }

      // Handle both single value and array (multiselect)
      const siteIds = Array.isArray(siteIdValue) ? siteIdValue : [siteIdValue];
      
      logger.debug('Filtering asset groups', {
        siteIds,
        tenantId
      });
      
      // Asset groups use site_id field to reference their parent site
      filter.site_id = Array.isArray(siteIdValue) ? { $in: siteIds } : siteIdValue;

      const assetGroups = await collection.find(filter).project({
        _id: 1,
        id: 1,
        name: 1,
        facility_id: 1,
        site_id: 1,
        siteId: 1,
        facilityId: 1,
        parent_id: 1,
        parentId: 1
      }).toArray();

      logger.debug('Asset groups retrieved', {
        count: assetGroups.length,
        filter,
        sample: assetGroups[0]
      });
      
      // Validate tenant security
      if (!validateResultsTenant(assetGroups, tenantId)) {
        return reply.code(403).send({ error: 'Tenant security violation detected' });
      }

      // Format for dropdown options
      const options = assetGroups.map(group => {
        // Add distinguishing info if there are duplicates
        const hasDuplicates = assetGroups.filter(g => g.name === group.name).length > 1;
        const label = hasDuplicates 
          ? `${group.name} (${group.code || group.id?.slice(-6) || 'ID: ' + group._id.toString().slice(-6)})`
          : group.name;
          
        return {
          value: group.id || group._id.toString(),
          label: label,
          facility_id: group.facility_id,
          site_id: group.site_id
        };
      });

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching asset groups:', error);
      return reply.code(500).send({
        error: 'Failed to fetch asset groups',
        details: error.message
      });
    }
  });

  // GET /api/options/assets - Get assets filtered by asset type
  fastify.get('/options/assets', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { asset_type, site_id, company_id } = request.query;
      
      logger.debug('Assets API request', {
        queryParams: { asset_type, site_id, company_id },
        tenantId: request.user.tenantId
      });
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';

      // Build filter for assets
      const filter = {
        tenantId: tenantId,
        type: 'asset'
      };

      // Filter by site_id if provided
      if (site_id) {
        const siteIds = Array.isArray(site_id) ? site_id : [site_id];
        filter.site_id = Array.isArray(site_id) ? { $in: siteIds } : site_id;
      }

      // Add asset type filter if provided
      if (asset_type) {
        logger.debug('Filtering assets by asset type', { asset_type });
        const assetTypes = Array.isArray(asset_type) ? asset_type : [asset_type];
        filter.asset_type = Array.isArray(asset_type) ? { $in: assetTypes } : asset_type;
      } else {
        logger.debug('No asset type selected, showing all assets', { site_id });
      }

      const assets = await collection.find(filter).project({
        _id: 1,
        id: 1,
        name: 1,
        asset_type: 1,
        asset_tag: 1,
        site_id: 1
      }).toArray();

      logger.debug('Assets retrieved', {
        count: assets.length,
        filter,
        sample: assets[0]
      });

      // Format for dropdown options
      const options = assets.map(asset => ({
        value: asset.id || asset._id.toString(),
        label: `${asset.name}${asset.asset_tag ? ' (' + asset.asset_tag + ')' : ''}`,
        asset_type: asset.asset_type,
        site_id: asset.site_id
      }));

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching assets:', error);
      return reply.code(500).send({
        error: 'Failed to fetch assets',
        details: error.message
      });
    }
  });

  // DEBUG endpoint to see asset group structure
  fastify.get('/debug/asset-groups', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';

      // Get all asset groups to see their structure
      const assetGroups = await collection.find({
        tenantId: tenantId,
        type: 'asset_group'
      }).limit(10).toArray();

      logger.debug('Asset Groups structure', { assetGroups });

      return reply.send({
        message: 'Asset groups structure logged to console',
        count: assetGroups.length,
        sample: assetGroups[0] || null
      });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // GET /api/options/:type - Generic options endpoint for any document type
  fastify.get('/options/:type', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type } = request.params;
      const { fields = 'id,name' } = request.query;
      
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const collection = db.collection('documents');
      const tenantId = request.user.tenantId || 'default';
// Build projection from fields parameter
      const fieldList = fields.split(',');
      const projection = {};
      fieldList.forEach(field => {
        projection[field.trim()] = 1;
      });
      projection._id = 1; // Always include _id

      // Get documents of specified type
      const documents = await collection.find({
        tenantId: tenantId,
        type: type
      }).project(projection).toArray();

      // Format for dropdown options
      const options = documents.map(doc => {
        const option = {
          value: doc.id || doc._id.toString(),
          label: doc.name || doc.title || doc._id.toString()
        };
        
        // Add any additional fields
        fieldList.forEach(field => {
          if (field !== 'id' && field !== 'name' && doc[field]) {
            option[field] = doc[field];
          }
        });
        
        return option;
      });

      return reply.send({
        success: true,
        data: options,
        count: options.length,
        type: type
      });

    } catch (error) {
      fastify.log.error(`Error fetching options for type ${request.params.type}:`, error);
      return reply.code(500).send({
        error: `Failed to fetch options for type ${request.params.type}`,
        details: error.message
      });
    }
  });
}

module.exports = { registerOptionsRoutes };

