/**
 * File Storage Service
 * 
 * Centralized file storage using MongoDB GridFS
 * Supports large file uploads, streaming, and management
 * 
 * Design Patterns:
 * - Singleton Pattern (single GridFS instance)
 * - Facade Pattern (simplified interface to GridFS)
 * - Strategy Pattern (different storage strategies possible)
 * 
 * Features:
 * - File upload with metadata
 * - File streaming (efficient for large files)
 * - File deletion
 * - File listing with filtering
 * - Tenant isolation support
 * - Multer middleware factory
 */

const mongoose = require('mongoose');
const Grid = require('gridfs-stream');
const multer = require('multer');
const { GridFsStorage } = require('multer-gridfs-storage');
const { logger } = require('./Logger');

class FileStorage {
  static gfs = null;
  static gridfsBucket = null;
  static initialized = false;

  /**
   * Initialize GridFS
   * Call this after MongoDB connection is established
   */
  static init() {
    const conn = mongoose.connection;

    if (conn.readyState === 1) {
      FileStorage._initialize();
    } else {
      conn.once('open', () => FileStorage._initialize());
    }
  }

  /**
   * Internal initialization
   * @private
   */
  static _initialize() {
    try {
      const conn = mongoose.connection;

      // Initialize GridFS stream
      FileStorage.gfs = Grid(conn.db, mongoose.mongo);
      FileStorage.gfs.collection('uploads');

      // Initialize GridFS bucket for multer
      FileStorage.gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'uploads'
      });

