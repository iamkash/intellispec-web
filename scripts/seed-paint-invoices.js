const mongoose = require('mongoose');
require('dotenv').config();

// Helper function to generate unique IDs
function generateId(prefix = 'doc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Helper function to get random date within last 6 months
function getRandomRecentDate() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const now = new Date();
  
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime);
}

// Helper function to get random element from array
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to get random quantity based on paint type
function getRealisticQuantity(paintProduct) {
  // Different paint types have different typical order quantities (in grams)
  if (paintProduct.includes('Primer') || paintProduct.includes('Zinc')) {
    // Primers and zinc-rich coatings - larger quantities
    return Math.floor(Math.random() * 50000) + 10000; // 10-60kg
  } else if (paintProduct.includes('Topcoat') || paintProduct.includes('Polysiloxane')) {
    // Topcoats - medium quantities
    return Math.floor(Math.random() * 30000) + 5000; // 5-35kg
  } else if (paintProduct.includes('Novolac') || paintProduct.includes('Epoxy')) {
    // Specialty coatings - smaller quantities
    return Math.floor(Math.random() * 20000) + 2000; // 2-22kg
  } else {
    // Default range
    return Math.floor(Math.random() * 25000) + 5000; // 5-30kg
  }
}

async function seedPaintInvoices() {
  try {
// Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
const db = mongoose.connection.db;
    const collection = db.collection('documents');
    
    // Get available data
const companies = await collection.find({ type: 'company' }).toArray();
    const sites = await collection.find({ type: 'site' }).toArray();
    const paintSpecs = await collection.find({ type: 'paint_specifications' }).toArray();
if (companies.length === 0 || sites.length === 0 || paintSpecs.length === 0) {
      throw new Error('Missing required data. Please ensure companies, sites, and paint specifications are seeded first.');
    }
    
    // Create realistic paint invoices
    const invoices = [];
    const invoiceNumbers = new Set(); // To ensure unique invoice numbers
    
    // Generate 15-20 invoices with realistic data
    const numInvoices = 15 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < numInvoices; i++) {
      // Select random company and one of its sites
      const company = getRandomElement(companies);
      const companySites = sites.filter(site => site.company_id === company.id);
      
      if (companySites.length === 0) {
        console.warn(`⚠️  No sites found for company ${company.name}, skipping...`);
        continue;
      }
      
      const facility = getRandomElement(companySites);
      
      // Generate unique invoice number
      let invoiceNumber;
      do {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const sequence = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
        invoiceNumber = `INV-${year}${month}-${sequence}`;
      } while (invoiceNumbers.has(invoiceNumber));
      invoiceNumbers.add(invoiceNumber);
      
      // Generate PO number
      const poNumber = `PO-${company.code}-${String(Math.floor(Math.random() * 99999) + 10000)}`;
      
      // Random purchase date within last 6 months
      const purchaseDate = getRandomRecentDate();
      
      // Generate 1-4 line items per invoice
      const numLineItems = 1 + Math.floor(Math.random() * 4);
      const lineItems = [];
      
      for (let j = 0; j < numLineItems; j++) {
        const paintSpec = getRandomElement(paintSpecs);
        const quantity = getRealisticQuantity(paintSpec.product);
        
        lineItems.push({
          paintSpecId: paintSpec.id,
          quantityPurchased: quantity
        });
      }
      
      // Determine status based on date (older invoices more likely to be processed)
      const daysSinceCreated = (new Date() - purchaseDate) / (1000 * 60 * 60 * 24);
      let status;
      if (daysSinceCreated > 120) {
        status = getRandomElement(['approved', 'paid']);
      } else if (daysSinceCreated > 60) {
        status = getRandomElement(['submitted', 'approved', 'paid']);
      } else if (daysSinceCreated > 30) {
        status = getRandomElement(['draft', 'submitted', 'approved']);
      } else {
        status = getRandomElement(['draft', 'submitted']);
      }
      
      // Create invoice document
      const invoice = {
        _id: generateId(),
        id: generateId(),
        type: 'paintInvoice',
        tenantId: '68aa95caaba0d502fe6ada5a', // Use the same tenant as existing data
        companyId: company.id,
        facilityId: facility.id,
        invoiceNumber: invoiceNumber,
        purchaseDate: purchaseDate,
        poNumber: poNumber,
        lineItems: lineItems,
        status: status,
        deleted: false,
        created_date: purchaseDate,
        last_updated: purchaseDate,
        created_by: 'system-seed',
        updated_by: 'system-seed'
      };
      
      invoices.push(invoice);
}
    
    // Insert invoices into database
    if (invoices.length > 0) {
await collection.insertMany(invoices);
// Display summary
console.log('==================');
      
      const statusCounts = {};
      let totalLineItems = 0;
      let totalQuantity = 0;
      
      invoices.forEach(invoice => {
        statusCounts[invoice.status] = (statusCounts[invoice.status] || 0) + 1;
        totalLineItems += invoice.lineItems.length;
        totalQuantity += invoice.lineItems.reduce((sum, item) => sum + item.quantityPurchased, 0);
      });
console.log(`Total Line Items: ${totalLineItems}`);
console.log('\nStatus Distribution:');
      Object.entries(statusCounts).forEach(([status, count]) => {
});
const companyInvoices = {};
      invoices.forEach(invoice => {
        const company = companies.find(c => c.id === invoice.companyId);
        const companyName = company ? company.name : 'Unknown';
        companyInvoices[companyName] = (companyInvoices[companyName] || 0) + 1;
      });
      Object.entries(companyInvoices).forEach(([company, count]) => {
});
      
    } else {
}
    
  } catch (error) {
    console.error('❌ Error seeding paint invoices:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
}
}

// Run the seeding function
if (require.main === module) {
  seedPaintInvoices()
    .then(() => {
process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Paint invoice seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedPaintInvoices };
