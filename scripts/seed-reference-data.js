#!/usr/bin/env node

/**
 * PRODUCTION REFERENCE DATA SEEDING SCRIPT
 * 
 * ⚠️  SINGLE SOURCE OF TRUTH FOR REFERENCE DATA ⚠️
 * 
 * This is the ONLY script used for seeding reference data in production.
 * All reference data is defined inline in this file to ensure consistency.
 * 
 * What this script does:
 * - Seeds all reference data lists and options for the asset management system
 * - Creates hierarchical relationships (Company → Site → Asset Group → Asset)
 * - Provides options for all form dropdowns (eliminating hardcoded values)
 * - Supports 9+ industries with complete asset hierarchies
 * 
 * Usage:
 *   node scripts/seed-reference-data.js
 * 
 * Environment:
 *   Requires MONGODB_URI or MONGODB_ATLAS_URI in .env file
 * 
 * Collections Created:
 *   - referenceListTypes: Metadata about each reference list
 *   - referenceListOptions: Individual options for each list
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

// Reference Data Schema
const referenceListTypeSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: String,
  category: { type: String, required: true },
  sortBy: { type: String, default: 'label' },
  allowCustom: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  parentType: String, // For hierarchical relationships
  parentValue: String, // Specific parent value this list applies to
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const referenceListOptionSchema = new mongoose.Schema({
  listType: { type: String, required: true },
  label: { type: String, required: true },
  value: { type: String, required: true },
  description: String,
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  color: String,
  icon: String,
  parentGroup: String, // For sub-categorization
  metadata: mongoose.Schema.Types.Mixed, // Additional properties
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create indexes for performance
referenceListOptionSchema.index({ listType: 1, value: 1 }, { unique: true });
referenceListOptionSchema.index({ listType: 1, sortOrder: 1 });
referenceListOptionSchema.index({ listType: 1, isActive: 1 });

const ReferenceListType = mongoose.model('ReferenceListType', referenceListTypeSchema);
const ReferenceListOption = mongoose.model('ReferenceListOption', referenceListOptionSchema);

// Comprehensive reference data
const referenceData = {
  // ==================== COMPANY INDUSTRIES ====================
  company_industry: {
    type: {
      name: 'company_industry',
      displayName: 'Company Industry',
      description: 'Industry classifications for companies',
      category: 'business',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Oil & Gas', value: 'oil_gas', description: 'Oil and gas exploration, production, and refining', sortOrder: 1, color: 'processing', icon: 'FireOutlined' },
      { label: 'Power Generation', value: 'power_generation', description: 'Electricity generation and distribution', sortOrder: 2, color: 'warning', icon: 'ThunderboltOutlined' },
      { label: 'Chemicals', value: 'chemicals', description: 'Chemical manufacturing and processing', sortOrder: 3, color: 'purple', icon: 'ExperimentOutlined' },
      { label: 'Manufacturing', value: 'manufacturing', description: 'General manufacturing and production', sortOrder: 4, color: 'success', icon: 'ToolOutlined' },
      { label: 'Pharmaceutical', value: 'pharmaceutical', description: 'Pharmaceutical and biotechnology', sortOrder: 5, color: 'cyan', icon: 'MedicineBoxOutlined' },
      { label: 'Maritime', value: 'maritime', description: 'Maritime and offshore operations', sortOrder: 6, color: 'blue', icon: 'CarOutlined' },
      { label: 'Paint Manufacturing', value: 'paint_manufacturing', description: 'Paint and coating manufacturing', sortOrder: 7, color: 'magenta', icon: 'BgColorsOutlined' },
      { label: 'Scaffolding Services', value: 'scaffolding_services', description: 'Scaffolding and construction services', sortOrder: 8, color: 'orange', icon: 'BuildOutlined' },
      { label: 'Construction', value: 'construction', description: 'Construction and building services', sortOrder: 9, color: 'geekblue', icon: 'HomeOutlined' },
      { label: 'Mining', value: 'mining', description: 'Mining and extraction operations', sortOrder: 10, color: 'gold', icon: 'GoldOutlined' },
      { label: 'Other', value: 'other', description: 'Other industries not listed', sortOrder: 99, color: 'default', icon: 'EllipsisOutlined' }
    ]
  },

  // ==================== SITE TYPES BY INDUSTRY ====================
  site_types_oil_gas: {
    type: {
      name: 'site_types_oil_gas',
      displayName: 'Site Types - Oil & Gas',
      description: 'Site types specific to oil and gas industry',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'oil_gas',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Refinery', value: 'refinery', description: 'Oil refining and processing facility', sortOrder: 1, color: 'processing' },
      { label: 'Drilling Platform', value: 'drilling_platform', description: 'Offshore or onshore drilling platform', sortOrder: 2, color: 'warning' },
      { label: 'Pipeline Station', value: 'pipeline_station', description: 'Pipeline pumping or compression station', sortOrder: 3, color: 'success' },
      { label: 'Tank Farm', value: 'tank_farm', description: 'Storage tank facility', sortOrder: 4, color: 'blue' },
      { label: 'Gas Plant', value: 'gas_plant', description: 'Natural gas processing plant', sortOrder: 5, color: 'cyan' },
      { label: 'Petrochemical Complex', value: 'petrochemical_complex', description: 'Integrated petrochemical facility', sortOrder: 6, color: 'purple' }
    ]
  },

  site_types_power_generation: {
    type: {
      name: 'site_types_power_generation',
      displayName: 'Site Types - Power Generation',
      description: 'Site types specific to power generation industry',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'power_generation',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Power Plant', value: 'power_plant', description: 'Electricity generation facility', sortOrder: 1, color: 'warning' },
      { label: 'Substation', value: 'substation', description: 'Electrical substation', sortOrder: 2, color: 'processing' },
      { label: 'Wind Farm', value: 'wind_farm', description: 'Wind energy generation facility', sortOrder: 3, color: 'success' },
      { label: 'Solar Farm', value: 'solar_farm', description: 'Solar energy generation facility', sortOrder: 4, color: 'gold' },
      { label: 'Hydroelectric Dam', value: 'hydroelectric_dam', description: 'Hydroelectric power generation', sortOrder: 5, color: 'blue' },
      { label: 'Nuclear Facility', value: 'nuclear_facility', description: 'Nuclear power generation facility', sortOrder: 6, color: 'red' }
    ]
  },

  site_types_manufacturing: {
    type: {
      name: 'site_types_manufacturing',
      displayName: 'Site Types - Manufacturing',
      description: 'Site types specific to manufacturing industry',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'manufacturing',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Assembly Plant', value: 'assembly_plant', description: 'Product assembly facility', sortOrder: 1, color: 'success' },
      { label: 'Fabrication Shop', value: 'fabrication_shop', description: 'Metal fabrication facility', sortOrder: 2, color: 'processing' },
      { label: 'Machining Center', value: 'machining_center', description: 'Precision machining facility', sortOrder: 3, color: 'blue' },
      { label: 'Quality Lab', value: 'quality_lab', description: 'Quality control laboratory', sortOrder: 4, color: 'purple' },
      { label: 'Distribution Center', value: 'distribution_center', description: 'Product distribution facility', sortOrder: 5, color: 'orange' },
      { label: 'Warehouse', value: 'warehouse', description: 'Storage and warehousing facility', sortOrder: 6, color: 'cyan' }
    ]
  },

  // ==================== ASSET GROUP TYPES BY INDUSTRY ====================
  asset_group_types_oil_gas: {
    type: {
      name: 'asset_group_types_oil_gas',
      displayName: 'Asset Group Types - Oil & Gas',
      description: 'Asset group types for oil and gas facilities',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'oil_gas',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Drilling Equipment', value: 'drilling_equipment', description: 'Equipment used for drilling operations', sortOrder: 1, color: 'processing' },
      { label: 'Processing Units', value: 'processing_units', description: 'Process equipment and units', sortOrder: 2, color: 'warning' },
      { label: 'Pipeline Systems', value: 'pipeline_systems', description: 'Pipeline and piping systems', sortOrder: 3, color: 'success' },
      { label: 'Safety Systems', value: 'safety_systems', description: 'Safety and emergency response systems', sortOrder: 4, color: 'error' },
      { label: 'Wellhead Equipment', value: 'wellhead_equipment', description: 'Wellhead and completion equipment', sortOrder: 5, color: 'blue' },
      { label: 'Compressors', value: 'compressors', description: 'Compression equipment', sortOrder: 6, color: 'cyan' },
      { label: 'Separators', value: 'separators', description: 'Separation equipment', sortOrder: 7, color: 'purple' },
      { label: 'Heat Exchangers', value: 'heat_exchangers', description: 'Heat transfer equipment', sortOrder: 8, color: 'magenta' },
      { label: 'Storage Tanks', value: 'storage_tanks', description: 'Storage tanks and vessels', sortOrder: 9, color: 'orange' },
      { label: 'Pumps', value: 'pumps', description: 'Pumping equipment', sortOrder: 10, color: 'geekblue' }
    ]
  },

  asset_group_types_power_generation: {
    type: {
      name: 'asset_group_types_power_generation',
      displayName: 'Asset Group Types - Power Generation',
      description: 'Asset group types for power generation facilities',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'power_generation',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Generators', value: 'generators', description: 'Power generation equipment', sortOrder: 1, color: 'warning' },
      { label: 'Turbines', value: 'turbines', description: 'Turbine equipment', sortOrder: 2, color: 'processing' },
      { label: 'Transformers', value: 'transformers', description: 'Electrical transformers', sortOrder: 3, color: 'blue' },
      { label: 'Switchgear', value: 'switchgear', description: 'Electrical switching equipment', sortOrder: 4, color: 'purple' },
      { label: 'Control Systems', value: 'control_systems', description: 'Control and automation systems', sortOrder: 5, color: 'success' },
      { label: 'Cooling Systems', value: 'cooling_systems', description: 'Cooling and heat rejection systems', sortOrder: 6, color: 'cyan' },
      { label: 'Boilers', value: 'boilers', description: 'Steam generation equipment', sortOrder: 7, color: 'orange' },
      { label: 'Fuel Systems', value: 'fuel_systems', description: 'Fuel handling and storage systems', sortOrder: 8, color: 'gold' }
    ]
  },

  // ==================== ASSET TYPES BY GROUP ====================
  asset_types_oil_gas: {
    type: {
      name: 'asset_types_oil_gas',
      displayName: 'Asset Types - Oil & Gas',
      description: 'Individual asset types for oil and gas industry',
      category: 'business',
      parentType: 'company_industry',
      parentValue: 'oil_gas',
      sortBy: 'label',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Drilling Rig', value: 'drilling_rig', description: 'Complete drilling rig assembly', sortOrder: 1, color: 'processing', parentGroup: 'drilling_equipment' },
      { label: 'Centrifugal Pump', value: 'pump', description: 'Centrifugal, positive displacement, or other pumps', sortOrder: 2, color: 'blue', parentGroup: 'pumps' },
      { label: 'Gas Compressor', value: 'compressor', description: 'Gas compression equipment', sortOrder: 3, color: 'cyan', parentGroup: 'compressors' },
      { label: 'Control Valve', value: 'valve', description: 'Control, isolation, or safety valves', sortOrder: 4, color: 'success', parentGroup: 'pipeline_systems' },
      { label: 'Pressure Vessel', value: 'pressure_vessel', description: 'Pressure containing equipment', sortOrder: 5, color: 'warning', parentGroup: 'separators' },
      { label: 'Shell & Tube Heat Exchanger', value: 'heat_exchanger', description: 'Shell and tube, plate, or other heat exchangers', sortOrder: 6, color: 'magenta', parentGroup: 'heat_exchangers' },
      { label: 'Oil-Gas Separator', value: 'separator', description: 'Oil-gas-water separation equipment', sortOrder: 7, color: 'purple', parentGroup: 'separators' },
      { label: 'Storage Tank', value: 'tank', description: 'Fixed roof, floating roof, or other storage tanks', sortOrder: 8, color: 'orange', parentGroup: 'storage_tanks' },
      { label: 'Process Pipeline', value: 'pipeline', description: 'Process or transmission pipeline', sortOrder: 9, color: 'success', parentGroup: 'pipeline_systems' },
      { label: 'Wellhead Assembly', value: 'wellhead', description: 'Wellhead assembly and equipment', sortOrder: 10, color: 'blue', parentGroup: 'wellhead_equipment' },
      { label: 'Blowout Preventer', value: 'blowout_preventer', description: 'Well control safety equipment', sortOrder: 11, color: 'error', parentGroup: 'safety_systems' },
      { label: 'Christmas Tree', value: 'christmas_tree', description: 'Wellhead production equipment', sortOrder: 12, color: 'success', parentGroup: 'wellhead_equipment' }
    ]
  },

  // ==================== GENERAL STATUS OPTIONS ====================
  general_status: {
    type: {
      name: 'general_status',
      displayName: 'General Status',
      description: 'Common status options for various entities',
      category: 'general',
      sortBy: 'order',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Active', value: 'active', description: 'Entity is active and operational', sortOrder: 1, color: 'success', icon: 'CheckCircleOutlined' },
      { label: 'Inactive', value: 'inactive', description: 'Entity is inactive but not deleted', sortOrder: 2, color: 'default', icon: 'MinusCircleOutlined' },
      { label: 'Suspended', value: 'suspended', description: 'Entity is temporarily suspended', sortOrder: 3, color: 'warning', icon: 'PauseCircleOutlined' },
      { label: 'Maintenance', value: 'maintenance', description: 'Entity is under maintenance', sortOrder: 4, color: 'processing', icon: 'ToolOutlined' },
      { label: 'Retired', value: 'retired', description: 'Entity is retired from service', sortOrder: 5, color: 'error', icon: 'StopOutlined' }
    ]
  },

  site_status: {
    type: {
      name: 'site_status',
      displayName: 'Site Status',
      description: 'Status options specific to sites',
      category: 'business',
      sortBy: 'order',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Active', value: 'active', description: 'Site is operational', sortOrder: 1, color: 'success' },
      { label: 'Inactive', value: 'inactive', description: 'Site is not operational', sortOrder: 2, color: 'default' },
      { label: 'Under Construction', value: 'under_construction', description: 'Site is being built', sortOrder: 3, color: 'processing' },
      { label: 'Decommissioned', value: 'decommissioned', description: 'Site has been decommissioned', sortOrder: 4, color: 'error' },
      { label: 'Shutdown', value: 'shutdown', description: 'Site is temporarily shut down', sortOrder: 5, color: 'warning' },
      { label: 'Turnaround', value: 'turnaround', description: 'Site is in turnaround maintenance', sortOrder: 6, color: 'purple' }
    ]
  },

  // ==================== PIPING INSPECTION OBSERVATIONS ====================
  piping_inspection_observations: {
    type: {
      name: 'piping_inspection_observations',
      displayName: 'Piping Inspection Observations',
      description: 'System-defined observation checklist items for piping inspections per API 570',
      category: 'inspection',
      sortBy: 'order',
      allowCustom: false,
      isActive: true
    },
    options: [
      // GENERAL PIPING
      { label: 'P1 - Other (Please Explain)', value: 'p1_other', description: 'Any other general piping observations', sortOrder: 1, parentGroup: 'general_piping', metadata: { code: 'P1', category: 'general_piping' } },
      { label: 'P2 - Corrosion', value: 'p2_corrosion', description: 'General corrosion observations on piping', sortOrder: 2, parentGroup: 'general_piping', metadata: { code: 'P2', category: 'general_piping' } },
      { label: 'P3 - Leaks', value: 'p3_leaks', description: 'Leak observations on piping systems', sortOrder: 3, parentGroup: 'general_piping', metadata: { code: 'P3', category: 'general_piping' } },
      { label: 'P4 - Vibration', value: 'p4_vibration', description: 'Vibration damage or excessive movement', sortOrder: 4, parentGroup: 'general_piping', metadata: { code: 'P4', category: 'general_piping' } },
      { label: 'P5 - Misalignment', value: 'p5_misalignment', description: 'Pipe misalignment or poor installation', sortOrder: 5, parentGroup: 'general_piping', metadata: { code: 'P5', category: 'general_piping' } },
      { label: 'P6 - Soil-Air Interface', value: 'p6_soil_air', description: 'Corrosion at soil-air interface', sortOrder: 6, parentGroup: 'general_piping', metadata: { code: 'P6', category: 'general_piping' } },
      { label: 'P7 - Painted Inactive Corrosion', value: 'p7_painted_inactive', description: 'Painted over inactive corrosion', sortOrder: 7, parentGroup: 'general_piping', metadata: { code: 'P7', category: 'general_piping' } },
      { label: 'P8 - Coating/Painting', value: 'p8_coating', description: 'Coating and painting conditions', sortOrder: 8, parentGroup: 'general_piping', metadata: { code: 'P8', category: 'general_piping' } },

      // SUPPORTS
      { label: 'P21 - Support Other (Please explain)', value: 'p21_support_other', description: 'Other support system observations', sortOrder: 21, parentGroup: 'supports', metadata: { code: 'P21', category: 'supports' } },
      { label: 'P22 - Support Shoes', value: 'p22_support_shoes', description: 'Support shoe conditions and alignment', sortOrder: 22, parentGroup: 'supports', metadata: { code: 'P22', category: 'supports' } },
      { label: 'P23 - Support Members', value: 'p23_support_members', description: 'Support member integrity and condition', sortOrder: 23, parentGroup: 'supports', metadata: { code: 'P23', category: 'supports' } },
      { label: 'P24 - Hanger/Brackets', value: 'p24_hanger_brackets', description: 'Hanger and bracket conditions', sortOrder: 24, parentGroup: 'supports', metadata: { code: 'P24', category: 'supports' } },
      { label: 'P25 - Fireproofing', value: 'p25_fireproofing', description: 'Fireproofing material condition', sortOrder: 25, parentGroup: 'supports', metadata: { code: 'P25', category: 'supports' } },

      // CONNECTIONS & COMPONENTS
      { label: 'P31 - Connection Other (Please explain)', value: 'p31_connection_other', description: 'Other connection observations', sortOrder: 31, parentGroup: 'connections_components', metadata: { code: 'P31', category: 'connections_components' } },
      { label: 'P32 - Expansion Joint', value: 'p32_expansion_joint', description: 'Expansion joint condition and operation', sortOrder: 32, parentGroup: 'connections_components', metadata: { code: 'P32', category: 'connections_components' } },
      { label: 'P33 - Small Branches', value: 'p33_small_branches', description: 'Small branch connection conditions', sortOrder: 33, parentGroup: 'connections_components', metadata: { code: 'P33', category: 'connections_components' } },
      { label: 'P34 - Inadequate Thread Engagement', value: 'p34_thread_engagement', description: 'Threaded connection engagement issues', sortOrder: 34, parentGroup: 'connections_components', metadata: { code: 'P34', category: 'connections_components' } },
      { label: 'P35 - Bolting', value: 'p35_bolting', description: 'Bolt tightness and condition', sortOrder: 35, parentGroup: 'connections_components', metadata: { code: 'P35', category: 'connections_components' } },
      { label: 'P36 - Socket Welds', value: 'p36_socket_welds', description: 'Socket weld integrity and condition', sortOrder: 36, parentGroup: 'connections_components', metadata: { code: 'P36', category: 'connections_components' } },
      { label: 'P37 - Threaded Connections', value: 'p37_threaded_connections', description: 'Threaded connection conditions', sortOrder: 37, parentGroup: 'connections_components', metadata: { code: 'P37', category: 'connections_components' } },
      { label: 'P38 - Flanges', value: 'p38_flanges', description: 'Flange condition and alignment', sortOrder: 38, parentGroup: 'connections_components', metadata: { code: 'P38', category: 'connections_components' } },
      { label: 'P39 - Valves', value: 'p39_valves', description: 'Valve operation and condition', sortOrder: 39, parentGroup: 'connections_components', metadata: { code: 'P39', category: 'connections_components' } },
      { label: 'P40 - Leak Clamps', value: 'p40_leak_clamps', description: 'Leak clamp installations and conditions', sortOrder: 40, parentGroup: 'connections_components', metadata: { code: 'P40', category: 'connections_components' } },

      // INSULATION
      { label: 'P41 - Insulation Other (Please explain)', value: 'p41_insulation_other', description: 'Other insulation observations', sortOrder: 41, parentGroup: 'insulation', metadata: { code: 'P41', category: 'insulation' } },
      { label: 'P42 - Insulation Damage', value: 'p42_insulation_damage', description: 'Insulation material damage', sortOrder: 42, parentGroup: 'insulation', metadata: { code: 'P42', category: 'insulation' } },
      { label: 'P43 - Penetrations', value: 'p43_penetrations', description: 'Cable and pipe penetrations', sortOrder: 43, parentGroup: 'insulation', metadata: { code: 'P43', category: 'insulation' } },
      { label: 'P44 - Insulation Jacket', value: 'p44_insulation_jacket', description: 'Insulation jacket condition', sortOrder: 44, parentGroup: 'insulation', metadata: { code: 'P44', category: 'insulation' } },
      { label: 'P45 - Banding', value: 'p45_banding', description: 'Insulation banding and securing', sortOrder: 45, parentGroup: 'insulation', metadata: { code: 'P45', category: 'insulation' } },
      { label: 'P46 - Seals/Joints/Caulking', value: 'p46_seals_joints', description: 'Seals, joints, and caulking conditions', sortOrder: 46, parentGroup: 'insulation', metadata: { code: 'P46', category: 'insulation' } },
      { label: 'P47 - Fireproofing', value: 'p47_fireproofing_insulation', description: 'Fireproofing insulation condition', sortOrder: 47, parentGroup: 'insulation', metadata: { code: 'P47', category: 'insulation' } }
    ]
  },

  // ==================== PIPING INSPECTION RATINGS ====================
  piping_inspection_ratings: {
    type: {
      name: 'piping_inspection_ratings',
      displayName: 'Piping Inspection Ratings',
      description: 'Rating scale for piping inspection observations',
      category: 'inspection',
      sortBy: 'order',
      allowCustom: false,
      isActive: true
    },
    options: [
      { label: 'Good', value: 'good', description: 'Condition is good with no issues', sortOrder: 1, color: 'success' },
      { label: 'Fair', value: 'fair', description: 'Condition is fair with minor issues', sortOrder: 2, color: 'warning' },
      { label: 'Poor', value: 'poor', description: 'Condition is poor with significant issues', sortOrder: 3, color: 'error' },
      { label: 'NA', value: 'na', description: 'Not applicable for this inspection', sortOrder: 4, color: 'default' }
    ]
  }
};

// Seed function - SAFE MODE: Only appends new lists, never deletes existing data
// Uses Mongoose models to ensure correct camelCase collection names
async function seedReferenceData() {
console.log('⚠️  This will ONLY add new reference lists, never delete existing user data');
try {
    let totalTypes = 0;
    let totalOptions = 0;
    let skippedTypes = 0;
    let skippedOptions = 0;

    // Seed each reference list type and its options
    for (const [listName, listData] of Object.entries(referenceData)) {
      // Check if list type already exists
      const existingType = await ReferenceListType.findOne({ name: listData.type.name });

      if (existingType) {
skippedTypes++;
        continue;
      }

      // Create the new list type
      const listType = new ReferenceListType(listData.type);
      await listType.save();
      totalTypes++;
console.log(`   📋 Type ID: ${listType._id}`);

      // Create the options for this new list using the type ID as listType
      const typeId = listType._id.toString();
      for (const optionData of listData.options) {
        // Check if option already exists (unlikely for new list, but safe check)
        const existingOption = await ReferenceListOption.findOne({
          listType: typeId,
          value: optionData.value
        });

        if (existingOption) {
skippedOptions++;
          continue;
        }

        const option = new ReferenceListOption({
          ...optionData,
          listTypeId: listType._id,  // Use ObjectId as listTypeId (API server expects ObjectId type)
          isActive: true            // Explicitly set isActive to true
        });
        await option.save();
        totalOptions++;
      }
}
console.log(`📊 Summary:`);
console.log(`   - New Options Added: ${totalOptions}`);
console.log(`   - Existing Options Skipped: ${skippedOptions}`);
console.log(`   - Mode: 🔒 SAFE (Append-only)`);
console.log(`   - Relationships: ✅ ID-based (options.listType = types._id)`);

    if (totalTypes === 0 && skippedTypes > 0) {
console.log(`   This is expected behavior for production environments.`);
}

  } catch (error) {
    console.error('❌ Error seeding reference data:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await connectDB();
    await seedReferenceData();
} catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
}
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedReferenceData, referenceData };
