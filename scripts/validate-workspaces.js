#!/usr/bin/env node

/**
 * Workspace metadata validator
 *
 * Ensures every workspace JSON file under public/data/workspaces uses the
 * `module/workspace` naming convention for its `id` and that the id matches
 * the folder structure.
 */

const { readFileSync, readdirSync, statSync } = require('fs');
const { join, relative, sep } = require('path');

const WORKSPACE_ROOT = join(__dirname, '..', 'public', 'data', 'workspaces');

const errors = [];

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
    const pathWithoutExt = relPath.replace(/\.json$/i, '');
    const pathSegments = pathWithoutExt.split(sep);
    const moduleSegment = pathSegments[0];

    try {
      const data = JSON.parse(readFileSync(fullPath, 'utf8'));
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        return;
      }

      const id = data.id;
      if (!id || typeof id !== 'string') {
        errors.push(
          `${relPath}: missing or invalid "id" field (expected string in module/workspace format)`
        );
        return;
      }

      if (!id.includes('/')) {
        errors.push(
          `${relPath}: id "${id}" missing module prefix (expected "${moduleSegment}/...")`
        );
        return;
      }

      const [moduleInId] = id.split('/');
      if (moduleInId !== moduleSegment) {
        errors.push(
          `${relPath}: id module "${moduleInId}" mismatches folder module "${moduleSegment}"`
        );
      }

      const expectedId = pathWithoutExt.replace(/\\/g, '/');
      if (id !== expectedId) {
        errors.push(
          `${relPath}: id "${id}" does not match file path "${expectedId}"`
        );
      }
    } catch (error) {
      errors.push(`${relPath}: failed to parse JSON (${error.message})`);
    }
  });
};

walk(WORKSPACE_ROOT);

if (errors.length > 0) {
  console.error('Workspace validation failed:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  console.error(
    `\nFound ${errors.length} issue${errors.length === 1 ? '' : 's'}.`
  );
  process.exit(1);
}

console.log('Workspace validation passed ✅');
process.exit(0);
