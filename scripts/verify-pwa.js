#!/usr/bin/env node

/**
 * PWA Verification Script for Field Agents Application
 * Checks if all PWA components are properly configured
 */

const fs = require('fs');
const path = require('path');

const checks = [];
let passCount = 0;
let failCount = 0;

function checkFile(filePath, description) {
  const fullPath = path.join(__dirname, '..', filePath);
  const exists = fs.existsSync(fullPath);

  checks.push({
    description,
    status: exists ? 'PASS' : 'FAIL',
    path: filePath
  });

  if (exists) passCount++;
  else failCount++;

  return exists;
}

function checkManifestContent() {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const requiredFields = ['name', 'short_name', 'start_url', 'display', 'icons'];
    const missingFields = requiredFields.filter(field => !manifest[field]);

    if (missingFields.length === 0) {
      checks.push({
        description: 'Manifest has all required fields',
        status: 'PASS',
        path: 'public/manifest.json'
      });
      passCount++;

      // Check for required icon sizes
      const requiredIcons = ['192x192', '512x512'];
      const iconSizes = manifest.icons.map(icon => icon.sizes);
      const missingIcons = requiredIcons.filter(size => !iconSizes.includes(size));

      if (missingIcons.length === 0) {
        checks.push({
          description: 'Manifest has required icon sizes (192x192, 512x512)',
          status: 'PASS',
          path: 'public/manifest.json'
        });
        passCount++;
      } else {
        checks.push({
          description: `Manifest missing icon sizes: ${missingIcons.join(', ')}`,
          status: 'FAIL',
          path: 'public/manifest.json'
        });
        failCount++;
      }
    } else {
      checks.push({
        description: `Manifest missing required fields: ${missingFields.join(', ')}`,
        status: 'FAIL',
        path: 'public/manifest.json'
      });
      failCount++;
    }
  } catch (error) {
    checks.push({
      description: 'Manifest JSON parse error',
      status: 'FAIL',
      path: 'public/manifest.json',
      error: error.message
    });
    failCount++;
  }
}

function checkServiceWorker() {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');

  if (fs.existsSync(swPath)) {
    const content = fs.readFileSync(swPath, 'utf8');

    const requiredEvents = ['install', 'activate', 'fetch'];
    const foundEvents = requiredEvents.filter(event =>
      content.includes(`addEventListener('${event}'`)
    );

    if (foundEvents.length === requiredEvents.length) {
      checks.push({
        description: 'Service Worker has all required event listeners',
        status: 'PASS',
        path: 'public/sw.js'
      });
      passCount++;
    } else {
      const missing = requiredEvents.filter(e => !foundEvents.includes(e));
      checks.push({
        description: `Service Worker missing events: ${missing.join(', ')}`,
        status: 'FAIL',
        path: 'public/sw.js'
      });
      failCount++;
    }
  }
}

console.log('\n🔍 PWA Configuration Verification\n');
console.log('=' .repeat(60));

// Core PWA files
checkFile('public/manifest.json', 'PWA Manifest file exists');
checkFile('public/sw.js', 'Service Worker file exists');
checkFile('src/app/layout.tsx', 'Next.js App Layout exists');
checkFile('src/app/globals.css', 'Global CSS with PWA styles exists');
checkFile('src/app/offline/page.tsx', 'Offline fallback page exists');

// Documentation
checkFile('docs/pwa-setup.md', 'PWA setup documentation exists');
checkFile('public/icons/README.md', 'Icon generation guide exists');

// Configuration
checkFile('next.config.js', 'Next.js config exists');

// Check manifest content
checkManifestContent();

// Check service worker content
checkServiceWorker();

// Check Next.js config for PWA headers
const configPath = path.join(__dirname, '..', 'next.config.js');
if (fs.existsSync(configPath)) {
  const config = fs.readFileSync(configPath, 'utf8');
  if (config.includes('async headers()') && config.includes('sw.js')) {
    checks.push({
      description: 'Next.js config has PWA headers',
      status: 'PASS',
      path: 'next.config.js'
    });
    passCount++;
  } else {
    checks.push({
      description: 'Next.js config missing PWA headers',
      status: 'WARN',
      path: 'next.config.js'
    });
  }
}

// Display results
console.log('\n📋 Check Results:\n');

checks.forEach((check, index) => {
  const icon = check.status === 'PASS' ? '✅' : check.status === 'WARN' ? '⚠️' : '❌';
  console.log(`${icon} ${check.description}`);
  if (check.status === 'FAIL' && check.error) {
    console.log(`   Error: ${check.error}`);
  }
});

console.log('\n' + '=' .repeat(60));
console.log(`\n📊 Summary: ${passCount} passed, ${failCount} failed\n`);

// Icon generation reminder
console.log('⚠️  IMPORTANT: Icon Files Not Checked');
console.log('   Run the following to generate app icons:');
console.log('   npx pwa-asset-generator logo.svg public/icons --icon-only\n');

console.log('📱 Testing Instructions:');
console.log('   1. Build the app: npm run build');
console.log('   2. Start production server: npm start');
console.log('   3. Open Chrome DevTools → Application tab');
console.log('   4. Check Manifest and Service Workers sections');
console.log('   5. Run Lighthouse PWA audit\n');

// Exit with appropriate code
process.exit(failCount > 0 ? 1 : 0);
