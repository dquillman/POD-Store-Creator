// devmode_setup_all.js — clean 2025-01 version (ESM)
// Run with: node devmode_setup_all.js

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

console.log('>>> Dev Mode setup starting...');

const BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-01`;
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};
const hasFile = p => p && fs.existsSync(p);

// -------------------- helpers --------------------
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
  // Some endpoints return 204 No Content
  if (res.status === 204) return {};
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(`REST ${method} ${url} failed:`, json);
    throw new Error('REST error');
  }
  return json;
};

// -------------------- files / themes --------------------
async function uploadToFiles(localPath, mimeType) {
  if (!hasFile(localPath)) return null;
  const filename = path.basename(localPath);

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
  console.log(`✓ Uploaded to Files: ${filename} -> ${file.url}`);
  return file.url;
}

async function putThemeAsset(key, localPath) {
  if (!hasFile(localPath)) return null;
  const data64 = fs.readFileSync(localPath).toString('base64');
  await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
    asset: { key, attachment: data64 }
  });
  console.log(`✓ Theme asset uploaded: ${key}`);
  return key;
}

// -------------------- store config pieces --------------------
async function createSmartCollections() {
  const defs = [
    { title: 'Mugs', rules: [{ column: 'title', relation: 'contains', condition: 'Mug' }] },
    { title: 'T-Shirts', rules: [{ column: 'title', relation: 'contains', condition: 'T-Shirt' }] },
    { title: 'Hoodies', rules: [{ column: 'title', relation: 'contains', condition: 'Hoodie' }] }
  ];
  for (const def of defs) {
    await rest('POST', `${BASE}/smart_collections.json`, {
      smart_collection: { ...def, disjunctive: false, published: true }
    });
    console.log(`✓ Collection: ${def.title}`);
  }
}

// ---- Create/Update FLOW15 idempotently
async function createDiscount() {
  const CODE = 'FLOW15';
  const now = new Date();
  const ends = new Date(now.getTime() + 7*24*60*60*1000);

  // 1) Ensure a price rule titled FLOW15 exists
  const rules = await rest('GET', `${BASE}/price_rules.json`);
  let rule = (rules.price_rules || []).find(r => (r.title || '').toUpperCase() === CODE);
  if (!rule) {
    const created = await rest('POST', `${BASE}/price_rules.json`, {
      price_rule: {
        title: CODE,
        target_type: 'line_item',
        target_selection: 'all',
        allocation_method: 'across',
        value_type: 'percentage',
        value: '-15.0',
        customer_selection: 'all',
        starts_at: now.toISOString(),
        ends_at: ends.toISOString()
      }
    });
    rule = created.price_rule;
    console.log('✓ Price rule FLOW15 created');
  } else {
    await rest('PUT', `${BASE}/price_rules/${rule.id}.json`, {
      price_rule: { id: rule.id, starts_at: now.toISOString(), ends_at: ends.toISOString() }
    });
    console.log('✓ Price rule FLOW15 dates refreshed');
  }

  // 2) Try to create discount code; if duplicate, treat as success
  try {
    await rest('POST', `${BASE}/price_rules/${rule.id}/discount_codes.json`, {
      discount_code: { code: CODE }
    });
    console.log('✓ Discount code FLOW15 created');
  } catch {
    // confirm it exists, then continue
    try {
      const codes = await rest('GET', `${BASE}/price_rules/${rule.id}/discount_codes.json`);
      const exists = (codes.discount_codes || []).some(dc => (dc.code || '').toUpperCase() === CODE);
      if (exists) {
        console.log('✓ Discount code FLOW15 already exists — continuing');
      } else {
        console.log('i Discount code likely already exists; continuing');
      }
    } catch {
      console.log('i Discount code likely already exists; continuing');
    }
  }
}

async function createPages() {
  const pages = [
    {
      title: 'FAQ',
      body_html: `
        <h2>FAQ</h2>
        <p><strong>Production & Shipping</strong>: POD items usually ship 5–9 business days after order.</p>
        <p><strong>Issues</strong>: Email a photo to support@devmode.store within 30 days for replacements.</p>
      `
    },
    {
      title: 'Shipping',
      body_html: `
        <h2>Shipping</h2>
        <p>Domestic: Flat $4.95 or Free $50+. Production 2–5 business days, shipping 3–5.</p>
      `
    },
    {
      title: 'Returns',
      body_html: `
        <h2>Returns</h2>
        <p>Made-to-order. Defects replaced within 30 days. Contact support@devmode.store.</p>
      `
    }
  ];
  for (const p of pages) {
    await rest('POST', `${BASE}/pages.json`, { page: { title: p.title, body_html: p.body_html, published: true }});
    console.log(`✓ Page: ${p.title}`);
  }
}

// ---- Menus: fallback (Admin GraphQL menu fields not available on this store)
async function upsertMenus() {
  console.log('i Skipping programmatic menu update (menu fields not available on this store/API plan).');
  console.log('> Do once in Admin: Online Store → Navigation');
  console.log('  - Main menu: /collections/all, /collections/mugs, /collections/t-shirts, /collections/hoodies, /pages/faq');
  console.log('  - Footer menu: /pages/shipping, /pages/returns, mailto:support@devmode.store');
}

// ---- hero section (optional assets)
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

async function installHeroSection(mp4Url, fallbackPngUrl) {
  if (!mp4Url && !fallbackPngUrl) {
    console.log('! No banner assets provided; skipping hero section install');
    return;
  }

  const sectionKey = 'sections/hero-devmode.liquid';
  await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
    asset: { key: sectionKey, value: heroSectionLiquid(mp4Url, fallbackPngUrl) }
  });
  console.log(`✓ Section created: ${sectionKey}`);

  const tplKey = 'templates/index.json';
  const current = await rest('GET', `${BASE}/themes/${process.env.THEME_ID}/assets.json?asset[key]=${encodeURIComponent(tplKey)}&theme_id=${process.env.THEME_ID}`);
  let json;
  try { json = JSON.parse(current.asset.value); } catch { json = { sections: {}, order: [] }; }

  const instanceId = 'hero-devmode';
  if (!json.sections) json.sections = {};
  if (!json.order) json.order = [];

  if (!json.sections[instanceId]) {
    json.sections[instanceId] = { type: 'hero-devmode', settings: {} };
    json.order = [instanceId, ...(json.order || [])];
    await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
      asset: { key: tplKey, value: JSON.stringify(json, null, 2) }
    });
    console.log('✓ Homepage updated: hero-devmode section placed first');
  } else {
    console.log('i Homepage already contains hero-devmode; leaving order unchanged');
  }
}

// -------------------- main --------------------
(async () => {
  if (!process.env.SHOPIFY_STORE || !process.env.SHOPIFY_ACCESS_TOKEN || !process.env.THEME_ID) {
    throw new Error('Missing SHOPIFY_STORE / SHOPIFY_ACCESS_TOKEN / THEME_ID in .env');
  }

  // Collections
  await createSmartCollections();

  // Discount
  await createDiscount();

  // Upload brand files to Files (optional)
  let mp4Url = null, bannerPngUrl = null;
  if (hasFile(process.env.BANNER_MP4)) mp4Url = await uploadToFiles(process.env.BANNER_MP4, 'video/mp4');
  if (hasFile(process.env.BANNER_FALLBACK)) bannerPngUrl = await uploadToFiles(process.env.BANNER_FALLBACK, 'image/png');

  // Pages
  await createPages();

  // Menus (manual fallback)
  await upsertMenus();

  // Theme assets convenience (optional)
  if (hasFile(process.env.LOGO_PATH)) await putThemeAsset('assets/devmode-logo.png', process.env.LOGO_PATH);
  if (hasFile(process.env.FAVICON_PATH)) await putThemeAsset('assets/favicon.png', process.env.FAVICON_PATH);

  // Hero section
  await installHeroSection(mp4Url, bannerPngUrl);

  console.log('✓ Dev Mode setup complete.');
})().catch(err => {
  console.error(err);
  process.exit(1);
});
