/**
 * DocumentRepository.js
 * 
 * Generic repository for ALL document types in the system:
 * - company
 * - site  
 * - paintInvoice
 * - paint_specifications
 * - asset
 * - assetGroup
 * - inspection
 * - wizard
 * - etc.
 * 
 * Provides:
 * - Automatic tenant filtering
 * - Automatic audit trail
 * - Type-safe CRUD operations
 * - Soft delete support
 * - Pagination and filtering
 * 
 * Architecture:
 * - Extends BaseRepository
 * - Uses TenantContext for automatic scoping
 * - Works with generic Document model
 * - Type parameter allows filtering by document type
 */

const BaseRepository = require('../core/BaseRepository');
const DocumentModel = require('../models/Document');

/**
 * DocumentRepository
 * 
 * Generic repository that handles all document types.
 * Type filtering is done automatically based on constructor parameter.
 * 
 * Usage:
 * 
 * // For companies
 * const companyRepo = new DocumentRepository(tenantContext, 'company');
 * const companies = await companyRepo.find({ status: 'active' });
 * 
 * // For sites
 * const siteRepo = new DocumentRepository(tenantContext, 'site');
 * const sites = await siteRepo.find({ company_id: 'comp_123' });
 * 
 * // For paint invoices
 * const invoiceRepo = new DocumentRepository(tenantContext, 'paintInvoice');
 * const invoices = await invoiceRepo.find({});
 * 
 * // For inspections
 * const inspectionRepo = new DocumentRepository(tenantContext, 'inspection');
 * const inspections = await inspectionRepo.find({});
 */
class DocumentRepository extends BaseRepository {
  /**
   * @param {TenantContext} tenantContext - User and tenant context
   * @param {string} documentType - Type of document (company, site, paintInvoice, inspection, etc.)
   * @param {RequestContext} requestContext - Optional request context for audit logging
   */
  constructor(tenantContext, documentType, requestContext = null) {
    // Call parent constructor with Document model
    super(DocumentModel, tenantContext, requestContext);
    
    // Store document type for automatic filtering
    this.documentType = documentType;
  }

  /**
   * Build base query with automatic type filtering
   * Overrides BaseRepository method to add type filter
   * 
   * @param {Object} filters - Additional filters
   * @returns {Object} Query with type filter added
   */
  buildBaseQuery(filters = {}) {
    // Get tenant filter from parent
    const baseQuery = super.buildBaseQuery(filters);
    
    // Add document type filter
    baseQuery.type = this.documentType;
    
    return baseQuery;
  }

  /**
   * Override create to automatically add type field
   * 
   * @param {Object} data - Document data
   * @returns {Promise<Object>}
   */
  async create(data) {
    // Automatically add type field
    const dataWithType = {
      ...data,
      type: this.documentType
    };
    
    // Call parent create
    return super.create(dataWithType);
  }

  /**
   * Override update to prevent changing type
   * 
   * @param {string} id - Document ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>}
   */
  async update(id, updates) {
    // Remove type from updates (shouldn't be changed)
    const { type, ...safeUpdates } = updates;
    
    // Call parent update
    return super.update(id, safeUpdates);
  }

  /**
   * Find documents by relationship (e.g., sites by company_id)
   * 
   * @param {string} relationField - Field name (e.g., 'company_id')
   * @param {string} relationValue - Value to match
   * @param {Object} options - Pagination and sort options
   * @returns {Promise<Object>} Paginated results
   */
  async findByRelation(relationField, relationValue, options = {}) {
    const filters = {
      [relationField]: relationValue
    };
    
    return this.findWithPagination(filters, options);
  }

  /**
   * Count documents by relationship
   * 
   * @param {string} relationField - Field name
   * @param {string} relationValue - Value to match
   * @returns {Promise<number>} Count
   */
  async countByRelation(relationField, relationValue) {
    const query = this.buildBaseQuery({
      [relationField]: relationValue
    });
    
    return this.model.countDocuments(query);
  }

  /**
   * Find documents by multiple field values (bulk lookup)
   * Useful for dropdown options, autocomplete, etc.
   * 
   * @param {string} field - Field to match
   * @param {Array} values - Array of values
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Matching documents
   */
  async findByFieldValues(field, values, options = {}) {
    const query = this.buildBaseQuery({
      [field]: { $in: values }
    });
    
    const sort = options.sort || { name: 1 };
    const limit = options.limit || 100;
    
    return this.model.find(query)
      .sort(sort)
      .limit(limit)
      .lean()
      .exec();
  }

