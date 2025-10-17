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
      path: '/api/documents?type=wizard&identity.domain=inspection&limit=20',
      method: 'GET',
      headers: {
        'x-tenant-id': 'pksti'
      }
    };

    const result = await makeRequest(options);

    const rows = Array.isArray(result?.data) ? result.data : [];
    const pagination = result?.pagination || {};

    const getValue = (record, paths) => {
      for (const path of paths) {
        if (!path) continue;
        const segments = path.split('.');
        let current = record;
        for (const segment of segments) {
          current = current?.[segment];
        }
        if (current !== undefined && current !== null && current !== '') {
          return current;
        }
      }
      return undefined;
    };

    console.log('API Response:');
    console.log('Total:', pagination.total ?? rows.length);
    console.log('Returned:', rows.length);
    console.log('Page:', pagination.page ?? 1);
    console.log('Pages:', pagination.totalPages ?? 1);

    const types = {};
    rows.forEach(item => {
      const type = getValue(item, [
        'inspectionType',
        'documentSummary.inspectionType',
        'wizardState.documentSummary.inspectionType'
      ]) || 'unknown';
      types[type] = (types[type] || 0) + 1;
    });

    console.log('\nTypes in API response:', types);

    const deleted = rows.filter(item => item.deleted);
    console.log('Deleted items in response:', deleted.length);

    console.log('\nFirst 3 items:');
    rows.slice(0, 3).forEach((item, i) => {
      const documentType = getValue(item, ['type']) || 'unknown';
      const domain = getValue(item, ['identity.domainLabel', 'identity.domain']) || 'unknown';
      const domainType = getValue(item, ['identity.domainSubTypeLabel', 'identity.domainSubType']) || 'unknown';
      const status = getValue(item, ['status']) || 'unknown';
      console.log(`${i + 1}. ID: ${item.id}, DocType: ${documentType}, Domain: ${domain}, DomainType: ${domainType}, Status: ${status}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI();
