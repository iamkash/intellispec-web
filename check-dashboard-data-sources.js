// Check what data sources the dashboard is actually using
async function checkDashboardDataSources() {
  try {
    console.log('Checking dashboard data sources...\n');
    
    // Check all document types
    const documentTypes = ['asset', 'inspection', 'company', 'site', 'paintInvoice', 'paint_specifications'];
    
    for (const type of documentTypes) {
      console.log(`Checking ${type} documents...`);
      const url = `http://localhost:4000/api/documents?type=${type}&page=1&limit=3`;
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        console.log(`  ✅ ${type}: ${result.data.length} records`);
        if (result.data.length > 0) {
          console.log(`  Sample fields: ${Object.keys(result.data[0]).join(', ')}`);
          
          // Check if it has inspection-related fields
          const hasInspectionFields = result.data[0].inspection || 
                                   result.data[0].formData?.inspectionDate ||
                                   result.data[0].next_inspection_date;
          if (hasInspectionFields) {
            console.log(`  🔍 Has inspection-related fields!`);
            console.log(`  Sample inspection data:`, JSON.stringify(hasInspectionFields, null, 2));
          }
        }
      } else {
        console.log(`  ❌ ${type}: ${result.error}`);
      }
      console.log('');
    }
    
    // Also check if there are any documents at all (without type filter)
    console.log('Checking documents without type filter...');
    try {
      const allUrl = 'http://localhost:4000/api/documents?page=1&limit=10';
      const allResponse = await fetch(allUrl);
      const allResult = await allResponse.json();
      
      if (allResult.success) {
        console.log(`✅ All documents: ${allResult.data.length} records`);
        if (allResult.data.length > 0) {
          const types = [...new Set(allResult.data.map(doc => doc.type))];
          console.log(`Available document types: ${types.join(', ')}`);
        }
      } else {
        console.log(`❌ All documents: ${allResult.error}`);
      }
    } catch (e) {
      console.log(`❌ All documents: ${e.message}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDashboardDataSources();

