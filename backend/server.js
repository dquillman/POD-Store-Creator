/**
 * POD Creator API
 * Version: 1.0.1
 * Backend API for Print-on-Demand store creator
 */
import express from "express";
import cors from "cors";

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 8080;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// Environment variables (can be set in Cloud Run or loaded from Secret Manager)
const SHOPIFY_STORE = process.env.SHOPIFY_STORE;
const SHOPIFY_ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;
const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // For trend/prompt generation

// ---- Middleware ----
app.use(cors({
  origin: (origin, cb) => cb(null, ALLOWED_ORIGIN === "*" ? true : origin === ALLOWED_ORIGIN),
  credentials: false
}));
app.use(express.json({ limit: "10mb" }));

// ---- Logging Middleware ----
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ---- Health ----
app.get("/health", (_req, res) => res.json({
  ok: true,
  service: "pod-creator-api",
  version: "1.0.1",
  timestamp: new Date().toISOString(),
  environment: {
    hasShopify: !!SHOPIFY_STORE && !!SHOPIFY_ACCESS_TOKEN,
    hasPrintful: !!PRINTFUL_API_KEY,
    hasOpenAI: !!OPENAI_API_KEY
  }
}));

// ---- Helper Functions ----

// Shopify GraphQL helper
async function shopifyGQL(query, variables = {}) {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const res = await fetch(`https://${SHOPIFY_STORE}/admin/api/2025-01/graphql.json`, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, variables })
  });

  const json = await res.json();
  if (json.errors) {
    console.error('Shopify GraphQL error:', JSON.stringify(json.errors, null, 2));
    throw new Error('Shopify GraphQL error');
  }
  return json.data;
}

// Shopify REST helper
async function shopifyREST(method, endpoint, body) {
  if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
    throw new Error('Shopify credentials not configured');
  }

  const url = `https://${SHOPIFY_STORE}/admin/api/2025-01${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Shopify REST error: ${method} ${endpoint}`, text);
    throw new Error(`Shopify API error: ${res.status}`);
  }

  return await res.json();
}

