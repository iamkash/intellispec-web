/**
 * BULK OPERATIONS API ROUTES
 * 
 * Provides CSV import/export functionality for documents (companies, sites, assets)
 * Supports bulk operations with validation and error reporting
 */

const { logger } = require('../core/Logger');
const mongoose = require('mongoose');
const multer = require('multer');
const csv = require('csv-parser');
const { Parser } = require('json2csv');
const { Readable } = require('stream');
const TenantContextFactory = require('../core/TenantContextFactory');
const { ValidationError } = require('../core/ErrorHandler');
const { requireAuth } = require('../core/AuthMiddleware');
const { validateDocumentWithContext } = require('../core/SchemaValidator');

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  }
});

// Generate unique IDs
function generateId(prefix = 'doc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// CSV field mappings for different document types
const CSV_FIELD_MAPPINGS = {
  company: {
    required: ['name', 'code', 'industry'],
    optional: ['description', 'status', 'founded_year', 'employee_count', 'annual_revenue', 'stock_symbol'],
    nested: {
      'headquarters.street': 'headquarters_street',
      'headquarters.city': 'headquarters_city',
      'headquarters.state': 'headquarters_state',
      'headquarters.zip': 'headquarters_zip',
      'headquarters.country': 'headquarters_country',
      'contact.ceo': 'contact_ceo',
      'contact.phone': 'contact_phone',
      'contact.email': 'contact_email',
      'contact.website': 'contact_website'
    }
  },
  site: {
    required: ['name', 'code', 'company_id', 'site_type'],
    optional: ['description', 'status'],
    nested: {}
  },
  asset_group: {
    required: ['name', 'code', 'site_id', 'group_type'],
    optional: ['description', 'status'],
    nested: {}
  },
  asset: {
    required: ['name', 'asset_tag', 'site_id', 'asset_group_id'],
    optional: ['asset_type', 'manufacturer', 'model', 'serial_number', 'description', 'status'],
    nested: {}
  }
};

// CSV export fields for different document types
const CSV_EXPORT_FIELDS = {
  company: [
    'id', 'name', 'code', 'industry', 'description', 'status', 'founded_year', 
    'employee_count', 'annual_revenue', 'stock_symbol',
    'headquarters_street', 'headquarters_city', 'headquarters_state', 'headquarters_zip', 'headquarters_country',
    'contact_ceo', 'contact_phone', 'contact_email', 'contact_website',
    'created_date', 'last_updated', 'created_by', 'updated_by'
  ],
  site: [
    'id', 'name', 'code', 'company_id', 'company_name', 'site_type', 'description', 'status',
    'created_date', 'last_updated', 'created_by', 'updated_by'
  ],
  asset_group: [
    'id', 'name', 'code', 'site_id', 'site_name', 'company_id', 'company_name', 'group_type', 'description', 'status',
    'created_date', 'last_updated', 'created_by', 'updated_by'
  ],
  asset: [
    'id', 'name', 'asset_tag', 'asset_type', 'manufacturer', 'model', 'serial_number',
    'site_id', 'site_name', 'asset_group_id', 'asset_group_name', 'company_id', 'company_name',
    'description', 'status', 'created_date', 'last_updated', 'created_by', 'updated_by'
  ]
};

async function registerBulkOperationsRoutes(fastify) {

  // Export documents to CSV
  fastify.get('/bulk/export/:type', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type } = request.params;
      
      if (!CSV_EXPORT_FIELDS[type]) {
        throw new ValidationError(`Unsupported document type: ${type}`);
      }

      // Create tenant context for automatic filtering
      const tenantContext = TenantContextFactory.fromRequest(request);

      const db = mongoose.connection;
      const collection = db.collection('documents');

      // Build aggregation pipeline for enriched data
      // Note: Repository automatically adds tenant filtering
      let pipeline = [
        { 
          $match: { 
            type: type,
            tenantId: tenantContext.tenantId,
            deleted: { $ne: true }
          }
        }
      ];

      // Add lookups for related data
      if (type === 'site') {
        pipeline.push({
          $lookup: {
            from: 'documents',
            localField: 'company_id',
            foreignField: 'id',
            as: 'company'
          }
        });
        pipeline.push({
          $addFields: {
            company_name: { $arrayElemAt: ['$company.name', 0] }
          }
        });
      }

      if (type === 'asset_group') {
        pipeline.push({
          $lookup: {
            from: 'documents',
            localField: 'site_id',
            foreignField: 'id',
            as: 'site'
          }
        });
        pipeline.push({
          $lookup: {
            from: 'documents',
            let: { companyId: { $arrayElemAt: ['$site.company_id', 0] } },
            pipeline: [
              { $match: { $expr: { $eq: ['$id', '$$companyId'] } } }
            ],
            as: 'company'
          }
        });
        pipeline.push({
          $addFields: {
            site_name: { $arrayElemAt: ['$site.name', 0] },
            company_id: { $arrayElemAt: ['$site.company_id', 0] },
            company_name: { $arrayElemAt: ['$company.name', 0] }
          }
        });
      }

      if (type === 'asset') {
        pipeline.push({
          $lookup: {
            from: 'documents',
            localField: 'asset_group_id',
            foreignField: 'id',
            as: 'asset_group'
          }
        });
        pipeline.push({
          $lookup: {
            from: 'documents',
            localField: 'site_id',
            foreignField: 'id',
            as: 'site'
          }
        });
        pipeline.push({
          $lookup: {
            from: 'documents',
            let: { companyId: { $arrayElemAt: ['$site.company_id', 0] } },
            pipeline: [
              { $match: { $expr: { $eq: ['$id', '$$companyId'] } } }
            ],
            as: 'company'
          }
        });
        pipeline.push({
          $addFields: {
            asset_group_name: { $arrayElemAt: ['$asset_group.name', 0] },
            site_name: { $arrayElemAt: ['$site.name', 0] },
            company_id: { $arrayElemAt: ['$site.company_id', 0] },
            company_name: { $arrayElemAt: ['$company.name', 0] }
          }
        });
      }

      const documents = await collection.aggregate(pipeline).toArray();

      // Flatten nested objects for CSV export
      const flattenedData = documents.map(doc => {
        const flattened = { ...doc };
        
        // Flatten nested objects
        if (doc.headquarters) {
          flattened.headquarters_street = doc.headquarters.street;
          flattened.headquarters_city = doc.headquarters.city;
          flattened.headquarters_state = doc.headquarters.state;
          flattened.headquarters_zip = doc.headquarters.zip;
          flattened.headquarters_country = doc.headquarters.country;
        }
        
        if (doc.contact) {
          flattened.contact_ceo = doc.contact.ceo;
          flattened.contact_phone = doc.contact.phone;
          flattened.contact_email = doc.contact.email;
          flattened.contact_website = doc.contact.website;
        }

        // Format dates
        if (flattened.created_date) {
          flattened.created_date = new Date(flattened.created_date).toISOString().split('T')[0];
        }
        if (flattened.last_updated) {
          flattened.last_updated = new Date(flattened.last_updated).toISOString().split('T')[0];
        }

        return flattened;
      });

      // Generate CSV
      const parser = new Parser({ 
        fields: CSV_EXPORT_FIELDS[type],
        header: true
      });
      const csv = parser.parse(flattenedData);

      // Set response headers for file download
      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.csv`;
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
return reply.send(csv);

    } catch (error) {
      logger.error('❌ Error exporting to CSV:', error);
      fastify.log.error('Error exporting to CSV:', error);
      return reply.code(500).send({ error: 'Failed to export data' });
    }
  });

  // Import documents from CSV
  fastify.post('/bulk/import/:type', {
    preHandler: requireAuth,
    preValidation: upload.single('csvFile')
  }, async (request, reply) => {
    try {
      const { type } = request.params;

      if (!CSV_FIELD_MAPPINGS[type]) {
        throw new ValidationError(`Unsupported document type: ${type}`);
      }

      if (!request.file) {
        throw new ValidationError('No CSV file uploaded');
      }

      // Create tenant context for automatic tenant injection
      const tenantContext = TenantContextFactory.fromRequest(request);
      const db = mongoose.connection;
      if (!db || db.readyState !== 1) {
        throw new ValidationError('Database not connected');
      }
      const collection = db.collection('documents');
      const tenantId = tenantContext.tenantId;
      
      const userId = request.user.id || request.user.email || 'unknown';
      
      const results = {
        total: 0,
        success: 0,
        errors: [],
        created: []
      };

      // Parse CSV data
      const csvData = [];
      const stream = Readable.from(request.file.buffer.toString());
      
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', (row) => {
            csvData.push(row);
          })
          .on('end', resolve)
          .on('error', reject);
      });

      results.total = csvData.length;
// Process each row
      for (let i = 0; i < csvData.length; i++) {
        const row = csvData[i];
        const rowNumber = i + 2; // Account for header row
        
        try {
          // Map CSV fields to document structure
          const documentData = {};
          const mapping = CSV_FIELD_MAPPINGS[type];
          
          // Map required and optional fields
          [...mapping.required, ...mapping.optional].forEach(field => {
            if (row[field] !== undefined && row[field] !== '') {
              documentData[field] = row[field];
            }
          });

          // Map nested fields
          Object.entries(mapping.nested).forEach(([nestedPath, csvField]) => {
            if (row[csvField] !== undefined && row[csvField] !== '') {
              const pathParts = nestedPath.split('.');
              let current = documentData;
              
              for (let j = 0; j < pathParts.length - 1; j++) {
                if (!current[pathParts[j]]) {
                  current[pathParts[j]] = {};
                }
                current = current[pathParts[j]];
              }
              
              current[pathParts[pathParts.length - 1]] = row[csvField];
            }
          });

          // Validate required fields
          const missingFields = mapping.required.filter(field => !documentData[field]);
          if (missingFields.length > 0) {
            results.errors.push({
              row: rowNumber,
              error: `Missing required fields: ${missingFields.join(', ')}`,
              data: row
            });
            continue;
          }

          // Build validation context if needed
          let validationContext = {};
          if (type === 'site' && documentData.company_id) {
            const company = await collection.findOne({ 
              id: documentData.company_id, 
              type: 'company',
              tenantId: tenantId,
              deleted: { $ne: true }
            });
            if (company) {
              validationContext.companyIndustry = company.industry;
            }
          }

          // Validate document with schema
          const validatedData = await validateDocumentWithContext(type, documentData, validationContext);

          // Create document
          const document = {
            _id: generateId('doc'),
            id: generateId('doc'),
            type,
            tenantId,
            ...validatedData,
            status: validatedData.status || 'active',
            tags: ['bulk-import'],
            deleted: false,
            created_date: new Date(),
            last_updated: new Date(),
            created_by: userId,
            updated_by: userId
          };

          await collection.insertOne(document);
          
          results.success++;
          results.created.push({
            row: rowNumber,
            id: document.id,
            name: document.name || document.asset_tag
          });

        } catch (error) {
          results.errors.push({
            row: rowNumber,
            error: error.message,
            data: row
          });
        }
      }
return reply.send({
        message: `Import completed: ${results.success}/${results.total} records imported successfully`,
        ...results
      });

    } catch (error) {
      logger.error('❌ Error importing from CSV:', error);
      fastify.log.error('Error importing from CSV:', error);
      return reply.code(500).send({ error: 'Failed to import data' });
    }
  });

  // Get CSV template for a document type
  fastify.get('/bulk/template/:type', { preHandler: requireAuth }, async (request, reply) => {
    try {
      const { type } = request.params;
      
      if (!CSV_FIELD_MAPPINGS[type]) {
        return reply.code(400).send({ error: `Unsupported document type: ${type}` });
      }

      const mapping = CSV_FIELD_MAPPINGS[type];
      const headers = [...mapping.required, ...mapping.optional, ...Object.values(mapping.nested)];
      
      // Create sample data
      const sampleData = {};
      headers.forEach(header => {
        sampleData[header] = `sample_${header}`;
      });

      // Generate CSV template
      const parser = new Parser({ 
        fields: headers,
        header: true
      });
      const csv = parser.parse([sampleData]);

      // Set response headers for file download
      const filename = `${type}_import_template.csv`;
      reply.header('Content-Type', 'text/csv');
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      
      return reply.send(csv);

    } catch (error) {
      logger.error('❌ Error generating CSV template:', error);
      fastify.log.error('Error generating CSV template:', error);
      return reply.code(500).send({ error: 'Failed to generate template' });
    }
  });

}

module.exports = { registerBulkOperationsRoutes };
