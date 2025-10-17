#!/usr/bin/env node

/**
 * Generic restore utility for backup snapshots.
 *
 * The script reads `manifest.json` to determine which collections
 * to restore, the source data files, and whether collections should
 * be truncated prior to import. This keeps the behaviour entirely
 * metadata-driven so new collections can be added without touching
 * the script itself.
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const MANIFEST_FILE = path.join(__dirname, 'manifest.json');

const ensureEnv = () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI must be defined in the environment before running the restore script');
  }
};

const loadManifest = async () => {
  try {
    const manifestRaw = await fs.readFile(MANIFEST_FILE, 'utf8');
    const manifest = JSON.parse(manifestRaw);
    if (!manifest?.collections || !Array.isArray(manifest.collections) || manifest.collections.length === 0) {
      throw new Error('Manifest is missing a non-empty "collections" array');
    }
    return manifest.collections;
  } catch (error) {
    throw new Error(`Failed to load manifest at ${MANIFEST_FILE}: ${error.message}`);
  }
};

const readDataFile = async (entry) => {
  if (!entry?.file) {
    throw new Error('Manifest entry missing required "file" property');
  }
  const filePath = path.join(__dirname, entry.file);
  const raw = await fs.readFile(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse JSON in ${entry.file}: ${error.message}`);
  }
};

const restoreCollection = async (collectionName, data, truncate = false) => {
  if (!collectionName) {
    throw new Error('Manifest entry missing required "collection" property');
  }
  const collection = mongoose.connection.db.collection(collectionName);

  if (truncate) {
    await collection.deleteMany({});
  }

  if (Array.isArray(data) && data.length > 0) {
    await collection.insertMany(data, { ordered: false });
  }
};

const restore = async () => {
  ensureEnv();
  const entries = await loadManifest();

  await mongoose.connect(process.env.MONGODB_URI);

  for (const entry of entries) {
    const data = await readDataFile(entry);
    await restoreCollection(entry.collection, data, entry.truncate !== false);
    console.log(`✔ Restored ${entry.file} into collection ${entry.collection}`);
  }

  await mongoose.disconnect();
};

restore()
  .then(() => {
    console.log('✅ Restore completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  });
