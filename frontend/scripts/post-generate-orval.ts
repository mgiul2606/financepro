#!/usr/bin/env tsx
/**
 * Post-processing script for Orval-generated models
 *
 * This script automatically makes Response interfaces extend EntityWithId
 * when they have an 'id' field, enabling type-safe usage with useCrudModal.
 *
 * Usage: Run after `orval` generation
 *
 * What it does:
 * 1. Scans all *Response.ts files in src/api/generated/models/
 * 2. Checks if interface has an 'id: string' field
 * 3. Adds 'extends EntityWithId' to the interface
 * 4. Adds import for EntityWithId from hooks
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MODELS_DIR = join(__dirname, '../src/api/generated/models');
const ENTITY_WITH_ID_IMPORT = `import type { EntityWithId } from "../../../hooks/useCrudModal";`;

/**
 * Check if a file content has an 'id' field defined
 */
function hasIdField(content: string): boolean {
  // Match: id: string; or /** ... */ id: string;
  const idFieldRegex = /^\s*(?:\/\*\*[\s\S]*?\*\/\s*)?id:\s*string;/m;
  return idFieldRegex.test(content);
}

/**
 * Check if interface already extends something
 */
function alreadyExtends(content: string): boolean {
  return /export\s+interface\s+\w+\s+extends\s+/.test(content);
}

/**
 * Add EntityWithId extension to interface
 */
function addEntityWithIdExtension(content: string): string {
  // Replace: export interface Foo {
  // With:    export interface Foo extends EntityWithId {
  return content.replace(
    /export\s+interface\s+(\w+)\s*{/,
    'export interface $1 extends EntityWithId {'
  );
}

/**
 * Add EntityWithId import at the top of the file (after existing imports)
 */
function addEntityWithIdImport(content: string): string {
  // Find the last import statement
  const importRegex = /^import\s+.*?;$/gm;
  const imports = content.match(importRegex);

  if (!imports || imports.length === 0) {
    // No imports found, add at the top after the header comment
    const headerEndRegex = /\*\/\n/;
    return content.replace(headerEndRegex, `*/\n${ENTITY_WITH_ID_IMPORT}\n`);
  }

  // Add after the last import
  const lastImport = imports[imports.length - 1];
  return content.replace(lastImport, `${lastImport}\n${ENTITY_WITH_ID_IMPORT}`);
}

/**
 * Check if EntityWithId import already exists
 */
function hasEntityWithIdImport(content: string): boolean {
  return content.includes('EntityWithId');
}

/**
 * Process a single file
 */
function processFile(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8');

  // Skip if already extends something or doesn't have id field
  if (alreadyExtends(content) || !hasIdField(content)) {
    return false;
  }

  let newContent = content;

  // Add import if not present
  if (!hasEntityWithIdImport(newContent)) {
    newContent = addEntityWithIdImport(newContent);
  }

  // Add extends clause
  newContent = addEntityWithIdExtension(newContent);

  // Write back only if changed
  if (newContent !== content) {
    writeFileSync(filePath, newContent, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Main function
 */
function main() {
  console.log('🔧 Post-processing Orval-generated models...\n');

  const files = readdirSync(MODELS_DIR).filter(
    (file) => file.endsWith('Response.ts')
  );

  let processedCount = 0;

  for (const file of files) {
    const filePath = join(MODELS_DIR, file);
    const wasModified = processFile(filePath);

    if (wasModified) {
      console.log(`✅ ${file} - Added EntityWithId extension`);
      processedCount++;
    }
  }

  console.log(`\n🎉 Processed ${processedCount} of ${files.length} Response models`);
}

main();
