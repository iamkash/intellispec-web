#!/usr/bin/env node

/**
 * Restore Script for backup 2025-08-24T04-34-34-870Z
 * 
 * Run this script to restore the backed up data.
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

async function restore() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
const backupFiles = [
      'referenceListTypes.json',
      'referenceListOptions.json',
      'roles.json',
      'modules.json'
    ];

    for (const file of backupFiles) {
      const filePath = path.join(__dirname, file);
      try {
        const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
        const collectionName = file.replace('.json', '');
        
        await mongoose.connection.db.collection(collectionName).deleteMany({});
        if (data.length > 0) {
          await mongoose.connection.db.collection(collectionName).insertMany(data);
}
      } catch (error) {
}
    }
process.exit(0);
  } catch (error) {
    console.error('❌ Restore failed:', error);
    process.exit(1);
  }
}

restore();
