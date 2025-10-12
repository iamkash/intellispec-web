/**
 * Base Repository
 * 
 * Abstract base class for all data repositories.
 * Automatically handles tenant scoping, soft deletes, and common operations.
 * 
 * Design Patterns:
 * - Repository Pattern (abstract data access)
 * - Template Method Pattern (define algorithm skeleton)
 * - Strategy Pattern (different query strategies based on tenant context)
 * - Chain of Responsibility (query building pipeline)
 * 
 * Principles:
 * - Single Responsibility: Only handles data access
 * - Open/Closed: Extend for new features, closed for modification
 * - Dependency Inversion: Depends on abstractions (TenantContext)
 * - DRY: Tenant filtering logic in ONE place
 */

const TenantContext = require('./TenantContext');
const { AuditTrail } = require('./AuditTrail');
const { NotFoundError, DatabaseError } = require('./ErrorHandler');
const { RequestContextManager } = require('./RequestContext');

class BaseRepository {
  /**
   * @param {Object} model - Mongoose model
   * @param {TenantContext} tenantContext - Tenant context
   * @param {RequestContext} requestContext - Optional request context for audit logging
   */
  constructor(model, tenantContext, requestContext = null) {
    if (!model) {
      throw new Error('Model is required for repository');
    }

    if (!(tenantContext instanceof TenantContext)) {
      throw new Error('TenantContext is required for repository');
    }

    this.model = model;
    this.context = tenantContext;
    this.requestContext = requestContext; // Store for audit logging
  }

  /**
   * Build base query with automatic tenant filtering
   * 
   * @param {Object} additionalFilters - Additional query filters
   * @returns {Object} MongoDB query object
   */
  buildBaseQuery(additionalFilters = {}) {
    const query = {
      deleted: { $ne: true }, // Soft delete filter
      ...additionalFilters
    };

    // Apply tenant filter (null for platform admins)
    const tenantFilter = this.context.getTenantFilter();
    if (tenantFilter) {
      Object.assign(query, tenantFilter);
    }

    return query;
  }

  /**
   * Find documents with automatic tenant scoping
   * 
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options (projection, sort, limit)
   * @returns {Promise<Array>}
   */
  async find(filters = {}, options = {}) {
    const query = this.buildBaseQuery(filters);
    
    let mongoQuery = this.model.find(query);

    if (options.projection) {
      mongoQuery = mongoQuery.select(options.projection);
    }

    if (options.sort) {
      mongoQuery = mongoQuery.sort(options.sort);
    }

    if (options.limit) {
      mongoQuery = mongoQuery.limit(options.limit);
    }

    if (options.skip) {
      mongoQuery = mongoQuery.skip(options.skip);
    }

    return await mongoQuery.lean().exec();
  }

  /**
   * Find one document with automatic tenant scoping
   * 
   * @param {Object} filters - Query filters
   * @param {Object} options - Query options
   * @returns {Promise<Object|null>}
   */
  async findOne(filters = {}, options = {}) {
    const query = this.buildBaseQuery(filters);
    
    let mongoQuery = this.model.findOne(query);

    if (options.projection) {
      mongoQuery = mongoQuery.select(options.projection);
    }

    return await mongoQuery.lean().exec();
  }

  /**
   * Find by ID with automatic tenant scoping
   * 
   * @param {string} id - Document ID
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    return await this.findOne({ id });
  }

  /**
   * Count documents with automatic tenant scoping
   * 
   * @param {Object} filters - Query filters
   * @returns {Promise<number>}
   */
  async count(filters = {}) {
    const query = this.buildBaseQuery(filters);
    return await this.model.countDocuments(query).exec();
  }

