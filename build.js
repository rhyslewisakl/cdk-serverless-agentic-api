#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to execute commands and handle errors
function execute(command, errorMessage) {
  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    console.error(`ERROR: ${errorMessage}`);
    console.error(error.message);
    process.exit(1);
  }
}

// Clean up previous build artifacts
console.log('Cleaning up previous build artifacts...');
execute('rm -rf lib/ dist/ .jsii tsconfig.json', 'Failed to clean up build artifacts');

// Ensure lib directory exists
console.log('Creating necessary directories...');
execute('mkdir -p lib', 'Failed to create lib directory');

// Generate JSII configuration
console.log('Generating JSII configuration...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// Create a temporary package.json without the jsii field to avoid conflicts
const tempPackageJson = { ...packageJson };
delete tempPackageJson.jsii;
fs.writeFileSync('package.json.temp', JSON.stringify(tempPackageJson, null, 2));

// Rename files to avoid conflicts
fs.renameSync('package.json', 'package.json.original');
fs.renameSync('package.json.temp', 'package.json');

// Compile TypeScript manually
console.log('Compiling TypeScript...');
const tsconfigContent = {
  compilerOptions: {
    alwaysStrict: true,
    declaration: true,
    experimentalDecorators: true,
    inlineSourceMap: true,
    inlineSources: true,
    lib: ["es2020"],
    module: "CommonJS",
    noEmitOnError: true,
    noFallthroughCasesInSwitch: true,
    noImplicitAny: true,
    noImplicitReturns: true,
    noImplicitThis: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    resolveJsonModule: true,
    strict: true,
    strictNullChecks: true,
    strictPropertyInitialization: true,
    stripInternal: true,
    target: "ES2020",
    outDir: "lib",
    rootDir: "src"
  },
  include: ["src/**/*.ts"],
  exclude: ["node_modules", "**/*.test.ts", "test"]
};
fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfigContent, null, 2));
execute('tsc', 'TypeScript compilation failed');

// Validate TypeScript output
console.log('Validating TypeScript output...');
if (!fs.existsSync('lib/index.js')) {
  console.error('ERROR: lib/index.js does not exist after TypeScript compilation!');
  process.exit(1);
}

// Restore original package.json
fs.renameSync('package.json', 'package.json.temp');
fs.renameSync('package.json.original', 'package.json');

// Run JSII
console.log('Running JSII...');
execute('jsii --silence-warnings=reserved-word --no-fix-peer-dependencies', 'JSII compilation failed');

// Validate JSII output
console.log('Validating JSII output...');
if (!fs.existsSync('.jsii')) {
  console.error('ERROR: .jsii file was not created!');
  process.exit(1);
}

// Run jsii-pacmak
console.log('Running jsii-pacmak...');
execute('jsii-pacmak', 'jsii-pacmak failed');

if (!fs.existsSync('dist')) {
  console.error('ERROR: dist directory was not created!');
  process.exit(1);
}

console.log('Build completed successfully!');