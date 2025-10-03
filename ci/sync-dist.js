#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), '.next');
const targetDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(sourceDir)) {
  console.warn('[sync-dist] Skipping copy: .next directory not found');
  process.exit(0);
}

try {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('[sync-dist] Copied .next -> dist');
} catch (error) {
  console.error('[sync-dist] Failed to mirror build output:', error);
  process.exit(1);
}
