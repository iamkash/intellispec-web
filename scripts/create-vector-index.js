/**
 * MongoDB Atlas Vector Search Index Creation Guide
 * 
 * Since vector search indexes must be created through MongoDB Atlas UI or Atlas CLI,
 * this script provides the exact configuration you need.
 */
const indexDefinition = {
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "tenantId"
    },
    {
      "type": "filter", 
      "path": "type"
    }
  ]
};
// Save the config to a file for Atlas CLI
const fs = require('fs');
fs.writeFileSync('vector-index-config.json', JSON.stringify({
  name: "vector_index",
  definition: indexDefinition
}, null, 2));
