#!/usr/bin/env node
/**
 * Normalize inspectionType fields across existing inspection documents.
 *
 * Usage:
 *   node scripts/maintenance/normalize-inspection-types.js
 *
 * Requires MONGODB_URI (and optional DATABASE_NAME) in .env.
 */

/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const mongoose = require('mongoose');

const DocumentModel = require('../../api/models/Document');

const TYPE_ALIASES = {
  pressure_vessel: ['pressure_vessel', 'pressure_vessel_vertical', 'pressure_vessel_horizontal', 'pressure_vessel_internal', 'pressure_vessel_external'],
  storage_tank: ['storage_tank', 'storage_tank_vertical', 'storage_tank_horizontal'],
  heat_exchanger: ['heat_exchanger', 'heat_exchanger_shell_tube', 'heat_exchanger_plate'],
  piping: ['piping', 'piping_system', 'pipework', 'pipeline'],
  rotating_equipment: ['rotating_equipment', 'pump', 'compressor', 'turbine']
};

const TYPE_LABELS = {
  pressure_vessel: 'Pressure Vessel',
  storage_tank: 'Storage Tank',
  heat_exchanger: 'Heat Exchanger',
  piping: 'Piping System',
  rotating_equipment: 'Rotating Equipment'
};

const toTitleCase = (value = '') =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const normalizeInspectionType = (rawType) => {
  if (!rawType) return null;
  const lower = String(rawType).toLowerCase();
  for (const [canonical, aliases] of Object.entries(TYPE_ALIASES)) {
    if (aliases.some((alias) => lower === alias || lower.startsWith(alias))) {
      return canonical;
    }
  }
  return lower;
};

const resolveInspectionLabel = (normalizedType) => {
  if (!normalizedType) return undefined;
  return TYPE_LABELS[normalizedType] || toTitleCase(normalizedType);
};

const mergeSummaryFields = (target, updates) => {
  if (!updates || typeof updates !== 'object') {
    return false;
  }
  let changed = false;
  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && target[key] !== value) {
      target[key] = value;
      changed = true;
    }
  });
  return changed;
};

const collectRawType = (doc) => {
  const candidates = [
    doc.documentSummary?.detectedEquipmentType,
    doc.documentSummary?.equipmentSubtype,
    doc.documentSummary?.inspectionType,
    doc.inspectionType,
    doc.sectionData?.detectedEquipmentType,
    doc.sectionData?.inspectionType,
    doc.formData?.inspectionType,
    doc.wizardState?.documentSummary?.detectedEquipmentType,
    doc.wizardState?.documentSummary?.inspectionType,
    doc.wizardState?.inspectionType
  ].filter((value) => value !== undefined && value !== null && value !== '');

  return candidates.length > 0 ? candidates[0] : null;
};

const updateWizardStateSummary = (wizardState, updates) => {
  if (!wizardState) return false;
  wizardState.documentSummary = wizardState.documentSummary || {};
  const changed = mergeSummaryFields(wizardState.documentSummary, updates);
  wizardState.inspectionType = wizardState.documentSummary.inspectionType;
  wizardState.inspectionTypeLabel = wizardState.documentSummary.inspectionTypeLabel;
  wizardState.detectedEquipmentType = wizardState.documentSummary.detectedEquipmentType;
  return changed;
};

const updateSectionData = (doc, updates) => {
  if (!doc.sectionData || typeof doc.sectionData !== 'object' || Array.isArray(doc.sectionData)) return false;
  const changed = mergeSummaryFields(doc.sectionData, updates);
  if (doc.sectionData.documentSummary && typeof doc.sectionData.documentSummary === 'object') {
    mergeSummaryFields(doc.sectionData.documentSummary, updates);
  }
  return changed;
};

const run = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      console.error('❌ Missing MONGODB_URI in environment');
      process.exit(1);
    }

    await mongoose.connect(uri, {
      dbName: process.env.DATABASE_NAME
    });

    console.log('✅ Connected to MongoDB');

    const query = { type: 'inspection' };
    const cursor = DocumentModel.find(query).cursor();

    let processed = 0;
    let updated = 0;

    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      processed += 1;

      const rawType = collectRawType(doc);
      const normalizedType = normalizeInspectionType(rawType) || doc.inspectionType;
      const label = resolveInspectionLabel(normalizedType);

      const updates = {
        inspectionType: normalizedType,
        inspectionTypeLabel: label,
        detectedEquipmentType: rawType
      };

      let docChanged = false;

      if (normalizedType && doc.inspectionType !== normalizedType) {
        doc.inspectionType = normalizedType;
        docChanged = true;
      }

      if (label && doc.inspectionTypeLabel !== label) {
        doc.inspectionTypeLabel = label;
        docChanged = true;
      }

      if (rawType && doc.detectedEquipmentType !== rawType) {
        doc.detectedEquipmentType = rawType;
        docChanged = true;
      }

      doc.documentSummary = doc.documentSummary || {};
      if (mergeSummaryFields(doc.documentSummary, updates)) {
        docChanged = true;
      }

      if (updateWizardStateSummary(doc.wizardState, updates)) {
        doc.markModified('wizardState');
        docChanged = true;
      }

      if (updateSectionData(doc, updates)) {
        doc.markModified('sectionData');
        docChanged = true;
      }

      if (docChanged) {
        doc.markModified('documentSummary');
        await doc.save();
        updated += 1;
        console.log(`🛠️ Updated inspection ${doc.id || doc._id}: normalizedType=${normalizedType}, label=${label}, detected=${rawType}`);
      }
    }

    console.log(`\n✅ Normalization complete. Processed ${processed} inspections, updated ${updated}.`);
    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ Failed to normalize inspection types:', error);
    process.exit(1);
  }
};

run();
