/**
 * MongoDB Document Schemas using Mongoose
 * 
 * Production-ready schema definitions for all document types.
 * Provides automatic validation, indexing, and type safety.
 */

import mongoose, { Schema, Document } from 'mongoose';

// Base Document Interface
export interface BaseDocument extends Document {
  id: string;
  type: string;
  tenantId: string;
  deleted?: boolean;
  deleted_at?: Date;
  deleted_by?: string;
  created_date?: Date;
  last_updated?: Date;
  created_by?: string;
  updated_by?: string;
  
  // RAG-specific fields for vector search and AI context
  embedding?: number[];
  semanticText?: string;
  searchableContent?: string;
  lastEmbeddingUpdate?: Date;
  ragMetadata?: {
    embeddingModel?: string;
    semanticVersion?: string;
    generatedAt?: Date;
    sourceGadget?: string;
  };
}

// Paint Invoice Interfaces
export interface LineItem {
  paintSpecId: string;
  quantityPurchased: number; // in grams
}

export interface PaintInvoice extends BaseDocument {
  type: 'paintInvoice';
  companyId: string;
  facilityId: string;
  invoiceNumber: string;
  purchaseDate: Date;
  poNumber: string;
  lineItems: LineItem[];
  totalAmount?: number;
  status?: 'draft' | 'submitted' | 'approved' | 'rejected' | 'paid';
  notes?: string;
}

// Company Interface
export interface Company extends BaseDocument {
  type: 'company';
  name: string;
  code: string;
  industry?: string;
  description?: string;
  headquarters?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contact?: {
    ceo?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  founded_year?: number;
  employee_count?: number;
  annual_revenue?: number;
  stock_symbol?: string;
}

// Site Interface
export interface Site extends BaseDocument {
  type: 'site';
  name: string;
  code?: string;
  company_id: string; // Note: underscore (from seed file analysis)
  site_type?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  contact?: {
    manager?: string;
    phone?: string;
    email?: string;
  };
  status?: string;
  tags?: string[];
}

// Asset Group Interface
export interface AssetGroup extends BaseDocument {
  type: 'asset_group';
  name: string;
  code: string;
  site_id: string; // Note: underscore (from seed file analysis)
  group_type?: string;
  description?: string;
  status?: string;
  tags?: string[];
}

// Asset Interface
export interface Asset extends BaseDocument {
  type: 'asset';
  name: string;
  asset_tag: string; // Unique identifier
  asset_group_id: string; // Note: underscore
  site_id: string; // Note: underscore
  asset_type: string;
  manufacturer?: string;
  model_number?: string; // Renamed from 'model' to avoid Mongoose conflict
  description?: string;
  status?: string;
  tags?: string[];
  specifications?: {
    coating_requirements?: {
      primer_type?: string;
      topcoat_type?: string;
      maintenance_cycle?: string;
      surface_prep?: string;
    };
    [key: string]: any; // Allow additional specifications
  };
  maintenance?: {
    last_service_date?: string;
    next_service_date?: string;
    maintenance_type?: string;
    maintenance_notes?: string;
  };
}

// Paint Specification Interface
export interface PaintSpecification extends BaseDocument {
  type: 'paint_specifications';
  product: string;
  code: string;
  voc_content?: number; // VOC content in g/L
  manufacturer?: string;
  category?: string;
  description?: string;
  specifications?: {
    density?: number;
    viscosity?: number;
    flashPoint?: number;
    dryTime?: number;
  };
}

// Inspection Document Interface - Fully dynamic based on metadata
export interface InspectionDocument extends BaseDocument {
  type: 'inspection';
  
  // Core fields that are always present
  inspectionType: string; // Dynamic based on workspace metadata
  workspaceId: string; // Reference to the workspace definition
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'archived';
  progress: number; // 0-100 percentage
  
  // Metadata reference
  metadataVersion?: string; // Track which version of metadata was used
  
  // Dynamic form data - stores all field values from the metadata-driven form
  formData: Record<string, any>; // All form fields stored as key-value pairs
  
  // Dynamic sections data - stores data organized by sections
  sections: Record<string, {
    sectionId: string;
    title: string;
    completed: boolean;
    data: Record<string, any>; // Section-specific data
  }>;
  
  // Grid data - stores dynamic grid/table data
  grids: Record<string, any[]>; // Grid ID to array of row data
  
  // AI Analysis Results - generic storage for any AI analysis
  aiAnalysis: Record<string, {
    analysisDate: Date;
    model?: string;
    result: any;
    metadata?: any;
  }>;
  
  // Attachments and media
  attachments: Array<{
    id: string;
    type: 'image' | 'document' | 'audio' | 'video';
    url: string;
    metadata?: any;
    uploadDate: Date;
  }>;
  
