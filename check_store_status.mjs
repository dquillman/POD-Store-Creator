#!/usr/bin/env node
// Check DevMode Store Setup Status
// Scans your local files and tells you what's done and what to do next

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const check = (condition) => condition ? '✓' : '✗';
const status = (condition) => condition ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;

console.log(`\n${colors.cyan}${colors.bold}=== DevMode Store Status Check ===${colors.reset}\n`);

// Check environment configuration
console.log(`${colors.bold}1. Environment Configuration${colors.reset}`);
const envExists = fs.existsSync(path.join(__dirname, '.env'));
console.log(`  ${status(envExists)} .env file exists`);

if (envExists) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf-8');
  const hasShopifyStore = envContent.includes('SHOPIFY_STORE=') && !envContent.includes('SHOPIFY_STORE=\n');
  const hasShopifyToken = envContent.includes('SHOPIFY_ACCESS_TOKEN=') && !envContent.includes('SHOPIFY_ACCESS_TOKEN=\n');
  const hasPrintfulKey = envContent.includes('PRINTFUL_API_KEY=') && !envContent.includes('PRINTFUL_API_KEY=pf_xxx');
  const hasThemeId = envContent.includes('THEME_ID=') && !envContent.includes('THEME_ID=123456789');

  console.log(`  ${status(hasShopifyStore)} Shopify store configured`);
  console.log(`  ${status(hasShopifyToken)} Shopify access token set`);
  console.log(`  ${status(hasPrintfulKey)} Printful API key set`);
  console.log(`  ${status(hasThemeId)} Theme ID configured`);
} else {
  console.log(`  ${colors.yellow}  → Create .env file with your credentials${colors.reset}`);
}

// Check brand assets
console.log(`\n${colors.bold}2. Brand Assets${colors.reset}`);
const brandDir = path.join(__dirname, 'brand');
const brandExists = fs.existsSync(brandDir);
console.log(`  ${status(brandExists)} Brand folder exists`);

if (brandExists) {
  const brandFiles = fs.readdirSync(brandDir);
  const hasLogo = brandFiles.some(f => f.toLowerCase().includes('logo'));
  const hasFavicon = brandFiles.some(f => f.toLowerCase().includes('favicon'));
  const hasBanner = brandFiles.some(f => f.toLowerCase().includes('banner') || f.toLowerCase().includes('hero'));

  console.log(`  ${status(hasLogo)} Logo file found (${brandFiles.filter(f => f.toLowerCase().includes('logo')).length} files)`);
  console.log(`  ${status(hasFavicon)} Favicon found (${brandFiles.filter(f => f.toLowerCase().includes('favicon')).length} files)`);
  console.log(`  ${status(hasBanner)} Banner/Hero image found`);
  console.log(`  ${colors.gray}  Total brand files: ${brandFiles.length}${colors.reset}`);
} else {
  console.log(`  ${colors.yellow}  → Create 'brand' folder and add your logo, favicon, banner${colors.reset}`);
}

// Check artworks/designs
console.log(`\n${colors.bold}3. Product Artworks${colors.reset}`);
const artworksDir = path.join(__dirname, 'artworks');
const artworksExist = fs.existsSync(artworksDir);
console.log(`  ${status(artworksExist)} Artworks folder exists`);

if (artworksExist) {
  const artworkFiles = fs.readdirSync(artworksDir).filter(f =>
    f.toLowerCase().endsWith('.png') ||
    f.toLowerCase().endsWith('.jpg') ||
    f.toLowerCase().endsWith('.jpeg')
  );
  console.log(`  ${colors.green}  Found ${artworkFiles.length} artwork files${colors.reset}`);

  if (artworkFiles.length > 0) {
    console.log(`  ${colors.gray}  Sample files:${colors.reset}`);
    artworkFiles.slice(0, 3).forEach(f => console.log(`    - ${f}`));
    if (artworkFiles.length > 3) console.log(`    ... and ${artworkFiles.length - 3} more`);
  }
} else {
  console.log(`  ${colors.yellow}  → Create 'artworks' folder and add your design PNGs${colors.reset}`);
}

// Check mockups
console.log(`\n${colors.bold}4. Product Mockups${colors.reset}`);
const mockupsDir = path.join(__dirname, 'mockups');
const mockupsExist = fs.existsSync(mockupsDir);
console.log(`  ${status(mockupsExist)} Mockups folder exists`);

