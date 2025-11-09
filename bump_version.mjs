#!/usr/bin/env node

/**
 * Bump Version Script
 * Increments the patch version in package.json and frontend/index.html
 * Run this before commits to keep version in sync
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function bumpVersion() {
  // Read package.json
  const packagePath = path.join(__dirname, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

  // Parse current version
  const [major, minor, patch] = pkg.version.split('.').map(Number);

  // Increment patch version
  const newVersion = `${major}.${minor}.${patch + 1}`;

  console.log(`Bumping version: ${pkg.version} → ${newVersion}`);

  // Update package.json
  pkg.version = newVersion;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n');
  console.log(`✓ Updated package.json`);

  // Update frontend/index.html
  const frontendPath = path.join(__dirname, 'frontend', 'index.html');
  let html = fs.readFileSync(frontendPath, 'utf8');

  // Update <title>
  html = html.replace(
    /<title>POD Creator - v[\d.]+<\/title>/,
    `<title>POD Creator - v${newVersion}</title>`
  );

  // Update LOCAL_VERSION constant
  html = html.replace(
    /const LOCAL_VERSION = '[\d.]+';/,
    `const LOCAL_VERSION = '${newVersion}';`
  );

  // Update version badge
  html = html.replace(
    /id="versionBadge">v[\d.]+</,
    `id="versionBadge">v${newVersion}<`
  );

  fs.writeFileSync(frontendPath, html);
  console.log(`✓ Updated frontend/index.html`);

  // Update backend package.json
  const backendPackagePath = path.join(__dirname, 'backend', 'package.json');
  if (fs.existsSync(backendPackagePath)) {
    const backendPkg = JSON.parse(fs.readFileSync(backendPackagePath, 'utf8'));
    backendPkg.version = newVersion;
    fs.writeFileSync(backendPackagePath, JSON.stringify(backendPkg, null, 2) + '\n');
    console.log(`✓ Updated backend/package.json`);
  }

  console.log(`\n🎉 Version bumped to ${newVersion}`);
  console.log(`\nNext steps:`);
  console.log(`  git add .`);
  console.log(`  git commit -m "Bump version to ${newVersion}"`);
  console.log(`  git push`);

  return newVersion;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  bumpVersion();
}

export default bumpVersion;
