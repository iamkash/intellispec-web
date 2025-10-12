// Template: Validated Document Schema
// This is a Cursor IDE template file
// Replace the placeholder values below when creating a new document schema

import mongoose, { Schema } from 'mongoose';
import { BaseDocument } from '../../src/models/DocumentSchemas';

// Example Interface (replace ExampleDocument with your interface name)
export interface ExampleDocument extends BaseDocument {
  type: 'example_document'; // Replace with your document type
  exampleField: string; // Replace with your field name and type
  // Add more fields as needed
}

// Example Mongoose Schema (replace ExampleDocument with your interface name)
const ExampleDocumentSchema = new Schema({
  id: { type: String, required: true, unique: true, index: true },
  type: { type: String, required: true, enum: ['example_document'], index: true }, // Replace enum value
  tenantId: { type: String, required: true, index: true },
  
  // Document-specific fields (replace with your actual fields)
  exampleField: { type: String, required: true, index: true },
  
  // Standard audit fields
  deleted: { type: Boolean, default: false, index: true },
  deleted_at: Date,
  deleted_by: String,
  created_date: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now },
  created_by: String,
  updated_by: String
}, {
  collection: 'documents',
  timestamps: false
});

// Indexes for common queries (replace field names)
ExampleDocumentSchema.index({ tenantId: 1, exampleField: 1 });

// Export Model (replace ExampleDocument with your interface name)
export const ExampleDocumentModel = mongoose.model<ExampleDocument>('ExampleDocument', ExampleDocumentSchema);

// REQUIRED: Add to DOCUMENT_FIELD_MAPPINGS in DocumentSchemas.ts
/*
Add this to the DOCUMENT_FIELD_MAPPINGS object:

example_document: {
  validFields: ['exampleField'], // Replace with your field names
  filterMappings: {
    'example_filter': 'exampleField' // Replace with your filter mappings
  }
}
*/
