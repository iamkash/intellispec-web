/**
 * File Upload Routes
 * Handles image uploads, downloads, and management
 * 
 * FEATURES:
 * - Hash-based deduplication to prevent duplicate storage
 * - Reference counting for shared files
 * - Smart cleanup of orphaned files
 * - Tenant isolation
 * 
 * Now uses FileStorage service (core framework)
 */

const mongoose = require('mongoose');
const crypto = require('crypto');
const FileStorage = require('../core/FileStorage');
const contentDisposition = require('content-disposition');
const { logger } = require('../core/Logger');
const { requireAuth } = require('../core/AuthMiddleware');

/**
 * Calculate file hash for deduplication
 */
async function calculateFileHash(stream) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const chunks = [];
    
    stream.on('data', (chunk) => {
      chunks.push(chunk);
      hash.update(chunk);
    });
    
    stream.on('end', () => {
      resolve({
        hash: hash.digest('hex'),
        buffer: Buffer.concat(chunks)
      });
    });
    
    stream.on('error', reject);
  });
}

/**
 * Check if file with hash already exists
 */
async function findExistingFileByHash(fileHash, mimeType, tenantId = null) {
  const query = {
    'metadata.fileHash': fileHash,
    'contentType': mimeType
  };
  
  // Add tenant filter if provided
  if (tenantId) {
    query['metadata.tenantId'] = tenantId;
  }
  
  const files = await FileStorage.getBucket()
    .find(query)
    .toArray();
  
  return files.length > 0 ? files[0] : null;
}

/**
 * Increment reference count for deduplicated file
 */
async function incrementReferenceCount(fileId) {
  const gridfsBucket = FileStorage.getBucket();
  const filesCollection = gridfsBucket.s._filesCollection;
  
  await filesCollection.updateOne(
    { _id: fileId },
    { 
      $inc: { 'metadata.referenceCount': 1 },
      $push: { 'metadata.references': { 
        timestamp: new Date(),
        action: 'reference_added'
      }}
    }
  );
}

/**
 * Register upload routes
 */
