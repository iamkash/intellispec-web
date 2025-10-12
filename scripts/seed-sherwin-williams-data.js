#!/usr/bin/env node

/**
 * SHERWIN-WILLIAMS PAINT SALES SEED DATA
 * 
 * Creates realistic companies, sites, and assets where Sherwin-Williams
 * could sell paint and coatings across multiple industries.
 * 
 * Industries Covered:
 * - Oil & Gas (refineries, platforms, pipelines)
 * - Manufacturing (automotive, aerospace, general)
 * - Maritime (shipyards, offshore platforms)
 * - Construction (commercial buildings, infrastructure)
 * - Power Generation (power plants, substations)
 * 
 * Usage:
 *   node scripts/seed-sherwin-williams-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/intellispec');
} catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    process.exit(1);
  }
}

// Generate unique IDs
function generateId(prefix = 'doc') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Sherwin-Williams Paint Sales Data
const sherwinWilliamsData = {
  companies: [
    // Oil & Gas Companies
    {
      name: "ExxonMobil Corporation",
      code: "XOM",
      industry: "oil_gas",
      description: "Global oil and gas corporation with refineries and chemical plants",
      headquarters: {
        street: "5959 Las Colinas Boulevard",
        city: "Irving",
        state: "Texas",
        zip: "75039",
        country: "USA"
      },
      contact: {
        ceo: "Darren Woods",
        phone: "+1-972-444-1000",
        email: "investor.relations@exxonmobil.com",
        website: "https://corporate.exxonmobil.com"
      },
      founded_year: 1999,
      employee_count: 64000,
      annual_revenue: 413680000000,
      stock_symbol: "XOM"
    },
    {
      name: "Chevron Corporation",
      code: "CVX",
      industry: "oil_gas",
      description: "Integrated energy company with upstream and downstream operations",
      headquarters: {
        street: "6001 Bollinger Canyon Road",
        city: "San Ramon",
        state: "California",
        zip: "94583",
        country: "USA"
      },
      contact: {
        ceo: "Mike Wirth",
        phone: "+1-925-842-1000",
        email: "media@chevron.com",
        website: "https://www.chevron.com"
      },
      founded_year: 1879,
      employee_count: 47600,
      annual_revenue: 200494000000,
      stock_symbol: "CVX"
    },
    
    // Manufacturing Companies
    {
      name: "Ford Motor Company",
      code: "F",
      industry: "manufacturing",
      description: "Automotive manufacturer requiring paint for vehicle production",
      headquarters: {
        street: "One American Road",
        city: "Dearborn",
        state: "Michigan",
        zip: "48126",
        country: "USA"
      },
      contact: {
        ceo: "Jim Farley",
        phone: "+1-313-322-3000",
        email: "media@ford.com",
        website: "https://www.ford.com"
      },
      founded_year: 1903,
      employee_count: 190000,
      annual_revenue: 158057000000,
      stock_symbol: "F"
    },
    {
      name: "Boeing Company",
      code: "BA",
      industry: "manufacturing",
      description: "Aerospace manufacturer requiring specialized coatings",
      headquarters: {
        street: "100 North Riverside Plaza",
        city: "Chicago",
        state: "Illinois",
        zip: "60606",
        country: "USA"
      },
      contact: {
        ceo: "Dave Calhoun",
        phone: "+1-312-544-2000",
        email: "communications@boeing.com",
        website: "https://www.boeing.com"
      },
      founded_year: 1916,
      employee_count: 156000,
      annual_revenue: 66608000000,
      stock_symbol: "BA"
    },
    
    // Maritime Companies
    {
      name: "Huntington Ingalls Industries",
      code: "HII",
      industry: "maritime",
      description: "Shipbuilding company requiring marine coatings",
      headquarters: {
        street: "4101 Washington Avenue",
        city: "Newport News",
        state: "Virginia",
        zip: "23607",
        country: "USA"
      },
      contact: {
        ceo: "Mike Petters",
        phone: "+1-757-380-2000",
        email: "media@hii-co.com",
        website: "https://www.huntingtoningalls.com"
      },
      founded_year: 2011,
      employee_count: 44000,
      annual_revenue: 9524000000,
      stock_symbol: "HII"
    },
    
    // Construction Companies
    {
      name: "Turner Construction Company",
      code: "TURNER",
      industry: "construction",
      description: "General contractor requiring architectural coatings",
      headquarters: {
        street: "375 Hudson Street",
        city: "New York",
        state: "New York",
        zip: "10014",
        country: "USA"
      },
      contact: {
        ceo: "Peter Davoren",
        phone: "+1-212-229-6000",
        email: "info@tcco.com",
        website: "https://www.turnerconstruction.com"
      },
      founded_year: 1902,
      employee_count: 10000,
      annual_revenue: 14000000000
    },
    
    // Power Generation
    {
      name: "NextEra Energy",
      code: "NEE",
      industry: "power_generation",
      description: "Electric utility company with power plants requiring protective coatings",
      headquarters: {
        street: "700 Universe Boulevard",
        city: "Juno Beach",
        state: "Florida",
        zip: "33408",
        country: "USA"
      },
      contact: {
        ceo: "John Ketchum",
        phone: "+1-561-694-4000",
        email: "communications@nexteraenergy.com",
        website: "https://www.nexteraenergy.com"
      },
      founded_year: 1925,
      employee_count: 15000,
      annual_revenue: 20956000000,
      stock_symbol: "NEE"
    }
  ],

  sites: [
    // ExxonMobil Sites
    {
      companyCode: "XOM",
      name: "Baytown Refinery",
      code: "BTN-REF",
      site_type: "refinery",
      description: "Large oil refinery with extensive piping and storage systems requiring protective coatings"
    },
    {
      companyCode: "XOM",
      name: "Beaumont Refinery",
      code: "BEA-REF",
      site_type: "refinery",
      description: "Integrated refining and chemical complex with high-temperature coating requirements"
    },
    
    // Chevron Sites
    {
      companyCode: "CVX",
      name: "Richmond Refinery",
      code: "RIC-REF",
      site_type: "refinery",
      description: "West Coast refinery requiring marine and industrial coatings"
    },
    {
      companyCode: "CVX",
      name: "Tengiz Oil Field",
      code: "TEN-DRILL",
      site_type: "drilling_platform",
      description: "Offshore drilling platform requiring specialized marine coatings"
    },
    
    // Ford Sites
    {
      companyCode: "F",
      name: "Dearborn Assembly Plant",
      code: "DEA-ASM",
      site_type: "manufacturing_facility",
      description: "Vehicle assembly plant requiring automotive paint systems"
    },
    {
      companyCode: "F",
      name: "Kansas City Assembly Plant",
      code: "KC-ASM",
      site_type: "manufacturing_facility",
      description: "Truck manufacturing facility with paint booth operations"
    },
    
    // Boeing Sites
    {
      companyCode: "BA",
      name: "Everett Factory",
      code: "EVE-FAC",
      site_type: "manufacturing_facility",
      description: "Aircraft assembly facility requiring aerospace-grade coatings"
    },
    {
      companyCode: "BA",
      name: "Charleston Assembly",
      code: "CHA-ASM",
      site_type: "manufacturing_facility",
      description: "Commercial aircraft production requiring specialized paint systems"
    },
    
    // Huntington Ingalls Sites
    {
      companyCode: "HII",
      name: "Newport News Shipyard",
      code: "NN-SHIP",
      site_type: "shipyard",
      description: "Naval shipyard requiring marine-grade protective coatings"
    },
    {
      companyCode: "HII",
      name: "Ingalls Shipyard",
      code: "ING-SHIP",
      site_type: "shipyard",
      description: "Commercial shipbuilding facility with extensive coating requirements"
    },
    
    // Turner Construction Sites
    {
      companyCode: "TURNER",
      name: "One World Trade Center",
      code: "1WTC-PROJ",
      site_type: "construction_site",
      description: "High-rise construction project requiring architectural coatings"
    },
    {
      companyCode: "TURNER",
      name: "LAX Terminal Modernization",
      code: "LAX-TERM",
      site_type: "construction_site",
      description: "Airport terminal construction requiring durable architectural finishes"
    },
    
    // NextEra Energy Sites
    {
      companyCode: "NEE",
      name: "Turkey Point Nuclear Plant",
      code: "TP-NUC",
      site_type: "power_plant",
      description: "Nuclear power facility requiring specialized protective coatings"
    },
    {
      companyCode: "NEE",
      name: "FPL Manatee Energy Center",
      code: "MAN-GAS",
      site_type: "power_plant",
      description: "Natural gas power plant with high-temperature coating needs"
    }
  ],

  assetGroups: [
    // Refinery Asset Groups (Paint-intensive)
    { siteCode: "BTN-REF", name: "Storage Tanks", code: "TANKS", group_type: "storage_tanks" },
    { siteCode: "BTN-REF", name: "Process Piping", code: "PIPING", group_type: "pipeline_systems" },
    { siteCode: "BTN-REF", name: "Heat Exchangers", code: "HX", group_type: "heat_exchangers" },
    
    { siteCode: "BEA-REF", name: "Crude Storage", code: "CRUDE", group_type: "storage_tanks" },
    { siteCode: "BEA-REF", name: "Distillation Units", code: "DIST", group_type: "separators" },
    
    { siteCode: "RIC-REF", name: "Marine Terminal", code: "MARINE", group_type: "storage_tanks" },
    { siteCode: "RIC-REF", name: "Cooling Systems", code: "COOL", group_type: "heat_exchangers" },
    
    // Manufacturing Asset Groups (Paint booths, equipment)
    { siteCode: "DEA-ASM", name: "Paint Booths", code: "PAINT", group_type: "manufacturing_equipment" },
    { siteCode: "DEA-ASM", name: "Assembly Line", code: "ASSY", group_type: "manufacturing_equipment" },
    
    { siteCode: "KC-ASM", name: "Coating Systems", code: "COAT", group_type: "manufacturing_equipment" },
    { siteCode: "KC-ASM", name: "Conveyor Systems", code: "CONV", group_type: "manufacturing_equipment" },
    
    { siteCode: "EVE-FAC", name: "Paint Hangars", code: "HANGAR", group_type: "manufacturing_equipment" },
    { siteCode: "EVE-FAC", name: "Surface Prep", code: "PREP", group_type: "manufacturing_equipment" },
    
    // Shipyard Asset Groups (Marine coatings)
    { siteCode: "NN-SHIP", name: "Dry Docks", code: "DOCK", group_type: "marine_structures" },
    { siteCode: "NN-SHIP", name: "Blast Booths", code: "BLAST", group_type: "manufacturing_equipment" },
    
    { siteCode: "ING-SHIP", name: "Hull Sections", code: "HULL", group_type: "marine_structures" },
    { siteCode: "ING-SHIP", name: "Coating Facilities", code: "COAT-FAC", group_type: "manufacturing_equipment" },
    
    // Construction Asset Groups
    { siteCode: "1WTC-PROJ", name: "Structural Steel", code: "STEEL", group_type: "construction_equipment" },
    { siteCode: "1WTC-PROJ", name: "Exterior Systems", code: "EXT", group_type: "construction_equipment" },
    
    // Power Plant Asset Groups
    { siteCode: "TP-NUC", name: "Cooling Towers", code: "TOWER", group_type: "power_equipment" },
    { siteCode: "TP-NUC", name: "Containment", code: "CONTAIN", group_type: "power_equipment" },
    
    { siteCode: "MAN-GAS", name: "Gas Turbines", code: "TURB", group_type: "power_equipment" },
    { siteCode: "MAN-GAS", name: "Stack Systems", code: "STACK", group_type: "power_equipment" }
  ],

  assets: [
    // Storage Tank Assets (High paint volume)
    { groupCode: "TANKS", name: "Crude Oil Tank #1", asset_tag: "T-001", asset_type: "tank", manufacturer: "CB&I", model: "Fixed Roof 100K BBL" },
    { groupCode: "TANKS", name: "Crude Oil Tank #2", asset_tag: "T-002", asset_type: "tank", manufacturer: "CB&I", model: "Fixed Roof 100K BBL" },
    { groupCode: "TANKS", name: "Gasoline Tank #1", asset_tag: "T-101", asset_type: "tank", manufacturer: "Matrix Service", model: "Floating Roof 80K BBL" },
    { groupCode: "TANKS", name: "Diesel Tank #1", asset_tag: "T-201", asset_type: "tank", manufacturer: "Matrix Service", model: "Fixed Roof 60K BBL" },
    
    // Pipeline Assets (Extensive coating needs)
    { groupCode: "PIPING", name: "Main Process Line A", asset_tag: "P-001", asset_type: "pipeline", manufacturer: "Bechtel", model: "24 inch Carbon Steel" },
    { groupCode: "PIPING", name: "Control Valve CV-100", asset_tag: "CV-100", asset_type: "valve", manufacturer: "Fisher", model: "EZ Series" },
    { groupCode: "PIPING", name: "Control Valve CV-101", asset_tag: "CV-101", asset_type: "valve", manufacturer: "Emerson", model: "ED Series" },
    
    // Heat Exchanger Assets
    { groupCode: "HX", name: "Crude Preheat Exchanger", asset_tag: "E-001", asset_type: "heat_exchanger", manufacturer: "Alfa Laval", model: "Shell & Tube" },
    { groupCode: "HX", name: "Product Cooler", asset_tag: "E-002", asset_type: "heat_exchanger", manufacturer: "API Schmidt", model: "Plate Type" },
    
    // Paint Booth Assets (Direct Sherwin-Williams customers)
    { groupCode: "PAINT", name: "Paint Booth #1", asset_tag: "PB-001", asset_type: "manufacturing_equipment", manufacturer: "Eisenmann", model: "EcoDryScrubber" },
    { groupCode: "PAINT", name: "Paint Booth #2", asset_tag: "PB-002", asset_type: "manufacturing_equipment", manufacturer: "Durr", model: "EcoRP E043" },
    { groupCode: "PAINT", name: "Oven Cure System", asset_tag: "OV-001", asset_type: "manufacturing_equipment", manufacturer: "Eisenmann", model: "EcoCore" },
    
    // Assembly Line Assets
    { groupCode: "ASSY", name: "Body Shop Robot #1", asset_tag: "R-001", asset_type: "manufacturing_equipment", manufacturer: "KUKA", model: "KR 500" },
    { groupCode: "ASSY", name: "Conveyor System A", asset_tag: "C-001", asset_type: "manufacturing_equipment", manufacturer: "Dürr", model: "EcoConveyor" },
    
    // Coating System Assets
    { groupCode: "COAT", name: "Primer Application System", asset_tag: "PA-001", asset_type: "manufacturing_equipment", manufacturer: "Graco", model: "ProMix 2KS" },
    { groupCode: "COAT", name: "Basecoat Spray System", asset_tag: "BC-001", asset_type: "manufacturing_equipment", manufacturer: "Sames Kremlin", model: "Airmix" },
    { groupCode: "COAT", name: "Clearcoat Application", asset_tag: "CC-001", asset_type: "manufacturing_equipment", manufacturer: "Ransburg", model: "RansFlex" },
    
    // Aircraft Paint Hangar Assets
    { groupCode: "HANGAR", name: "Aircraft Paint Hangar #1", asset_tag: "H-001", asset_type: "manufacturing_equipment", manufacturer: "Boeing", model: "Wide Body Hangar" },
    { groupCode: "HANGAR", name: "Paint Spray System", asset_tag: "PS-001", asset_type: "manufacturing_equipment", manufacturer: "Graco", model: "XM Plural Component" },
    
    // Surface Prep Assets
    { groupCode: "PREP", name: "Blast Cleaning System", asset_tag: "BL-001", asset_type: "manufacturing_equipment", manufacturer: "Clemco", model: "Blast Machine" },
    { groupCode: "PREP", name: "Surface Profile Gauge", asset_tag: "PG-001", asset_type: "manufacturing_equipment", manufacturer: "DeFelsko", model: "PosiTector SPG" },
    
    // Marine Structure Assets
    { groupCode: "DOCK", name: "Dry Dock #1", asset_tag: "DD-001", asset_type: "marine_structure", manufacturer: "Newport News", model: "Graving Dock" },
    { groupCode: "DOCK", name: "Floating Dry Dock", asset_tag: "FD-001", asset_type: "marine_structure", manufacturer: "Keppel", model: "Floating Dock" },
    
    // Hull Section Assets
    { groupCode: "HULL", name: "Hull Section A", asset_tag: "HS-A01", asset_type: "marine_structure", manufacturer: "Ingalls", model: "Destroyer Hull" },
    { groupCode: "HULL", name: "Hull Section B", asset_tag: "HS-B01", asset_type: "marine_structure", manufacturer: "Ingalls", model: "Destroyer Hull" },
    
    // Blast Booth Assets
    { groupCode: "BLAST", name: "Blast Booth #1", asset_tag: "BB-001", asset_type: "manufacturing_equipment", manufacturer: "Wheelabrator", model: "Tumblast" },
    { groupCode: "BLAST", name: "Paint Booth Marine", asset_tag: "PBM-001", asset_type: "manufacturing_equipment", manufacturer: "Global Finishing", model: "Marine Grade" },
    
    // Construction Assets
    { groupCode: "STEEL", name: "Structural Beam SB-100", asset_tag: "SB-100", asset_type: "construction_equipment", manufacturer: "Nucor", model: "W36x300" },
    { groupCode: "STEEL", name: "Structural Column SC-50", asset_tag: "SC-50", asset_type: "construction_equipment", manufacturer: "Nucor", model: "W14x500" },
    
    // Power Plant Assets
    { groupCode: "TOWER", name: "Cooling Tower #1", asset_tag: "CT-001", asset_type: "power_equipment", manufacturer: "SPX Cooling", model: "Marley NC" },
    { groupCode: "TOWER", name: "Cooling Tower #2", asset_tag: "CT-002", asset_type: "power_equipment", manufacturer: "Baltimore Aircoil", model: "VXI Series" },
    
    { groupCode: "TURB", name: "Gas Turbine GT-1", asset_tag: "GT-001", asset_type: "power_equipment", manufacturer: "GE", model: "7FA.05" },
    { groupCode: "TURB", name: "Gas Turbine GT-2", asset_tag: "GT-002", asset_type: "power_equipment", manufacturer: "Siemens", model: "SGT5-4000F" }
  ]
};

// Seed function
async function seedSherwinWilliamsData() {
try {
    const db = mongoose.connection;
    const collection = db.collection('documents');
    
    // Get default tenant ID (you may need to adjust this)
    const tenantId = 't_pk_inspections'; // Use your actual tenant ID
    const userId = 'superadmin@pksti.com';
    
    let totalCreated = 0;
    const companyMap = new Map();
    const siteMap = new Map();
    const assetGroupMap = new Map();

    // Create Companies
for (const companyData of sherwinWilliamsData.companies) {
      const company = {
        _id: generateId('doc'),
        id: generateId('doc'),
        type: 'company',
        tenantId,
        ...companyData,
        status: 'active',
        tags: ['sherwin-williams-customer', 'paint-sales-prospect'],
        deleted: false,
        created_date: new Date(),
        last_updated: new Date(),
        created_by: userId,
        updated_by: userId
      };
      
      await collection.insertOne(company);
      companyMap.set(companyData.code, company.id);
      totalCreated++;
}

    // Create Sites
for (const siteData of sherwinWilliamsData.sites) {
      const companyId = companyMap.get(siteData.companyCode);
      if (!companyId) {
        console.warn(`   ⚠️  Company not found for site: ${siteData.name}`);
        continue;
      }

      const site = {
        _id: generateId('doc'),
        id: generateId('doc'),
        type: 'site',
        tenantId,
        company_id: companyId,
        name: siteData.name,
        code: siteData.code,
        site_type: siteData.site_type,
        description: siteData.description,
        status: 'active',
        tags: ['paint-intensive', 'coating-requirements'],
        deleted: false,
        created_date: new Date(),
        last_updated: new Date(),
        created_by: userId,
        updated_by: userId
      };
      
      await collection.insertOne(site);
      siteMap.set(siteData.code, site.id);
      totalCreated++;
}

    // Create Asset Groups
for (const groupData of sherwinWilliamsData.assetGroups) {
      const siteId = siteMap.get(groupData.siteCode);
      if (!siteId) {
        console.warn(`   ⚠️  Site not found for asset group: ${groupData.name}`);
        continue;
      }

      const assetGroup = {
        _id: generateId('doc'),
        id: generateId('doc'),
        type: 'asset_group',
        tenantId,
        site_id: siteId,
        name: groupData.name,
        code: groupData.code,
        group_type: groupData.group_type,
        description: `Asset group requiring specialized paint and coating systems`,
        status: 'active',
        tags: ['paint-required', 'coating-maintenance'],
        deleted: false,
        created_date: new Date(),
        last_updated: new Date(),
        created_by: userId,
        updated_by: userId
      };
      
      await collection.insertOne(assetGroup);
      assetGroupMap.set(groupData.code, assetGroup.id);
      totalCreated++;
}

    // Create Assets
for (const assetData of sherwinWilliamsData.assets) {
      const assetGroupId = assetGroupMap.get(assetData.groupCode);
      if (!assetGroupId) {
        console.warn(`   ⚠️  Asset group not found for asset: ${assetData.name}`);
        continue;
      }

      // Get site_id from asset group for validation
      const assetGroup = await collection.findOne({ id: assetGroupId, type: 'asset_group' });
      const siteId = assetGroup?.site_id;

      const asset = {
        _id: generateId('doc'),
        id: generateId('doc'),
        type: 'asset',
        tenantId,
        asset_group_id: assetGroupId,
        site_id: siteId,
        name: assetData.name,
        asset_tag: assetData.asset_tag,
        asset_type: assetData.asset_type,
        manufacturer: assetData.manufacturer,
        model: assetData.model,
        description: `Asset requiring regular paint and coating maintenance for corrosion protection and aesthetics`,
        status: 'active',
        tags: ['paint-maintenance', 'coating-schedule', 'sherwin-williams-opportunity'],
        specifications: {
          coating_requirements: {
            primer_type: "Anti-corrosive primer",
            topcoat_type: "Industrial enamel",
            maintenance_cycle: "Every 3-5 years",
            surface_prep: "SSPC-SP6 commercial blast cleaning"
          }
        },
        maintenance: {
          last_service_date: new Date(Date.now() - (Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          next_service_date: new Date(Date.now() + (Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          maintenance_type: "preventive",
          maintenance_notes: "Regular coating inspection and touch-up required"
        },
        deleted: false,
        created_date: new Date(),
        last_updated: new Date(),
        created_by: userId,
        updated_by: userId
      };
      
      await collection.insertOne(asset);
      totalCreated++;
}
console.log(`📊 Summary:`);
console.log(`   - Companies: ${sherwinWilliamsData.companies.length}`);
console.log(`   - Asset Groups: ${sherwinWilliamsData.assetGroups.length}`);
console.log(`\n🎨 Industries Covered:`);
console.log(`   - Manufacturing (automotive, aerospace)`);
console.log(`   - Construction (commercial buildings)`);
console.log(`\n💰 Paint Sales Opportunities:`);
console.log(`   - Marine coatings`);
console.log(`   - Aerospace coatings`);
} catch (error) {
    console.error('❌ Error seeding Sherwin-Williams data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await seedSherwinWilliamsData();
} catch (error) {
    console.error('❌ Seed process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
}
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { seedSherwinWilliamsData };
