/**
 * Observability & Metrics System
 * 
 * Provides:
 * - Prometheus metrics
 * - Health checks
 * - Performance monitoring
 * - Custom metrics
 * 
 * Design Patterns:
 * - Singleton Pattern (metrics registry)
 * - Observer Pattern (collect metrics)
 * - Decorator Pattern (instrument functions)
 */

const promClient = require('prom-client');
const { logger } = require('./Logger');

class Metrics {
  constructor() {
    // Create registry
    this.register = new promClient.Registry();
    
    // Add default metrics (CPU, memory, etc.)
    promClient.collectDefaultMetrics({ register: this.register });
    
    // HTTP request metrics
    this.httpRequestDuration = new promClient.Histogram({
      name: 'http_request_duration_ms',
      help: 'Duration of HTTP requests in milliseconds',
      labelNames: ['method', 'route', 'status_code', 'tenant_id'],
      buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    });
    this.register.registerMetric(this.httpRequestDuration);
    
    this.httpRequestTotal = new promClient.Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status_code', 'tenant_id']
    });
    this.register.registerMetric(this.httpRequestTotal);
    
    this.httpErrorsTotal = new promClient.Counter({
      name: 'http_errors_total',
      help: 'Total number of HTTP errors',
      labelNames: ['method', 'route', 'status_code', 'tenant_id', 'error_code']
    });
    this.register.registerMetric(this.httpErrorsTotal);
    
    // Database metrics
    this.dbQueryDuration = new promClient.Histogram({
      name: 'db_query_duration_ms',
      help: 'Duration of database queries in milliseconds',
      labelNames: ['operation', 'collection', 'tenant_id'],
      buckets: [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000]
    });
    this.register.registerMetric(this.dbQueryDuration);
    
    this.dbOperationsTotal = new promClient.Counter({
      name: 'db_operations_total',
      help: 'Total number of database operations',
      labelNames: ['operation', 'collection', 'tenant_id', 'success']
    });
    this.register.registerMetric(this.dbOperationsTotal);
    
    // Repository metrics
    this.repositoryOperations = new promClient.Counter({
      name: 'repository_operations_total',
      help: 'Total number of repository operations',
      labelNames: ['repository', 'operation', 'tenant_id']
    });
    this.register.registerMetric(this.repositoryOperations);
    
    // Audit trail metrics
    this.auditEventsTotal = new promClient.Counter({
      name: 'audit_events_total',
      help: 'Total number of audit events',
      labelNames: ['event_type', 'tenant_id', 'user_id']
    });
    this.register.registerMetric(this.auditEventsTotal);
    
    // Authentication metrics
    this.authAttemptsTotal = new promClient.Counter({
      name: 'auth_attempts_total',
      help: 'Total number of authentication attempts',
      labelNames: ['result', 'tenant_id']
    });
    this.register.registerMetric(this.authAttemptsTotal);
    
    // Active users gauge
    this.activeUsers = new promClient.Gauge({
      name: 'active_users',
      help: 'Number of active users',
      labelNames: ['tenant_id']
    });
    this.register.registerMetric(this.activeUsers);
    
    // Custom business metrics
    this.customMetrics = new Map();
  }
  
  /**
   * Record HTTP request
   */
  recordHttpRequest(method, route, statusCode, duration, tenantId = 'unknown') {
    this.httpRequestDuration.observe(
      { method, route, status_code: statusCode, tenant_id: tenantId },
      duration
    );
    
    this.httpRequestTotal.inc({
      method,
      route,
      status_code: statusCode,
      tenant_id: tenantId
    });
    
    // Record errors
    if (statusCode >= 400) {
      this.httpErrorsTotal.inc({
        method,
        route,
        status_code: statusCode,
        tenant_id: tenantId,
        error_code: statusCode >= 500 ? 'server_error' : 'client_error'
      });
    }
  }
  
  /**
   * Record database query
   */
  recordDbQuery(operation, collection, duration, success, tenantId = 'unknown') {
    this.dbQueryDuration.observe(
      { operation, collection, tenant_id: tenantId },
      duration
    );
    
    this.dbOperationsTotal.inc({
      operation,
      collection,
      tenant_id: tenantId,
      success: success ? 'true' : 'false'
    });
  }
  
  /**
   * Record repository operation
   */
  recordRepositoryOperation(repository, operation, tenantId = 'unknown') {
    this.repositoryOperations.inc({
      repository,
      operation,
      tenant_id: tenantId
    });
  }
  
  /**
   * Record audit event
   */
  recordAuditEvent(eventType, tenantId, userId) {
    this.auditEventsTotal.inc({
      event_type: eventType,
      tenant_id: tenantId || 'unknown',
      user_id: userId || 'unknown'
    });
  }
  
  /**
   * Record authentication attempt
   */
  recordAuthAttempt(success, tenantId = 'unknown') {
    this.authAttemptsTotal.inc({
      result: success ? 'success' : 'failure',
      tenant_id: tenantId
    });
  }
  
  /**
   * Update active users count
   */
  setActiveUsers(count, tenantId = 'unknown') {
    this.activeUsers.set({ tenant_id: tenantId }, count);
  }
  
  /**
   * Create custom counter
   */
  createCounter(name, help, labelNames = []) {
    if (this.customMetrics.has(name)) {
      return this.customMetrics.get(name);
    }
    
    const counter = new promClient.Counter({
      name,
      help,
      labelNames
    });
    
    this.register.registerMetric(counter);
    this.customMetrics.set(name, counter);
    
    return counter;
  }
  
  /**
   * Create custom gauge
   */
  createGauge(name, help, labelNames = []) {
    if (this.customMetrics.has(name)) {
      return this.customMetrics.get(name);
    }
    
    const gauge = new promClient.Gauge({
      name,
      help,
      labelNames
    });
    
    this.register.registerMetric(gauge);
    this.customMetrics.set(name, gauge);
    
    return gauge;
  }
  
  /**
   * Create custom histogram
   */
  createHistogram(name, help, labelNames = [], buckets = [0.1, 0.5, 1, 5, 10]) {
    if (this.customMetrics.has(name)) {
      return this.customMetrics.get(name);
    }
    
    const histogram = new promClient.Histogram({
      name,
      help,
      labelNames,
      buckets
    });
    
    this.register.registerMetric(histogram);
    this.customMetrics.set(name, histogram);
    
    return histogram;
  }
  
  /**
   * Get metrics in Prometheus format
   */
  async getMetrics() {
    return await this.register.metrics();
  }
  
  /**
   * Reset all metrics (for testing)
   */
  reset() {
    this.register.resetMetrics();
  }
  
  /**
   * Register metrics middleware
   */
  static registerMiddleware(fastify) {
    // Use singleton instance
    const metricsInstance = metrics;
    
    // Expose metrics endpoint
    fastify.get('/metrics', async (request, reply) => {
      reply.header('Content-Type', metricsInstance.register.contentType);
      return await metricsInstance.getMetrics();
    });
    
    // Track HTTP requests
    fastify.addHook('onResponse', async (request, reply) => {
      const context = request.context;
      if (!context) return;
      
      const duration = context.getDuration();
      const tenantId = context.tenantId || 'unknown';
      
      metricsInstance.recordHttpRequest(
        request.method,
        request.routerPath || request.url,
        reply.statusCode,
        duration,
        tenantId
      );
    });
    
    // Make metrics available globally
    fastify.decorate('metrics', metricsInstance);
    
    logger.info('Metrics middleware registered');
  }
}

