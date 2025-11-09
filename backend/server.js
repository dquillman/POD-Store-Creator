import express from "express";
import cors from "cors";

const app = express();

// ---- Config ----
const PORT = process.env.PORT || 8080;
// Allow your frontend bucket/site to call this API (set ALLOWED_ORIGIN in Cloud Run env)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "*";

// ---- Middleware ----
app.use(cors({
  origin: (origin, cb) => cb(null, ALLOWED_ORIGIN === "*" ? true : origin === ALLOWED_ORIGIN),
  credentials: false
}));
app.use(express.json({ limit: "10mb" }));

// ---- Health ----
app.get("/health", (_req, res) => res.json({
  ok: true,
  service: "pod-creator-api",
  version: "1.0.0",
  timestamp: new Date().toISOString()
}));

// ---- Stubs (wire these to real providers later) ----

// Generate product mockups via your POD provider (e.g., Printful/Printify)
// Body example:
// {
//   "provider": "printful",
//   "productType": "tshirt",
//   "assetUrl": "https://.../your.png",
//   "options": { "color": "black" }
// }
app.post("/api/mockup", async (req, res) => {
  // TODO: call provider API using secrets from Google Secret Manager
  // const token = await readSecret("PRINTFUL_TOKEN");
  // const provRes = await fetch("https://api.printful.com/mockup-generator/...", { headers:{Authorization:`Bearer ${token}`}, ... });
  // const data = await provRes.json();
  res.json({ ok: true, message: "Mockup generator stub", input: req.body, images: [] });
});

// Create a listing draft in your sales channel (Shopify/Etsy)
// Body example:
// { "channel":"shopify","title":"Dark Coffee > Day Mode","description":"...","tags":["dev","coffee"],"price":29.95,"variants":[{"color":"black","size":"M"}],"images":["https://...mock1.jpg"] }
app.post("/api/listing", async (req, res) => {
  // TODO: call channel API (Shopify Admin / Etsy v3) using Secret Manager keys
  res.json({ ok: true, message: "Listing draft stub", input: req.body, listingId: "DRAFT-0001" });
});

// Publish the draft and return a public URL
// Body example: { "channel":"shopify", "listingId":"DRAFT-0001" }
app.post("/api/publish", async (req, res) => {
  // TODO: finalize listing, set inventory, prices, SEO; return product URL
  res.json({ ok: true, message: "Publish stub", input: req.body, url: "https://example.com/products/dark-coffee-day-mode" });
});

// Optional: list enabled channels from config
app.get("/api/channels", (_req, res) => {
  res.json({ ok: true, channels: [{ id: "shopify", name: "Shopify", enabled: true }, { id: "etsy", name: "Etsy", enabled: false }] });
});

// Optional: surface locked Style A / thresholds to the frontend
app.get("/api/config", (_req, res) => {
  res.json({
    ok: true,
    styleA: { devModePx: 105, sloganPx: 400, color: "#FFFFFF", layout: "left", canvas: "4500x5400" },
    thresholds: { bgTolerance: 12 }
  });
});

// ---- Start ----
app.listen(PORT, () => console.log(`pod-creator-api listening on ${PORT}`));

/*
// Example Secret Manager helper (uncomment if you add @google-cloud/secret-manager)
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
const sm = new SecretManagerServiceClient();
async function readSecret(name) {
  const [version] = await sm.accessSecretVersion({ name: `projects/${process.env.GCP_PROJECT_ID}/secrets/${name}/versions/latest` });
  return version.payload.data.toString("utf8");
}
*/
