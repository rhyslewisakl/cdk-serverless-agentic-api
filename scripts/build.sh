#!/bin/bash

set -e

# Clean up previous build artifacts
echo "Cleaning up previous build artifacts..."
rm -rf lib/ dist/ .jsii tsconfig.json

# Create a temporary tsconfig.json file
echo "Creating temporary tsconfig.json..."
cat > tsconfig.json << EOF
{
  "compilerOptions": {
    "alwaysStrict": true,
    "declaration": true,
    "experimentalDecorators": true,
    "inlineSourceMap": true,
    "inlineSources": true,
    "lib": ["es2020"],
    "module": "CommonJS",
    "noEmitOnError": true,
    "noFallthroughCasesInSwitch": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "strict": true,
    "strictNullChecks": true,
    "strictPropertyInitialization": true,
    "stripInternal": true,
    "target": "ES2020",
    "outDir": "lib",
    "rootDir": "src"
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

# Run JSII
echo "Running JSII..."
npx jsii --silence-warnings=reserved-word --no-fix-peer-dependencies

# Check if .jsii file was created
if [ ! -f ".jsii" ]; then
  echo "ERROR: .jsii file was not created!"
  exit 1
fi

# Run jsii-pacmak
echo "Running jsii-pacmak..."
npx jsii-pacmak

# Check if dist directory was created
if [ ! -d "dist" ]; then
  echo "ERROR: dist directory was not created!"
  exit 1
fi

echo "Build completed successfully!"