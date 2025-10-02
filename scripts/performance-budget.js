#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Validates build output against defined performance budgets
 */

const fs = require('fs');
const path = require('path');

// Performance budgets (in KB)
const BUDGETS = {
  totalJS: 300,
  totalCSS: 50,
  totalImages: 200,
  totalFonts: 100,
  total: 700,
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function getDirectorySize(dir, extensions = []) {
  let size = 0;

  if (!fs.existsSync(dir)) {
    return size;
  }

  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      size += getDirectorySize(filePath, extensions);
    } else if (extensions.length === 0 || extensions.some(ext => file.endsWith(ext))) {
      size += stat.size;
    }
  }

  return size;
}

function formatSize(bytes) {
  return (bytes / 1024).toFixed(2);
}

function checkBudget(actual, budget, label) {
  const percentage = (actual / budget) * 100;
  const status = actual <= budget ? 'PASS' : 'FAIL';
  const color = actual <= budget ? colors.green : colors.red;

  console.log(
    `${color}${status}${colors.reset} ${label}: ${formatSize(actual)} KB / ${budget} KB (${percentage.toFixed(
      1
    )}%)`
  );

  return actual <= budget;
}

function main() {
  console.log(`${colors.blue}=== Performance Budget Check ===${colors.reset}\n`);

  const distDir = path.join(process.cwd(), '.next');
  const staticDir = path.join(distDir, 'static');

  if (!fs.existsSync(distDir)) {
    console.error(`${colors.red}Error: Build directory not found. Run 'npm run build' first.${colors.reset}`);
    process.exit(1);
  }

  // Calculate sizes
  const jsSize = getDirectorySize(staticDir, ['.js']);
  const cssSize = getDirectorySize(staticDir, ['.css']);
  const totalSize = getDirectorySize(staticDir);

  // Check budgets
  const results = [
    checkBudget(jsSize, BUDGETS.totalJS * 1024, 'JavaScript'),
    checkBudget(cssSize, BUDGETS.totalCSS * 1024, 'CSS'),
    checkBudget(totalSize, BUDGETS.total * 1024, 'Total Assets'),
  ];

  console.log('\n');

  // Summary
  const allPassed = results.every(result => result);

  if (allPassed) {
    console.log(`${colors.green}✓ All performance budgets passed!${colors.reset}`);
    process.exit(0);
  } else {
    console.log(`${colors.red}✗ Some performance budgets exceeded!${colors.reset}`);
    console.log(`${colors.yellow}Consider optimizing your bundle size.${colors.reset}`);
    process.exit(1);
  }
}

main();