  // Workflow metadata
  completedSections: string[];
  lastSectionCompleted?: string;
  wizardState?: any; // Complete wizard state for resuming
  
  // Validation and compliance
  validationResults?: Record<string, any>;
  complianceChecks?: Record<string, any>;
}

// Base RAG fields that ALL documents inherit
const BASE_RAG_FIELDS = {
  // RAG-specific fields for vector search and AI context
  embedding: { type: [Number], index: true },
  semanticText: { type: String, index: 'text' },
  searchableContent: { type: String, index: 'text' },
  lastEmbeddingUpdate: { type: Date, index: true },
  ragMetadata: {
    embeddingModel: String,
    semanticVersion: String,
    generatedAt: Date,
    sourceGadget: String,
    autoGenerated: { type: Boolean, default: true }
  }
};

// Base audit fields that ALL documents inherit
const BASE_AUDIT_FIELDS = {
  deleted: { type: Boolean, default: false, index: true },
  deleted_at: Date,
  deleted_by: String,
  created_date: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  created_by: String,
  updated_by: String
};

// Mongoose Schemas
const LineItemSchema = new Schema({
  paintSpecId: { type: String, required: true, index: true },
  quantityPurchased: { type: Number, required: true, min: 0 }
}, { _id: false });

const PaintInvoiceSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['paintInvoice'], index: true },
  tenantId: { type: String, required: true, index: true },
  companyId: { type: String, required: true, index: true },
  facilityId: { type: String, required: true, index: true },
  invoiceNumber: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, required: true, index: true },
  poNumber: { type: String, required: true },
  lineItems: { type: [LineItemSchema], required: true, validate: [arrayLimit, '{PATH} must have at least one item'] },
  totalAmount: { type: Number, min: 0 },
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'approved', 'rejected', 'paid'],
    default: 'draft',
    index: true
  },
  notes: String,
  ...BASE_AUDIT_FIELDS,
  ...BASE_RAG_FIELDS
}, {
  collection: 'documents',
  timestamps: false // Using custom timestamp fields
});

const CompanySchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['company'], index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  industry: { type: String, index: true },
  description: String,
  headquarters: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  contact: {
    ceo: String,
    phone: String,
    email: { type: String, lowercase: true },
    website: String
  },
  founded_year: { type: Number, min: 1800, max: new Date().getFullYear() },
  employee_count: { type: Number, min: 0 },
  annual_revenue: { type: Number, min: 0 },
  stock_symbol: { type: String, uppercase: true },
  ...BASE_AUDIT_FIELDS,
  ...BASE_RAG_FIELDS
}, {
  collection: 'documents',
  timestamps: false
});

const SiteSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['site'], index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String, index: true },
  company_id: { type: String, required: true, index: true }, // Note: underscore
  site_type: { type: String, index: true },
  address: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  contact: {
    manager: String,
    phone: String,
    email: { type: String, lowercase: true }
  },
  status: { type: String, index: true },
  tags: [String],
  ...BASE_AUDIT_FIELDS,
  ...BASE_RAG_FIELDS
}, {
  collection: 'documents',
  timestamps: false
});

const AssetGroupSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['asset_group'], index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  code: { type: String, required: true, index: true },
  site_id: { type: String, required: true, index: true }, // Note: underscore
  group_type: { type: String, index: true },
  description: String,
  status: { type: String, index: true },
  tags: [String],
  ...BASE_AUDIT_FIELDS,
  ...BASE_RAG_FIELDS
}, {
  collection: 'documents',
  timestamps: false
});

const AssetSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['asset'], index: true },
  tenantId: { type: String, required: true, index: true },
  name: { type: String, required: true, index: true },
  asset_tag: { type: String, required: true, index: true }, // Unique identifier
  asset_group_id: { type: String, required: true, index: true }, // Note: underscore
  site_id: { type: String, required: true, index: true }, // Note: underscore
  asset_type: { type: String, required: true, index: true },
  manufacturer: { type: String, index: true },
  model_number: { type: String, index: true }, // Renamed from 'model' to avoid Mongoose conflict
  description: String,
  status: { type: String, index: true },
  tags: [String],
  specifications: Schema.Types.Mixed,
  maintenance: {
    last_service_date: String,
    next_service_date: String,
    maintenance_type: String,
    maintenance_notes: String
  },
  ...BASE_AUDIT_FIELDS as any,
  ...BASE_RAG_FIELDS as any
} as any, {
  collection: 'documents',
  timestamps: false
});

const PaintSpecificationSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['paint_specifications'], index: true },
  tenantId: { type: String, required: true, index: true },
  product: { type: String, required: true, index: true },
  code: { type: String, required: true, unique: true },
  voc_content: { type: Number, min: 0, max: 1000 }, // g/L
  manufacturer: { type: String, index: true },
  category: { type: String, index: true },
  description: String,
  specifications: {
    density: Number,
    viscosity: Number,
    flashPoint: Number,
    dryTime: Number
  },
  ...BASE_AUDIT_FIELDS,
  ...BASE_RAG_FIELDS
}, {
  collection: 'documents',
  timestamps: false
});

// Create Dynamic Inspection Schema - fully metadata-driven
// Using simpler schema definition to avoid TypeScript complexity
const InspectionSchema = new Schema({
  // Core identity fields
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['inspection'], index: true },
  tenantId: { type: String, required: true, index: true },
  
  // Core inspection fields
  inspectionType: { type: String, required: true, index: true },
  workspaceId: { type: String, required: true, index: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['draft', 'in_progress', 'completed', 'approved', 'archived'],
    default: 'draft',
    index: true 
  },
  progress: { type: Number, min: 0, max: 100, default: 0, index: true },
  
  // Metadata tracking
  metadataVersion: String,
  
  // Dynamic data storage - using Schema.Types.Mixed for flexibility
  formData: Schema.Types.Mixed,
  sections: Schema.Types.Mixed,
  grids: Schema.Types.Mixed,
  aiAnalysis: Schema.Types.Mixed,
  attachments: Schema.Types.Mixed,
  
  // Workflow tracking
  completedSections: [String],
  lastSectionCompleted: String,
  wizardState: Schema.Types.Mixed,
  
  // Validation and compliance
  validationResults: Schema.Types.Mixed,
  complianceChecks: Schema.Types.Mixed,
  
  // Audit fields
  deleted: { type: Boolean, default: false, index: true },
  deleted_at: Date,
  deleted_by: String,
  created_date: { type: Date, default: Date.now, index: true },
  last_updated: { type: Date, default: Date.now },
  created_by: String,
  updated_by: String,
  
  // RAG fields
  embedding: [Number],
  semanticText: String,
  searchableContent: String,
  lastEmbeddingUpdate: Date,
  ragMetadata: Schema.Types.Mixed
} as any, {
  collection: 'documents',
  timestamps: false,
  strict: false
});

// Validation functions
function arrayLimit(val: any[]) {
  return val.length > 0;
}

// Add indexes for common queries
PaintInvoiceSchema.index({ tenantId: 1, companyId: 1, purchaseDate: -1 });
PaintInvoiceSchema.index({ tenantId: 1, facilityId: 1, purchaseDate: -1 });
PaintInvoiceSchema.index({ tenantId: 1, status: 1, purchaseDate: -1 });

CompanySchema.index({ tenantId: 1, name: 1 });
CompanySchema.index({ tenantId: 1, industry: 1 });

SiteSchema.index({ tenantId: 1, company_id: 1 });
SiteSchema.index({ tenantId: 1, site_type: 1 });

AssetGroupSchema.index({ tenantId: 1, site_id: 1 });
AssetGroupSchema.index({ tenantId: 1, group_type: 1 });

AssetSchema.index({ tenantId: 1, asset_group_id: 1 });
AssetSchema.index({ tenantId: 1, site_id: 1 });
AssetSchema.index({ tenantId: 1, asset_type: 1 });
AssetSchema.index({ tenantId: 1, asset_tag: 1 }); // For update matching
AssetSchema.index({ tenantId: 1, manufacturer: 1 });

PaintSpecificationSchema.index({ tenantId: 1, manufacturer: 1 });
PaintSpecificationSchema.index({ tenantId: 1, vocContent: 1 });

// Dynamic indexes for inspection documents
InspectionSchema.index({ tenantId: 1, inspectionType: 1, created_date: -1 });
InspectionSchema.index({ tenantId: 1, workspaceId: 1, status: 1 });
InspectionSchema.index({ tenantId: 1, status: 1, progress: 1 });
InspectionSchema.index({ tenantId: 1, 'formData.equipmentId': 1 }); // Index common fields in formData
InspectionSchema.index({ tenantId: 1, 'formData.inspectionDate': -1 });
InspectionSchema.index({ tenantId: 1, 'formData.inspectorName': 1 });

// Export Models - without generic types to avoid TypeScript complexity
export const PaintInvoiceModel = mongoose.model('PaintInvoice', PaintInvoiceSchema);
export const CompanyModel = mongoose.model('Company', CompanySchema);
export const SiteModel = mongoose.model('Site', SiteSchema);
export const AssetGroupModel = mongoose.model('AssetGroup', AssetGroupSchema);
export const AssetModel = mongoose.model('Asset', AssetSchema);
export const PaintSpecificationModel = mongoose.model('PaintSpecification', PaintSpecificationSchema);
export const InspectionModel = mongoose.model('Inspection', InspectionSchema);

