#!/bin/bash
set -euo pipefail

# Clean up previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf lib/ dist/ .jsii

# Create a standard tsconfig.json for TypeScript compilation
echo "Creating TypeScript configuration..."
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "lib",
    "rootDir": "src",
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "**/*.test.ts", "test"]
}
EOF

# Compile TypeScript
echo "Compiling TypeScript..."
npx tsc

# Check if lib/index.js exists
if [ ! -f "lib/index.js" ]; then
  echo "ERROR: lib/index.js does not exist after TypeScript compilation!"
  exit 1
fi

echo "Build completed successfully!"