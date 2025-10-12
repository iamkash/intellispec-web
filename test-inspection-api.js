const fetch = require('node-fetch');

async function testInspectionStatsAPI() {
  try {
// Test without authentication first
    const response = await fetch('http://localhost:3001/api/inspections/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add basic auth headers if needed
        'x-tenant-id': 'default-tenant',
        'x-user-id': 'default-user'
      }
    });
console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
console.log(JSON.stringify(data, null, 2));

      // Check if the expected fields are present
      const expectedFields = ['total', 'completed', 'inProgress', 'approved', 'avgProgress', 'complianceRate', 'overdue'];
expectedFields.forEach(field => {
        if (data[field] !== undefined) {
} else {
}
      });
    } else {
      const errorText = await response.text();
}

  } catch (error) {
    console.error('Test failed:', error.message);
console.log('1. MongoDB is running');
console.log('3. There are inspection documents in the database');
  }
}

testInspectionStatsAPI();
