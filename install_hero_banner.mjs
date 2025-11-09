#!/usr/bin/env node
// Install Hero Banner to Shopify Theme
// This script uploads banner assets and installs the hero section

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
const c = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

console.log(`\n${c.cyan}${c.bold}=== Hero Banner Installation ===${c.reset}\n`);

// Check required env vars
const BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-01`;
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};

if (!process.env.SHOPIFY_STORE || !process.env.SHOPIFY_ACCESS_TOKEN || !process.env.THEME_ID) {
  console.error(`${c.red}Error: Missing required environment variables${c.reset}`);
  console.log('Please set in .env:');
  console.log('  SHOPIFY_STORE');
  console.log('  SHOPIFY_ACCESS_TOKEN');
  console.log('  THEME_ID');
  process.exit(1);
}

// Helper functions
const gql = async (query, variables = {}) => {
  const res = await fetch(`${BASE}/graphql.json`, {
    method: 'POST',
    headers: { ...HEADERS },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (!res.ok || json.errors) {
    console.error(JSON.stringify(json, null, 2));
    throw new Error('GraphQL error');
  }
  return json.data;
};

const rest = async (method, url, body) => {
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`REST ${method} ${url} failed:`, json);
    throw new Error('REST error');
  }
  return json;
};

// Upload file to Shopify Files
async function uploadToFiles(localPath, mimeType) {
  if (!fs.existsSync(localPath)) {
    console.log(`${c.yellow}  File not found: ${localPath}${c.reset}`);
    return null;
  }

  const filename = path.basename(localPath);
  console.log(`${c.cyan}  Uploading ${filename}...${c.reset}`);

  const staged = await gql(`
    mutation stagedUploadsCreate($inputs: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $inputs) {
        stagedTargets { url resourceUrl parameters { name value } }
        userErrors { message field }
      }
    }
  `, { inputs: [{ resource: "FILE", filename, mimeType, httpMethod: "POST" }] });

  const target = staged.stagedUploadsCreate.stagedTargets?.[0];
  if (!target) throw new Error('No staged upload target');

  const FormData = (await import('form-data')).default;
  const form = new FormData();
  target.parameters.forEach(p => form.append(p.name, p.value));
  form.append('file', fs.createReadStream(localPath));

  const upRes = await fetch(target.url, { method: 'POST', body: form });
  if (!upRes.ok) throw new Error(`Staged upload failed: ${filename}`);

  const fc = await gql(`
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files { id alt url }
        userErrors { message field }
      }
    }
  `, { files: [{ contentType: "FILE", originalSource: target.resourceUrl, alt: filename }] });

  const file = fc.fileCreate.files?.[0];
  if (!file?.url) throw new Error('fileCreate returned no URL');

  console.log(`${c.green}  ✓ Uploaded: ${file.url}${c.reset}`);
  return file.url;
}

// Generate hero section Liquid code
function heroSectionLiquid(mp4Url, fallbackPngUrl) {
  return `
{% comment %} Dev Mode Hero Video Section {% endcomment %}
<section class="devmode-hero" style="position:relative;overflow:hidden;background:#0b0b0b;">
  <video autoplay muted loop playsinline style="width:100%;height:auto;display:block;object-fit:cover">
    ${mp4Url ? `<source src="${mp4Url}" type="video/mp4">` : ``}
    ${fallbackPngUrl ? `<img src="${fallbackPngUrl}" alt="Dev Mode Banner">` : ``}
  </video>
  <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;">
    <h1 style="font-family:monospace;color:#fff;font-size:clamp(28px,6vw,64px);margin:0;">DEV MODE</h1>
    <p style="font-family:monospace;color:#0AF0FF;font-size:clamp(14px,2.2vw,22px);margin:.5rem 0 0;">&gt; ENTER THE FLOW_</p>
  </div>
