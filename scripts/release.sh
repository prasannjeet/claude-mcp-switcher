#!/bin/bash
# Usage: ./scripts/release.sh 1.2.0
set -e

VERSION=$1

if [ -z "$VERSION" ]; then
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh 1.2.0"
  exit 1
fi

# Update package.json version
node -e "
  const fs = require('fs');
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  pkg.version = '${VERSION}';
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
"

echo "✅ Updated package.json to version ${VERSION}"

# Commit and tag
git add package.json
git commit -m "chore: bump version to ${VERSION}"
git tag "v${VERSION}"

echo "✅ Created tag v${VERSION}"

# Push commit and tag
git push origin main
git push origin "v${VERSION}"

echo "🚀 Pushed — GitHub Actions will now build and publish the release."
