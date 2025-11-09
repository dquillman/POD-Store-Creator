# Deployment Guide for POD Store Creator

## Current Status

The repository is now pushed to GitHub at: https://github.com/dquillman/POD-Store-Creator

## Project Structure

The project has two main components:

### 1. POD Creator Console (Frontend + Backend)
- **Frontend**: SPA in `frontend/index.html` - will be deployed to Google Cloud Storage
- **Backend**: Node.js API in `backend/` - will be deployed to Cloud Run
- **Purpose**: Web console for design QA, mockups, listings, and publishing

### 2. Shopify DevMode Scripts (Root Directory)
- **Purpose**: Automation scripts for setting up Shopify store
- **Main Scripts**:
  - `devmode_bootstrap.js` - Basic store setup
  - `devmode_setup_all.js` - Complete store configuration
  - `gen_products_csv.mjs` - CSV generation for products

## Google Cloud Run Deployment Steps

### Prerequisites

1. **Google Cloud Project**: "POD Store Creator"
2. **Required APIs** (enable in GCP Console):
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable artifactregistry.googleapis.com
   gcloud services enable storage.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

### Step 1: Create Service Account

```bash
# Create service account for GitHub Actions
gcloud iam service-accounts create gha-deployer \
  --display-name="GitHub Actions Deployer"

# Get your project ID
export PROJECT_ID=$(gcloud config get-value project)

# Grant necessary roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### Step 2: Set Up Workload Identity Federation

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-pool" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --display-name="GitHub Actions Pool"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" \
  --attribute-condition="assertion.repository_owner == 'dquillman'" \
  --issuer-uri="https://token.actions.githubusercontent.com"

# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding "gha-deployer@${PROJECT_ID}.iam.gserviceaccount.com" \
  --project="${PROJECT_ID}" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')/locations/global/workloadIdentityPools/github-pool/attribute.repository/dquillman/POD-Store-Creator"

# Get the Workload Identity Provider resource name (you'll need this for GitHub Secrets)
gcloud iam workload-identity-pools providers describe "github-provider" \
  --project="${PROJECT_ID}" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --format="value(name)"
```

### Step 3: Create GCS Bucket for Frontend

```bash
# Create bucket (must be globally unique)
export BUCKET_NAME="pod-creator-site-${PROJECT_ID}"
gcloud storage buckets create gs://${BUCKET_NAME} --location=us-central1

# Enable static website hosting
gcloud storage buckets update gs://${BUCKET_NAME} --web-main-page-suffix=index.html --web-error-page=index.html

# Make bucket public (for static website)
gcloud storage buckets add-iam-policy-binding gs://${BUCKET_NAME} \
  --member=allUsers \
  --role=roles/storage.objectViewer
```

### Step 4: Configure GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

| Secret Name | Value | Example |
|------------|-------|---------|
| `GCP_PROJECT_ID` | Your GCP project ID | `pod-store-creator-12345` |
| `GCP_REGION` | Your preferred region | `us-central1` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | Service account email | `gha-deployer@pod-store-creator-12345.iam.gserviceaccount.com` |
| `GCP_WORKLOAD_IDP` | Full resource path from Step 2 | `projects/123456789/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCS_BUCKET` | Bucket name from Step 3 | `pod-creator-site-pod-store-creator-12345` |

### Step 5: Deploy

The GitHub Actions workflows are already configured. To trigger deployment:

```bash
# Make a change to trigger backend deployment
cd backend
# Make any small change to server.js or just touch it
git add .
git commit -m "Trigger backend deployment"
git push origin main

# Make a change to trigger frontend deployment
cd ../frontend
# Make any small change to index.html or just touch it
git add .
git commit -m "Trigger frontend deployment"
git push origin main
```

Or manually trigger the workflows in GitHub Actions tab.

### Step 6: Store Shopify Secrets in Secret Manager

```bash
# Create secrets for Shopify integration
echo -n "YOUR_SHOPIFY_ACCESS_TOKEN" | gcloud secrets create SHOPIFY_ACCESS_TOKEN --data-file=-
echo -n "YOUR_PRINTFUL_API_KEY" | gcloud secrets create PRINTFUL_API_KEY --data-file=-

# Grant Cloud Run service access to secrets
gcloud secrets add-iam-policy-binding SHOPIFY_ACCESS_TOKEN \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding PRINTFUL_API_KEY \
  --member="serviceAccount:${PROJECT_ID}@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## Running Shopify Scripts Locally

The Shopify automation scripts are in the root directory:

### Setup

```bash
# Install dependencies
npm install

# Copy .env.example if you haven't already
# Edit .env with your Shopify credentials (never commit this file!)
```

### Run Scripts

```bash
# Bootstrap (basic setup)
npm run bootstrap

# Complete setup (collections, discounts, pages, theme)
npm run setup

# Generate products CSV
npm run gen-csv
```

## Testing

### Test Backend Locally

```bash
cd backend
npm install
npm start
# Visit http://localhost:8080/health
```

### Test Frontend Locally

```bash
cd frontend
# Open index.html in a browser
# Or use a simple HTTP server:
python -m http.server 8000
# Visit http://localhost:8000
```

## Accessing Deployed Application

After deployment:

- **Frontend**: `https://storage.googleapis.com/${GCS_BUCKET}/index.html`
- **Backend**: Check Cloud Run console for the URL (e.g., `https://pod-creator-api-xxxx-uc.a.run.app`)
- **Health Check**: `https://YOUR-CLOUD-RUN-URL/health`

## Troubleshooting

### GitHub Actions Failing

1. Check that all secrets are set correctly in GitHub
2. Verify Workload Identity Federation is properly configured
3. Check that APIs are enabled in GCP
4. Review GitHub Actions logs for specific errors

### Cloud Run Deployment Issues

1. Check Cloud Run logs in GCP Console
2. Verify the service account has necessary permissions
3. Ensure the Docker image built successfully in Artifact Registry

### Shopify Scripts Not Working

1. Verify .env file has correct credentials
2. Check that SHOPIFY_ACCESS_TOKEN has admin API access
3. Ensure THEME_ID is set correctly
4. Verify file paths for assets exist

## Next Steps

1. Configure your Shopify and Printful API keys in Secret Manager
2. Update the backend to use Secret Manager for credentials
3. Test the complete flow: Design → QA → Mockup → List → Publish
4. Set up monitoring and logging in GCP
