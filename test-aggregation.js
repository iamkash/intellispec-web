const { spawn } = require('child_process');

function curlTest(description, headers, data) {
  return new Promise((resolve, reject) => {
    const curlArgs = [
      '-X', 'POST',
      'http://localhost:4001/api/aggregation',
      '-H', 'Content-Type: application/json'
    ];

    // Add custom headers
    Object.entries(headers).forEach(([key, value]) => {
      curlArgs.push('-H', `${key}: ${value}`);
    });

    curlArgs.push('-d', JSON.stringify(data));

    console.log(`\n${description}:`);
    console.log('Command:', 'curl', curlArgs.join(' '));

    const curl = spawn('curl', curlArgs);

    let output = '';
    let errorOutput = '';

    curl.stdout.on('data', (data) => {
      output += data.toString();
    });

    curl.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    curl.on('close', (code) => {
      try {
        if (code === 0) {
          const result = JSON.parse(output);
          console.log('Status: 200');
          console.log('Data length:', result.data?.length || 0);
          console.log('Has data:', result.data && result.data.length > 0 ? 'YES' : 'NO');

          if (result.data && result.data.length > 0) {
            console.log('Sample result:', JSON.stringify(result.data[0], null, 2));
          }
          resolve(result);
        } else {
          console.log('Status: Error');
          console.log('Error output:', errorOutput);
          reject(new Error(`Curl failed with code ${code}`));
        }
      } catch (e) {
        console.log('Failed to parse response:', output);
        reject(e);
      }
    });
  });
}

async function testAggregation() {
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

  try {
    console.log('🧪 Testing aggregation API...\n');

    // Test without tenant header
    await curlTest('1. Testing without x-tenant-id header', {}, { config });

    // Test with correct tenant header
    await curlTest('2. Testing with correct x-tenant-id header',
      {'x-tenant-id': '68aa95caaba0d502fe6ada5a'},
      { config }
    );

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAggregation();
