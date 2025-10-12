#!/usr/bin/env node

/**
 * INDUSTRIAL CUSTOMERS SEED DATA
 * 
 * Creates additional industrial companies, sites, and assets for tenant 68aa95caaba0d502fe6ada5a
 * Focus on heavy industry customers requiring extensive coating and maintenance services.
 * 
 * Industries Covered:
 * - Chemicals & Petrochemicals
 * - Steel & Mining
 * - Pharmaceutical Manufacturing
 * - Food & Beverage Processing
 * - Pulp & Paper
 * 
 * Usage:
 *   node scripts/seed-industrial-customers-data.js
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

// Industrial Customers Data
const industrialCustomersData = {
  companies: [
    // Chemical Companies
    {
      name: "Dow Chemical Company",
      code: "DOW",
      industry: "chemicals",
      description: "Global chemical manufacturer with extensive processing facilities",
      headquarters: {
        street: "2030 Dow Center",
        city: "Midland",
        state: "Michigan",
        zip: "48674",
        country: "USA"
      },
      contact: {
        ceo: "Jim Fitterling",
        phone: "+1-989-636-1000",
        email: "info@dow.com",
        website: "https://www.dow.com"
      },
      founded_year: 1897,
      employee_count: 35700,
      annual_revenue: 56902000000,
      stock_symbol: "DOW"
    },
    {
      name: "BASF Corporation",
      code: "BASF",
      industry: "chemicals",
      description: "Chemical company with diverse product portfolio and manufacturing sites",
      headquarters: {
        street: "100 Park Avenue",
        city: "Florham Park",
        state: "New Jersey",
        zip: "07932",
        country: "USA"
      },
      contact: {
        ceo: "Martin Brudermüller",
        phone: "+1-973-245-6000",
        email: "info@basf.com",
        website: "https://www.basf.com"
      },
      founded_year: 1865,
      employee_count: 111047,
      annual_revenue: 78595000000
    },
    
    // Steel & Mining Companies
    {
      name: "United States Steel Corporation",
      code: "X",
      industry: "manufacturing",
      description: "Integrated steel producer with blast furnaces and rolling mills",
      headquarters: {
        street: "600 Grant Street",
        city: "Pittsburgh",
        state: "Pennsylvania",
        zip: "15219",
        country: "USA"
      },
      contact: {
        ceo: "David B. Burritt",
        phone: "+1-412-433-1121",
        email: "info@ussteel.com",
        website: "https://www.ussteel.com"
      },
      founded_year: 1901,
      employee_count: 22000,
      annual_revenue: 20860000000,
      stock_symbol: "X"
    },
    {
      name: "Nucor Corporation",
      code: "NUE",
      industry: "manufacturing",
      description: "Steel and steel products manufacturer with mini-mills",
      headquarters: {
        street: "1915 Rexford Road",
        city: "Charlotte",
        state: "North Carolina",
        zip: "28211",
        country: "USA"
      },
      contact: {
        ceo: "Leon Topalian",
        phone: "+1-704-366-7000",
        email: "info@nucor.com",
        website: "https://www.nucor.com"
      },
      founded_year: 1940,
      employee_count: 26800,
      annual_revenue: 41507000000,
      stock_symbol: "NUE"
    },
    
    // Pharmaceutical Companies
    {
      name: "Pfizer Inc.",
      code: "PFE",
      industry: "pharmaceutical",
      description: "Pharmaceutical manufacturer with sterile production facilities",
      headquarters: {
        street: "235 East 42nd Street",
        city: "New York",
        state: "New York",
        zip: "10017",
        country: "USA"
      },
      contact: {
        ceo: "Albert Bourla",
        phone: "+1-212-733-2323",
        email: "media@pfizer.com",
        website: "https://www.pfizer.com"
      },
      founded_year: 1849,
      employee_count: 83000,
      annual_revenue: 100330000000,
      stock_symbol: "PFE"
    },
    
    // Food & Beverage Companies
    {
      name: "Anheuser-Busch InBev",
      code: "BUD",
      industry: "manufacturing",
      description: "Brewery and beverage manufacturing with large-scale production facilities",
      headquarters: {
        street: "1 Busch Place",
        city: "St. Louis",
        state: "Missouri",
        zip: "63118",
        country: "USA"
      },
      contact: {
        ceo: "Michel Doukeris",
        phone: "+1-314-577-2000",
        email: "media@ab-inbev.com",
        website: "https://www.ab-inbev.com"
      },
      founded_year: 1852,
      employee_count: 164000,
      annual_revenue: 57786000000,
      stock_symbol: "BUD"
    },
    
    // Pulp & Paper Companies
    {
      name: "International Paper Company",
      code: "IP",
      industry: "manufacturing",
      description: "Pulp and paper manufacturer with large industrial facilities",
      headquarters: {
        street: "6400 Poplar Avenue",
        city: "Memphis",
        state: "Tennessee",
        zip: "38197",
        country: "USA"
      },
      contact: {
        ceo: "Mark Sutton",
        phone: "+1-901-419-9000",
        email: "info@ipaper.com",
        website: "https://www.internationalpaper.com"
      },
      founded_year: 1898,
      employee_count: 38000,
      annual_revenue: 18060000000,
      stock_symbol: "IP"
    }
  ],

  sites: [
    // Dow Chemical Sites
    {
      companyCode: "DOW",
      name: "Freeport Chemical Complex",
      code: "DOW-FRP",
      site_type: "chemical_plant",
      description: "Large-scale chemical production facility with extensive piping and reactor systems"
    },
    {
      companyCode: "DOW",
      name: "Plaquemine Manufacturing Complex",
      code: "DOW-PLQ",
      site_type: "chemical_plant",
      description: "Integrated petrochemical complex with multiple production units"
    },
    
    // BASF Sites
    {
      companyCode: "BASF",
      name: "Geismar Chemical Complex",
      code: "BASF-GEI",
      site_type: "chemical_plant",
      description: "Multi-product chemical manufacturing site with specialty chemicals production"
    },
    {
      companyCode: "BASF",
      name: "Freeport Chemical Site",
      code: "BASF-FRP",
      site_type: "chemical_plant",
      description: "Acrylic acid and specialty chemicals production facility"
    },
    
    // US Steel Sites
    {
      companyCode: "X",
      name: "Gary Works Steel Mill",
      code: "USS-GAR",
      site_type: "manufacturing_facility",
      description: "Integrated steel mill with blast furnaces, coke ovens, and rolling mills"
    },
    {
      companyCode: "X",
      name: "Mon Valley Works",
      code: "USS-MON",
      site_type: "manufacturing_facility",
      description: "Steel production facility with extensive structural steel fabrication"
    },
    
    // Nucor Sites
    {
      companyCode: "NUE",
      name: "Crawfordsville Steel Mill",
      code: "NUE-CRA",
      site_type: "manufacturing_facility",
      description: "Mini-mill steel production with electric arc furnaces"
    },
    {
      companyCode: "NUE",
      name: "Berkeley Steel Mill",
      code: "NUE-BER",
      site_type: "manufacturing_facility",
      description: "Flat-rolled steel production facility"
    },
    
    // Pfizer Sites
    {
      companyCode: "PFE",
      name: "Kalamazoo Manufacturing Site",
      code: "PFE-KAL",
      site_type: "pharmaceutical_facility",
      description: "Sterile pharmaceutical manufacturing with cleanroom facilities"
    },
    {
      companyCode: "PFE",
      name: "Groton Research Site",
      code: "PFE-GRO",
      site_type: "pharmaceutical_facility",
      description: "Research and development facility with pilot manufacturing"
    },
    
    // Anheuser-Busch Sites
    {
      companyCode: "BUD",
      name: "St. Louis Brewery",
      code: "BUD-STL",
      site_type: "manufacturing_facility",
      description: "Large-scale brewery with fermentation tanks and packaging lines"
    },
    {
      companyCode: "BUD",
      name: "Newark Brewery",
      code: "BUD-NEW",
      site_type: "manufacturing_facility",
      description: "High-volume beer production facility with extensive tank farms"
    },
    
    // International Paper Sites
    {
      companyCode: "IP",
      name: "Courtland Paper Mill",
      code: "IP-COU",
      site_type: "manufacturing_facility",
      description: "Pulp and paper mill with large digesters and paper machines"
    },
    {
      companyCode: "IP",
      name: "Pensacola Paper Mill",
      code: "IP-PEN",
      site_type: "manufacturing_facility",
      description: "Integrated pulp and paper manufacturing facility"
    }
  ],

  assetGroups: [
    // Chemical Plant Asset Groups
    { siteCode: "DOW-FRP", name: "Reactor Systems", code: "REACT", group_type: "chemical_reactors" },
    { siteCode: "DOW-FRP", name: "Distillation Columns", code: "DIST", group_type: "separators" },
    { siteCode: "DOW-FRP", name: "Storage Vessels", code: "STOR", group_type: "storage_tanks" },
    
    { siteCode: "DOW-PLQ", name: "Heat Recovery", code: "HREC", group_type: "heat_exchangers" },
    { siteCode: "DOW-PLQ", name: "Cooling Systems", code: "COOL", group_type: "heat_exchangers" },
    
    { siteCode: "BASF-GEI", name: "Process Piping", code: "PIPE", group_type: "pipeline_systems" },
    { siteCode: "BASF-GEI", name: "Pressure Vessels", code: "PVES", group_type: "separators" },
    
    { siteCode: "BASF-FRP", name: "Polymerization Units", code: "POLY", group_type: "chemical_reactors" },
    { siteCode: "BASF-FRP", name: "Utility Systems", code: "UTIL", group_type: "pipeline_systems" },
    
    // Steel Mill Asset Groups
    { siteCode: "USS-GAR", name: "Blast Furnaces", code: "BF", group_type: "steel_equipment" },
    { siteCode: "USS-GAR", name: "Coke Ovens", code: "COKE", group_type: "steel_equipment" },
    { siteCode: "USS-GAR", name: "Rolling Mills", code: "ROLL", group_type: "steel_equipment" },
    
    { siteCode: "USS-MON", name: "Structural Fabrication", code: "FAB", group_type: "steel_equipment" },
    { siteCode: "USS-MON", name: "Finishing Lines", code: "FIN", group_type: "steel_equipment" },
    
    { siteCode: "NUE-CRA", name: "Electric Arc Furnaces", code: "EAF", group_type: "steel_equipment" },
    { siteCode: "NUE-CRA", name: "Continuous Casters", code: "CC", group_type: "steel_equipment" },
    
    { siteCode: "NUE-BER", name: "Hot Strip Mill", code: "HSM", group_type: "steel_equipment" },
    { siteCode: "NUE-BER", name: "Cold Mill", code: "CM", group_type: "steel_equipment" },
    
    // Pharmaceutical Asset Groups
    { siteCode: "PFE-KAL", name: "Bioreactors", code: "BIO", group_type: "pharma_equipment" },
    { siteCode: "PFE-KAL", name: "Purification Systems", code: "PUR", group_type: "pharma_equipment" },
    { siteCode: "PFE-KAL", name: "Filling Lines", code: "FILL", group_type: "pharma_equipment" },
    
    { siteCode: "PFE-GRO", name: "Lab Equipment", code: "LAB", group_type: "pharma_equipment" },
    { siteCode: "PFE-GRO", name: "Pilot Plants", code: "PILOT", group_type: "pharma_equipment" },
    
    // Brewery Asset Groups
    { siteCode: "BUD-STL", name: "Fermentation Tanks", code: "FERM", group_type: "brewing_equipment" },
    { siteCode: "BUD-STL", name: "Bright Beer Tanks", code: "BBT", group_type: "brewing_equipment" },
    { siteCode: "BUD-STL", name: "Packaging Lines", code: "PKG", group_type: "brewing_equipment" },
    
    { siteCode: "BUD-NEW", name: "Brew Houses", code: "BREW", group_type: "brewing_equipment" },
    { siteCode: "BUD-NEW", name: "CIP Systems", code: "CIP", group_type: "brewing_equipment" },
    
    // Paper Mill Asset Groups
    { siteCode: "IP-COU", name: "Digesters", code: "DIG", group_type: "pulp_equipment" },
    { siteCode: "IP-COU", name: "Paper Machines", code: "PM", group_type: "pulp_equipment" },
    { siteCode: "IP-COU", name: "Recovery Boilers", code: "RB", group_type: "pulp_equipment" },
    
    { siteCode: "IP-PEN", name: "Bleach Plants", code: "BLEACH", group_type: "pulp_equipment" },
    { siteCode: "IP-PEN", name: "Coating Stations", code: "COAT", group_type: "pulp_equipment" }
  ],

  assets: [
    // Chemical Reactor Assets
    { groupCode: "REACT", name: "Polymerization Reactor R-101", asset_tag: "R-101", asset_type: "chemical_reactor", manufacturer: "Buss ChemTech", model: "Loop Reactor 500m³" },
    { groupCode: "REACT", name: "CSTR Reactor R-102", asset_tag: "R-102", asset_type: "chemical_reactor", manufacturer: "Pfaudler", model: "Glass-Lined 10m³" },
    
    // Distillation Assets
    { groupCode: "DIST", name: "Distillation Column T-201", asset_tag: "T-201", asset_type: "separator", manufacturer: "Koch-Glitsch", model: "Packed Column 50 Trays" },
    { groupCode: "DIST", name: "Reboiler E-201", asset_tag: "E-201", asset_type: "heat_exchanger", manufacturer: "Alfa Laval", model: "Thermosiphon" },
    
    // Storage Tank Assets
    { groupCode: "STOR", name: "Ethylene Storage Tank", asset_tag: "TK-301", asset_type: "tank", manufacturer: "CB&I", model: "Spherical 2000m³" },
    { groupCode: "STOR", name: "Propylene Storage Tank", asset_tag: "TK-302", asset_type: "tank", manufacturer: "Matrix Service", model: "Bullet Tank 1500m³" },
    
    // Heat Exchanger Assets
    { groupCode: "HREC", name: "Feed Preheater E-401", asset_tag: "E-401", asset_type: "heat_exchanger", manufacturer: "Kelvion", model: "Shell & Tube" },
    { groupCode: "COOL", name: "Product Cooler E-501", asset_tag: "E-501", asset_type: "heat_exchanger", manufacturer: "API Schmidt", model: "Plate Heat Exchanger" },
    
    // Pipeline Assets
    { groupCode: "PIPE", name: "Main Process Header", asset_tag: "L-601", asset_type: "pipeline", manufacturer: "Bechtel", model: "36 inch SS316L" },
    { groupCode: "PIPE", name: "Control Valve PCV-601", asset_tag: "PCV-601", asset_type: "valve", manufacturer: "Fisher", model: "EZ Series Globe" },
    
    // Steel Mill Assets
    { groupCode: "BF", name: "Blast Furnace #1", asset_tag: "BF-1", asset_type: "steel_equipment", manufacturer: "Paul Wurth", model: "4000m³ Blast Furnace" },
    { groupCode: "BF", name: "Hot Blast Stoves", asset_tag: "HBS-1", asset_type: "steel_equipment", manufacturer: "Danieli", model: "Cowper Stoves" },
    
    { groupCode: "COKE", name: "Coke Oven Battery A", asset_tag: "COB-A", asset_type: "steel_equipment", manufacturer: "SunCoke", model: "Heat Recovery" },
    { groupCode: "ROLL", name: "Hot Strip Mill", asset_tag: "HSM-1", asset_type: "steel_equipment", manufacturer: "SMS Group", model: "2000mm Width" },
    
    // Electric Arc Furnace Assets
    { groupCode: "EAF", name: "Electric Arc Furnace #1", asset_tag: "EAF-1", asset_type: "steel_equipment", manufacturer: "Danieli", model: "200 Ton AC" },
    { groupCode: "EAF", name: "Ladle Furnace LF-1", asset_tag: "LF-1", asset_type: "steel_equipment", manufacturer: "SMS Group", model: "180 Ton" },
    
    { groupCode: "CC", name: "Continuous Caster #1", asset_tag: "CC-1", asset_type: "steel_equipment", manufacturer: "Primetals", model: "Slab Caster" },
    { groupCode: "HSM", name: "Roughing Mill", asset_tag: "RM-1", asset_type: "steel_equipment", manufacturer: "Hitachi Metals", model: "4-High Stand" },
    
    // Pharmaceutical Assets
    { groupCode: "BIO", name: "Bioreactor BR-101", asset_tag: "BR-101", asset_type: "pharma_equipment", manufacturer: "Sartorius", model: "BIOSTAT STR 2000L" },
    { groupCode: "BIO", name: "Seed Bioreactor BR-102", asset_tag: "BR-102", asset_type: "pharma_equipment", manufacturer: "Eppendorf", model: "BioFlo 320" },
    
    { groupCode: "PUR", name: "Chromatography System", asset_tag: "CHR-201", asset_type: "pharma_equipment", manufacturer: "Cytiva", model: "ÄKTA Process" },
    { groupCode: "FILL", name: "Vial Filling Line", asset_tag: "VFL-301", asset_type: "pharma_equipment", manufacturer: "Bausch+Ströbel", model: "ML-1" },
    
    // Brewery Assets
    { groupCode: "FERM", name: "Fermentation Tank FV-101", asset_tag: "FV-101", asset_type: "brewing_equipment", manufacturer: "Ziemann", model: "CCT 1000 HL" },
    { groupCode: "FERM", name: "Fermentation Tank FV-102", asset_tag: "FV-102", asset_type: "brewing_equipment", manufacturer: "GEA", model: "CCT 800 HL" },
    
    { groupCode: "BBT", name: "Bright Beer Tank BBT-201", asset_tag: "BBT-201", asset_type: "brewing_equipment", manufacturer: "Alfa Laval", model: "1200 HL" },
    { groupCode: "PKG", name: "Bottle Filling Line", asset_tag: "BFL-301", asset_type: "brewing_equipment", manufacturer: "KHS", model: "Innofill Glass DRS" },
    
    // Paper Mill Assets
    { groupCode: "DIG", name: "Continuous Digester", asset_tag: "CD-101", asset_tag: "CD-101", asset_type: "pulp_equipment", manufacturer: "Andritz", model: "Compact Cooking" },
    { groupCode: "PM", name: "Paper Machine #1", asset_tag: "PM-1", asset_type: "pulp_equipment", manufacturer: "Valmet", model: "OptiFlo Headbox" },
    
    { groupCode: "RB", name: "Recovery Boiler RB-1", asset_tag: "RB-1", asset_type: "pulp_equipment", manufacturer: "Andritz", model: "Single Drum" },
    { groupCode: "BLEACH", name: "Bleach Tower BT-1", asset_tag: "BT-1", asset_type: "pulp_equipment", manufacturer: "Metso", model: "ECF Bleaching" }
  ]
};

// Seed function
async function seedIndustrialCustomersData() {
try {
    const db = mongoose.connection;
    const collection = db.collection('documents');
    
    // Use the specific tenant ID provided
    const tenantId = '68aa95caaba0d502fe6ada5a';
    const userId = 'superadmin@pksti.com';
    
    let totalCreated = 0;
    const companyMap = new Map();
    const siteMap = new Map();
    const assetGroupMap = new Map();

    // Create Companies
for (const companyData of industrialCustomersData.companies) {
      const company = {
        _id: generateId('doc'),
        id: generateId('doc'),
        type: 'company',
        tenantId,
        ...companyData,
        status: 'active',
        tags: ['industrial-customer', 'coating-intensive', 'maintenance-contracts'],
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
for (const siteData of industrialCustomersData.sites) {
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
        tags: ['heavy-industry', 'corrosion-protection', 'scheduled-maintenance'],
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
for (const groupData of industrialCustomersData.assetGroups) {
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
        description: `Industrial asset group requiring specialized protective coatings and regular maintenance`,
        status: 'active',
        tags: ['industrial-equipment', 'coating-critical', 'high-temperature'],
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
for (const assetData of industrialCustomersData.assets) {
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
        description: `Industrial equipment requiring specialized protective coatings for harsh operating environments`,
        status: 'active',
        tags: ['industrial-asset', 'coating-maintenance', 'corrosion-protection', 'high-value'],
        specifications: {
          coating_requirements: {
            primer_type: "High-build epoxy primer",
            intermediate_coat: "Epoxy barrier coat",
            topcoat_type: "Polyurethane finish",
            dry_film_thickness: "250-400 microns",
            surface_prep: "SSPC-SP10 near-white blast cleaning",
            environmental_conditions: "High temperature, chemical exposure"
          },
          operating_conditions: {
            temperature_range: "-40°C to +200°C",
            pressure_rating: "Up to 150 bar",
            chemical_exposure: "Acids, bases, solvents",
            humidity: "Up to 100% RH"
          }
        },
        maintenance: {
          last_service_date: new Date(Date.now() - (Math.random() * 730 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          next_service_date: new Date(Date.now() + (Math.random() * 1095 * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
          service_interval_days: 1095, // 3 years
          maintenance_type: "preventive",
          maintenance_notes: "Critical asset requiring specialized industrial coatings and regular inspection",
          criticality: "high",
          downtime_cost_per_hour: Math.floor(Math.random() * 50000) + 10000
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
console.log(`   - Total Documents Created: ${totalCreated}`);
console.log(`   - Sites: ${industrialCustomersData.sites.length}`);
console.log(`   - Assets: ${industrialCustomersData.assets.length}`);
console.log(`   - Chemicals & Petrochemicals (Dow, BASF)`);
console.log(`   - Pharmaceutical (Pfizer)`);
console.log(`   - Pulp & Paper (International Paper)`);
console.log(`   - High-temperature industrial coatings`);
console.log(`   - Long-term maintenance contracts`);
} catch (error) {
    console.error('❌ Error seeding Industrial Customers data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await seedIndustrialCustomersData();
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

module.exports = { seedIndustrialCustomersData };