  /**
   * Get unique values for a field (for filters, dropdowns)
   * 
   * @param {string} field - Field name
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Unique values
   */
  async getDistinctValues(field, filters = {}) {
    const query = this.buildBaseQuery(filters);
    return this.model.distinct(field, query);
  }

  /**
   * Search documents by text (name, code, description)
   * 
   * @param {string} searchTerm - Search term
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Paginated results
   */
  async search(searchTerm, options = {}) {
    const filters = {
      $or: [
        { name: { $regex: searchTerm, $options: 'i' } },
        { code: { $regex: searchTerm, $options: 'i' } },
        { description: { $regex: searchTerm, $options: 'i' } }
      ]
    };
    
    return this.findWithPagination(filters, options);
  }

  /**
   * Get options for dropdown/select fields
   * Returns { label, value } pairs
   * 
   * @param {Object} filters - Additional filters
   * @param {string} labelField - Field to use for label (default: 'name')
   * @param {string} valueField - Field to use for value (default: 'id')
   * @returns {Promise<Array>} Options array
   */
  async getOptions(filters = {}, labelField = 'name', valueField = 'id') {
    const query = this.buildBaseQuery(filters);
    
    const documents = await this.model.find(query)
      .select(`${labelField} ${valueField} code`)
      .sort({ [labelField]: 1 })
      .limit(1000)
      .lean()
      .exec();
    
    return documents.map(doc => ({
      label: doc[labelField] || doc.code || doc[valueField],
      value: doc[valueField],
      code: doc.code,
      // Include original doc for additional data
      ...doc
    }));
  }

  /**
   * Bulk create documents (for imports)
   * 
   * @param {Array<Object>} documents - Array of documents to create
   * @returns {Promise<Array>} Created documents
   */
  async bulkCreate(documents) {
    const results = [];
    
    for (const doc of documents) {
      try {
        const created = await this.create(doc);
        results.push({ success: true, data: created });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message,
          data: doc 
        });
      }
    }
    
    return results;
  }

  /**
   * Get statistics for this document type
   * 
   * @param {Object} additionalFilters - Additional filters
   * @returns {Promise<Object>} Statistics
   */
  async getStats(additionalFilters = {}) {
    const query = this.buildBaseQuery(additionalFilters);
    
    const [
      total,
      byStatus,
      recentCount
    ] = await Promise.all([
      this.model.countDocuments(query),
      
      this.model.aggregate([
        { $match: query },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      
      this.model.countDocuments({
        ...query,
        created_date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      })
    ]);
    
    return {
      total,
      byStatus: byStatus.map(s => ({ status: s._id, count: s.count })),
      recentCount,
      type: this.documentType
    };
  }

  /**
   * Run custom aggregation pipeline
   * Automatically prepends tenant filter to pipeline
   * 
   * @param {Array|Object} pipelineOrConfig - MongoDB aggregation pipeline or config object
   * @returns {Promise<Array>} Aggregation results
   */
  async aggregate(pipelineOrConfig) {
    let pipeline;

    // Support both direct pipeline arrays and config objects
    if (Array.isArray(pipelineOrConfig)) {
      pipeline = pipelineOrConfig;
    } else if (pipelineOrConfig && typeof pipelineOrConfig === 'object') {
      // Build pipeline from config (metadata-driven)
      pipeline = [];

      if (pipelineOrConfig.baseFilter) {
        pipeline.push({ $match: pipelineOrConfig.baseFilter });
      }

      if (pipelineOrConfig.groupBy) {
        pipeline.push({ $group: pipelineOrConfig.groupBy });
      }

      if (pipelineOrConfig.sort) {
        pipeline.push({ $sort: pipelineOrConfig.sort });
      }

      if (pipelineOrConfig.limit) {
        pipeline.push({ $limit: pipelineOrConfig.limit });
      }

      if (pipelineOrConfig.project) {
        pipeline.push({ $project: pipelineOrConfig.project });
      }
    } else {
      throw new Error('Pipeline must be an array or configuration object');
    }

    // Prepend tenant filter
    const baseQuery = this.buildBaseQuery({});
    pipeline.unshift({ $match: baseQuery });

    return await this.model.aggregate(pipeline);
  }
}

module.exports = DocumentRepository;

