#!/usr/bin/env node
/**
 * Unified generated-output drift check.
 *
 * This script intentionally stays dependency-free so it can run in a minimal
 * Node environment locally and in GitHub Actions.
 */

'use strict';

const { spawnSync } = require('child_process');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const CHECKS = [
  ['scripts/build-presets-exercises.js', ['--check']],
  ['scripts/build-ex-guides.js', ['--check']],
  ['scripts/build-ex-meta.js', ['--check']]
];

for (const [script, args] of CHECKS) {
  const printable = ['node', script, ...args].join(' ');
  console.log(`\n> ${printable}`);

  const result = spawnSync(process.execPath, [script, ...args], {
    cwd: ROOT_DIR,
    stdio: 'inherit'
  });

  if (result.error) {
    console.error(`\nCodegen check failed to start: ${printable}`);
    console.error(result.error.message);
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`\nCodegen check failed: ${printable}`);
    process.exit(result.status || 1);
  }
}

console.log('\nCodegen checks passed.');
