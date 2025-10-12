const http = require('http');

const config = {
  "name": "Total Quantity Purchased",
  "collection": "documents",
  "baseFilter": {"type": "paintInvoice"},
  "fieldMappings": {
    "date_range": "purchaseDate",
    "company_id": "companyId",
    "site_id": "facilityId",
    "paint_spec_id": "lineItems.paintSpecId"
  },
  "groupBy": {
    "_id": null,
    "fields": {
      "total_quantity": {
        "expression": {
          "$sum": {
            "$reduce": {
              "input": "$lineItems",
              "initialValue": 0,
              "in": {"$add": ["$$value", "$$this.quantityPurchased"]}
            }
          }
        }
      }
    }
  }
};

const postData = JSON.stringify({ config });

const options = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/aggregation',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🧪 Testing API on port 4000...\n');
console.log('Sending config:', JSON.stringify(config, null, 2));

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);

  res.setEncoding('utf8');
  let body = '';

  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response body length:', body.length);
    console.log('Raw response body:');
    console.log(body);
    console.log('');

    try {
      const parsed = JSON.parse(body);
      console.log('Parsed response:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Failed to parse JSON response');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();
