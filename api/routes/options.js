const mongoose = require('mongoose');
const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');
const TenantContextFactory = require('../core/TenantContextFactory');
const DocumentRepository = require('../repositories/DocumentRepository');

/**
 * Generic options API routes for dropdowns and filters
 * Provides dynamic options based on document types and fields
 * 
 * Framework Integration:
 * - Uses Logger for structured logging
 */

async function registerOptionsRoutes(fastify) {

  function toLabel(raw = '') {
    if (!raw) return raw;
    return String(raw)
      .split(/[_\s]+/)
      .filter(Boolean)
      .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
  
  // GET /api/options/companies - Get all companies for dropdown
  fastify.get('/options/companies', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected' });
      }

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'company', request.context);
      const companies = await repository.find({}, {
        projection: 'id name code',
        sort: { name: 1 }
      });

      const options = companies.map(company => ({
        value: company.id || company._id?.toString(),
        label: company.name || company.code || company.id,
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

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'site', request.context);

      const { company_id } = request.query;

      const hasCompanySelection = Array.isArray(company_id)
        ? company_id.length > 0
        : Boolean(company_id);

      if (!hasCompanySelection) {
        logger.debug('No company selected, returning empty site list');
        return reply.send({
          success: true,
          data: [],
          count: 0,
          message: 'Please select a company first'
        });
      }

      const filters = {};

      if (company_id) {
        if (Array.isArray(company_id)) {
          filters.company_id = { $in: company_id };
        } else {
          filters.company_id = company_id;
        }
      }

      const sites = await repository.find(filters, {
        projection: 'id name code companyId company_id',
        sort: { name: 1 }
      });

      const options = sites.map(site => ({
        value: site.id || site._id?.toString(),
        label: site.name || site.code || site.id,
        code: site.code,
        companyId: site.companyId || site.company_id
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

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'asset', request.context);

      const filters = {
        asset_type: { $exists: true, $ne: null }
      };

      if (site_id) {
        const siteIds = Array.isArray(site_id) ? site_id : [site_id];
        filters.site_id = siteIds.length > 1 ? { $in: siteIds } : siteIds[0];
      }

      const assetTypes = await repository.getDistinctValues('asset_type', filters);

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

  fastify.get('/options/wizard', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const {
        distinct,
        includeFields,
        labelField = 'identity.domainSubTypeLabel',
        valueField = 'identity.domainSubType',
        limit = 100,
        sort
      } = request.query;

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'wizard', request.context);

      const reservedKeys = new Set([
        'distinct',
        'includeFields',
        'labelField',
        'valueField',
        'limit',
        'sort'
      ]);

      const filters = {};

      const aliasConditions = [];

      for (const [key, rawValue] of Object.entries(request.query)) {
        if (reservedKeys.has(key)) continue;
        if (rawValue === undefined || rawValue === null || rawValue === '') continue;

        let fieldKey = key;
        let operator = null;

        if (fieldKey.includes('__')) {
          const parts = fieldKey.split('__');
          fieldKey = parts[0];
          operator = parts[1];
        }

        const value = rawValue;

        let parsedValue;
        if (operator === 'in' || Array.isArray(value)) {
          parsedValue = { $in: Array.isArray(value) ? value : [value] };
        } else if (operator === 'gte') {
          parsedValue = { $gte: value };
        } else if (operator === 'lte') {
          parsedValue = { $lte: value };
        } else if (operator === 'ne') {
          parsedValue = { $ne: value };
        } else {
          parsedValue = value;
        }

        if (fieldKey === 'identity.domain') {
          aliasConditions.push({
            $or: [
              { 'identity.domain': parsedValue },
              { domain: parsedValue }
            ]
          });
        } else if (fieldKey === 'identity.domainSubType') {
          aliasConditions.push({
            $or: [
              { 'identity.domainSubType': parsedValue },
              { domainSubType: parsedValue }
            ]
          });
        } else {
          if (
            operator === 'gte' ||
            operator === 'lte'
          ) {
            filters[fieldKey] = { ...(filters[fieldKey] || {}), ...parsedValue };
          } else {
            filters[fieldKey] = parsedValue;
          }
        }
      }

      if (aliasConditions.length > 0) {
        filters.$and = [...(filters.$and || []), ...aliasConditions];
      }

      const baseMatch = repository.buildBaseQuery(filters);

      const pipeline = [
        { $match: baseMatch }
      ];

      const aliasAddFields = {};
      const ensureAlias = (path) => {
        if (!path) return;
        if (path === 'identity.domain') {
          aliasAddFields['identity.domain'] = {
            $ifNull: ['$identity.domain', '$domain']
          };
        } else if (path === 'identity.domainSubType') {
          aliasAddFields['identity.domainSubType'] = {
            $ifNull: ['$identity.domainSubType', '$domainSubType']
          };
        } else if (path === 'identity.domainLabel') {
          aliasAddFields['identity.domainLabel'] = {
            $ifNull: ['$identity.domainLabel', '$domainLabel']
          };
        } else if (path === 'identity.domainSubTypeLabel') {
          aliasAddFields['identity.domainSubTypeLabel'] = {
            $ifNull: ['$identity.domainSubTypeLabel', '$domainSubTypeLabel']
          };
        }
      };

      ensureAlias(distinct);
      ensureAlias(labelField);
      ensureAlias(valueField);

      if (includeFields) {
        includeFields
          .split(',')
          .map(field => field.trim())
          .filter(Boolean)
          .forEach(ensureAlias);
      }

      if (Object.keys(aliasAddFields).length > 0) {
        pipeline.push({ $addFields: aliasAddFields });
      }

      if (includeFields) {
        const projectionFields = new Set(
          includeFields
            .split(',')
            .map(field => field.trim())
            .filter(Boolean)
        );

        if (distinct) {
          projectionFields.add(distinct);
        }

        if (labelField) {
          projectionFields.add(labelField);
        }

        if (valueField) {
          projectionFields.add(valueField);
        }

        const projection = {};
        projectionFields.forEach(field => {
          if (field) {
            projection[field] = 1;
          }
        });

        if (Object.keys(projection).length > 0) {
          pipeline.push({ $project: projection });
        }
      }

      if (distinct) {
        pipeline.push({
          $group: {
            _id: `$${distinct}`,
            doc: { $first: '$$ROOT' }
          }
        });
      }

      if (sort) {
        let sortStage = null;
        if (typeof sort === 'string') {
          try {
            if (sort.trim().startsWith('{')) {
              sortStage = JSON.parse(sort);
            } else {
              const [field, direction] = sort.split(':').map(part => part.trim());
              if (field) {
                sortStage = { [field]: direction === 'asc' ? 1 : -1 };
              }
            }
          } catch (error) {
            logger.warn('Invalid sort parameter for /options/wizard', { sort, error: error.message });
          }
        }

        if (sortStage) {
          pipeline.push({ $sort: sortStage });
        }
      }

      pipeline.push({ $limit: Number(limit) || 100 });

      const results = await repository.model.aggregate(pipeline).exec();

      const getByPath = (obj, path) => {
        if (!obj || !path) return undefined;
        return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
      };

      const options = results
        .map(result => {
          const doc = result.doc || result;
          const value = getByPath(doc, valueField) ?? result._id;
          if (value === undefined || value === null || value === '') {
            return null;
          }

          const labelCandidate = getByPath(doc, labelField);
          const option = {
            value: String(value),
            label: labelCandidate ? String(labelCandidate) : toLabel(value)
          };

          if (includeFields) {
            includeFields
              .split(',')
              .map(field => field.trim())
              .filter(Boolean)
              .forEach(field => {
                const fieldValue = getByPath(doc, field);
                if (fieldValue !== undefined) {
                  option[field.replace(/\./g, '_')] = fieldValue;
                }
              });
          }

          return option;
        })
        .filter(Boolean);

      return reply.send({
        success: true,
        data: options,
        count: options.length
      });

    } catch (error) {
      fastify.log.error('Error fetching wizard options:', error);
      return reply.code(500).send({
        error: 'Failed to fetch wizard options',
        details: error.message
      });
    }
  });

  // GET /api/options/asset-groups - Get asset groups filtered by facility
  fastify.get('/options/asset-groups', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { site_id, facility_id } = request.query;
      const siteIdValue = site_id || facility_id; // Handle both parameter names

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'asset_group', request.context);

      logger.debug('Asset Groups API request', {
        queryParams: { site_id, facility_id, siteIdValue },
        user: { 
          tenantId: tenantContext.tenantId,
          userId: tenantContext.userId,
          isPlatformAdmin: tenantContext.isPlatformAdmin
        }
      });

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

      const filters = {};
      logger.debug('Filtering asset groups', {
        siteIds,
        tenantContext: tenantContext.toJSON()
      });

      filters.site_id = siteIds.length > 1 ? { $in: siteIds } : siteIds[0];

      const assetGroups = await repository.find(filters, {
        projection: 'id name code facility_id site_id siteId facilityId parent_id parentId',
        sort: { name: 1 }
      });

      logger.debug('Asset groups retrieved', { count: assetGroups.length, sample: assetGroups[0] });

      // Format for dropdown options
      const options = assetGroups.map(group => {
        // Add distinguishing info if there are duplicates
        const hasDuplicates = assetGroups.filter(g => g.name === group.name).length > 1;
        const fallbackId = group.code || group.id?.slice(-6) || 'ID unavailable';
        const label = hasDuplicates 
          ? `${group.name} (${fallbackId})`
          : group.name;
          
        return {
          value: group.id,
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
      const { asset_type, site_id, company_id, asset_group_id } = request.query;
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'asset', request.context);

      logger.debug('Assets API request', {
        queryParams: { asset_type, site_id, company_id, asset_group_id },
        tenantContext: tenantContext.toJSON()
      });

      const hasSiteSelection = Array.isArray(site_id)
        ? site_id.length > 0
        : Boolean(site_id);
      const hasGroupSelection = Array.isArray(asset_group_id)
        ? asset_group_id.length > 0
        : Boolean(asset_group_id);

      if (!hasSiteSelection && !hasGroupSelection) {
        logger.debug('No facility or asset group selected, returning empty asset list');
        return reply.send({
          success: true,
          data: [],
          count: 0,
          message: 'Please select a facility first'
        });
      }

      const filters = {};

      // Filter by site_id if provided
      if (site_id) {
        const siteIds = Array.isArray(site_id) ? site_id : [site_id];
        filters.site_id = siteIds.length > 1 ? { $in: siteIds } : siteIds[0];
      }

      // Add asset type filter if provided
      if (asset_type) {
        logger.debug('Filtering assets by asset type', { asset_type });
        const assetTypes = Array.isArray(asset_type) ? asset_type : [asset_type];
        filters.asset_type = assetTypes.length > 1 ? { $in: assetTypes } : assetTypes[0];
      } else {
        logger.debug('No asset type selected, showing all assets', { site_id });
      }

      // Filter by company if provided
      if (company_id) {
        const companyIds = Array.isArray(company_id) ? company_id : [company_id];
        filters.company_id = companyIds.length > 1 ? { $in: companyIds } : companyIds[0];
      }

      // Filter by asset group if provided
      if (asset_group_id) {
        const groupIds = Array.isArray(asset_group_id) ? asset_group_id : [asset_group_id];
        filters.asset_group_id = groupIds.length > 1 ? { $in: groupIds } : groupIds[0];
      }

      const assets = await repository.find(filters, {
        projection: 'id name asset_type asset_tag site_id asset_group_id company_id',
        sort: { name: 1 }
      });

      logger.debug('Assets retrieved', { count: assets.length, sample: assets[0] });

      // Format for dropdown options
      const options = assets.map(asset => ({
        value: asset.id || asset._id?.toString(),
        label: `${asset.name}${asset.asset_tag ? ' (' + asset.asset_tag + ')' : ''}`,
        asset_type: asset.asset_type,
        site_id: asset.site_id,
        asset_group_id: asset.asset_group_id,
        company_id: asset.company_id
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

  // Helper to get nested property via dot notation
  const getByPath = (obj, path) => {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, key) => {
      if (acc === undefined || acc === null) return undefined;
      return acc[key];
    }, obj);
  };

  // GET /api/options/:type - Generic options endpoint for any document type
  fastify.get('/options/:type', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type } = request.params;
      const {
        fields = 'id,name',
        distinct,
        includeFields = '',
        labelField
      } = request.query;

      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, type, request.context);

      const excludedParams = new Set(['fields', 'distinct', 'includeFields', 'labelField']);
      const filters = {};

      for (const [key, value] of Object.entries(request.query)) {
        if (excludedParams.has(key)) continue;
        if (key === '') continue;
        if (Array.isArray(value)) {
          filters[key] = value.length > 1 ? { $in: value } : value[0];
        } else {
          filters[key] = value;
        }
      }

      if (distinct) {
        const distinctField = distinct;
        const distinctValues = await repository.getDistinctValues(distinctField, filters);
        const normalizedValues = distinctValues
          .filter(value => value !== null && value !== undefined && value !== '');

        if (normalizedValues.length === 0) {
          return reply.send({ success: true, data: [], count: 0 });
        }

        const extraFields = includeFields
          .split(',')
          .map(field => field.trim())
          .filter(Boolean);

        const projectionFields = new Set([distinctField]);
        if (labelField) projectionFields.add(labelField);
        extraFields.forEach(field => projectionFields.add(field));
        projectionFields.add('id');
        projectionFields.add('name');

        const sampleDocs = await repository.find({
          ...filters,
          [distinctField]: { $in: normalizedValues }
        }, {
          projection: Array.from(projectionFields).join(' ')
        });

        const sampleMap = new Map();
        for (const doc of sampleDocs) {
          const value = getByPath(doc, distinctField);
          if (value !== undefined && !sampleMap.has(value)) {
            sampleMap.set(value, doc);
          }
        }

        const options = normalizedValues.map(value => {
          const doc = sampleMap.get(value);
          const labelCandidate = doc ? getByPath(doc, labelField) : undefined;
          const label = labelCandidate || toLabel(value);

          const option = {
            value,
            label
          };

          extraFields.forEach(field => {
            const fieldValue = doc ? getByPath(doc, field) : undefined;
            if (fieldValue !== undefined) {
              option[field.replace(/\./g, '_')] = fieldValue;
            }
          });

          return option;
        }).sort((a, b) => (a.label || '').localeCompare(b.label || ''));

        return reply.send({
          success: true,
          data: options,
          count: options.length
        });
      }

      const fieldList = fields
        .split(',')
        .map(field => field.trim())
        .filter(Boolean);

      const projection = fieldList.length > 0 ? fieldList.join(' ') : undefined;

      const documents = await repository.find(filters, {
        projection,
        sort: { name: 1 }
      });

      const options = documents.map(doc => {
        const option = {
          value: doc.id,
          label: doc.name || doc.title || doc.id
        };

        fieldList.forEach(field => {
          if (field === 'id' || field === 'name') return;
          const fieldValue = doc[field];
          if (fieldValue !== undefined) {
            option[field] = fieldValue;
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
