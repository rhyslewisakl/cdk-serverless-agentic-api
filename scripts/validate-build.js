#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Define required files and directories
const requiredFiles = [
  'lib/index.js',
  'lib/index.d.ts'
];

const requiredDirs = [
  'lib'
];

// Validation function
function validateBuild() {
  console.log('Validating build output...');
  
  // Check required directories
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      console.error(`ERROR: Required directory '${dir}' does not exist!`);
      process.exit(1);
    }
    console.log(`✓ Directory '${dir}' exists`);
  }
  
  // Check required files
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`ERROR: Required file '${file}' does not exist!`);
      process.exit(1);
    }
    console.log(`✓ File '${file}' exists`);
  }
  
  // Check if index.js exports the main class
  try {
    const indexContent = fs.readFileSync('lib/index.js', 'utf8');
    if (!indexContent.includes('CDKServerlessAgenticAPI')) {
      console.error('ERROR: lib/index.js does not export CDKServerlessAgenticAPI!');
      process.exit(1);
    }
    console.log('✓ lib/index.js exports CDKServerlessAgenticAPI');
  } catch (error) {
    console.error('ERROR: Failed to read lib/index.js!', error);
    process.exit(1);
  }
  
  console.log('Build validation successful!');
}

// Run validation
validateBuild();