      FileStorage.initialized = true;
      logger.info('FileStorage initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize FileStorage', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if FileStorage is initialized
   * @private
   */
  static _ensureInitialized() {
    if (!FileStorage.initialized) {
      throw new Error('FileStorage not initialized. Call FileStorage.init() first.');
    }
  }

  /**
   * Upload file to GridFS
   * 
   * @param {Buffer} buffer - File buffer
   * @param {Object} metadata - File metadata
   * @returns {Promise<String>} File ID
   */
  static async uploadFile(buffer, metadata = {}) {
    FileStorage._ensureInitialized();

    return new Promise((resolve, reject) => {
      const uploadStream = FileStorage.gridfsBucket.openUploadStream(metadata.filename || 'file', {
        metadata: {
          originalName: metadata.originalName,
          mimeType: metadata.mimeType,
          size: buffer.length,
          uploadedBy: metadata.uploadedBy || 'system',
          tenantId: metadata.tenantId, // Tenant isolation
          uploadDate: new Date(),
          ...metadata
        }
      });

      uploadStream.on('error', (error) => {
        logger.error('File upload failed', { error: error.message, metadata });
        reject(error);
      });

      uploadStream.on('finish', () => {
        logger.info('File uploaded successfully', {
          fileId: uploadStream.id.toString(),
          filename: metadata.filename
        });
        resolve(uploadStream.id.toString());
      });

      uploadStream.end(buffer);
    });
  }

  /**
   * Get file metadata from GridFS by ID
   * 
   * @param {String} fileId - File ID
   * @returns {Promise<Object>} File metadata
   */
  static async getFileById(fileId) {
    FileStorage._ensureInitialized();

    try {
      const file = await FileStorage.gfs.files.findOne({
        _id: new mongoose.Types.ObjectId(fileId)
      });

      if (!file) {
        throw new Error('File not found');
      }

      return file;
    } catch (error) {
      logger.error('Error getting file from GridFS', {
        fileId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Stream file from GridFS
   * Efficient for large files
   * 
   * @param {String} fileId - File ID
   * @param {Object} reply - Fastify reply object (optional)
   * @returns {Stream} Download stream
   */
  static async streamFile(fileId, reply = null) {
    FileStorage._ensureInitialized();

    try {
      const downloadStream = FileStorage.gridfsBucket.openDownloadStream(
        new mongoose.Types.ObjectId(fileId)
      );

      // Handle stream errors
      downloadStream.on('error', (error) => {
        logger.error('Error streaming file', { fileId, error: error.message });
        if (reply) {
          reply.code(404).send({ error: 'File not found' });
        }
      });

      // If Fastify reply provided, stream directly
      if (reply) {
        reply.header('Content-Type', 'application/octet-stream');
        reply.header('Cache-Control', 'no-cache');
        return reply.send(downloadStream);
      }

      // Otherwise return stream for manual handling
      return downloadStream;
    } catch (error) {
      logger.error('Error setting up file stream', {
        fileId,
        error: error.message
      });
      if (reply) {
        reply.code(500).send({ error: 'Internal server error' });
      }
      throw error;
    }
  }

  /**
   * Delete file from GridFS
   * 
   * @param {String} fileId - File ID
   * @returns {Promise<void>}
   */
  static async deleteFile(fileId) {
    FileStorage._ensureInitialized();

    try {
      await FileStorage.gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
      logger.info('File deleted from GridFS', { fileId });
    } catch (error) {
      logger.error('Error deleting file from GridFS', {
        fileId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * List files in GridFS
   * 
   * @param {Object} query - MongoDB query filter
   * @param {Object} options - Query options (limit, skip, sort)
   * @returns {Promise<Array>} Array of files
   */
  static async listFiles(query = {}, options = {}) {
    FileStorage._ensureInitialized();

    try {
      const { limit = 100, skip = 0, sort = { uploadDate: -1 } } = options;

      const files = await FileStorage.gfs.files
        .find(query)
        .limit(limit)
        .skip(skip)
        .sort(sort)
        .toArray();

      return files;
    } catch (error) {
      logger.error('Error listing GridFS files', { error: error.message });
      throw error;
    }
  }

  /**
   * List files by tenant
   * 
   * @param {String} tenantId - Tenant ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of files
   */
  static async listFilesByTenant(tenantId, options = {}) {
    return FileStorage.listFiles({ 'metadata.tenantId': tenantId }, options);
  }

  /**
   * Create Multer storage engine for GridFS
   * 
   * @param {Object} options - Storage options
   * @returns {GridFsStorage} Multer storage engine
   */
  static createStorage(options = {}) {
    return new GridFsStorage({
      url: process.env.MONGODB_URI,
      options: { useNewUrlParser: true, useUnifiedTopology: true },
      file: (req, file) => {
        return new Promise((resolve) => {
          const filename = options.filenameGenerator
            ? options.filenameGenerator(req, file)
            : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname}`;

          const fileInfo = {
            filename: filename,
            bucketName: options.bucketName || 'uploads',
            metadata: {
              originalName: file.originalname,
              uploadDate: new Date(),
              mimeType: file.mimetype,
              size: file.size,
              uploadedBy: req.user?.id || 'system',
              tenantId: req.user?.tenantId, // Automatic tenant isolation
              ...options.metadata
            }
          };
          resolve(fileInfo);
        });
      }
    });
  }

  /**
   * Create Multer upload middleware
   * Factory method for creating configured multer instances
   * 
   * @param {Object} options - Multer options
   * @returns {Multer} Configured multer middleware
   */
  static createUploadMiddleware(options = {}) {
    const storage = FileStorage.createStorage(options);

    return multer({
      storage: storage,
      limits: options.limits || {
        fileSize: 50 * 1024 * 1024 // 50MB default
      },
      fileFilter: options.fileFilter || ((req, file, cb) => {
        // Default: allow all files
        cb(null, true);
      })
    });
  }

  /**
   * Create image upload middleware
   * Pre-configured for image uploads only
   * 
   * @param {Object} options - Additional options
   * @returns {Multer} Multer middleware for images
   */
  static createImageUploadMiddleware(options = {}) {
    return FileStorage.createUploadMiddleware({
      ...options,
      limits: {
        fileSize: options.maxSize || 50 * 1024 * 1024 // 50MB for images
      },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
          cb(null, true);
        } else {
          cb(new Error('Only image files are allowed'), false);
        }
      }
    });
  }

  /**
   * Get GridFS instance (for advanced usage)
   * 
   * @returns {Grid} GridFS instance
   */
  static getGFS() {
    FileStorage._ensureInitialized();
    return FileStorage.gfs;
  }

  /**
   * Get GridFS bucket (for advanced usage)
   * 
   * @returns {GridFSBucket} GridFS bucket
   */
  static getBucket() {
    FileStorage._ensureInitialized();
    return FileStorage.gridfsBucket;
  }
}

module.exports = FileStorage;

