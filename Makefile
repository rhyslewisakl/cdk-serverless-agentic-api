# Makefile for cdk-serverless-agentic-api

.PHONY: all clean install build test validate package tag release

# Default target
all: clean install build test validate

# Clean build artifacts
clean:
	@echo "Cleaning build artifacts..."
	rm -rf lib/ dist/ .jsii .jsii-temp/ *.tgz

# Install dependencies and update package-lock.json
install:
	@echo "Installing dependencies..."
	npm install

# Build the project
build:
	@echo "Building the project..."
	npm run build

# Run tests
test:
	@echo "Running tests..."
	npm test

# Validate the build
validate:
	@echo "Validating the build..."
	npm run validate

# Create a package for testing
package:
	@echo "Creating package..."
	npm pack

# Tag a new version
# Usage: make tag VERSION=x.y.z
tag:
	@echo "Tagging version $(VERSION)..."
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Use 'make tag VERSION=x.y.z'"; \
		exit 1; \
	fi
	npm version $(VERSION) --no-git-tag-version
	git add package.json package-lock.json
	git commit -m "Bump version to $(VERSION)"
	git tag v$(VERSION)
	@echo "Tagged version v$(VERSION). To push, run: git push origin main && git push origin v$(VERSION)"

# Full release process
# Usage: make release VERSION=x.y.z
release: clean install build test validate
	@echo "Preparing release $(VERSION)..."
	@if [ -z "$(VERSION)" ]; then \
		echo "Error: VERSION is required. Use 'make release VERSION=x.y.z'"; \
		exit 1; \
	fi
	npm version $(VERSION) --no-git-tag-version
	git add package.json package-lock.json
	git commit -m "Bump version to $(VERSION)"
	git tag v$(VERSION)
	@echo "Tagged version v$(VERSION). To push, run: git push origin main && git push origin v$(VERSION)"