// Field mapping validation
export const DOCUMENT_FIELD_MAPPINGS: Record<string, {
  validFields: string[];
  filterMappings: Record<string, string>;
}> = {
  paintInvoice: {
    validFields: ['companyId', 'facilityId', 'purchaseDate', 'status', 'invoiceNumber', 'poNumber', 'lineItems', 'lineItems.paintSpecId', 'lineItems.quantityPurchased'],
    filterMappings: {
      company_id: 'companyId',
      site_id: 'facilityId', 
      facility_id: 'facilityId',
      date_range: 'purchaseDate',
      paint_spec_id: 'lineItems.paintSpecId',
      status: 'status'
    }
  },
  company: {
    validFields: ['name', 'code', 'industry'],
    filterMappings: {
      industry: 'industry',
      name: 'name'
    }
  },
  site: {
    validFields: ['name', 'code', 'company_id', 'site_type', 'status'], // Note: underscore
    filterMappings: {
      company_id: 'company_id', // Maps to itself (underscore)
      name: 'name',
      site_type: 'site_type',
      status: 'status'
    }
  },
  asset_group: {
    validFields: ['name', 'code', 'site_id', 'group_type', 'description', 'status'], // Note: underscore
    filterMappings: {
      site_id: 'site_id', // Maps to itself (underscore)
      name: 'name',
      code: 'code',
      group_type: 'group_type',
      status: 'status'
    }
  },
  asset: {
    validFields: ['name', 'asset_tag', 'asset_group_id', 'site_id', 'company_id', 'asset_type', 'manufacturer', 'model_number', 'description', 'status', 'inspection.next_inspection_date'], // Note: underscores
    filterMappings: {
      asset_tag: 'asset_tag',
      asset_group_id: 'asset_group_id', // Maps to itself (underscore)
      site_id: 'site_id', // Maps to itself (underscore)
      company_id: 'company_id', // Maps to itself (underscore)
      asset_type: 'asset_type',
      manufacturer: 'manufacturer',
      model_number: 'model_number',
      name: 'name',
      status: 'status',
      date_range: 'inspection.next_inspection_date'
    }
  },
  paint_specifications: {
    validFields: ['product', 'code', 'voc_content', 'manufacturer', 'category'],
    filterMappings: {
      manufacturer: 'manufacturer',
      category: 'category',
      voc_content: 'voc_content'
    }
  },
  inspection: {
    validFields: ['inspectionType', 'workspaceId', 'status', 'progress', 'formData.*', 'sections.*', 'grids.*'],
    filterMappings: {
      inspection_type: 'inspectionType',
      workspace_id: 'workspaceId',
      status: 'status',
      // Dynamic field mappings - these map to formData fields
      equipment_type: 'formData.equipmentType',
      equipment_id: 'formData.equipmentId',
      date_range: 'formData.inspectionDate',
      inspector: 'formData.inspectorName',
      location: 'formData.location',
      // Progress filters
      progress_min: 'progress',
      progress_max: 'progress',
      // Section completion
      completed_sections: 'completedSections'
    }
  }
};

/**
 * Validate field mapping for a document type
 */
export function validateFieldMapping(
  documentType: string,
  filterField: string,
  dbField: string
): { isValid: boolean; suggestion?: string } {
  const mapping = DOCUMENT_FIELD_MAPPINGS[documentType];
  
  if (!mapping) {
    return { isValid: false, suggestion: `Unknown document type: ${documentType}` };
  }

  // Check if the database field exists
  const isValidField = mapping.validFields.some((field: string) => {
    // Handle wildcards like 'formData.*' or 'sections.*'
    if (field.endsWith('.*')) {
      const prefix = field.slice(0, -2); // Remove '.*'
      return dbField.startsWith(prefix + '.');
    }
    return field === dbField;
  });

  if (!isValidField) {
    const suggestions = mapping.validFields.filter((field: string) => 
      field.toLowerCase().includes(dbField.toLowerCase()) ||
      dbField.toLowerCase().includes(field.toLowerCase())
    );
    
    return { 
      isValid: false, 
      suggestion: suggestions.length > 0 
        ? `Did you mean: ${suggestions.join(', ')}?`
        : `Valid fields: ${mapping.validFields.join(', ')}`
    };
  }

  // Check if the mapping is correct
  const expectedMapping = mapping.filterMappings[filterField];
  if (expectedMapping && expectedMapping !== dbField) {
    return {
      isValid: false,
      suggestion: `Filter '${filterField}' should map to '${expectedMapping}', not '${dbField}'`
    };
  }

  return { isValid: true };
}