  /**
   * Paginated find with automatic tenant scoping
   * 
   * @param {Object} filters - Query filters
   * @param {Object} options - Pagination options
   * @returns {Promise<{data: Array, total: number, page: number, totalPages: number}>}
   */
  async findWithPagination(filters = {}, options = {}) {
    const { page = 1, limit = 20, sort = {}, projection } = options;
    const skip = (page - 1) * limit;

    const query = this.buildBaseQuery(filters);

    const [data, total] = await Promise.all([
      this.find(filters, { projection, sort, limit, skip }),
      this.count(filters)
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Create document with automatic tenant assignment
   * 
   * @param {Object} data - Document data
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      const doc = {
        ...data,
        created_date: new Date(),
        last_updated: new Date()
      };

      // Assign tenant if not platform admin
      if (!this.context.isPlatformAdmin && this.context.tenantId) {
        doc.tenantId = this.context.tenantId;
      }

      // Assign creator
      if (this.context.userId) {
        doc.created_by = this.context.userId;
        doc.last_updated_by = this.context.userId;
      }

      const created = await this.model.create(doc);
      const result = created.toObject();
      
      // Audit logging (use explicit context or try to get from AsyncLocalStorage)
      const requestContext = this.requestContext || RequestContextManager.getCurrentContext();
      
      if (requestContext) {
        await AuditTrail.logCreate(
          this.context,
          result.type || this.model.modelName,
          result.id || result._id.toString(),
          result,
          requestContext.getAuditMetadata()
        );
      }
      
      return result;
    } catch (error) {
      throw new DatabaseError(`Failed to create ${this.model.modelName}`, {
        originalError: error.message
      });
    }
  }

  /**
   * Update document with automatic tenant scoping
   * 
   * @param {string} id - Document ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object|null>}
   */
  async update(id, updates) {
    try {
      const query = this.buildBaseQuery({ id });

      // Get before state for audit trail
      const before = await this.model.findOne(query).lean().exec();
      
      if (!before) {
        throw new NotFoundError(this.model.modelName, id);
      }

      const updated = await this.model.findOneAndUpdate(
        query,
        {
          $set: {
            ...updates,
            last_updated: new Date(),
            last_updated_by: this.context.userId
          }
        },
        { new: true }
      ).lean().exec();

      // Audit logging (use explicit context or try to get from AsyncLocalStorage)
      const requestContext = this.requestContext || RequestContextManager.getCurrentContext();
      if (requestContext && updated) {
        await AuditTrail.logUpdate(
          this.context,
          updated.type || this.model.modelName,
          id,
          before,
          updated,
          requestContext.getAuditMetadata()
        );
      }

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update ${this.model.modelName}`, {
        originalError: error.message
      });
    }
  }

  /**
   * Soft delete document with automatic tenant scoping
   * 
   * @param {string} id - Document ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    try {
      const query = this.buildBaseQuery({ id });

      // Get document before deletion for audit trail
      const doc = await this.model.findOne(query).lean().exec();
      
      if (!doc) {
        throw new NotFoundError(this.model.modelName, id);
      }

      const deleted = await this.model.findOneAndUpdate(
        query,
        {
          $set: {
            deleted: true,
            deleted_at: new Date(),
            deleted_by: this.context.userId
          }
        },
        { new: true }
      ).lean().exec();

      // Audit logging (use explicit context or try to get from AsyncLocalStorage)
      const requestContext = this.requestContext || RequestContextManager.getCurrentContext();
      if (requestContext && deleted) {
        await AuditTrail.logDelete(
          this.context,
          doc.type || this.model.modelName,
          id,
          doc,
          requestContext.getAuditMetadata()
        );
      }

      return !!deleted;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete ${this.model.modelName}`, {
        originalError: error.message
      });
    }
  }

  /**
   * Hard delete document (permanent) - platform admin only
   * 
   * @param {string} id - Document ID
   * @returns {Promise<boolean>}
   */
  async hardDelete(id) {
    if (!this.context.isPlatformAdmin) {
      throw new Error('Hard delete requires platform admin privileges');
    }

    const result = await this.model.deleteOne({ id }).exec();
    return result.deletedCount > 0;
  }

  /**
   * Run aggregation with automatic tenant scoping
   * 
   * @param {Array} pipeline - Aggregation pipeline
   * @returns {Promise<Array>}
   */
  async aggregate(pipeline) {
    // Prepend $match stage with tenant filter
    const tenantFilter = this.context.getTenantFilter();
    const matchStage = {
      $match: {
        deleted: { $ne: true },
        ...(tenantFilter || {})
      }
    };

    const fullPipeline = [matchStage, ...pipeline];
    return await this.model.aggregate(fullPipeline).exec();
  }

  /**
   * Bulk operations (advanced - override in subclasses)
   */
  async bulkCreate(documents) {
    const docs = documents.map(doc => ({
      ...doc,
      tenantId: this.context.isPlatformAdmin ? doc.tenantId : this.context.tenantId,
      created_date: new Date(),
      created_by: this.context.userId
    }));

    const result = await this.model.insertMany(docs);
    return result.map(r => r.toObject());
  }
}

module.exports = BaseRepository;