</section>
`;
}

// Install hero section in theme
async function installHeroSection(mp4Url, fallbackPngUrl) {
  if (!mp4Url && !fallbackPngUrl) {
    console.log(`${c.yellow}No banner assets provided; skipping hero section install${c.reset}`);
    return;
  }

  console.log(`\n${c.cyan}Installing hero section in theme...${c.reset}`);

  const sectionKey = 'sections/hero-devmode.liquid';
  await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
    asset: { key: sectionKey, value: heroSectionLiquid(mp4Url, fallbackPngUrl) }
  });
  console.log(`${c.green}✓ Section created: ${sectionKey}${c.reset}`);

  const tplKey = 'templates/index.json';
  const current = await rest('GET', `${BASE}/themes/${process.env.THEME_ID}/assets.json?asset[key]=${encodeURIComponent(tplKey)}&theme_id=${process.env.THEME_ID}`);
  let json;
  try {
    json = JSON.parse(current.asset.value);
  } catch {
    json = { sections: {}, order: [] };
  }

  const instanceId = 'hero-devmode';
  if (!json.sections) json.sections = {};
  if (!json.order) json.order = [];

  if (!json.sections[instanceId]) {
    json.sections[instanceId] = { type: 'hero-devmode', settings: {} };
    json.order = [instanceId, ...(json.order || [])];
    await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
      asset: { key: tplKey, value: JSON.stringify(json, null, 2) }
    });
    console.log(`${c.green}✓ Homepage updated: hero-devmode section placed first${c.reset}`);
  } else {
    console.log(`${c.yellow}i Homepage already contains hero-devmode; leaving order unchanged${c.reset}`);
  }
}

// Main execution
(async () => {
  try {
    console.log(`${c.bold}Step 1: Looking for banner files...${c.reset}`);

    // Check for banner files in brand folder and root
    const possiblePaths = [
      path.join(__dirname, 'brand', 'hero-2048x1152.mp4'),
      path.join(__dirname, 'brand', 'banner-2048x1152.png'),
      path.join(__dirname, 'brand', 'hero.mp4'),
      path.join(__dirname, 'brand', 'banner.png'),
      path.join(__dirname, 'brand', 'hero-banner.mp4'),
      path.join(__dirname, 'brand', 'hero-banner.png'),
      path.join(__dirname, 'hero-2048x1152.mp4'),
      path.join(__dirname, 'banner-2048x1152.png'),
    ];

    // Also check from .env
    if (process.env.BANNER_MP4) possiblePaths.unshift(path.join(__dirname, process.env.BANNER_MP4));
    if (process.env.BANNER_FALLBACK) possiblePaths.unshift(path.join(__dirname, process.env.BANNER_FALLBACK));

    let mp4Path = null;
    let pngPath = null;

    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        if (p.endsWith('.mp4')) {
          mp4Path = p;
          console.log(`${c.green}  Found MP4: ${path.basename(p)}${c.reset}`);
        } else if (p.endsWith('.png')) {
          pngPath = p;
          console.log(`${c.green}  Found PNG: ${path.basename(p)}${c.reset}`);
        }
      }
    }

    if (!mp4Path && !pngPath) {
      console.log(`\n${c.yellow}${c.bold}No banner files found!${c.reset}`);
      console.log(`\n${c.cyan}To add a hero banner:${c.reset}`);
      console.log(`1. Add your banner files to the 'brand' folder:`);
      console.log(`   - hero-2048x1152.mp4 (video banner, recommended)`);
      console.log(`   - banner-2048x1152.png (fallback image)`);
      console.log(`\n2. Or update .env with paths:`);
      console.log(`   BANNER_MP4=./path/to/your/video.mp4`);
      console.log(`   BANNER_FALLBACK=./path/to/your/image.png`);
      console.log(`\n3. Run this script again: npm run install-hero\n`);
      process.exit(0);
    }

    console.log(`\n${c.bold}Step 2: Uploading to Shopify Files...${c.reset}`);
    let mp4Url = null;
    let pngUrl = null;

    if (mp4Path) {
      mp4Url = await uploadToFiles(mp4Path, 'video/mp4');
    }
    if (pngPath) {
      pngUrl = await uploadToFiles(pngPath, 'image/png');
    }

    console.log(`\n${c.bold}Step 3: Installing hero section...${c.reset}`);
    await installHeroSection(mp4Url, pngUrl);

    console.log(`\n${c.green}${c.bold}✓ Hero banner installation complete!${c.reset}`);
    console.log(`\nVisit your store to see the hero section on the homepage.`);
    console.log(`Store: https://${process.env.SHOPIFY_STORE}\n`);

  } catch (err) {
    console.error(`\n${c.red}${c.bold}Error:${c.reset}`, err.message);
    process.exit(1);
  }
})();
