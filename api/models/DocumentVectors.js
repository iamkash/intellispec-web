/**
 * Document Vectors Model
 * 
 * Separate collection for storing document embeddings and semantic data
 * to prevent main document size bloat and improve performance
 */

const mongoose = require('mongoose');

const DocumentVectorSchema = new mongoose.Schema({
  // Reference to main document
  documentId: { type: String, required: true, index: true },
  documentType: { type: String, required: true, index: true },
  tenantId: { type: String, required: true, index: true },
  
  // Vector data
  embedding: { 
    type: [Number], 
    index: true,
    validate: {
      validator: function(arr) {
        return !arr || arr.length <= 1536; // Max dimensions for text-embedding-3-small
      },
      message: 'Embedding vector too large'
    }
  },
  
  // Text data (size-limited)
  semanticText: { 
    type: String,
    maxlength: 10000 // 10KB limit
  },
  searchableContent: { 
    type: String,
    maxlength: 5000 // 5KB limit
  },
  
  // Metadata
  embeddingModel: { type: String, default: 'text-embedding-3-small' },
  semanticVersion: { type: String, default: '2.0' },
  lastEmbeddingUpdate: { type: Date, default: Date.now },
  
  // Audit fields
  created_date: { type: Date, default: Date.now },
  last_updated: { type: Date, default: Date.now }
}, {
  collection: 'document_vectors',
  timestamps: false
});

// Compound indexes for efficient queries
DocumentVectorSchema.index({ tenantId: 1, documentType: 1 });
DocumentVectorSchema.index({ tenantId: 1, documentId: 1 }, { unique: true });
DocumentVectorSchema.index({ embedding: '2dsphere' }); // Vector search index

const DocumentVectorModel = mongoose.model('DocumentVector', DocumentVectorSchema);

// Export model only (consistent with other models)
module.exports = DocumentVectorModel;
