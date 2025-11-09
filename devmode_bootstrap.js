import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BASE = `https://${process.env.SHOPIFY_STORE}/admin/api/2025-01`;
const HEADERS = {
  'X-Shopify-Access-Token': process.env.SHOPIFY_ACCESS_TOKEN,
  'Content-Type': 'application/json'
};

const gql = async (query, variables={}) => {
  const res = await fetch(`${BASE}/graphql.json`, {
    method: 'POST',
    headers: { ...HEADERS },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors || json.data?.userErrors?.length) {
    console.error(JSON.stringify(json, null, 2));
    throw new Error('GraphQL error');
  }
  return json.data;
};

const rest = async (method, url, body) => {
  const res = await fetch(url, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) { console.error(json); throw new Error(`${method} ${url} failed`); }
  return json;
};

(async () => {
  // 1) Create Smart Collections
  const collections = [
    { title: 'Mugs', rules: [{ column: 'title', relation: 'contains', condition: 'Mug' }] },
    { title: 'T-Shirts', rules: [{ column: 'title', relation: 'contains', condition: 'T-Shirt' }] },
    { title: 'Hoodies', rules: [{ column: 'title', relation: 'contains', condition: 'Hoodie' }] }
  ];
  for (const col of collections) {
    await rest('POST', `${BASE}/smart_collections.json`, { smart_collection: { ...col, disjunctive: false, published: true }});
    console.log(`✓ Collection created: ${col.title}`);
  }

  // 2) Create Price Rule + Discount Code FLOW15
  const now = new Date();
  const expires = new Date(now.getTime() + 7*24*60*60*1000); // 7 days
  const priceRule = {
    price_rule: {
      title: 'FLOW15',
      target_type: 'line_item',
      target_selection: 'all',
      allocation_method: 'across',
      value_type: 'percentage',
      value: '-15.0',
      customer_selection: 'all',
      starts_at: now.toISOString(),
      ends_at: expires.toISOString(),
      once_per_customer: false,
      usage_limit: null
    }
  };
  const pr = await rest('POST', `${BASE}/price_rules.json`, priceRule);
  const ruleId = pr.price_rule.id;
  await rest('POST', `${BASE}/price_rules/${ruleId}/discount_codes.json`, { discount_code: { code: 'FLOW15' }});
  console.log('✓ Discount code FLOW15 created');

  // 3) Upload files (banner, favicon, logo) via stagedUploadsCreate
  const filesToUpload = [
    { path: process.env.BANNER_PATH, mimeType: 'image/png', resource: 'FILE' },
    { path: process.env.FAVICON_PATH, mimeType: 'image/png', resource: 'FILE' },
    { path: process.env.LOGO_PATH, mimeType: 'image/png', resource: 'FILE' }
  ].filter(f => f.path && fs.existsSync(f.path));

  if (filesToUpload.length) {
    const staged = await gql(`
      mutation stagedUploadsCreate($inputs: [StagedUploadInput!]!) {
        stagedUploadsCreate(input: $inputs) {
          stagedTargets { url resourceUrl parameters { name value } }
          userErrors { field message }
        }
      }
    `, {
      inputs: filesToUpload.map(f => ({
        resource: 'FILE',
        filename: path.basename(f.path),
        mimeType: f.mimeType,
        httpMethod: 'POST'
      }))
    });

    for (let i = 0; i < filesToUpload.length; i++) {
      const f = filesToUpload[i];
      const target = staged.stagedUploadsCreate.stagedTargets[i];
      // Build multipart form
      const FormData = (await import('form-data')).default;
      const form = new FormData();
      target.parameters.forEach(p => form.append(p.name, p.value));
      form.append('file', fs.createReadStream(f.path));
      const upRes = await fetch(target.url, { method: 'POST', body: form });
      if (!upRes.ok) throw new Error('Staged upload failed');

      // Finalize file in Shopify
      await gql(`
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) { files { id alt url } userErrors { field message } }
        }
      `, { files: [{ contentType: 'FILE', originalSource: target.resourceUrl, alt: path.basename(f.path) }] });

      console.log(`✓ Uploaded to Content/Files: ${path.basename(f.path)}`);
    }
  } else {
    console.log('No local files found to upload. Skip step 3 or verify paths.');
  }

  // 4) (Optional) Set theme assets (logo, favicon)
  if (process.env.THEME_ID && fs.existsSync(process.env.LOGO_PATH)) {
    const logoData = fs.readFileSync(process.env.LOGO_PATH).toString('base64');
    await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
      asset: { key: 'assets/devmode-logo.png', attachment: logoData }
    });
    console.log('✓ Theme asset uploaded: assets/devmode-logo.png');
  }
  if (process.env.THEME_ID && fs.existsSync(process.env.FAVICON_PATH)) {
    const favData = fs.readFileSync(process.env.FAVICON_PATH).toString('base64');
    await rest('PUT', `${BASE}/themes/${process.env.THEME_ID}/assets.json`, {
      asset: { key: 'assets/favicon.png', attachment: favData }
    });
    console.log('✓ Theme asset uploaded: assets/favicon.png');
  }

  console.log('All done. Dev Mode bootstrap complete.');
})();
