# Project Brief — POD Creator

Owner-controlled web console to take a POD store from **design files → QA → mockups → listings → publish** with zero local servers and no vendor lock-in.

---

## 1) Reason / Problem Statement
- **Problem:** POD workflows are fragmented (design QA, background cleanup, mockups, listings, pricing, publishing). Inconsistency (e.g., “Style A”) and context switching slow launch.
- **Goal:** A single, durable, Google-Cloud–hosted console that standardizes the process end-to-end, owned by you.
- **Outcomes:** Faster launches, fewer errors, repeatable quality, portable codebase.

---

## 2) Users & Jobs-to-Be-Done
| User        | JTBD                                                                 |
|-------------|----------------------------------------------------------------------|
| Store Owner | Approve assets, lock Style A, create/publish products, track status. |
| Designer/VA | Upload assets, fix backgrounds, pass QA, hand off for listing.       |
| Ops         | Build listings, set pricing/SEO, publish to channels, run QA.        |

---

## 3) Scope (MVP → V1)
**MVP**
- SPA on GCS (Asset Checker + Store Setup flow)
- Background detection/removal + Style A guardrails
- Local persistence; optional update channel
- Cloud Run API scaffolding + CI/CD (GitHub → GCP)

**V1**
- Mockup integration (Printful/Printify)
- Listing builder (Shopify/Etsy)
- Publish flow (return product URL)
- SEO helper + pricing calculator
- QA dashboard + CSV export

---

## 4) Architecture
- **Frontend:** Static SPA (HTML/JS) on **Google Cloud Storage** (+ optional Cloud CDN)
- **Backend:** Node/Express on **Cloud Run** (container image via Artifact Registry)
- **State:** Browser (IndexedDB/localStorage) for drafts; optional cloud DB later
- **Auth:** Start private; upgrade to Google IAP or Supabase Auth
- **Secrets:** Google **Secret Manager** (provider keys)
- **CI/CD:** GitHub Actions with **Workload Identity Federation** (OIDC)

---

## 5) Functional Requirements

### A) Design QA (Asset Checker)
- Upload PNGs; check transparency, solid BG, canvas size **4500×5400**, Style A heuristic.
- One-click **Remove BG** (white/black thresholds).
- Preview on checkerboard; **Export Clean** PNG.
- **Style A locked:** “DevMode” 105 px; Slogan 400 px; color `#FFFFFF`; left-aligned; transparent; no effects.

### B) Mockup Generator (V1)
- Select product (tee/hoodie/mug), color/variant.
- Call provider mockup API; preview and select finals.
- Save selected mockups to the draft product.

### C) Listing Builder (V1)
- Fields: title, bullets, description, tags, price, variants.
- Attach assets + mockups; re-order images.
- Save draft (local + provider draft).

### D) Publisher (V1)
- Choose channel (Shopify/Etsy); publish draft to live.
- Return **product URL** and ID.

### E) SEO & Pricing (V1)
- Keyword helper; meta title/description; URL slug.
- Pricing calculator (COGS, fees, margin target).

### F) QA & Ops (V1)
- Final checklist (thumbnail contrast, Style A, transparency, price OK).
- Export CSV (SKU, title, price, tags, URL).

### G) Updates & Settings
- Check `updates.json` in this repo (optional).
- Threshold knobs (BG tolerance, etc).

---

## 6) UI Overview

### Global Shell
- Top bar: App switcher (Asset Checker / WeScale Console), “Check for Updates” button, Style A badge.
- Tabs render per app.

### Screens (MVP)
1. **Asset Audit**  
   Grid: File | Transparency | Background | 4500×5400 | Style A | Actions (Preview, Remove BG, Export)
2. **Store Setup Flow**  
   Persistent checklist for end-to-end tasks
3. **Settings**  
   Font sizes, line height, BG tolerance

### Screens (V1)
4. **Mockups:** product picker → “Generate Mockups” → gallery → select finals  
5. **Listings:** form for content/tags/price/variants → attach images → save draft  
6. **Publish:** pick channel → publish → show product URL  
7. **SEO & Pricing:** keyword helper + margin calc  
8. **QA:** final checklist + CSV export

---

## 7) API (Cloud Run)

**Base:** `/api`

| Endpoint       | Method | Request (example)                                                                                  | Response (example)                                                        |
|----------------|--------|-----------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| `/health`      | GET    | –                                                                                                   | `{ ok: true, service: "pod-creator-api" }`                                |
| `/mockup`      | POST   | `{ provider:"printful", productType:"tshirt", assetUrl:"...", options:{ color:"black" } }`         | `{ ok:true, images:[ ... ] }`                                            |
| `/listing`     | POST   | `{ channel:"shopify", title:"...", description:"...", tags:["dev"], price:29.95, images:[...] }`   | `{ ok:true, listingId:"DRAFT-0001" }`                                    |
| `/publish`     | POST   | `{ channel:"shopify", listingId:"DRAFT-0001" }`                                                     | `{ ok:true, url:"https://yourstore/..." }`                               |
| `/channels`    | GET    | –                                                                                                   | `{ ok:true, channels:[{id:"shopify",enabled:true}, ...] }`               |
| `/config`      | GET    | –                                                                                                   | `{ ok:true, styleA:{...}, thresholds:{...} }`                            |

> Provider keys loaded from Secret Manager only on the server.

---

## 8) Data Model (front-end draft)
```json
{
  "projectId": "pod-creator-001",
  "assets": [
    { "id":"a1","name":"DarkCoffee.png","w":4500,"h":5400,"transparent":true,"styleAOk":true,"url":"blob://..." }
  ],
  "products": [
    {
      "id":"p1","title":"Dark Coffee > Day Mode","tags":["dev","coffee"],"price":29.95,
      "variants":[{"color":"black","size":"M"}],
      "assets":["a1"],"mockups":["blob://m1.jpg"],"channel":"shopify",
      "status":"draft","remoteId":null,"url":null
    }
  ],
  "checklist": { "styleA":true,"transparent":true,"contrast":true,"pricingOk":true }
}
