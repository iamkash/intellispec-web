// Seed script to create inspection calculators
// Usage: node scripts/seed-calculators.js

const path = require('path');
const fs = require('fs');
try { require('dotenv').config({ path: path.resolve(process.cwd(), '.env') }); } catch (_) {}

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_ATLAS_URI || 'mongodb://localhost:27017/intellispec-dev';

const isObject = (value) => typeof value === 'object' && value !== null;

const extractFields = (uiDefinition) => {
  if (!uiDefinition) return [];

  if (Array.isArray(uiDefinition)) {
    return uiDefinition.filter(
      (item) => item && item.type && item.type !== 'section' && item.type !== 'group'
    );
  }

  if (Array.isArray(uiDefinition.fields)) {
    return uiDefinition.fields;
  }

  if (Array.isArray(uiDefinition.sections)) {
    const fields = [];
    uiDefinition.sections.forEach((section) => {
      if (Array.isArray(section?.fields)) {
        fields.push(...section.fields);
      }
      if (Array.isArray(section?.groups)) {
        section.groups.forEach((group) => {
          if (Array.isArray(group?.fields)) {
            fields.push(...group.fields);
          }
        });
      }
    });
    return fields;
  }

  return [];
};

const validateCalculatorMetadata = (calculator, sourceFile) => {
  const fields = extractFields(calculator.uiDefinition);
  const context = `${calculator.id}${sourceFile ? ` (${sourceFile})` : ''}`;

  fields.forEach((field) => {
    if (String(field.type).toLowerCase() === 'checkbox_group') {
      if (!Array.isArray(field.options) || field.options.length === 0) {
        throw new Error(
          `Calculator ${context} has checkbox_group "${field.id}" without options array.`
        );
      }

      field.options.forEach((option, index) => {
        if (!isObject(option)) {
          throw new Error(
            `Calculator ${context} has checkbox_group "${field.id}" option at index ${index} that is not an object. Expected { label, value }.`
          );
        }
        if (!Object.prototype.hasOwnProperty.call(option, 'label') || option.label === undefined) {
          throw new Error(
            `Calculator ${context} has checkbox_group "${field.id}" option at index ${index} missing "label".`
          );
        }
        if (!Object.prototype.hasOwnProperty.call(option, 'value') || option.value === undefined) {
          throw new Error(
            `Calculator ${context} has checkbox_group "${field.id}" option at index ${index} missing "value".`
          );
        }
      });
    }
  });
};

async function run() {
  await mongoose.connect(MONGODB_URI, { maxPoolSize: 5 });

  const db = mongoose.connection.db;
  const calculatorsCol = db.collection('calculators');
// CLI options for recreate behavior
  const args = process.argv.slice(2);
  const recreateAll = args.includes('--recreate');
  const recreateIdArg = args.find(a => a.startsWith('--id='));
  const recreateId = recreateIdArg ? recreateIdArg.split('=')[1] : undefined;
  const tenantArg = args.find(a => a.startsWith('--tenant='));
  const targetTenantId = tenantArg ? tenantArg.split('=')[1] : 'system';

  // Legacy ID mapping for backward compatibility (empty for now)
  const legacyIdMap = {};

  // Comprehensive list of inspection calculators


  // Load calculators from modular files only
  let calculators = [];

  // Auto-load all calculator modules from scripts/calculators recursively
  try {
    const calcRoot = path.join(__dirname, 'calculators');
    const collectJsFiles = (dir) => {
      const out = [];
      if (!fs.existsSync(dir)) return out;
      for (const entry of fs.readdirSync(dir)) {
        const full = path.join(dir, entry);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) out.push(...collectJsFiles(full));
        else if (stat.isFile() && entry.endsWith('.js')) out.push(full);
      }
      return out;
    };
    const files = collectJsFiles(calcRoot);
    for (const file of files) {
      const rel = path.relative(calcRoot, file).replace(/\\/g, '/');
      try {
        const mod = require(file);
        if (mod && typeof mod === 'object' && mod.id) {
          mod.__sourceFile = rel;
          calculators.push(mod);
        }
      } catch (err) {
        console.warn(`⚠️  Failed loading calculator module ${rel}:`, err.message);
      }
    }
  } catch (e) {
    console.warn('⚠️  Error scanning calculators directory:', e.message);
  }

  // Validate metadata before seeding to enforce schema consistency
  calculators.forEach((calculator) =>
    validateCalculatorMetadata(calculator, calculator.__sourceFile)
  );
// Seed calculators (upsert + update existing)
  for (const calculator of calculators) {
    const now = new Date();
    const { id, __sourceFile, ...rest } = calculator;

    // Only set fields provided by the calculator definition + maintenance fields
    const setPayload = {
      ...rest,
      updatedAt: now,
      deleted: false
    };

    // Recreate logic: drop and recreate specific or all
    if (recreateAll || (recreateId && recreateId === id)) {
      const legacyIds = legacyIdMap[id] || [];
      const idVariants = [{ id }, ...legacyIds.map((oldId) => ({ id: oldId }))];
      const tenantVariants = [
        { tenantId: 'default' },
        { tenantId: 'system' },
        { tenantId: { $exists: false } }
      ];
      // Delete any old variants for this id (including legacy ids) for default or missing tenant
      await calculatorsCol.deleteMany({
        $and: [
          { $or: idVariants },
          { $or: tenantVariants }
        ]
      });
    }

    const result = await calculatorsCol.updateOne(
      { id, tenantId: targetTenantId },
      {
        $set: setPayload,
        $setOnInsert: { id, tenantId: targetTenantId, createdAt: now },
        $unset: { calculations: "" }
      },
      { upsert: true }
    );

    if (result.upsertedCount === 1) {
} else if (result.matchedCount > 0) {
if (recreateAll || (recreateId && recreateId === id)) {
}
    } else {
}
  }
console.log(`📈 Total calculators available: ${calculators.length}`);

  await mongoose.disconnect();
}

run().catch(console.error);
