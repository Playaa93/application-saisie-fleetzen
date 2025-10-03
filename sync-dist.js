#!/usr/bin/env node

// Mirror the Next.js build output into a `dist` directory.
// Some deployment targets (including the current Vercel setup) still expect
// `dist/routes-manifest.json`, so we copy the generated `.next` folder after
// each build.

const fs = require('fs');
const path = require('path');

const sourceDir = path.join(process.cwd(), '.next');
const targetDir = path.join(process.cwd(), 'dist');

if (!fs.existsSync(sourceDir)) {
  console.warn('[sync-dist] Skipping copy: ".next" directory not found. Did the build fail?');
  process.exit(0);
}

console.log('[sync-dist] Preparing dist directory for Vercel compatibility...');

try {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });
  console.log('[sync-dist] Copied .next -> dist');
} catch (error) {
  console.error('[sync-dist] Failed to mirror build output:', error);
  process.exit(1);
}