// Printful API helper
async function printfulAPI(method, endpoint, body) {
  if (!PRINTFUL_API_KEY) {
    throw new Error('Printful API key not configured');
  }

  const url = `https://api.printful.com${endpoint}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('Printful API error:', json);
    throw new Error(`Printful API error: ${json.error?.message || res.status}`);
  }

  return json;
}

// OpenAI API helper
async function openaiAPI(messages, options = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model || 'gpt-4o-mini',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000
    })
  });

  const json = await res.json();
  if (!res.ok) {
    console.error('OpenAI API error:', json);
    throw new Error(`OpenAI API error: ${json.error?.message || res.status}`);
  }

  return json.choices[0].message.content;
}

// ---- API Endpoints ----

// Get configuration
app.get("/api/config", (_req, res) => {
  res.json({
    ok: true,
    styleA: {
      devModePx: 105,
      sloganPx: 400,
      color: "#FFFFFF",
      layout: "left",
      canvas: "4500x5400"
    },
    thresholds: { bgTolerance: 12 },
    integrations: {
      shopify: !!SHOPIFY_STORE && !!SHOPIFY_ACCESS_TOKEN,
      printful: !!PRINTFUL_API_KEY,
      ai: !!OPENAI_API_KEY
    }
  });
});

// List available sales channels
app.get("/api/channels", (_req, res) => {
  res.json({
    ok: true,
    channels: [
      { id: "shopify", name: "Shopify", enabled: !!SHOPIFY_STORE && !!SHOPIFY_ACCESS_TOKEN },
      { id: "etsy", name: "Etsy", enabled: false },
      { id: "printful", name: "Printful", enabled: !!PRINTFUL_API_KEY }
    ]
  });
});

// Generate design trends
// POST /api/trends
// Body: { niche: "developer", keywords: ["coding", "programming"] }
app.post("/api/trends", async (req, res) => {
  try {
    const { niche = "developer", keywords = [] } = req.body;

    if (!OPENAI_API_KEY) {
      // Return mock data if no API key
      return res.json({
        ok: true,
        trends: [
          "Minimalist code snippet designs with syntax highlighting",
          "Retro 80s/90s computer aesthetics with neon colors",
          "Dark mode themed designs with glowing elements",
          "Command line interface mockups with custom commands",
          "Binary/matrix style backgrounds with tech elements",
          "Pixel art programming icons and symbols",
          "Monospace typography with code-inspired layouts",
          "Tech humor: 'Works on my machine' themed designs",
          "IDE screenshot mockups with funny code",
          "Programming language logos in creative arrangements"
        ]
      });
    }

    const prompt = `You are a design trend researcher for print-on-demand products.

Generate 10 current design trends for the "${niche}" niche that would work well on t-shirts, hoodies, and mugs.
${keywords.length > 0 ? `Focus on these keywords: ${keywords.join(', ')}` : ''}

Requirements:
- Each trend should be 1-2 sentences
- Focus on visual design styles, not just topics
- Consider what's popular on platforms like Etsy, Redbubble, Amazon Merch
- Think about typography, color schemes, and layout styles
- Trends should be feasible for POD printing

Return only the list of trends, numbered 1-10.`;

    const response = await openaiAPI([
      { role: "system", content: "You are a design trend expert specializing in print-on-demand products." },
      { role: "user", content: prompt }
    ]);

    // Parse the numbered list
    const trends = response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0);

    res.json({ ok: true, trends });
  } catch (error) {
    console.error('Trends generation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Generate design prompts
// POST /api/prompts
// Body: { niche: "developer", style: "minimalist", count: 10 }
app.post("/api/prompts", async (req, res) => {
  try {
    const { niche = "developer", style = "minimalist", count = 10 } = req.body;

    if (!OPENAI_API_KEY) {
      // Return mock data if no API key
      return res.json({
        ok: true,
        prompts: [
          "Code never lies, comments sometimes do - in monospace font on black background",
          "Syntax Error: Coffee not found - minimalist design with command line aesthetic",
          "In code we trust - geometric layout with binary background",
          "DevMode: Always On - glowing neon text with circuit board pattern",
          "Function Over Form() - clean typography with code brackets",
          "404: Sleep Not Found - error message styled design",
          "Keep Calm and Debug On - British poster style meets code",
          "CTRL+ALT+COFFEE - keyboard shortcut themed design",
          "While (awake) { code(); } - infinite loop joke in code style",
          "Powered by Coffee & Stack Overflow - dual credit design"
        ]
      });
    }

    const prompt = `Generate ${count} creative t-shirt design prompts for the "${niche}" niche with a "${style}" style.

Each prompt should:
- Be specific and actionable for a designer
- Include text/slogan when appropriate
- Describe the visual style and layout
- Be suitable for print-on-demand (t-shirts, hoodies, mugs)
- Be trendy and likely to sell

Format: Simple list, one prompt per line, no numbering.`;

    const response = await openaiAPI([
      { role: "system", content: "You are a creative director for print-on-demand products." },
      { role: "user", content: prompt }
    ]);

    const prompts = response
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^[-•*]\s*/, '').replace(/^\d+\.\s*/, '').trim())
      .filter(line => line.length > 0)
      .slice(0, count);

    res.json({ ok: true, prompts });
  } catch (error) {
    console.error('Prompts generation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Generate product mockups via Printful
// POST /api/mockup
// Body: { productId: 71, variant: 4012, imageUrl: "https://..." }
app.post("/api/mockup", async (req, res) => {
  try {
    const { productId = 71, variantId = 4012, imageUrl, options = {} } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ ok: false, error: 'imageUrl is required' });
    }

    if (!PRINTFUL_API_KEY) {
      // Return mock response if no API key
      return res.json({
        ok: true,
        mockups: [
          { url: "https://via.placeholder.com/800x800?text=Front+Mockup", placement: "front" },
          { url: "https://via.placeholder.com/800x800?text=Back+Mockup", placement: "back" }
        ],
        message: "Mock mockups (configure PRINTFUL_API_KEY for real mockups)"
      });
    }

    // Create mockup task
    const taskData = {
      variant_ids: [variantId],
      format: "jpg",
      files: [
        {
          placement: "front",
          image_url: imageUrl,
          position: {
            area_width: 1800,
            area_height: 2400,
            width: 1800,
            height: 1800,
            top: 300,
            left: 0
          }
        }
      ]
    };

    const result = await printfulAPI('POST', `/mockup-generator/create-task/${productId}`, taskData);

    // Poll for result (Printful mockups are async)
    const taskId = result.result.task_key;
    let mockups = null;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts && !mockups) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      const taskResult = await printfulAPI('GET', `/mockup-generator/task?task_key=${taskId}`);

      if (taskResult.result.status === 'completed') {
        mockups = taskResult.result.mockups.map(m => ({
          url: m.mockup_url,
          placement: m.placement,
          variant: m.variant_ids[0]
        }));
        break;
      }

      attempts++;
    }

    if (!mockups) {
      return res.json({ ok: false, error: 'Mockup generation timeout' });
    }

    res.json({ ok: true, mockups });
  } catch (error) {
    console.error('Mockup generation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Create a product listing in Shopify
// POST /api/listing
// Body: { title, description, tags, price, images, variants }
app.post("/api/listing", async (req, res) => {
  try {
    const { title, description = "", tags = [], price = 29.99, images = [], variants = [] } = req.body;

    if (!title) {
      return res.status(400).json({ ok: false, error: 'title is required' });
    }

    if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
      return res.json({
        ok: true,
        listingId: "MOCK-" + Date.now(),
        message: "Mock listing created (configure Shopify credentials for real listings)"
      });
    }

    // Create product with variants
    const productData = {
      product: {
        title,
        body_html: description,
        vendor: "DevMode",
        product_type: "Apparel",
        tags: tags.join(', '),
        status: "draft",
        variants: variants.length > 0 ? variants.map(v => ({
          option1: v.size || "M",
          option2: v.color || "Black",
          price: v.price || price,
          inventory_management: "shopify",
          inventory_quantity: 0 // POD - no inventory
        })) : [{
          price,
          inventory_management: null
        }],
        images: images.map(url => ({ src: url }))
      }
    };

    const result = await shopifyREST('POST', '/products.json', productData);

    res.json({
      ok: true,
      listingId: result.product.id,
      adminUrl: `https://${SHOPIFY_STORE}/admin/products/${result.product.id}`,
      product: result.product
    });
  } catch (error) {
    console.error('Listing creation error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Publish a draft product
// POST /api/publish
// Body: { listingId }
app.post("/api/publish", async (req, res) => {
  try {
    const { listingId } = req.body;

    if (!listingId) {
      return res.status(400).json({ ok: false, error: 'listingId is required' });
    }

    if (!SHOPIFY_STORE || !SHOPIFY_ACCESS_TOKEN) {
      return res.json({
        ok: true,
        url: `https://example.myshopify.com/products/demo-product-${listingId}`,
        message: "Mock publish (configure Shopify credentials for real publishing)"
      });
    }

    // Update product status to active
    const result = await shopifyREST('PUT', `/products/${listingId}.json`, {
      product: {
        id: listingId,
        status: "active"
      }
    });

    const handle = result.product.handle;
    const storeUrl = `https://${SHOPIFY_STORE.replace('.myshopify.com', '')}/products/${handle}`;

    res.json({
      ok: true,
      url: storeUrl,
      adminUrl: `https://${SHOPIFY_STORE}/admin/products/${listingId}`,
      product: result.product
    });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Upload store status (accept JSON report from local checker)
// POST /api/store-status
// Body: { ...store status report JSON }
app.post("/api/store-status", async (req, res) => {
  try {
    const report = req.body;

    // Store or process the report (for now just return analysis)
    const analysis = {
      completionPercentage: 0,
      readyForLaunch: false,
      missingSteps: [],
      recommendations: []
    };

    // Analyze the report
    if (report.environment?.configured) {
      analysis.completionPercentage += 20;
    } else {
      analysis.missingSteps.push("Configure environment variables");
    }

    if (report.assets?.artworks > 0) {
      analysis.completionPercentage += 30;
    } else {
      analysis.missingSteps.push("Add artwork files");
    }

    if (report.assets?.mockups > 0) {
      analysis.completionPercentage += 20;
    } else {
      analysis.missingSteps.push("Generate product mockups");
    }

    if (report.dependencies?.installed) {
      analysis.completionPercentage += 10;
    }

    if (report.environment?.hasShopifyStore && report.environment?.hasShopifyToken) {
      analysis.completionPercentage += 20;
    } else {
      analysis.missingSteps.push("Configure Shopify credentials");
    }

    analysis.readyForLaunch = analysis.completionPercentage >= 80;

    if (analysis.completionPercentage < 80) {
      analysis.recommendations = [
        ...analysis.missingSteps.map(step => `Complete: ${step}`),
        "Run 'npm run setup' to configure Shopify store",
        "Run 'npm run install-hero' to add hero banner"
      ];
    }

    res.json({
      ok: true,
      analysis,
      report
    });
  } catch (error) {
    console.error('Store status error:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
});

// ---- Error Handler ----
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ ok: false, error: err.message });
});

// ---- Start ----
app.listen(PORT, () => {
  console.log(`pod-creator-api listening on ${PORT}`);
  console.log(`Shopify: ${SHOPIFY_STORE ? 'Configured' : 'Not configured'}`);
  console.log(`Printful: ${PRINTFUL_API_KEY ? 'Configured' : 'Not configured'}`);
  console.log(`OpenAI: ${OPENAI_API_KEY ? 'Configured' : 'Not configured'}`);
});

/*
// Google Secret Manager integration (optional)
// To use: npm install @google-cloud/secret-manager
// Then uncomment and load secrets on startup

import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const sm = new SecretManagerServiceClient();

async function loadSecrets() {
  const projectId = process.env.GCP_PROJECT_ID || 'pod-store-creator';

  try {
    const [shopifyStore] = await sm.accessSecretVersion({
      name: `projects/${projectId}/secrets/SHOPIFY_STORE/versions/latest`
    });
    process.env.SHOPIFY_STORE = shopifyStore.payload.data.toString();

    const [shopifyToken] = await sm.accessSecretVersion({
      name: `projects/${projectId}/secrets/SHOPIFY_ACCESS_TOKEN/versions/latest`
    });
    process.env.SHOPIFY_ACCESS_TOKEN = shopifyToken.payload.data.toString();

    // Load other secrets...
  } catch (error) {
    console.warn('Could not load secrets from Secret Manager:', error.message);
  }
}

// Call before starting server
// await loadSecrets();
*/