// Singleton instance - create once and reuse
const metrics = new Metrics();

/**
 * Health Check Manager
 */
class HealthCheck {
  constructor() {
    this.checks = new Map();
  }
  
  /**
   * Register health check
   */
  register(name, checkFn) {
    this.checks.set(name, checkFn);
  }
  
  /**
   * Run all health checks
   */
  async runChecks() {
    const results = {};
    let overall = 'healthy';
    
    for (const [name, checkFn] of this.checks.entries()) {
      try {
        const result = await Promise.race([
          checkFn(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 5000)
          )
        ]);
        
        results[name] = {
          status: result ? 'healthy' : 'unhealthy',
          ...(typeof result === 'object' ? result : {})
        };
        
        if (!result || (typeof result === 'object' && result.status === 'unhealthy')) {
          overall = 'unhealthy';
        }
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error.message
        };
        overall = 'unhealthy';
      }
    }
    
    return {
      status: overall,
      checks: results,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    };
  }
  
  /**
   * Register health check endpoints
   */
  static registerEndpoints(fastify, mongoose) {
    const health = new HealthCheck();
    
    // Register checks
    health.register('database', async () => {
      if (mongoose.connection.readyState !== 1) {
        return { status: 'unhealthy', message: 'Database not connected' };
      }
      
      // Ping database
      await mongoose.connection.db.admin().ping();
      
      return {
        status: 'healthy',
        connections: mongoose.connection.readyState
      };
    });
    
    health.register('memory', () => {
      const usage = process.memoryUsage();
      const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
      const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
      const percentage = Math.round((usedMB / totalMB) * 100);
      
      return {
        status: percentage > 90 ? 'unhealthy' : 'healthy',
        heapUsed: `${usedMB}MB`,
        heapTotal: `${totalMB}MB`,
        percentage: `${percentage}%`
      };
    });
    
    health.register('disk', () => {
      // Placeholder - would check disk space in production
      return { status: 'healthy' };
    });
    
    // Health endpoint (detailed)
    fastify.get('/health', async (request, reply) => {
      const results = await health.runChecks();
      const statusCode = results.status === 'healthy' ? 200 : 503;
      return reply.status(statusCode).send(results);
    });
    
    // Readiness probe (k8s)
    fastify.get('/ready', async (request, reply) => {
      const dbCheck = await health.checks.get('database')();
      if (dbCheck.status === 'unhealthy') {
        return reply.status(503).send({ ready: false });
      }
      return reply.send({ ready: true });
    });
    
    // Liveness probe (k8s)
    fastify.get('/alive', async (request, reply) => {
      return reply.send({ alive: true, uptime: process.uptime() });
    });
    
    logger.info('Health check endpoints registered');
  }
}

module.exports = {
  Metrics,
  HealthCheck,
  metrics // Export the singleton instance created above
};

