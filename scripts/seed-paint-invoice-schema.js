#!/usr/bin/env node

/**
 * Seed Paint Invoice Schema Configuration
 * 
 * This script creates a metadata-driven schema configuration for paintInvoice documents.
 * This demonstrates how to create document schemas without hardcoding them in the API.
 */

const path = require('path');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

// Paint Invoice Schema Configuration
const paintInvoiceSchemaConfig = {
  documentType: 'paintInvoice',
  name: 'Paint Invoice',
  description: 'Schema for paint purchase invoices and line items',
  version: '1.0.0',
  isActive: true,
  fields: {
    companyId: {
      type: 'string',
      min: 1,
      message: 'Company ID is required',
      description: 'Reference to the company making the purchase'
    },
    facilityId: {
      type: 'string', 
      min: 1,
      message: 'Facility ID is required',
      description: 'Reference to the facility where paint will be used'
    },
    invoiceNumber: {
      type: 'string',
      min: 1,
      message: 'Invoice number is required',
      description: 'Unique invoice identifier from supplier'
    },
    purchaseDate: {
      type: 'string',
      min: 1,
      message: 'Purchase date is required',
      description: 'Date of paint purchase (ISO date string)'
    },
    poNumber: {
      type: 'string',
      min: 1,
      message: 'PO number is required',
      description: 'Purchase order number'
    },
    lineItems: {
      type: 'array',
      min: 1,
      message: 'At least one line item is required',
      description: 'Array of paint products purchased',
      items: {
        type: 'object',
        properties: {
          paintSpecId: {
            type: 'string',
            min: 1,
            message: 'Paint specification ID is required',
            description: 'Reference to paint specification document'
          },
          quantityPurchased: {
            type: 'number',
            positive: true,
            message: 'Quantity must be positive',
            description: 'Amount of paint purchased in grams'
          }
        }
      }
    },
    totalAmount: {
      type: 'number',
      nonnegative: true,
      optional: true,
      description: 'Total invoice amount in currency'
    },
    status: {
      type: 'enum',
      values: ['draft', 'submitted', 'approved', 'rejected', 'paid'],
      default: 'draft',
      optional: true,
      description: 'Current status of the invoice'
    },
    notes: {
      type: 'string',
      optional: true,
      description: 'Additional notes or comments'
    },
    deleted: {
      type: 'boolean',
      default: false,
      optional: true,
      description: 'Soft delete flag'
    },
    deleted_at: {
      type: 'date',
      optional: true,
      description: 'Timestamp when record was deleted'
    },
    deleted_by: {
      type: 'string',
      optional: true,
      description: 'User who deleted the record'
    }
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
  updatedBy: 'system'
};

async function seedPaintInvoiceSchema() {
try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });
const db = mongoose.connection.db;
    const schemasCol = db.collection('documentSchemas');

    // Check if schema already exists
    const existingSchema = await schemasCol.findOne({ 
      documentType: 'paintInvoice' 
    });

    if (existingSchema) {
await schemasCol.updateOne(
        { documentType: 'paintInvoice' },
        { 
          $set: {
            ...paintInvoiceSchemaConfig,
            updatedAt: new Date()
          }
        }
      );
} else {
await schemasCol.insertOne(paintInvoiceSchemaConfig);
}
console.log('📊 Summary:');
console.log('   - Fields: 11 (companyId, facilityId, invoiceNumber, etc.)');
console.log('   - Status: Active and ready for use');
console.log('   - Forms will automatically validate against this schema');
console.log('   - Schema can be updated via database without code changes');

  } catch (error) {
    console.error('❌ Error seeding Paint Invoice schema:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
}
}

// Main execution
async function main() {
  try {
    await seedPaintInvoiceSchema();
    process.exit(0);
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedPaintInvoiceSchema };
