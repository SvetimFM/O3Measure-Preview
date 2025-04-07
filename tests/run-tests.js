#!/usr/bin/env node

/**
 * Test Runner Script for O3Measure
 * 
 * Allows running specific test groups or all tests
 * Usage: node tests/run-tests.js [group]
 * where group can be: utils, components, state, webxr, or all
 */

import { execSync } from 'child_process';

// Get test group from command line argument
const args = process.argv.slice(2);
const group = args[0] || 'all';

// Map group names to test patterns
const testPatterns = {
  utils: './tests/unit/utils/**/*.test.js',
  components: './tests/unit/components/**/*.test.js',
  state: './tests/unit/state/**/*.test.js',
  webxr: './tests/unit/webxr/**/*.test.js',
  all: './tests/unit/**/*.test.js'
};

// Get the pattern for the requested group
const pattern = testPatterns[group] || testPatterns.all;

// If group is invalid, show help
if (!testPatterns[group]) {
  console.log('Invalid test group. Available groups:');
  Object.keys(testPatterns).forEach(key => {
    console.log(`  - ${key}`);
  });
  process.exit(1);
}

console.log(`Running ${group} tests...`);

try {
  // Run the tests using Vitest
  const command = `npx vitest run ${pattern}`;
  execSync(command, { stdio: 'inherit' });
  console.log(`\n✅ ${group} tests completed successfully`);
} catch (error) {
  console.error(`\n❌ ${group} tests failed`);
  process.exit(1);
}