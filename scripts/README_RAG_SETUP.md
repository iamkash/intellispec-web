# RAG Chatbot Setup Guide

## Overview
This guide walks you through setting up the complete RAG (Retrieval-Augmented Generation) chatbot functionality for your VOC compliance workspace.

## Prerequisites

### 1. Environment Variables
Ensure these environment variables are set in your `.env` file:

```bash
# MongoDB Atlas connection (required for vector search)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellispec

# OpenAI API key (required for embeddings and chat)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Database name (optional, defaults to 'intellispec')
DATABASE_NAME=intellispec
```

### 2. MongoDB Atlas Requirements
- **MongoDB Atlas cluster** (vector search is Atlas-only, not available in local MongoDB)
- **M10+ cluster tier** (vector search requires dedicated clusters)
- **Search index capability** enabled

## Step-by-Step Setup

### Step 1: Create Vector Search Index

```bash
# Create the MongoDB Atlas vector search index
node scripts/setup-vector-search-index.js
```

**What this does:**
- Creates `voc_vector_search` index for 1536-dimensional embeddings
- Adds filter fields for tenant isolation and document types
- Creates performance indexes for faster queries

**If you see "Vector search requires MongoDB Atlas":**
- You're using local MongoDB - vector search only works on Atlas
- Manually create the index in Atlas UI using the provided configuration

### Step 2: Generate Document Embeddings

```bash
# Generate embeddings for all existing documents (dry run first)
node scripts/generate-document-embeddings.js --dry-run

# Generate embeddings for real
node scripts/generate-document-embeddings.js

# Generate embeddings for specific document type only
node scripts/generate-document-embeddings.js --document-type=paintInvoice
```

**What this does:**
- Processes `paintInvoice` and `paint_specifications` documents
- Generates semantic text from document fields
- Creates 1536-dimensional embeddings using OpenAI
- Adds `embedding`, `semanticText`, and `searchableContent` fields

**Expected output:**
```
📄 Found 150 documents to process
✅ Updated paintInvoice:inv_001
✅ Updated paint_specifications:spec_001
🎉 Embedding generation completed!
📊 Summary:
  📄 Documents processed: 150
  ✅ Documents updated: 150
```

### Step 3: Test RAG Functionality

```bash
# Test the complete RAG pipeline
node scripts/test-rag-chatbot.js

# Test with custom endpoint and tenant
node scripts/test-rag-chatbot.js --endpoint=http://localhost:3001 --tenant-id=your-tenant-id
```

**What this tests:**
- MongoDB vector search pipeline
- Document structure and embeddings
- RAG chat API endpoints
- Context building and AI responses

**Expected output:**
```
🧪 RAG Chatbot Test Suite
==========================
✅ Connected to database
📊 Document types: paintInvoice, paint_specifications
✅ Vector search returned 3 results
💬 Testing RAG Chat API: "What paint specifications have the highest VOC content?"
✅ API Response received:
  Success: true
  Search Results: 3
  Response: Based on the paint specifications data, the highest VOC content...
🎯 Overall Result: ✅ ALL TESTS PASSED
```

## Troubleshooting

### Issue: "No documents with embeddings found"

**Solution:**
1. Check if documents exist: `db.documents.countDocuments()`
2. Run embedding generation: `node scripts/generate-document-embeddings.js`
3. Verify OpenAI API key is valid

### Issue: "Vector search index not found"

**Solution:**
1. Ensure you're using MongoDB Atlas (not local MongoDB)
2. Run: `node scripts/setup-vector-search-index.js`
3. Wait 5-10 minutes for index to build in Atlas
4. Check Atlas UI under "Search" tab

### Issue: "API request failed (500)"

**Solution:**
1. Check server logs for detailed errors
2. Verify RAG chat routes are registered in `api/server.js`
3. Ensure `buildRAGFilterStage` function exists in `api/routes/rag-chat.js`
4. Check OpenAI API key and rate limits

### Issue: "No search results returned"

**Solution:**
1. Verify tenant ID matches your data: `db.documents.distinct('tenantId')`
2. Check document types: `db.documents.distinct('type')`
3. Ensure embeddings exist: `db.documents.countDocuments({embedding: {$exists: true}})`
4. Test with broader filters or no filters

### Issue: "Poor response quality"

**Solution:**
1. Check semantic text quality in documents
2. Adjust `semanticFields` in workspace configuration
3. Increase `maxResults` in RAG configuration
4. Fine-tune system prompts in workspace config

## Configuration Files

### Workspace Configuration
The RAG chatbot is configured in:
`public/data/workspaces/compliance-manager/voc-workspace.json`

Key sections:
- `rag.contextSources`: Document types to search
- `rag.semanticFields`: Fields used for context building
- `rag.fieldMappings`: Filter field mappings
- `ai.systemPrompt`: AI behavior instructions

### Document Schema
RAG fields are defined in:
`src/models/DocumentSchemas.ts`

Added fields:
- `embedding: number[]` - Vector embeddings
- `semanticText: string` - Human-readable context
- `searchableContent: string` - Keyword search content
- `ragMetadata: object` - Generation metadata

## Performance Optimization

### Index Optimization
```javascript
// Additional indexes for better performance
db.documents.createIndex({ "tenantId": 1, "type": 1, "deleted": 1 })
db.documents.createIndex({ "embedding": 1 })
db.documents.createIndex({ "semanticText": "text" })
```

### Batch Processing
```bash
# Process documents in smaller batches
node scripts/generate-document-embeddings.js --batch-size=25

# Process only recent documents
node scripts/generate-document-embeddings.js --document-type=paintInvoice
```

### Monitoring
- Check embedding generation logs for errors
- Monitor OpenAI API usage and costs
- Track vector search performance in Atlas metrics
- Review chat interaction logs for quality

## Maintenance

### Regular Tasks
1. **Weekly**: Re-generate embeddings for new documents
2. **Monthly**: Review and optimize semantic text generation
3. **Quarterly**: Update system prompts based on user feedback

### Adding New Document Types
1. Add document type to `contextSources` in workspace config
2. Update `semanticFields` and `fieldMappings`
3. Run embedding generation for new document type
4. Test with sample queries

### Scaling Considerations
- **Documents**: Atlas vector search scales to millions of documents
- **Tenants**: Each tenant is isolated via `tenantId` filters
- **Concurrent Users**: API can handle multiple simultaneous requests
- **Costs**: Monitor OpenAI embedding and chat API usage

## Support

For issues or questions:
1. Check server logs: `tail -f logs/server.log`
2. Review Atlas search index status
3. Test individual components using the test scripts
4. Verify environment variables and API keys

## Next Steps

After successful setup:
1. 🎯 Test the chatbot in the VOC workspace UI
2. 📊 Monitor search relevance and response quality
3. 🔧 Fine-tune prompts and semantic field configurations
4. 📈 Scale to additional document types and workspaces
