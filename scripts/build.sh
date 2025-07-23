#!/bin/bash

# Clean up previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf lib/ dist/ .jsii

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc --project tsconfig.json --listFiles

# Check if lib/index.js exists
if [ ! -f "lib/index.js" ]; then
  echo "ERROR: lib/index.js does not exist after TypeScript compilation!"
  exit 1
fi

# Run JSII with debug output
echo "Running JSII with debug output..."
JSII_DEBUG=1 npx jsii --silence-warnings=reserved-word --no-fix-peer-dependencies

# Check if .jsii file was created
if [ ! -f ".jsii" ]; then
  echo "ERROR: .jsii file was not created!"
  exit 1
fi

echo "Build completed successfully!"