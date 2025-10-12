/**
 * Document Model
 * 
 * Generic document model for ALL document types in the system:
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
 * Features:
 * - Flexible schema (strict: false) for different document types
 * - Tenant isolation
 * - Soft delete support
 * - Audit trail fields
 * - Type-based filtering
 */

const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  // Core identification
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, index: true }, // company, site, paintInvoice, inspection, etc.
  
  // Tenant isolation
  tenantId: { type: String, required: true, index: true },
  
  // Common document fields (present in most documents)
  name: { type: String, index: true },
  code: { type: String, index: true },
  description: String,
  status: { type: String, index: true },
  
  // Relationships (flexible, type-dependent)
  company_id: { type: String, index: true }, // For sites, assets
  site_id: { type: String, index: true }, // For assets
  parent_id: { type: String, index: true }, // For hierarchical data
  
  // All other fields stored at root level or in nested objects
  // The schema is flexible to accommodate different document types
  
  // Soft delete
  deleted: { type: Boolean, default: false, index: true },
  deleted_at: Date,
  deleted_by: String,
  
  // Audit trail
  created_date: { type: Date, default: Date.now, index: true },
  created_by: String,
  last_updated: { type: Date, default: Date.now },
  last_updated_by: String
}, {
  collection: 'documents',
  timestamps: false, // We manage timestamps manually
  strict: false // Allow flexible schema for different document types
});

// Compound indexes for common queries
DocumentSchema.index({ tenantId: 1, type: 1, deleted: 1 });
DocumentSchema.index({ tenantId: 1, type: 1, created_date: -1 });
DocumentSchema.index({ tenantId: 1, company_id: 1, type: 1 }); // For sites by company
DocumentSchema.index({ tenantId: 1, site_id: 1, type: 1 }); // For assets by site

// Pre-save hook to update last_updated
DocumentSchema.pre('save', function(next) {
  this.last_updated = new Date();
  next();
});

const DocumentModel = mongoose.models.Document || mongoose.model('Document', DocumentSchema);

module.exports = DocumentModel;

