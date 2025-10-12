/**
 * Database Manager
 * 
 * Centralized database connection management for the framework.
 * Handles connection pooling, monitoring, health checks, and lifecycle.
 * 
 * Design Patterns:
 * - Singleton Pattern (single connection manager)
 * - Factory Pattern (connection creation)
 * - Observer Pattern (connection events)
 * - Retry Pattern (exponential backoff)
 * 
 * Features:
 * - Centralized connection management
 * - Connection pool monitoring
 * - Automatic reconnection with retry
 * - Health checks and metrics
 * - Graceful shutdown
 * - Environment-based configuration
 * - Connection leak detection
 * - Integration with Logger and Metrics
 */

const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');
const { logger } = require('./Logger');

class DatabaseManager {
  static instance = null;
  
  /**
   * Get singleton instance
   * @param {Object} config - Configuration options
   * @returns {DatabaseManager} Singleton instance
   */
  static getInstance(config = {}) {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager(config);
    }
    return DatabaseManager.instance;
  }
  
  constructor(config) {
    this.config = this.buildConfig(config);
    this.mongoose = mongoose;
    this.nativeClient = null;
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.reconnectionAttempts = 0;
    this.lastError = null;
    this.lastConnectionTime = null;
    this.monitoringInterval = null;
    this.metrics = {
      totalConnections: 0,
      totalDisconnections: 0,
      totalReconnections: 0,
      totalErrors: 0,
      uptime: 0,
      lastHealthCheck: null,
      lastLeakCheckAt: null,
      lastTotalCreated: null
    };
  }
  
  /**
   * Build configuration with environment-based defaults
   * @param {Object} config - User configuration
   * @returns {Object} Complete configuration
   */
  buildConfig(config) {
    const env = process.env.NODE_ENV || 'development';
    const isProduction = env === 'production';
    
    return {
      uri: config.uri || process.env.MONGODB_URI,
      database: config.database || process.env.DATABASE_NAME,
      poolSize: {
        min: parseInt(config.minPoolSize || process.env.DB_MIN_POOL_SIZE || (isProduction ? '5' : '2')),
        max: parseInt(config.maxPoolSize || process.env.DB_MAX_POOL_SIZE || (isProduction ? '50' : '10'))
      },
      timeouts: {
        connect: parseInt(config.connectTimeoutMS || process.env.DB_CONNECT_TIMEOUT || '10000'),
        serverSelection: parseInt(config.serverSelectionTimeoutMS || process.env.DB_SERVER_SELECTION_TIMEOUT || '5000'),
        socket: parseInt(config.socketTimeoutMS || process.env.DB_SOCKET_TIMEOUT || '45000'),
        maxIdleTime: parseInt(config.maxIdleTimeMS || process.env.DB_MAX_IDLE_TIME || (isProduction ? '60000' : '300000')),
        waitQueueTimeout: parseInt(config.waitQueueTimeoutMS || process.env.DB_WAIT_QUEUE_TIMEOUT || '5000')
      },
      retry: {
        enabled: config.enableRetry !== false,
        maxAttempts: parseInt(config.maxRetryAttempts || process.env.DB_MAX_RETRY_ATTEMPTS || '5'),
        initialDelayMS: parseInt(config.initialRetryDelayMS || '1000'),
        backoffMultiplier: parseFloat(config.retryBackoffMultiplier || '2'),
        maxDelayMS: parseInt(config.maxRetryDelayMS || '30000')
      },
      monitoring: {
        enabled: config.enableMonitoring !== false,
        logInterval: parseInt(config.logIntervalMS || process.env.DB_MONITOR_INTERVAL || '60000'),
        enableLeakDetection: config.enableLeakDetection !== false
      },
      reconnect: {
        autoReconnect: config.autoReconnect !== false,
        reconnectTries: parseInt(config.reconnectTries || '30'),
        reconnectInterval: parseInt(config.reconnectInterval || '1000')
      }
    };
  }
  
  /**
   * Connect to database with retry logic
   * @returns {Promise<void>}
   */
  async connect() {
    if (this.isConnected) {
      logger.warn('Database already connected');
      return;
    }
    
    if (!this.config.uri) {
      throw new Error('MONGODB_URI is required for database connection');
    }
    
    logger.info('Initializing database connection', {
      maxPoolSize: this.config.poolSize.max,
      minPoolSize: this.config.poolSize.min,
      environment: process.env.NODE_ENV || 'development'
    });
    
    await this.connectWithRetry();
    this.setupEventListeners();
    
    if (this.config.monitoring.enabled) {
      this.startMonitoring();
    }
    
    this.metrics.totalConnections++;
    this.lastConnectionTime = Date.now();
  }
  
  /**
   * Attempt connection with exponential backoff retry
   * @returns {Promise<void>}
   */
  async connectWithRetry() {
    let attempt = 0;
    let delay = this.config.retry.initialDelayMS;
    
    while (attempt < this.config.retry.maxAttempts) {
      try {
        this.connectionAttempts++;
        await this.establishConnection();
        
        logger.info('Database connected successfully', {
          attempt: attempt + 1,
          totalAttempts: this.connectionAttempts,
          poolSize: this.config.poolSize.max
        });
        
        this.isConnected = true;
        return;
        
      } catch (error) {
        attempt++;
        this.lastError = error;
        this.metrics.totalErrors++;
        
        if (attempt >= this.config.retry.maxAttempts) {
          logger.error('Failed to connect to database after max attempts', {
            attempts: attempt,
            totalAttempts: this.connectionAttempts,
            error: error.message,
            stack: error.stack
          });
          throw new Error(`Database connection failed after ${attempt} attempts: ${error.message}`);
        }
        
        logger.warn(`Database connection attempt ${attempt} failed, retrying...`, {
          delay,
          nextAttempt: attempt + 1,
          maxAttempts: this.config.retry.maxAttempts,
          error: error.message
        });
        
        await this.sleep(delay);
        delay = Math.min(
          delay * this.config.retry.backoffMultiplier,
          this.config.retry.maxDelayMS
        );
      }
    }
  }
  
  /**
   * Establish database connection
   * @returns {Promise<void>}
   */
  async establishConnection() {
    const mongooseOptions = {
      minPoolSize: this.config.poolSize.min,
      maxPoolSize: this.config.poolSize.max,
      connectTimeoutMS: this.config.timeouts.connect,
      serverSelectionTimeoutMS: this.config.timeouts.serverSelection,
      socketTimeoutMS: this.config.timeouts.socket,
      maxIdleTimeMS: this.config.timeouts.maxIdleTime,
      waitQueueTimeoutMS: this.config.timeouts.waitQueueTimeout
    };
    
    await mongoose.connect(this.config.uri, mongooseOptions);
    
    // Create native client for advanced operations (change streams, etc.)
    this.nativeClient = new MongoClient(this.config.uri, {
      minPoolSize: this.config.poolSize.min,
      maxPoolSize: this.config.poolSize.max,
      connectTimeoutMS: this.config.timeouts.connect,
      serverSelectionTimeoutMS: this.config.timeouts.serverSelection
    });
    
    await this.nativeClient.connect();
    
    logger.info('Native MongoDB client connected');
  }
  
  /**
   * Setup connection event listeners
   */
  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      logger.info('Mongoose connected', {
        readyState: mongoose.connection.readyState
      });
      this.isConnected = true;
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('Mongoose disconnected', {
        readyState: mongoose.connection.readyState
      });
      this.isConnected = false;
      this.metrics.totalDisconnections++;
      
      // Attempt reconnection if enabled
      if (this.config.reconnect.autoReconnect) {
        this.handleReconnection();
      }
    });
    
    mongoose.connection.on('error', (error) => {
      logger.error('Mongoose connection error', {
        error: error.message,
        code: error.code,
        readyState: mongoose.connection.readyState
      });
      this.lastError = error;
      this.metrics.totalErrors++;
    });
    
    mongoose.connection.on('reconnected', () => {
      logger.info('Mongoose reconnected', {
        reconnectionAttempts: this.reconnectionAttempts,
        readyState: mongoose.connection.readyState
      });
      this.isConnected = true;
      this.metrics.totalReconnections++;
      this.reconnectionAttempts = 0;
    });
    
    mongoose.connection.on('reconnectFailed', () => {
      logger.error('Mongoose reconnection failed', {
        reconnectionAttempts: this.reconnectionAttempts,
        maxAttempts: this.config.reconnect.reconnectTries
      });
    });
  }
  
  /**
   * Handle automatic reconnection
   */
  async handleReconnection() {
    if (this.reconnectionAttempts >= this.config.reconnect.reconnectTries) {
      logger.error('Max reconnection attempts reached', {
        attempts: this.reconnectionAttempts,
        maxAttempts: this.config.reconnect.reconnectTries
      });
      return;
    }
    
    this.reconnectionAttempts++;
    
    logger.info('Attempting to reconnect to database', {
      attempt: this.reconnectionAttempts,
      maxAttempts: this.config.reconnect.reconnectTries
    });
    
    try {
      await this.sleep(this.config.reconnect.reconnectInterval);
      await this.establishConnection();
      
      logger.info('Reconnection successful', {
        attempt: this.reconnectionAttempts
      });
      
      this.reconnectionAttempts = 0;
      this.isConnected = true;
      
    } catch (error) {
      logger.error('Reconnection failed', {
        attempt: this.reconnectionAttempts,
        error: error.message
      });
      
      if (this.reconnectionAttempts < this.config.reconnect.reconnectTries) {
        await this.handleReconnection();
      }
    }
  }
  
  /**
   * Start connection monitoring
   */
  startMonitoring() {
    logger.info('Starting database connection monitoring', {
      interval: this.config.monitoring.logInterval
    });
    
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.logConnectionStats();
        
        if (this.config.monitoring.enableLeakDetection) {
          await this.detectConnectionLeaks();
        }
        
        // Update uptime
        if (this.lastConnectionTime) {
          this.metrics.uptime = Date.now() - this.lastConnectionTime;
        }
        
      } catch (error) {
        logger.error('Database monitoring error', {
          error: error.message
        });
      }
    }, this.config.monitoring.logInterval);
  }
  
  /**
   * Log connection statistics
   */
  async logConnectionStats() {
    try {
      const stats = await this.getConnectionStats();
      
      if (!stats) {
        logger.warn('Unable to retrieve connection stats');
        return;
      }
      
      const previousTotal = this.metrics.lastTotalCreated;
      const createdSinceLastCheck = previousTotal !== null
        ? stats.totalCreated - previousTotal
        : null;

      logger.debug('Database connection stats', {
        ...stats,
        createdSinceLastCheck: createdSinceLastCheck !== null ? createdSinceLastCheck : 'N/A'
      });
      
      this.metrics.lastHealthCheck = Date.now();
      
      // Alert on high connection usage
      const utilizationPercent = (stats.activeConnections / stats.maxPoolSize) * 100;
      
      if (utilizationPercent > 80) {
        logger.warn('High database connection pool utilization', {
          utilization: `${utilizationPercent.toFixed(1)}%`,
          active: stats.activeConnections,
          max: stats.maxPoolSize,
          available: stats.availableConnections
        });
      }
      
      // Alert if no available connections
      if (stats.availableConnections === 0) {
        logger.error('Connection pool exhausted - no available connections', {
          active: stats.activeConnections,
          max: stats.maxPoolSize,
          totalCreated: stats.totalCreated
        });
      }
      
    } catch (error) {
      logger.error('Failed to log connection stats', {
        error: error.message
      });
    }
  }
  
  /**
   * Get current connection statistics
   * @returns {Promise<Object>} Connection stats
   */
  async getConnectionStats() {
    try {
      const db = mongoose.connection.db;
      if (!db) return null;
      
      const serverStatus = await db.admin().serverStatus();
      const connections = serverStatus.connections || {};
      
      return {
        activeConnections: connections.current || 0,
        availableConnections: connections.available || 0,
        totalCreated: connections.totalCreated || 0,
        maxPoolSize: this.config.poolSize.max,
        minPoolSize: this.config.poolSize.min,
        utilizationPercent: ((connections.current || 0) / this.config.poolSize.max * 100).toFixed(1),
        readyState: mongoose.connection.readyState,
        readyStateText: this.getReadyStateText(mongoose.connection.readyState)
      };
    } catch (error) {
      logger.error('Error getting connection stats', {
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Detect potential connection leaks
   */
  async detectConnectionLeaks() {
    try {
      const stats = await this.getConnectionStats();
      
      if (!stats) return;
      
      // Check for connection pool saturation
      if (stats.activeConnections >= stats.maxPoolSize * 0.9) {
        logger.warn('Potential connection leak detected', {
          active: stats.activeConnections,
          max: stats.maxPoolSize,
          utilization: stats.utilizationPercent + '%',
          totalCreated: stats.totalCreated
        });
      }
      
      // Check for abnormal total created vs current
      const now = Date.now();
      const previousTotal = this.metrics.lastTotalCreated;
      this.metrics.lastTotalCreated = stats.totalCreated;

      const previousCheckAt = this.metrics.lastLeakCheckAt;
      this.metrics.lastLeakCheckAt = now;

      if (previousTotal !== null && previousCheckAt !== null) {
        const delta = stats.totalCreated - previousTotal;
        const intervalMs = now - previousCheckAt;

        if (delta > 0 && intervalMs > 0) {
          const leakThreshold = this.config.poolSize.max * 10;
          const ratio = stats.activeConnections > 0
            ? (delta / stats.activeConnections)
            : delta;

          if (delta > leakThreshold && ratio > 10) {
            logger.warn('Abnormally high connection creation rate', {
              totalCreated: stats.totalCreated,
              createdDuringInterval: delta,
              intervalMs,
              current: stats.activeConnections,
              ratio: ratio.toFixed(1)
            });
          }
        }
      }
      
    } catch (error) {
      logger.error('Error detecting connection leaks', {
        error: error.message
      });
    }
  }
  
  /**
   * Get readable ready state text
   * @param {number} state - Ready state code
   * @returns {string} Ready state text
   */
  getReadyStateText(state) {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized'
    };
    return states[state] || 'unknown';
  }
  
  /**
   * Graceful disconnect
   * @returns {Promise<void>}
   */
  async disconnect() {
    logger.info('Initiating graceful database shutdown...');
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    try {
      if (this.mongoose && mongoose.connection.readyState !== 0) {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed');
      }
      
      if (this.nativeClient) {
        await this.nativeClient.close();
        logger.info('Native MongoDB client closed');
      }
      
      this.isConnected = false;
      this.metrics.totalDisconnections++;
      
      logger.info('Database shutdown completed', {
        uptime: this.metrics.uptime,
        totalConnections: this.metrics.totalConnections,
        totalReconnections: this.metrics.totalReconnections,
        totalErrors: this.metrics.totalErrors
      });
      
    } catch (error) {
      logger.error('Error during database shutdown', {
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Check if database is healthy
   * @returns {boolean} Health status
   */
  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }
  
  /**
   * Perform health check
   * @returns {Promise<Object>} Health check result
   */
  async healthCheck() {
    try {
      const stats = await this.getConnectionStats();
      const isHealthy = this.isHealthy();
      
      return {
        healthy: isHealthy,
        connected: this.isConnected,
        readyState: mongoose.connection.readyState,
        readyStateText: this.getReadyStateText(mongoose.connection.readyState),
        stats,
        metrics: this.getMetrics(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  
  /**
   * Get metrics for monitoring
   * @returns {Object} Metrics data
   */
  getMetrics() {
    return {
      ...this.metrics,
      connectionAttempts: this.connectionAttempts,
      reconnectionAttempts: this.reconnectionAttempts,
      isConnected: this.isConnected,
      lastError: this.lastError?.message || null,
      lastConnectionTime: this.lastConnectionTime,
      uptimeSeconds: this.metrics.uptime ? Math.floor(this.metrics.uptime / 1000) : 0
    };
  }
  
  /**
   * Get Mongoose instance
   * @returns {Object} Mongoose instance
   */
  getMongoose() {
    return this.mongoose;
  }
  
  /**
   * Get native MongoDB client
   * @returns {MongoClient} Native client
   */
  getNativeClient() {
    return this.nativeClient;
  }
  
  /**
   * Get database instance
   * @returns {Object} Database instance
   */
  getDatabase() {
    return mongoose.connection.db;
  }
  
  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = DatabaseManager;