if (mockupsExist) {
  const mockupFiles = fs.readdirSync(mockupsDir).filter(f =>
    f.toLowerCase().endsWith('.png') ||
    f.toLowerCase().endsWith('.jpg') ||
    f.toLowerCase().endsWith('.jpeg')
  );
  console.log(`  ${colors.green}  Found ${mockupFiles.length} mockup files${colors.reset}`);
} else {
  console.log(`  ${colors.yellow}  → Create 'mockups' folder for product mockups${colors.reset}`);
}

// Check product CSVs
console.log(`\n${colors.bold}5. Product Data Files${colors.reset}`);
const shopifyProductsCsv = fs.existsSync(path.join(__dirname, 'Shopify_DevMode_ProductImport.csv'));
const printfulMappingCsv = fs.existsSync(path.join(__dirname, 'DevMode_Printful_Mapping_Template.csv'));

console.log(`  ${status(shopifyProductsCsv)} Shopify product import CSV exists`);
console.log(`  ${status(printfulMappingCsv)} Printful mapping template exists`);

// Check if scripts have been run
console.log(`\n${colors.bold}6. Setup Scripts Status${colors.reset}`);
const hasNodeModules = fs.existsSync(path.join(__dirname, 'node_modules'));
console.log(`  ${status(hasNodeModules)} Dependencies installed (node_modules exists)`);

if (!hasNodeModules) {
  console.log(`  ${colors.yellow}  → Run: npm install${colors.reset}`);
}

// Summary and next steps
console.log(`\n${colors.cyan}${colors.bold}=== Next Steps ===${colors.reset}\n`);

const steps = [];

if (!envExists || !fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').includes('SHOPIFY_STORE=dev-mode')) {
  steps.push('1. Configure .env file with your Shopify and Printful credentials');
}

if (!hasNodeModules) {
  steps.push(`${steps.length + 1}. Install dependencies: npm install`);
}

if (!artworksExist || fs.readdirSync(artworksDir).length === 0) {
  steps.push(`${steps.length + 1}. Add your product artwork PNGs to the 'artworks' folder`);
}

if (!brandExists || fs.readdirSync(brandDir).length < 3) {
  steps.push(`${steps.length + 1}. Add logo, favicon, and banner to 'brand' folder`);
}

if (envExists && hasNodeModules) {
  steps.push(`${steps.length + 1}. Run store setup: npm run setup`);
  steps.push(`${steps.length + 1}. Generate product CSV: npm run gen-csv`);
}

if (steps.length === 0) {
  console.log(`${colors.green}${colors.bold}✓ Your store is ready to go!${colors.reset}`);
  console.log(`\n${colors.cyan}Available commands:${colors.reset}`);
  console.log(`  npm run setup      - Configure Shopify store`);
  console.log(`  npm run gen-csv    - Generate product CSV`);
  console.log(`  npm run bootstrap  - Quick bootstrap setup`);
} else {
  steps.forEach(step => console.log(`  ${colors.yellow}•${colors.reset} ${step}`));
}

// File count summary
console.log(`\n${colors.cyan}${colors.bold}=== File Summary ===${colors.reset}`);
console.log(`  Artworks: ${artworksExist ? fs.readdirSync(artworksDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length : 0}`);
console.log(`  Mockups: ${mockupsExist ? fs.readdirSync(mockupsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length : 0}`);
console.log(`  Brand Assets: ${brandExists ? fs.readdirSync(brandDir).length : 0}`);
console.log();

// Generate a JSON report
const report = {
  timestamp: new Date().toISOString(),
  environment: {
    configured: envExists,
    hasShopifyStore: envExists && fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').includes('SHOPIFY_STORE=dev-mode'),
    hasShopifyToken: envExists && fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').includes('SHOPIFY_ACCESS_TOKEN=shpat_'),
    hasPrintfulKey: envExists && !fs.readFileSync(path.join(__dirname, '.env'), 'utf-8').includes('PRINTFUL_API_KEY=pf_xxx'),
  },
  assets: {
    artworks: artworksExist ? fs.readdirSync(artworksDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length : 0,
    mockups: mockupsExist ? fs.readdirSync(mockupsDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg')).length : 0,
    brand: brandExists ? fs.readdirSync(brandDir).length : 0,
  },
  dependencies: {
    installed: hasNodeModules
  },
  csvFiles: {
    shopifyProducts: shopifyProductsCsv,
    printfulMapping: printfulMappingCsv
  },
  nextSteps: steps
};

// Save report
fs.writeFileSync(
  path.join(__dirname, 'store_status_report.json'),
  JSON.stringify(report, null, 2)
);

console.log(`${colors.gray}Report saved to: store_status_report.json${colors.reset}\n`);
