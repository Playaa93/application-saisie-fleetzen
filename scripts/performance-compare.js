#!/usr/bin/env node

/**
 * Performance Comparison Script
 * Compares current performance metrics with baseline
 */

const fs = require('fs');
const path = require('path');

function compareMetrics() {
  const currentFile = path.join(process.cwd(), 'performance-results.json');
  const baselineFile = path.join(process.cwd(), 'performance-baseline.json');

  if (!fs.existsSync(currentFile)) {
    console.error('Current performance results not found. Run perf:test first.');
    process.exit(1);
  }

  const current = JSON.parse(fs.readFileSync(currentFile, 'utf8'));

  // If no baseline exists, create one
  if (!fs.existsSync(baselineFile)) {
    console.log('No baseline found. Creating baseline from current results.');
    fs.writeFileSync(baselineFile, JSON.stringify(current, null, 2));
    console.log('Baseline created successfully.');
    process.exit(0);
  }

  const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));

  // Compare metrics
  const comparison = {
    base: baseline.metrics,
    current: current.metrics,
    diff: {},
    regression: false,
  };

  // Calculate differences
  for (const metric in current.metrics) {
    const baseValue = baseline.metrics[metric] || 0;
    const currentValue = current.metrics[metric] || 0;
    const diff = currentValue - baseValue;
    const percentChange = baseValue ? ((diff / baseValue) * 100).toFixed(2) : 0;

    comparison.diff[metric] = {
      absolute: diff,
      percentage: percentChange,
      direction: diff > 0 ? 'increased' : diff < 0 ? 'decreased' : 'unchanged',
    };

    // Check for regression (size increases > 10% or timing increases > 15%)
    if (metric.includes('Size') && percentChange > 10) {
      comparison.regression = true;
    }
    if ((metric === 'fcp' || metric === 'lcp' || metric === 'tti') && percentChange > 15) {
      comparison.regression = true;
    }
  }

  // Format for display
  const output = {
    base: {
      bundleSize: `${(baseline.metrics.totalSize / 1024).toFixed(2)} KB`,
      fcp: `${baseline.metrics.fcp} ms`,
      tti: `${baseline.metrics.tti} ms`,
    },
    current: {
      bundleSize: `${(current.metrics.totalSize / 1024).toFixed(2)} KB`,
      fcp: `${current.metrics.fcp} ms`,
      tti: `${current.metrics.tti} ms`,
    },
    diff: {
      bundleSize: `${comparison.diff.totalSize?.percentage || 0}%`,
      fcp: `${comparison.diff.fcp?.percentage || 0}%`,
      tti: `${comparison.diff.tti?.percentage || 0}%`,
    },
    regression: comparison.regression,
  };

  console.log('Performance Comparison:');
  console.log(JSON.stringify(comparison, null, 2));

  fs.writeFileSync(
    path.join(process.cwd(), 'perf-comparison.json'),
    JSON.stringify(output, null, 2)
  );

  console.log('\nComparison saved to perf-comparison.json');

  if (comparison.regression) {
    console.log('\n⚠️  Performance regression detected!');
    process.exit(1);
  } else {
    console.log('\n✅ No performance regression');
    process.exit(0);
  }
}

compareMetrics();
