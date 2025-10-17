#!/usr/bin/env node

/**
 * Database Backup Script
 * 
 * Creates a backup of important collections before running destructive operations.
 * This helps prevent accidental data loss.
 */

const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Collections to backup (excluding multi-tenant collections that get reseeded)
const COLLECTIONS_TO_BACKUP = [
  'referenceListTypes',
  'referenceListOptions', 
  'roles',
  'modules' // Backup modules since they might have custom data
];

async function connectToDatabase() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    await mongoose.connect(mongoUri);
} catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', timestamp);
  
  try {
    await fs.mkdir(backupDir, { recursive: true });
const db = mongoose.connection.db;
    let backedUpCollections = 0;

    for (const collectionName of COLLECTIONS_TO_BACKUP) {
      try {
        const collection = db.collection(collectionName);
        const documents = await collection.find({}).toArray();
        
        if (documents.length > 0) {
          const backupFile = path.join(backupDir, `${collectionName}.json`);
          await fs.writeFile(backupFile, JSON.stringify(documents, null, 2));
          backedUpCollections++;
        } else {
          console.log(`ℹ️  ${collectionName} is empty - nothing to back up.`);
        }
      } catch (error) {
        console.error(`⚠️  Failed to back up ${collectionName}:`, error);
      }
    }

    // Create a restore script
    const restoreScript = `#!/usr/bin/env node

/**
 * Restore Script for backup ${timestamp}
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
${COLLECTIONS_TO_BACKUP.map(col => `      '${col}.json'`).join(',\n')}
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
`;

    await fs.writeFile(path.join(backupDir, 'restore.js'), restoreScript);
    console.log(`📊 Summary:`);
    console.log(`   - Backup location: ${backupDir}`);
    console.log(`   - Collections backed up: ${backedUpCollections}`);
    return backupDir;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

async function main() {
try {
    await connectToDatabase();
    await createBackup();
  } catch (error) {
    console.error('❌ Backup process failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run backup if called directly
if (require.main === module) {
  main();
}

module.exports = { createBackup, connectToDatabase };
