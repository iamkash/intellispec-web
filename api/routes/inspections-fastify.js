/**
 * Generic Document API Routes for Fastify
 * 
 * RESTful API endpoints for document management (inspections, companies, sites, etc.)
 * Fully generic - works with ANY document type without code changes
 * 
 * Architecture:
 * - Pure repository pattern (no service layer needed)
 * - TenantContext for automatic tenant scoping
 * - DocumentRepository handles ALL document types
 * - Routes are HTTP handlers only
 */

const TenantContextFactory = require('../core/TenantContextFactory');
const { requireAuth } = require('../core/AuthMiddleware');
const DocumentRepository = require('../repositories/DocumentRepository');

/**
 * Helper to extract tenant and user from request
 */
function getTenantAndUser(request) {
  if (!request.user || !request.user.id) {
    throw new Error('User not authenticated');
  }

  const tenantId = request.user.tenantId;
  const userId = request.user.id;

  return { tenantId, userId };
}

function getNestedValue(source, path) {
  if (!source || !path) return undefined;
  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean);
  let current = source;

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined;
    }

    const arrayMatch = segment.match(/^(.+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = current?.[key];
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[Number(index)];
    } else {
      current = current?.[segment];
    }
  }

  return current;
}

function pickFirstValue(sources, candidatePaths = []) {
  for (const path of candidatePaths) {
    for (const source of sources) {
      const value = getNestedValue(source, path);
      if (value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }
  return undefined;
}

function normalizeDate(value) {
  if (!value) return undefined;
  const date = new Date(value);
  if (!Number.isNaN(date.getTime())) {
    return date.toISOString();
  }
  return value;
}

const TYPE_ALIASES = {
  pressure_vessel: ['pressure_vessel', 'pressure_vessel_vertical', 'pressure_vessel_horizontal', 'pressure_vessel_internal', 'pressure_vessel_external'],
  storage_tank: ['storage_tank', 'storage_tank_vertical', 'storage_tank_horizontal'],
  heat_exchanger: ['heat_exchanger', 'heat_exchanger_shell_tube', 'heat_exchanger_plate'],
  piping: ['piping', 'piping_system', 'pipework', 'pipeline'],
  rotating_equipment: ['rotating_equipment', 'pump', 'compressor', 'turbine']
};

const TYPE_LABELS = {
  pressure_vessel: 'Pressure Vessel',
  storage_tank: 'Storage Tank',
  heat_exchanger: 'Heat Exchanger',
  piping: 'Piping System',
  rotating_equipment: 'Rotating Equipment'
};

function getDocName(doc) {
  if (!doc || typeof doc !== 'object') return undefined;
  return (
    doc.name ||
    doc.title ||
    doc.company_name ||
    doc.site_name ||
    doc.asset_group_name ||
    doc.asset_name ||
    doc.formData?.name ||
    doc.formData?.title ||
    doc.formData?.company_name ||
    doc.formData?.site_name ||
    doc.formData?.asset_group_name ||
    doc.formData?.asset_name
  );
}

function toTitleCase(value = '') {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeInspectionType(rawType) {
  if (!rawType) return undefined;
  const lower = String(rawType).toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((alias) => lower === alias || lower.startsWith(alias))) {
      return canonical;
    }
  }
  return lower;
}

function resolveInspectionLabel(type) {
  if (!type) return undefined;
  return TYPE_LABELS[type] || toTitleCase(type);
}

function enrichInspectionRecord(document = {}, referenceMaps = {}) {
  const record = { ...document };

  const sourceCandidates = [
    document,
    document.documentSummary,
    document.sectionData?.documentSummary,
    document.sectionData,
    document.sectionData?.formData,
    document.formData,
    document.wizardState?.documentSummary,
    document.wizardState,
    document.globalFormData,
    document.recordContext
  ].filter(Boolean);

  const ensureField = (field, paths) => {
    if (record[field] !== undefined && record[field] !== null && record[field] !== '') {
      return;
    }
    const value = pickFirstValue(sourceCandidates, paths);
    if (value !== undefined && value !== null && value !== '') {
      record[field] = value;
    }
  };

  const detectedTypeFromSources = pickFirstValue(sourceCandidates, ['detectedEquipmentType', 'equipmentSubtype']);
  ensureField('inspectionType', ['inspectionType', 'inspection_type', 'sectionData.inspectionType']);
  const normalizedType = normalizeInspectionType(detectedTypeFromSources || record.inspectionType);
  if (normalizedType) {
    record.inspectionType = normalizedType;
  }
  const inspectionLabelFromSources = pickFirstValue(sourceCandidates, ['inspectionTypeLabel', 'equipmentTypeLabel']);
  const inspectionLabel = inspectionLabelFromSources || resolveInspectionLabel(record.inspectionType);
  if (inspectionLabel) {
    record.inspectionTypeLabel = record.inspectionTypeLabel || inspectionLabel;
    record.equipmentType = record.equipmentType || inspectionLabel;
    record.equipmentTypeLabel = record.equipmentTypeLabel || inspectionLabel;
  } else {
    ensureField('equipmentType', ['equipmentType', 'equipment_type']);
  }
  if (detectedTypeFromSources) {
    record.detectedEquipmentType = record.detectedEquipmentType || detectedTypeFromSources;
  }
  ensureField('equipmentId', ['equipmentId', 'equipment_id', 'equipment.id', 'assetId', 'asset_id']);

  const equipmentName =
    pickFirstValue(sourceCandidates, ['equipmentName', 'equipment_name', 'assetName', 'asset_name', 'asset.name', 'name']);
  if (equipmentName) {
    if (!record.equipmentName) record.equipmentName = equipmentName;
    if (!record.assetName) record.assetName = equipmentName;
  }

  const companyId = pickFirstValue(sourceCandidates, ['company_id', 'companyId', 'company.id', 'formData.company_id']);
  const siteId = pickFirstValue(sourceCandidates, ['site_id', 'siteId', 'site.id', 'formData.site_id']);
  const assetGroupId = pickFirstValue(sourceCandidates, ['assetGroupId', 'asset_group_id', 'assetGroup.id', 'formData.asset_group_id']);
  const assetId = pickFirstValue(sourceCandidates, ['assetId', 'asset_id', 'asset.id', 'formData.asset_id']);

  ensureField('assetId', ['assetId', 'asset_id', 'asset.id']);
  ensureField('assetGroupId', ['assetGroupId', 'asset_group_id', 'assetGroup.id']);
  ensureField('assetGroupName', ['assetGroupName', 'asset_group_name', 'assetGroup.name']);
  ensureField('company_id', ['company_id', 'companyId', 'company.id']);
  ensureField('companyName', ['companyName', 'company_name', 'company.name']);
  ensureField('facilityName', [
    'facilityName',
    'facility_name',
    'siteName',
    'site_name',
    'site.name',
    'location.facility.name'
  ]);
  ensureField('site_id', ['site_id', 'siteId', 'site.id']);
  ensureField('siteName', ['siteName', 'site_name', 'site.name']);
  ensureField('inspectorName', ['inspectorName', 'inspector_name', 'inspector.name']);

  const inspectionDate =
    normalizeDate(record.inspectionDate) ||
    normalizeDate(pickFirstValue(sourceCandidates, ['inspectionDate', 'inspection_date', 'date']));
  if (inspectionDate) {
    record.inspectionDate = inspectionDate;
  }

  if (record.status === undefined || record.status === null || record.status === '') {
    const completedSteps = document.wizardState?.completedSteps || document.completedSteps || [];
    const totalSteps =
      document.wizardState?.sections?.length ||
      document.sectionData?.wizardState?.sections?.length ||
      (Array.isArray(document.sections) ? document.sections.length : 0) ||
      1;
    const uniqueCompleted = new Set(completedSteps);
    const calculatedProgress = Math.round((uniqueCompleted.size / Math.max(totalSteps, 1)) * 100);
    record.progress = record.progress ?? calculatedProgress;
    record.status = calculatedProgress >= 100 ? 'completed' : 'in_progress';
  } else if (record.progress === undefined || record.progress === null) {
    const completedSteps = document.wizardState?.completedSteps || document.completedSteps || [];
    const totalSteps =
      document.wizardState?.sections?.length ||
      document.sectionData?.wizardState?.sections?.length ||
      (Array.isArray(document.sections) ? document.sections.length : 0) ||
      1;
    const uniqueCompleted = new Set(completedSteps);
    record.progress = Math.round((uniqueCompleted.size / Math.max(totalSteps, 1)) * 100);
  }

  record.formData = record.formData || {};
  record.documentSummary = record.documentSummary || {};

  const { companies = {}, sites = {}, assetGroups = {}, assets = {} } = referenceMaps;

  if (companyId && companies[companyId]) {
    const companyName = getDocName(companies[companyId]);
    if (companyName) {
      record.companyName = record.companyName || companyName;
      record.documentSummary.companyName = record.documentSummary.companyName || companyName;
      record.documentSummary.company_id = record.documentSummary.company_id || companyId;
      record.formData.companyName = record.formData.companyName || companyName;
    }
  }

  if (siteId && sites[siteId]) {
    const siteName = getDocName(sites[siteId]);
    if (siteName) {
      record.facilityName = record.facilityName || siteName;
      record.siteName = record.siteName || siteName;
      record.documentSummary.facilityName = record.documentSummary.facilityName || siteName;
      record.documentSummary.siteName = record.documentSummary.siteName || siteName;
      record.documentSummary.site_id = record.documentSummary.site_id || siteId;
      record.formData.siteName = record.formData.siteName || siteName;
    }
  }

  if (assetGroupId && assetGroups[assetGroupId]) {
    const groupName = getDocName(assetGroups[assetGroupId]);
    if (groupName) {
      record.assetGroupName = record.assetGroupName || groupName;
      record.documentSummary.assetGroupName = record.documentSummary.assetGroupName || groupName;
      record.documentSummary.assetGroupId = record.documentSummary.assetGroupId || assetGroupId;
      record.formData.assetGroupName = record.formData.assetGroupName || groupName;
    }
  }

  if (assetId && assets[assetId]) {
    const assetName = getDocName(assets[assetId]);
    if (assetName) {
      record.assetName = record.assetName || assetName;
      record.documentSummary.assetName = record.documentSummary.assetName || assetName;
      record.documentSummary.assetId = record.documentSummary.assetId || assetId;
      record.formData.assetName = record.formData.assetName || assetName;
    }
  }

  return record;
}

async function fetchDocumentsByIds(tenantContext, requestContext, type, ids = []) {
  if (!ids.length) return {};
  const repository = new DocumentRepository(tenantContext, type, requestContext);
  const documents = await repository.find({ id: { $in: ids } });
  return documents.reduce((acc, doc) => {
    if (doc && doc.id) {
      acc[doc.id] = doc;
    }
    return acc;
  }, {});
}

async function loadReferenceMaps(records, tenantContext, requestContext) {
  const companyIds = new Set();
  const siteIds = new Set();
  const assetGroupIds = new Set();
  const assetIds = new Set();

  const candidatesForRecord = (record) => [
    record,
    record.formData,
    record.documentSummary,
    record.recordContext,
    record.sectionData?.formData
  ].filter(Boolean);

  const addId = (set, value) => {
    if (value && typeof value === 'string') {
      set.add(value);
    }
  };

  records.forEach((record) => {
    const candidates = candidatesForRecord(record);
    const companyId = pickFirstValue(candidates, ['company_id', 'companyId', 'company.id', 'formData.company_id']);
    const siteId = pickFirstValue(candidates, ['site_id', 'siteId', 'site.id', 'formData.site_id']);
    const assetGroupId = pickFirstValue(candidates, ['assetGroupId', 'asset_group_id', 'assetGroup.id', 'formData.asset_group_id']);
    const assetId = pickFirstValue(candidates, ['assetId', 'asset_id', 'asset.id', 'formData.asset_id']);

    addId(companyIds, companyId);
    addId(siteIds, siteId);
    addId(assetGroupIds, assetGroupId);
    addId(assetIds, assetId);
  });

  const [companies, sites, assetGroups, assets] = await Promise.all([
    fetchDocumentsByIds(tenantContext, requestContext, 'company', Array.from(companyIds)),
    fetchDocumentsByIds(tenantContext, requestContext, 'site', Array.from(siteIds)),
    fetchDocumentsByIds(tenantContext, requestContext, 'asset_group', Array.from(assetGroupIds)),
    fetchDocumentsByIds(tenantContext, requestContext, 'asset', Array.from(assetIds))
  ]);

  return {
    companies,
    sites,
    assetGroups,
    assets
  };
}

async function registerInspectionRoutes(fastify) {
  /**
   * GET /inspections
   * List all inspections with filters
   */
  fastify.get('/inspections', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context from request (JWT or headers)
      const tenantContext = TenantContextFactory.fromRequest(request);
      
      // Create repository with tenant context and request context for audit logging
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const filters = {};
      const options = {
        page: parseInt(request.query.page) || 1,
        limit: parseInt(request.query.limit) || 20,
        sort: {}
      };

      // Parse filters from query params with operator support
      const parseFilterValue = (value, operator) => {
        if (operator === '__in') {
          return { $in: Array.isArray(value) ? value : [value] };
        }
        if (operator === '__gte') {
          return { $gte: value };
        }
        if (operator === '__lte') {
          return { $lte: value };
        }
        if (operator === '__gt') {
          return { $gt: value };
        }
        if (operator === '__lt') {
          return { $lt: value };
        }
        if (operator === '__ne') {
          return { $ne: value };
        }
        if (operator === '__regex') {
          return { $regex: value, $options: 'i' };
        }
        return value;
      };

      // Build filters from query params
      for (const [key, value] of Object.entries(request.query)) {
        if (['page', 'limit', 'sort', 'sortBy', 'sortOrder'].includes(key)) {
          continue;
        }

        // Check for operator suffix
        const operatorMatch = key.match(/(.+)__(in|gte|lte|gt|lt|ne|regex)$/);
        if (operatorMatch) {
          const [, fieldName, operator] = operatorMatch;
          filters[fieldName] = parseFilterValue(value, `__${operator}`);
        } else {
          filters[key] = value;
        }
      }

      // Handle sorting
      if (request.query.sortBy) {
        const sortOrder = request.query.sortOrder === 'desc' ? -1 : 1;
        options.sort[request.query.sortBy] = sortOrder;
      } else {
        options.sort.created_date = -1; // Default sort
      }

      // Use repository for data access (tenant filtering automatic)
      const result = await repository.findWithPagination(filters, options);
      const referenceMaps = await loadReferenceMaps(result.data || [], tenantContext, request.context);
      const enrichedData = Array.isArray(result.data)
        ? result.data.map((record) => enrichInspectionRecord(record, referenceMaps))
        : [];

      return reply.send({
        ...result,
        data: enrichedData
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to list inspections',
        message: error.message
      });
    }
  });

  /**
   * GET /inspections/stats
   * Get inspection statistics
   */
  fastify.get('/inspections/stats', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const filters = {};
      if (request.query.inspection_type) {
        filters.inspectionType = request.query.inspection_type;
      }
      if (request.query.equipment_type) {
        filters['formData.equipmentType'] = request.query.equipment_type;
      }

      // Use repository for statistics (tenant filtering automatic)
      const stats = await repository.getStats(filters);
      return reply.send(stats);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get inspection stats',
        message: error.message
      });
    }
  });

  /**
   * POST /api/inspections/aggregate
   * Run custom aggregation on inspections
   */
  fastify.post('/api/inspections/aggregate', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      const { aggregationConfig } = request.body;
      
      if (!aggregationConfig) {
        return reply.status(400).send({ error: 'aggregationConfig is required' });
      }

      // Use repository for aggregation (tenant filtering automatic)
      const result = await repository.aggregate(aggregationConfig);
      return reply.send(result);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Aggregation failed',
        message: error.message
      });
    }
  });

  /**
   * POST /inspections
   * Create a new inspection
   */
  fastify.post('/inspections', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { tenantId, userId } = getTenantAndUser(request);
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);

      // Generate ID if not provided
      const inspectionData = {
        ...request.body,
        id: request.body.id || `inspection-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        tenantId,
        created_by: userId,
        created_date: new Date(),
        last_updated: new Date(),
        last_updated_by: userId,
        deleted: false
      };

      const inspection = await repository.create(inspectionData);
      return reply.status(201).send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: 'Failed to create inspection',
        message: error.message
      });
    }
  });

  /**
   * PUT /inspections/:id
   * Update an inspection
   */
  fastify.put('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { userId } = getTenantAndUser(request);
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);

      const updateData = {
        ...request.body,
        last_updated: new Date(),
        last_updated_by: userId
      };

      const inspection = await repository.update(request.params.id, updateData);
      
      if (!inspection) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(400).send({
        error: 'Failed to update inspection',
        message: error.message
      });
    }
  });

  /**
   * GET /inspections/:id
   * Get a single inspection
   */
  fastify.get('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      // Use repository to get inspection (tenant filtering automatic)
      const inspection = await repository.findById(request.params.id);
      
      if (!inspection) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send(inspection);
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to get inspection',
        message: error.message
      });
    }
  });

  /**
   * DELETE /inspections/:id
   * Delete an inspection (soft delete)
   */
  fastify.delete('/inspections/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      // Extract tenant context and create repository
      const tenantContext = TenantContextFactory.fromRequest(request);
      const repository = new DocumentRepository(tenantContext, 'inspection', request.context);
      
      // Use repository to delete inspection (tenant filtering automatic)
      const result = await repository.delete(request.params.id);

      if (!result) {
        return reply.status(404).send({ error: 'Inspection not found' });
      }

      return reply.send({ success: true, message: 'Inspection deleted' });
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({
        error: 'Failed to delete inspection',
        message: error.message
      });
    }
  });
}

module.exports = registerInspectionRoutes;
