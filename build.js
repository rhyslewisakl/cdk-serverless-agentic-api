#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Clean up previous build artifacts
console.log('Cleaning up previous build artifacts...');
execSync('rm -rf lib/ dist/ .jsii');

// Compile TypeScript
console.log('Compiling TypeScript...');
execSync('tsc --project tsconfig.json');

// Copy TypeScript source files to lib directory
console.log('Copying TypeScript source files to lib directory...');
execSync('mkdir -p lib');
execSync('cp -r src/*.ts lib/');

// Run JSII
console.log('Running JSII...');
execSync('jsii --silence-warnings=reserved-word');

console.log('Build completed successfully!');