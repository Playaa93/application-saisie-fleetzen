#!/usr/bin/env node

/**
 * Verify that the login route is included in the Next.js build
 * Run after: npm run build
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Next.js build output...\n');

const buildDir = path.join(__dirname, '..', '.next');
const serverDir = path.join(buildDir, 'server', 'app', 'api', 'auth', 'login');

// Check 1: Build directory exists
if (!fs.existsSync(buildDir)) {
  console.error('❌ Build directory not found. Run `npm run build` first.');
  process.exit(1);
}

console.log('✅ Build directory exists:', buildDir);

// Check 2: Login route in server output
const loginRouteFiles = [
  path.join(serverDir, 'route.js'),
  path.join(serverDir, 'route.js.nft.json'),
  path.join(buildDir, 'server', 'app', 'api', 'auth', 'login.rsc'),
];

let found = false;
console.log('\n📂 Checking for login route files:\n');

for (const file of loginRouteFiles) {
  if (fs.existsSync(file)) {
    console.log(`  ✅ Found: ${path.relative(buildDir, file)}`);
    found = true;
  } else {
    console.log(`  ⚠️  Missing: ${path.relative(buildDir, file)}`);
  }
}

if (!found) {
  console.error('\n❌ Login route not found in build output!');
  console.error('   The route file may not be compiling correctly.\n');
  process.exit(1);
}

// Check 3: Analyze route.js content
const routeJsPath = path.join(serverDir, 'route.js');
if (fs.existsSync(routeJsPath)) {
  console.log('\n📄 Analyzing route.js content:\n');

  const content = fs.readFileSync(routeJsPath, 'utf-8');

  // Check for POST export
  if (content.includes('export') && content.includes('POST')) {
    console.log('  ✅ POST handler export found');
  } else {
    console.log('  ⚠️  POST handler export not clearly visible (might be minified)');
  }

  // Check for runtime config
  if (content.includes('runtime') || content.includes('nodejs')) {
    console.log('  ✅ Runtime configuration found');
  } else {
    console.log('  ⚠️  Runtime configuration not found');
  }

  // Check file size
  const sizeKB = (fs.statSync(routeJsPath).size / 1024).toFixed(2);
  console.log(`  ℹ️  File size: ${sizeKB} KB`);
}

// Check 4: Routes manifest
const routesManifestPath = path.join(buildDir, 'routes-manifest.json');
if (fs.existsSync(routesManifestPath)) {
  console.log('\n📋 Checking routes manifest:\n');

  const manifest = JSON.parse(fs.readFileSync(routesManifestPath, 'utf-8'));

  // Look for login route in dynamic routes
  const hasLoginRoute = manifest.dynamicRoutes?.some(route =>
    route.page.includes('auth/login')
  ) || manifest.routes?.some(route =>
    route.includes('auth/login')
  );

  if (hasLoginRoute) {
    console.log('  ✅ Login route found in routes manifest');
  } else {
    console.log('  ⚠️  Login route not found in routes manifest');
    console.log('  ℹ️  This might be normal for API routes');
  }
}

// Check 5: App build manifest
const appPathsManifestPath = path.join(buildDir, 'server', 'app-paths-manifest.json');
if (fs.existsSync(appPathsManifestPath)) {
  console.log('\n📋 Checking app paths manifest:\n');

  const manifest = JSON.parse(fs.readFileSync(appPathsManifestPath, 'utf-8'));

  if (manifest['/api/auth/login/route']) {
    console.log('  ✅ Login route registered in app paths manifest');
    console.log('  ℹ️  Path:', manifest['/api/auth/login/route']);
  } else {
    console.log('  ⚠️  Login route not found in app paths manifest');
    console.log('  Available API routes:');
    Object.keys(manifest)
      .filter(key => key.includes('/api/'))
      .forEach(key => console.log(`     - ${key}`));
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 Summary\n');
console.log(found ? '✅ Login route IS included in the build' : '❌ Login route NOT included in the build');
console.log('\nNext steps:');
console.log('  1. If build looks good, test locally: npm start');
console.log('  2. Then deploy to Vercel: vercel --prod --force');
console.log('  3. Run test script: bash scripts/test-login-endpoint.sh');
console.log('='.repeat(60) + '\n');
