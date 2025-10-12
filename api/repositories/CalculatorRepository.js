const BaseRepository = require('../core/BaseRepository');
const CalculatorModel = require('../models/Calculator');

/**
 * Repository for calculator definitions.
 * Ensures tenant scoping while allowing access to system defaults.
 */
class CalculatorRepository extends BaseRepository {
  constructor(tenantContext, requestContext = null) {
    super(CalculatorModel, tenantContext, requestContext);
  }

  /**
   * Extend base query with support for global "system" calculators.
   */
  buildBaseQuery(filters = {}) {
    const baseQuery = super.buildBaseQuery(filters);

    if (this.context.isPlatformAdmin) {
      return baseQuery;
    }

    const tenantIds = new Set(['system']);

    if (this.context.tenantId) {
      tenantIds.add(this.context.tenantId);
    }

    if (Array.isArray(this.context.allowedTenants)) {
      this.context.allowedTenants.forEach(tenantId => tenantIds.add(tenantId));
    }

    baseQuery.tenantId = { $in: Array.from(tenantIds).filter(Boolean) };

    return baseQuery;
  }

  /**
   * Retrieve calculators with optional filters and search, returning tenant-specific
   * definitions when available and falling back to system defaults.
   */
  async listCalculators(options = {}) {
    const { module, category, search, page, limit } = options;

    const filters = {};
    if (module) {
      filters.module = module;
    }
    if (category) {
      filters.category = category;
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [
        { name: regex },
        { description: regex },
        { tags: { $in: [regex] } }
      ];
    }

    const parsedLimit = parseInt(limit, 10);
    const hasPagination = Number.isFinite(parsedLimit);
    const safeLimit = hasPagination ? Math.min(Math.max(parsedLimit, 1), 100) : null;
    const safePage = hasPagination ? Math.max(parseInt(page, 10) || 1, 1) : 1;

    const queryOptions = { sort: { name: 1 } };

    if (hasPagination) {
      queryOptions.limit = safeLimit * 2;
      queryOptions.skip = (safePage - 1) * safeLimit;
    }

    const rawCalculators = await this.find(filters, queryOptions);
    const deduped = this._dedupeCalculators(rawCalculators);

    if (hasPagination) {
      return deduped.slice(0, safeLimit);
    }

    return deduped;
  }

  /**
   * Fetch calculator by external ID, preferring tenant definitions over system defaults.
   */
  async getByExternalId(calculatorId) {
    const calculators = await this.find({ id: calculatorId }, { limit: 5 });
    const deduped = this._dedupeCalculators(calculators);
    return deduped.length > 0 ? deduped[0] : null;
  }

  _dedupeCalculators(calculators) {
    const preferredTenantId = this.context.tenantId;
    const deduped = new Map();

    for (const calculator of calculators) {
      const existing = deduped.get(calculator.id);

      if (!existing) {
        deduped.set(calculator.id, calculator);
        continue;
      }

      const existingTenant = existing.tenantId;
      const currentTenant = calculator.tenantId;

      const existingMatchesPreferred = preferredTenantId && existingTenant === preferredTenantId;
      const currentMatchesPreferred = preferredTenantId && currentTenant === preferredTenantId;

      if (currentMatchesPreferred && !existingMatchesPreferred) {
        deduped.set(calculator.id, calculator);
        continue;
      }

      if (existingTenant === 'system' && currentTenant !== 'system') {
        deduped.set(calculator.id, calculator);
        continue;
      }
    }

    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }
}

module.exports = CalculatorRepository;
