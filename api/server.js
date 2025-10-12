// Simple Fastify API server for saving wizard states
// Design: routes → controllers → services → repositories (file-backed JSON store)

require('dotenv').config();
const Fastify = require('fastify');
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Auto-load all routes
const RouteLoader = require('./core/RouteLoader');
const FileStorage = require('./core/FileStorage');

// Framework Components
const DatabaseManager = require('./core/DatabaseManager');
const { RequestContextManager } = require('./core/RequestContext');
const { ErrorHandler } = require('./core/ErrorHandler');
const { Metrics, HealthCheck } = require('./core/Metrics');
const { TenantUsageMonitor } = require('./core/TenantUsageMonitoring');
const { RateLimiter } = require('./core/RateLimiter');
const { FeatureFlags } = require('./core/FeatureFlags');
const { initializeCache } = require('./core/CacheManager');
const { logger } = require('./core/Logger');

if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_AUTH === undefined) {
  process.env.ENFORCE_AUTH = 'true';
  logger.info('ENFORCE_AUTH enabled by default for production environment');
}

// WebSocket support
const websocket = require('@fastify/websocket');

async function buildServer() {
  const fastify = Fastify({
    logger: false, // Disable Fastify's logger, using our own framework logger
    bodyLimit: 100 * 1024 * 1024 // 100MB limit to accommodate inspection payloads with images/voice/signatures
  });

  await fastify.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  // Register multipart support for file uploads
  await fastify.register(multipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB max file size for inspection images/voice/signatures
      files: 25, // Max 25 files per request (increased for inspection images)
    }
  });

  // Register WebSocket support
  await fastify.register(websocket);

  // ============================================
  // FRAMEWORK MIDDLEWARE (Must be registered BEFORE routes)
  // ============================================
  logger.info('Initializing framework components...');
  
  // 1. Request Context - Creates context for every request
  RequestContextManager.registerMiddleware(fastify);
  
  // 2. Error Handler - Standardizes error responses
  ErrorHandler.registerMiddleware(fastify);
  
  // 3. Metrics - Observability
  Metrics.registerMiddleware(fastify);
  
  // 4. Health Checks - Register health endpoints (note: DB connection done later)
  // We'll register these endpoints now, they'll work once DB is connected
  
  // 5. Tenant Usage Monitoring - Track API usage per tenant
  TenantUsageMonitor.registerMiddleware(fastify);
  
  // 5. Rate Limiting - Prevent abuse
  RateLimiter.registerMiddleware(fastify, {
    skipPaths: ['/health', '/ready', '/alive', '/metrics']
  });
  
  // 6. Feature Flags - A/B testing and feature toggles
  FeatureFlags.registerMiddleware(fastify);
  
  // 7. Cache Manager - Multi-level caching
  initializeCache({
    defaultTtl: 300000, // 5 minutes
    maxSize: 1000
  });
  
  logger.info('Framework components initialized successfully');
  // ============================================

  // Note: Will register full health checks after MongoDB connection in start()

  // ============================================
  // AUTO-REGISTER ALL ROUTES
  // ============================================
  // Uses RouteLoader to automatically discover and register all routes from api/routes/
  // Configuration is in api/core/RouteLoader.js
  
  const routeStats = await RouteLoader.autoRegisterRoutes(fastify);
  logger.info('Route registration summary', routeStats);

  // Initialize Vector Update Service for automatic vector maintenance
  const VectorUpdateService = require('./services/vectorUpdateService');
  let vectorService = null;
  
  if (process.env.ENABLE_VECTOR_SERVICE !== 'false') {
    try {
      // VectorUpdateService now uses DatabaseManager (no mongoUri needed)
      const vectorConfig = {
        openaiKey: process.env.OPENAI_API_KEY,
        embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        monitoring: process.env.NODE_ENV === 'production',
        allowedCollections: process.env.VECTOR_ALLOWED_COLLECTIONS,
        discoveryEnabled: process.env.VECTOR_DISCOVERY_ENABLED,
        maxCollections: process.env.VECTOR_MAX_COLLECTIONS,
        batchSize: process.env.VECTOR_BATCH_SIZE,
        rateLimitDelay: process.env.VECTOR_RATE_LIMIT_DELAY,
        retryDelay: process.env.VECTOR_RETRY_DELAY,
        debounceDelay: process.env.VECTOR_DEBOUNCE_MS,
        maxRetries: process.env.VECTOR_MAX_RETRIES,
        discoverySampleLimit: process.env.VECTOR_DISCOVERY_SAMPLE_LIMIT
      };
      vectorService = new VectorUpdateService(vectorConfig);
      
      await vectorService.start();
      
      logger.info('Vector Update Service started successfully', {
        embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
        monitoring: process.env.NODE_ENV === 'production',
        discoveryEnabled: vectorService.config.discovery.enabled,
        allowedCollections: vectorService.config.discovery.allowedCollections,
        healthEndpoint: '/api/vector-service/health',
        metricsEndpoint: '/api/vector-service/metrics'
      });
      
      // Add health check endpoint
      fastify.get('/api/vector-service/health', async (request, reply) => {
        const metrics = vectorService.getMetrics();
        const isHealthy = vectorService.isHealthy();
        
        return reply.code(isHealthy ? 200 : 503).send({
          status: isHealthy ? 'healthy' : 'unhealthy',
          metrics,
          timestamp: new Date().toISOString()
        });
      });
      
      // Add metrics endpoint
      fastify.get('/api/vector-service/metrics', async (request, reply) => {
        return reply.send(vectorService.getMetrics());
      });
      
      
    } catch (error) {
      logger.error('Failed to start Vector Update Service', {
        error: error.message,
        stack: error.stack
      });
    }
  } else {
    logger.info('Vector Update Service disabled', { 
      reason: 'ENABLE_VECTOR_SERVICE environment variable set to false' 
    });
  }
  
  // Graceful shutdown handling
  const gracefulShutdown = async () => {
    logger.info('Graceful shutdown initiated');
    
    // Stop vector service first
    if (vectorService) {
      logger.info('Stopping Vector Update Service');
      await vectorService.stop();
    }
    
    // Close Fastify server
    logger.info('Closing Fastify server');
    await fastify.close();
    
    // Close MongoDB connections via DatabaseManager
    logger.info('Closing MongoDB connections');
    const dbManager = DatabaseManager.getInstance();
    await dbManager.disconnect();
    
    logger.info('Graceful shutdown completed');
    process.exit(0);
  };
  
  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);

  // =============== AUTH ROUTES (Fastify) =================
  // Register auth routes directly with full prefix to avoid plugin prefix issues
  fastify.post('/api/auth/login', async (request, reply) => {
      try {
        const { email, password, tenantSlug } = request.body || {};
        if (!email || !password) {
          return reply.code(400).send({ error: 'Email and password are required', code: 'MISSING_CREDENTIALS' });
        }

        const db = mongoose.connection;
        if (!db || db.readyState !== 1) {
          return reply.code(500).send({ error: 'Database not connected', code: 'DB_NOT_CONNECTED' });
        }

        const tenantsCol = db.collection('tenants');
        const usersCol = db.collection('users');
        const membershipsCol = db.collection('memberships');
        const rolesCol = db.collection('roles');

        let tenantDoc = null;
        if (tenantSlug) {
          // Support both old schema (tenantSlug) and new schema (slug)
          tenantDoc = await tenantsCol.findOne({ 
            $or: [
              { slug: String(tenantSlug) },
              { tenantSlug: String(tenantSlug) }
            ],
            status: 'active' 
          });
          if (!tenantDoc) {
            return reply.code(404).send({ error: 'Tenant not found', code: 'TENANT_NOT_FOUND' });
          }
        }

        // Find user by email
        let userDoc = await usersCol.findOne({ email: String(email).toLowerCase() });
        
        if (!userDoc) {
          return reply.code(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        // Check if user is platform admin
        const isPlatformAdmin = userDoc.platformRole === 'platform_admin';

        // Platform admins can login without specifying a tenant or having memberships
        if (isPlatformAdmin) {
          // If no tenant specified, use first active tenant (or create a "platform" context)
          if (!tenantDoc) {
            tenantDoc = await tenantsCol.findOne({ status: 'active' });
            
            // If no tenants exist at all, create a platform-level context
            if (!tenantDoc) {
              tenantDoc = {
                id: 'platform',
                slug: 'platform',
                name: 'Platform Administration',
                status: 'active'
              };
            }
          }
          // Platform admins can access ANY tenant without membership check
        } else {
          // Regular users - verify tenant membership
          const userId = String(userDoc.id || userDoc.userId || userDoc._id);
          
          if (tenantDoc) {
            const tenantId = String(tenantDoc.id || tenantDoc._id);
            const membership = await membershipsCol.findOne({ 
              userId: userId,
              tenantId: tenantId
            });
            
            if (!membership) {
              return reply.code(403).send({ 
                error: 'You do not have access to this organization', 
                code: 'NO_TENANT_ACCESS' 
              });
            }
          } else {
            // No tenant specified - find user's first tenant via membership
            const membership = await membershipsCol.findOne({ userId: userId });
            if (membership) {
              const membershipTenantQuery = {
                $or: [
                  { id: membership.tenantId }
                ],
                status: 'active'
              };
              
              // Only try ObjectId if valid format
              if (/^[0-9a-fA-F]{24}$/.test(String(membership.tenantId))) {
                try {
                  membershipTenantQuery.$or.push({ _id: new mongoose.Types.ObjectId(String(membership.tenantId)) });
                } catch (e) {
                  // Ignore
                }
              }
              
              tenantDoc = await tenantsCol.findOne(membershipTenantQuery);
            }
          }

          // Regular users must have a tenant
          if (!tenantDoc) {
            return reply.code(401).send({ 
              error: 'No tenant access found. Please contact your administrator.', 
              code: 'NO_TENANT_ACCESS' 
            });
          }
        }

        if (userDoc.status && userDoc.status !== 'active') {
          return reply.code(403).send({ error: 'Account is not active', code: 'ACCOUNT_INACTIVE', status: userDoc.status });
        }

        const isValid = await bcrypt.compare(String(password), String(userDoc.password));
        if (!isValid) {
          return reply.code(401).send({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
        }

        const roleIds = Array.isArray(userDoc.roleIds) ? userDoc.roleIds : [];
        const roles = await rolesCol.find({ _id: { $in: roleIds } }).toArray();
        const isExternalCustomer = roles.some(r => r.isExternalCustomer);

        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        
        // Support both new schema (id) and old schema (userId)
        const finalUserId = String(userDoc.id || userDoc.userId || userDoc._id);
        const finalTenantId = String(tenantDoc.id || tenantDoc._id);
        const finalTenantSlug = String(tenantDoc.slug || tenantDoc.tenantSlug || '');
        
        const token = jwt.sign({
          userId: finalUserId,
          tenantId: finalTenantId,
          tenantSlug: finalTenantSlug,
          email: String(userDoc.email),
          platformRole: String(userDoc.platformRole || 'user')
        }, JWT_SECRET, {
          expiresIn: process.env.JWT_EXPIRES_IN || '24h',
          issuer: 'intellispec-auth',
          audience: finalTenantSlug
        });

        return reply.code(200).send({
          message: 'Login successful',
          token,
          user: {
            id: finalUserId,
            email: String(userDoc.email),
            name: String(userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || ''),
            status: String(userDoc.status || 'active'),
            platformRole: String(userDoc.platformRole || 'user'),
            isPlatformAdmin: isPlatformAdmin,
            roles: roles.map(r => ({ id: String(r._id), name: r.name, permissions: r.permissions || [], isExternalCustomer: !!r.isExternalCustomer })),
            tenantSlug: finalTenantSlug,
            tenantId: finalTenantId,
            tenantName: String(tenantDoc.name || ''),
            isExternalCustomer
          },
          expiresIn: '24h'
        });
      } catch (err) {
        request.log.error({ err }, 'Login error');
        return reply.code(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
      }
    });

  fastify.get('/api/auth/me', async (request, reply) => {
      try {
        const auth = request.headers['authorization'] || '';
        const token = typeof auth === 'string' && auth.startsWith('Bearer ') ? auth.slice(7) : '';
        if (!token) {
          return reply.code(401).send({ error: 'Authentication required', code: 'NOT_AUTHENTICATED' });
        }

        const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
        let payload;
        try {
          payload = jwt.verify(token, JWT_SECRET);
        } catch (err) {
          return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }

        const db = mongoose.connection;
        if (!db || db.readyState !== 1) {
          return reply.code(500).send({ error: 'Database not connected', code: 'DB_NOT_CONNECTED' });
        }

        const usersCol = db.collection('users');
        const tenantsCol = db.collection('tenants');
        const membershipsCol = db.collection('memberships');
        
        // Find user - support both old schema (userId) and new schema (id)
        // Build query dynamically to avoid ObjectId conversion errors
        const userQuery = {
          $or: [
            { id: String(payload.userId) },
            { userId: String(payload.userId) }
          ]
        };
        
        // Only try ObjectId conversion if it looks like a valid ObjectId (24 hex chars)
        if (/^[0-9a-fA-F]{24}$/.test(String(payload.userId))) {
          try {
            userQuery.$or.push({ _id: new mongoose.Types.ObjectId(String(payload.userId)) });
          } catch (e) {
            // Ignore invalid ObjectId
          }
        }
        
        const userDoc = await usersCol.findOne(userQuery);
        
        if (!userDoc) {
          return reply.code(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' });
        }

        // Find tenant - support both schemas
        const tenantQuery = {
          $or: [
            { id: String(payload.tenantId) }
          ]
        };
        
        // Only try ObjectId conversion if it looks like a valid ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(String(payload.tenantId))) {
          try {
            tenantQuery.$or.push({ _id: new mongoose.Types.ObjectId(String(payload.tenantId)) });
          } catch (e) {
            // Ignore invalid ObjectId
          }
        }
        
        const tenantDoc = await tenantsCol.findOne(tenantQuery);
        
        const userId = String(userDoc.id || userDoc.userId || userDoc._id);
        
        // Get user's membership for this tenant (if not platform admin)
        const membership = await membershipsCol.findOne({ 
          userId: userId,
          tenantId: payload.tenantId 
        });

        const isPlatformAdmin = userDoc.platformRole === 'platform_admin';

        return reply.code(200).send({
          user: {
            id: userId,
            email: String(userDoc.email),
            name: String(userDoc.name || `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim() || ''),
            status: String(userDoc.status || 'active'),
            platformRole: String(userDoc.platformRole || 'user'),
            isPlatformAdmin: isPlatformAdmin,
            roles: membership ? [membership.role] : (isPlatformAdmin ? ['platform_admin'] : []),
            tenantSlug: String(payload.tenantSlug || ''),
            tenantId: String(payload.tenantId || ''),
            tenantName: tenantDoc ? String(tenantDoc.name) : '',
            createdAt: userDoc.createdAt || null,
            updatedAt: userDoc.updatedAt || null
          }
        });
      } catch (err) {
        request.log.error({ err }, 'Get /auth/me error');
        return reply.code(500).send({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
      }
    });

  // Logout route (JWT-based auth - logout is client-side, but endpoint for consistency)
  fastify.post('/api/auth/logout', async (request, reply) => {
    try {
      // In a JWT-based system, logout is handled client-side by removing the token
      // We can add token blacklisting here if needed in the future
      // For now, just return success and let the client clear the token
      
      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (authHeader) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');
          logger.info('[Auth] User logged out', {
            userId: decoded.userId || 'unknown',
            tenantId: decoded.tenantId || 'unknown'
          });
        } catch (e) {
          // Token invalid - still allow logout
        }
      }
      
      return reply.send({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('[Auth] Logout error:', error);
      return reply.code(500).send({ 
        error: 'Logout failed', 
        code: 'LOGOUT_ERROR' 
      });
    }
  });

  // Token refresh route - Generate new token from valid old token
  fastify.post('/api/auth/refresh', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Token required', code: 'NO_TOKEN' });
      }

      const oldToken = authHeader.substring(7);
      
      // Verify old token (allow recently expired tokens within grace period)
      let decoded;
      try {
        decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
          ignoreExpiration: false
        });
      } catch (error) {
        // If token is expired but within grace period (1 hour), allow refresh
        if (error.name === 'TokenExpiredError') {
          try {
            decoded = jwt.verify(oldToken, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production', {
              ignoreExpiration: true
            });
            
            // Check if expired less than 1 hour ago
            const expiredAt = decoded.exp * 1000;
            const now = Date.now();
            const gracePeriod = 60 * 60 * 1000; // 1 hour
            
            if (now - expiredAt > gracePeriod) {
              return reply.code(401).send({ error: 'Token expired beyond grace period', code: 'TOKEN_EXPIRED' });
            }
          } catch (e) {
            return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
          }
        } else {
          return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
        }
      }

      // Generate new token with same payload
      const newToken = jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          tenantId: decoded.tenantId,
          tenantSlug: decoded.tenantSlug,
          platformRole: decoded.platformRole
        },
        process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
        { 
          expiresIn: '24h',
          audience: decoded.tenantSlug || 'intellispec',
          issuer: 'intellispec-auth'
        }
      );

      logger.info('[Auth] Token refreshed', {
        userId: decoded.userId,
        tenantId: decoded.tenantId
      });

      return reply.send({
        success: true,
        token: newToken
      });
    } catch (error) {
      logger.error('[Auth] Token refresh error:', error);
      return reply.code(500).send({ 
        error: 'Token refresh failed', 
        code: 'REFRESH_ERROR' 
      });
    }
  });

  // Profile update route - Update user profile information
  fastify.put('/api/auth/profile', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization || request.headers.Authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return reply.code(401).send({ error: 'Authentication required', code: 'NOT_AUTHENTICATED' });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production');

      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        return reply.code(500).send({ error: 'Database not connected', code: 'DB_NOT_CONNECTED' });
      }

      const usersCol = db.collection('users');
      
      // Get update data
      const updates = request.body || {};
      
      // Don't allow updating sensitive fields via this endpoint
      delete updates.password;
      delete updates.email;
      delete updates.platformRole;
      delete updates.status;
      delete updates.id;
      delete updates.userId;
      delete updates._id;
      
      // Update user profile
      const result = await usersCol.updateOne(
        { id: decoded.userId },
        { 
          $set: { 
            ...updates, 
            updatedAt: new Date() 
          } 
        }
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: 'User not found', code: 'USER_NOT_FOUND' });
      }

      // Fetch updated user
      const updatedUser = await usersCol.findOne({ id: decoded.userId });

      logger.info('[Auth] Profile updated', {
        userId: decoded.userId,
        fields: Object.keys(updates)
      });

      return reply.send({
        success: true,
        user: {
          id: updatedUser.id,
          userId: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          avatar: updatedUser.avatar,
          name: updatedUser.name
        }
      });
    } catch (error) {
      logger.error('[Auth] Profile update error:', error);
      
      if (error.name === 'JsonWebTokenError') {
        return reply.code(401).send({ error: 'Invalid token', code: 'INVALID_TOKEN' });
      }
      
      return reply.code(500).send({ 
        error: 'Profile update failed', 
        code: 'UPDATE_ERROR' 
      });
    }
  });

  // Auth logging endpoint - Accepts auth event logs from frontend
  fastify.post('/api/logs/auth', async (request, reply) => {
    try {
      const logEvent = request.body;
      
      // Log to backend logger for audit trail
      logger.info('[Auth Log]', {
        tenantSlug: logEvent.tenantSlug,
        userId: logEvent.userId,
        email: logEvent.email,
        action: logEvent.action,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        metadata: logEvent.metadata,
        timestamp: logEvent.timestamp
      });
      
      // Could also store in database if needed
      // For now, just log to console/file via logger
      
      return reply.send({ success: true });
    } catch (error) {
      logger.error('[Auth Log] Error logging auth event:', error);
      // Don't fail the request - logging should be non-blocking
      return reply.send({ success: true }); // Still return success
    }
  });

  // Note: /health, /ready, /alive endpoints registered after MongoDB connection
  // See HealthCheck.registerEndpoints() in start() function below

  return fastify;
}

async function start() {
  try {
    // Initialize Database Manager with framework-level configuration
    const dbManager = DatabaseManager.getInstance({
      uri: process.env.MONGODB_URI,
      maxPoolSize: process.env.DB_MAX_POOL_SIZE || 10,
      minPoolSize: process.env.DB_MIN_POOL_SIZE || 5,
      enableMonitoring: true,
      enableLeakDetection: true
    });
    
    // Connect with retry logic and monitoring
    await dbManager.connect();
    
    // Initialize FileStorage after MongoDB connection
    FileStorage.init();

    const server = await buildServer();
    
    // Register Health Check endpoints (uses DatabaseManager)
    HealthCheck.registerEndpoints(server, dbManager.getMongoose());
    const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
    const host = process.env.API_HOST || '0.0.0.0';
    await server.listen({ port, host });
    
    logger.info('Server started successfully', {
      port,
      host,
      env: process.env.NODE_ENV || 'development',
      endpoints: {
        health: `http://${host}:${port}/health`,
        metrics: `http://${host}:${port}/metrics`,
        api: `http://${host}:${port}/api`
      }
    });
    
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
}

// Start only if called directly (not during tests)
if (require.main === module) {
  start();
}

module.exports = { buildServer };