async function registerUploadRoutes(fastify, options) {
  // Upload single image with deduplication
  fastify.post('/image', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const data = await request.file();

      if (!data) {
        return reply.code(400).send({ error: 'No image file provided' });
      }

      // Validate file type
      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({ error: 'Only image files are allowed' });
      }

      // Validate file size (50MB limit)
      if (data.file.truncated) {
        return reply.code(400).send({ error: 'File too large. Maximum size is 50MB' });
      }

      // Get tenant ID from authenticated user
      const tenantId = request.user?.tenantId || null;

      // Calculate file hash for deduplication
      const { hash: fileHash, buffer: fileBuffer } = await calculateFileHash(data.file);
      
      // Check if file already exists (with tenant isolation)
      const existingFile = await findExistingFileByHash(fileHash, data.mimetype, tenantId);
      
      if (existingFile) {
        // File already exists - increment reference count and return existing file
        await incrementReferenceCount(existingFile._id);
        
        logger.info('File deduplicated', {
          fileHash,
          fileId: existingFile._id.toString(),
          tenantId
        });
        
        // Return existing file information
        const protocol = request.protocol;
        const host = request.hostname;
        const port = process.env.PORT || 4000;
        const baseUrl = process.env.NODE_ENV === 'production'
          ? `${protocol}://${host}`
          : `${protocol}://${host}:${port}`;

        return reply.code(200).send({
          success: true,
          deduplicated: true,
          file: {
            id: existingFile._id.toString(),
            filename: existingFile.filename,
            originalName: data.filename,
            mimeType: existingFile.contentType,
            size: existingFile.length,
            uploadDate: existingFile.uploadDate,
            url: `${baseUrl}/api/uploads/image/${existingFile._id}`,
            fileHash: fileHash
          }
        });
      }

      // New file - upload via FileStorage
      const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${data.filename}`;

      // Upload file with metadata
      const fileId = await FileStorage.uploadFile(fileBuffer, {
        filename,
        originalName: data.filename,
        mimeType: data.mimetype,
        uploadedBy: request.user?.id || 'system',
        tenantId, // Automatic tenant isolation
        fileHash,
        referenceCount: 1,
        references: [{
          timestamp: new Date(),
          action: 'initial_upload'
        }]
      });
      // Return file information with full URL
      const protocol = request.protocol;
      const host = request.hostname;
      const port = process.env.PORT || 4000;
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `${protocol}://${host}`
        : `${protocol}://${host}:${port}`;

      const fileInfo = {
        id: fileId,
        filename: filename,
        originalName: data.filename,
        mimeType: data.mimetype,
        size: fileBuffer.length,
        uploadDate: new Date(),
        url: `${baseUrl}/api/uploads/image/${fileId}`,
        fileHash: fileHash,
        deduplicated: false
      };

      logger.info('File uploaded', {
        fileId,
        filename,
        size: fileBuffer.length,
        tenantId
      });

      reply.code(201).send({
        success: true,
        file: fileInfo
      });

    } catch (error) {
      logger.error('Error uploading image', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        tenantId: request.user?.tenantId
      });
      reply.code(500).send({
        error: 'Failed to upload image',
        message: error.message
      });
    }
  });

  // Upload multiple images
  fastify.post('/images', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const parts = request.files();
      const files = [];

      for await (const part of parts) {
        // Validate file type
        if (!part.mimetype.startsWith('image/')) {
          return reply.code(400).send({ error: 'Only image files are allowed' });
        }

        // Validate file size (50MB limit)
        if (part.file.truncated) {
          return reply.code(400).send({ error: 'File too large. Maximum size is 50MB' });
        }

        files.push(part);
      }

      if (!files || files.length === 0) {
        return reply.code(400).send({ error: 'No image files provided' });
      }

      const tenantId = request.user?.tenantId || null;

      // Process all uploaded files
      const fileInfos = [];
      for (const data of files) {
        // Read file buffer
        const { hash: fileHash, buffer: fileBuffer } = await calculateFileHash(data.file);
        
        // Generate unique filename
        const filename = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${data.filename}`;

        // Upload via FileStorage
        const fileId = await FileStorage.uploadFile(fileBuffer, {
          filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          uploadedBy: request.user?.id || 'system',
          tenantId, // Automatic tenant isolation
          fileHash
        });

        // Construct full URL for multiple images
        const protocol = request.protocol;
        const host = request.hostname;
        const port = process.env.PORT || 4000;
        const baseUrl = process.env.NODE_ENV === 'production'
          ? `${protocol}://${host}`
          : `${protocol}://${host}:${port}`;

        fileInfos.push({
          id: fileId,
          filename: filename,
          originalName: data.filename,
          mimeType: data.mimetype,
          size: fileBuffer.length,
          uploadDate: new Date(),
          url: `${baseUrl}/api/uploads/image/${fileId}`
        });
      }

      reply.code(201).send({
        success: true,
        files: fileInfos,
        count: fileInfos.length
      });

    } catch (error) {
      logger.error('Error uploading images', {
        error: error.message,
        stack: error.stack,
        userId: request.user?.id,
        tenantId: request.user?.tenantId
      });
      reply.code(500).send({
        error: 'Failed to upload images',
        message: error.message
      });
    }
  });

  // Get image by ID
  fastify.get('/image/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.code(400).send({ error: 'Invalid file ID' });
      }

      // Get file metadata first
      const file = await FileStorage.getFileById(id);

      // Set appropriate headers
      const mimeType = file.contentType || 'application/octet-stream';
      const fallbackFilename = `${id}.bin`;
      const safeFilename = sanitizeFilename(
        file.filename || file.metadata?.originalName,
        fallbackFilename
      );

      reply.type(mimeType);
      reply.header('Content-Disposition', contentDisposition(safeFilename, { type: 'inline' }));

      // Stream the file
      return await FileStorage.streamFile(id, reply);

    } catch (error) {
      logger.error('Error serving image', {
        error: error.message,
        fileId: request.params.id
      });
      if (!reply.sent) {
        reply.removeHeader('Content-Type');
        reply.removeHeader('Content-Disposition');
      }
      if (error.message === 'File not found') {
        reply
          .code(404)
          .type('application/json')
          .send(JSON.stringify({ error: 'Image not found' }));
      } else {
        reply
          .code(500)
          .type('application/json')
          .send(JSON.stringify({ error: 'Failed to serve image' }));
      }
    }
  });

  // Get image metadata
  fastify.get('/image/:id/metadata', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.code(400).send({ error: 'Invalid file ID' });
      }

      const file = await FileStorage.getFileById(id);

      // Construct full URL for metadata
      const protocol = request.protocol;
      const host = request.hostname;
      const port = process.env.PORT || 4000;
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `${protocol}://${host}`
        : `${protocol}://${host}:${port}`;

      reply.send({
        id: file._id.toString(),
        filename: file.filename,
        originalName: file.metadata?.originalName,
        mimeType: file.contentType,
        size: file.length,
        uploadDate: file.uploadDate,
        uploadedBy: file.metadata?.uploadedBy,
        url: `${baseUrl}/api/uploads/image/${file._id}`
      });

    } catch (error) {
      logger.error('Error getting image metadata', {
        error: error.message,
        fileId: request.params.id
      });
      if (error.message === 'File not found') {
        reply.code(404).send({ error: 'Image not found' });
      } else {
        reply.code(500).send({ error: 'Failed to get image metadata' });
      }
    }
  });

  // Delete image with reference counting
  fastify.delete('/image/:id', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { id } = request.params;
      const { force = false } = request.query; // Force delete even if references exist

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return reply.code(400).send({ error: 'Invalid file ID' });
      }

      // Get file metadata to check reference count
      const file = await FileStorage.getFileById(id);
      const referenceCount = file.metadata?.referenceCount || 0;

      if (referenceCount > 1 && !force) {
        // Decrement reference count instead of deleting
        const gridfsBucket = FileStorage.getBucket();
        const filesCollection = gridfsBucket.s._filesCollection;
        await filesCollection.updateOne(
          { _id: new mongoose.Types.ObjectId(id) },
          { 
            $inc: { 'metadata.referenceCount': -1 },
            $push: { 'metadata.references': { 
              timestamp: new Date(),
              action: 'reference_removed'
            }}
          }
        );

        logger.info('File reference decremented', {
          fileId: id,
          newReferenceCount: referenceCount - 1
        });

        reply.send({
          success: true,
          message: 'Reference removed successfully',
          referenceCount: referenceCount - 1,
          fileDeleted: false
        });
      } else {
        // Actually delete the file (no more references or force delete)
        await FileStorage.deleteFile(id);

        logger.info('File deleted', {
          fileId: id,
          referenceCount
        });

        reply.send({
          success: true,
          message: 'Image deleted successfully',
          fileDeleted: true
        });
      }

    } catch (error) {
      logger.error('Error deleting image', {
        error: error.message,
        fileId: request.params.id
      });
      if (error.message.includes('File not found')) {
        reply.code(404).send({ error: 'Image not found' });
      } else {
        reply.code(500).send({ error: 'Failed to delete image' });
      }
    }
  });

  // List images with optional filtering
  fastify.get('/images', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { uploadedBy, mimeType, limit = 50, skip = 0 } = request.query;

      const query = {};
      if (uploadedBy) query['metadata.uploadedBy'] = uploadedBy;
      if (mimeType) query.contentType = mimeType;

      const files = await FileStorage.listFiles(query, {
        limit: parseInt(limit),
        skip: parseInt(skip)
      });

      // Construct full URL for list endpoint
      const protocol = request.protocol;
      const host = request.hostname;
      const port = process.env.PORT || 4000;
      const baseUrl = process.env.NODE_ENV === 'production'
        ? `${protocol}://${host}`
        : `${protocol}://${host}:${port}`;

      // Map files to response format
      const paginatedFiles = files.map(file => ({
          id: file._id.toString(),
          filename: file.filename,
          originalName: file.metadata?.originalName,
          mimeType: file.contentType,
          size: file.length,
          uploadDate: file.uploadDate,
          uploadedBy: file.metadata?.uploadedBy,
          url: `${baseUrl}/api/uploads/image/${file._id}`
        }));

      reply.send({
        files: paginatedFiles,
        total: files.length,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });

    } catch (error) {
      logger.error('Error listing images', {
        error: error.message,
        stack: error.stack
      });
      reply.code(500).send({
        error: 'Failed to list images',
        message: error.message
      });
    }
  });
}

module.exports = registerUploadRoutes;
/**
 * Ensure filenames used in HTTP headers avoid control characters
 */
function sanitizeFilename(name, fallback) {
  if (!name || typeof name !== 'string') {
    return fallback;
  }

  // Drop control characters and collapse whitespace/newlines
  const sanitized = name
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/["\\]/g, '_')
    .replace(/[^\x20-\x7E]+/g, '_')
    .trim();

  return sanitized || fallback;
}
