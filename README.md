# POD Creator

Owner-controlled web console to take a print-on-demand store from **design files → QA → mockups → listings → publish**, with zero local servers.

- **Frontend:** static SPA (single HTML file) on **Google Cloud Storage** (+ optional Cloud CDN)
- **Backend:** Node/Express on **Cloud Run**
- **CI/CD:** GitHub Actions using Google **Workload Identity Federation** (OIDC) — no JSON keys

> You own the code. App works even if external tools change. Optional updates are read from a JSON file you host in this repo.

---

## Quick Start

1. **Create a GitHub repo** named `POD-Creator` and add this folder.
2. In **Google Cloud**:
   - Create or pick a project
   - Enable: **Cloud Run**, **Artifact Registry**, **Cloud Storage**
   - Create a **GCS bucket** for static hosting (e.g., `pod-creator-site-<project-id>`)
   - (Optional) Set Website config for the bucket:  
     Main page: `index.html`, Not found page: `index.html`
3. Create a **Service Account** (e.g., `gha-deployer@PROJECT.iam.gserviceaccount.com`) with roles:
   - Cloud Run Admin
   - Artifact Registry Admin
   - Storage Admin
   - Service Account Token Creator
4. Configure **Workload Identity Federation** for GitHub → GCP (OIDC) so GitHub Actions can impersonate the SA.
5. In GitHub → **Settings → Secrets and variables → Actions**, add:
   - `GCP_PROJECT_ID` = your GCP project id
   - `GCP_REGION` = e.g., `us-central1`
   - `GCP_SERVICE_ACCOUNT_EMAIL` = the SA above
   - `GCP_WORKLOAD_IDP` = resource path of your OIDC provider
   - `GCS_BUCKET` = your static site bucket (e.g., `pod-creator-site-<project-id>`)
6. **Push to `main`**:
   - Frontend auto-uploads to GCS
   - Backend builds & deploys to Cloud Run

**Frontend URL:**  
`https://storage.googleapis.com/<GCS_BUCKET>/index.html`

**Backend Health:**  
Cloud Run deploy log shows the URL (e.g., `https://pod-creator-api-xxxx-uc.a.run.app/health`)

---

## DevMode Style A (locked)
- **Dev label:** “DevMode” **105 px**, pure white `#FFFFFF`, top-left, no effects  
- **Slogan:** **400 px**, pure white, left-aligned  
- **Canvas:** **4500×5400 px**, transparent background

---

## Structure

