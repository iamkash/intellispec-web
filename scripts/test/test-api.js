const https = require('https');
const http = require('http');

function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

async function testAPI() {
  try {
    console.log('=== TESTING API WITH TENANT HEADER ===');
    
    const options = {
      hostname: 'localhost',
      port: 4000,
      path: '/api/inspections',
      method: 'GET',
      headers: {
        'x-tenant-id': 'pksti'
      }
    };
    
    const data = await makeRequest(options);
    
    console.log('API Response:');
    console.log('Total:', data.total);
    console.log('Returned:', data.data.length);
    console.log('Page:', data.page);
    console.log('Pages:', data.pages);
    
    // Check inspection types in response
    const types = {};
    data.data.forEach(item => {
      const type = item.inspectionType || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    console.log('\nTypes in API response:', types);
    
    // Check if any have deleted flag
    const deleted = data.data.filter(item => item.deleted);
    console.log('Deleted items in response:', deleted.length);
    
    // Show first few items
    console.log('\nFirst 3 items:');
    data.data.slice(0, 3).forEach((item, i) => {
      console.log(`${i+1}. ID: ${item.id}, Type: ${item.inspectionType}, Status: ${item.status}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
