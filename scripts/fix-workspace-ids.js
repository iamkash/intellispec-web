#!/usr/bin/env node

/**
 * One-time utility to normalize workspace IDs.
 *
 * For every JSON file in public/data/workspaces, set the `id` to match the
 * relative file path (`module/workspace`) and ensure nested directories are
 * preserved in the id.
 *
 * Usage:
 *   node scripts/fix-workspace-ids.js
 */

const { readFileSync, readdirSync, statSync, writeFileSync } = require('fs');
const { join, relative } = require('path');

const WORKSPACE_ROOT = join(__dirname, '..', 'public', 'data', 'workspaces');
let updatedCount = 0;
let skippedCount = 0;

const walk = (dir) => {
  const entries = readdirSync(dir);
  entries.forEach((entry) => {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath);
      return;
    }

    if (!entry.endsWith('.json')) {
      return;
    }

    const relPath = relative(WORKSPACE_ROOT, fullPath);
    const expectedId = relPath.replace(/\\/g, '/').replace(/\.json$/i, '');

    try {
      const raw = readFileSync(fullPath, 'utf8');
      const data = JSON.parse(raw);
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        skippedCount += 1;
        return;
      }

      if (data.id === expectedId) {
        skippedCount += 1;
        return;
      }

      data.id = expectedId;
      writeFileSync(fullPath, `${JSON.stringify(data, null, 2)}\n`);
      updatedCount += 1;
      console.log(`Updated ${relPath} -> id "${expectedId}"`);
    } catch (error) {
      console.warn(`Failed to process ${relPath}: ${error.message}`);
    }
  });
};

walk(WORKSPACE_ROOT);

console.log(
  `Workspace id normalization complete. Updated ${updatedCount} file(s), skipped ${skippedCount}.`
);
