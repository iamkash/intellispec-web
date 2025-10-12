const fetch = require('node-fetch');

async function testAPIDirect() {
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
    console.log('🧪 Testing API directly...\n');

    const response = await fetch('http://localhost:4001/api/aggregation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ config })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    const text = await response.text();
    console.log('Raw response text:', text);

    if (response.ok) {
      try {
        const data = JSON.parse(text);
        console.log('Parsed response:', JSON.stringify(data, null, 2));
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAPIDirect();
