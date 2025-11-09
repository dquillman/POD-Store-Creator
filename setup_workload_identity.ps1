# Setup Workload Identity Federation for POD Store Creator
# This script creates the necessary resources for GitHub Actions to deploy to GCP

$PROJECT_ID = "pod-store-creator"
$REGION = "us-central1"
$GITHUB_REPO = "dquillman/POD-Store-Creator"

Write-Host "`n=== Setting up Workload Identity Federation ===" -ForegroundColor Cyan
Write-Host "Project: $PROJECT_ID" -ForegroundColor Yellow
Write-Host "Region: $REGION" -ForegroundColor Yellow
Write-Host "GitHub Repo: $GITHUB_REPO`n" -ForegroundColor Yellow

# Set the project
Write-Host "Setting GCP project..." -ForegroundColor Green
gcloud config set project $PROJECT_ID

# Get project number (needed for some commands)
Write-Host "`nGetting project number..." -ForegroundColor Green
$PROJECT_NUMBER = gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
Write-Host "Project Number: $PROJECT_NUMBER" -ForegroundColor Yellow

# Step 1: Enable required APIs
Write-Host "`nStep 1: Enabling required APIs..." -ForegroundColor Green
$apis = @(
    "iam.googleapis.com",
    "iamcredentials.googleapis.com",
    "run.googleapis.com",
    "artifactregistry.googleapis.com",
    "storage.googleapis.com",
    "secretmanager.googleapis.com"
)

foreach ($api in $apis) {
    Write-Host "  Enabling $api..." -ForegroundColor Gray
    gcloud services enable $api --project=$PROJECT_ID 2>&1 | Out-Null
}
Write-Host "  APIs enabled!" -ForegroundColor Green

# Step 2: Check/Create Workload Identity Pool
Write-Host "`nStep 2: Setting up Workload Identity Pool..." -ForegroundColor Green
$poolName = "github-actions-pool"

# Check if pool exists
$existingPool = gcloud iam workload-identity-pools list --location=global --project=$PROJECT_ID --format="value(name)" 2>&1 | Where-Object { $_ -match $poolName }

if ($existingPool) {
    Write-Host "  Pool '$poolName' already exists" -ForegroundColor Yellow
} else {
    Write-Host "  Creating Workload Identity Pool '$poolName'..." -ForegroundColor Gray
    gcloud iam workload-identity-pools create $poolName `
        --project=$PROJECT_ID `
        --location=global `
        --display-name="GitHub Actions Pool" `
        --description="Pool for GitHub Actions OIDC authentication"
    Write-Host "  Pool created!" -ForegroundColor Green
}

# Step 3: Check/Create Workload Identity Provider
Write-Host "`nStep 3: Setting up Workload Identity Provider..." -ForegroundColor Green
$providerName = "github-actions-provider"

# Check if provider exists
$existingProvider = gcloud iam workload-identity-pools providers list --workload-identity-pool=$poolName --location=global --project=$PROJECT_ID --format="value(name)" 2>&1 | Where-Object { $_ -match $providerName }

if ($existingProvider) {
    Write-Host "  Provider '$providerName' already exists" -ForegroundColor Yellow
} else {
    Write-Host "  Creating Workload Identity Provider '$providerName'..." -ForegroundColor Gray
    gcloud iam workload-identity-pools providers create-oidc $providerName `
        --project=$PROJECT_ID `
        --location=global `
        --workload-identity-pool=$poolName `
        --display-name="GitHub Actions Provider" `
        --attribute-mapping="google.subject=assertion.sub,attribute.actor=assertion.actor,attribute.repository=assertion.repository,attribute.repository_owner=assertion.repository_owner" `
        --attribute-condition="assertion.repository_owner == 'dquillman'" `
        --issuer-uri="https://token.actions.githubusercontent.com"
    Write-Host "  Provider created!" -ForegroundColor Green
}

# Step 4: Check/Create Service Account
Write-Host "`nStep 4: Setting up Service Account..." -ForegroundColor Green
$serviceAccountName = "github-actions-deployer"
$serviceAccountEmail = "$serviceAccountName@$PROJECT_ID.iam.gserviceaccount.com"

# Check if service account exists
$existingSA = gcloud iam service-accounts list --project=$PROJECT_ID --format="value(email)" 2>&1 | Where-Object { $_ -eq $serviceAccountEmail }

if ($existingSA) {
    Write-Host "  Service Account '$serviceAccountName' already exists" -ForegroundColor Yellow
} else {
    Write-Host "  Creating Service Account '$serviceAccountName'..." -ForegroundColor Gray
    gcloud iam service-accounts create $serviceAccountName `
        --project=$PROJECT_ID `
        --display-name="GitHub Actions Deployer" `
        --description="Service account for GitHub Actions deployments"
    Write-Host "  Service Account created!" -ForegroundColor Green
}

# Step 5: Grant roles to service account
Write-Host "`nStep 5: Granting permissions to Service Account..." -ForegroundColor Green
$roles = @(
    "roles/run.admin",
    "roles/artifactregistry.admin",
    "roles/storage.admin",
    "roles/iam.serviceAccountUser"
)

foreach ($role in $roles) {
    Write-Host "  Granting $role..." -ForegroundColor Gray
    gcloud projects add-iam-policy-binding $PROJECT_ID `
        --member="serviceAccount:$serviceAccountEmail" `
        --role=$role `
        --condition=None 2>&1 | Out-Null
}
Write-Host "  Permissions granted!" -ForegroundColor Green

# Step 6: Allow GitHub Actions to impersonate the service account
Write-Host "`nStep 6: Binding Workload Identity..." -ForegroundColor Green
gcloud iam service-accounts add-iam-policy-binding $serviceAccountEmail `
    --project=$PROJECT_ID `
    --role="roles/iam.workloadIdentityUser" `
    --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/$poolName/attribute.repository/$GITHUB_REPO"
Write-Host "  Workload Identity bound!" -ForegroundColor Green

# Step 7: Get Workload Identity Provider resource name
Write-Host "`nStep 7: Getting Workload Identity Provider resource name..." -ForegroundColor Green
$workloadIdpResourceName = gcloud iam workload-identity-pools providers describe $providerName `
    --project=$PROJECT_ID `
    --location=global `
    --workload-identity-pool=$poolName `
    --format="value(name)"

# Step 8: Check/Create GCS Bucket
Write-Host "`nStep 8: Setting up GCS Bucket for frontend..." -ForegroundColor Green
$bucketName = "pod-creator-site-$PROJECT_ID"

# Check if bucket exists
$existingBucket = gcloud storage buckets list --project=$PROJECT_ID --format="value(name)" 2>&1 | Where-Object { $_ -eq $bucketName }

if ($existingBucket) {
    Write-Host "  Bucket '$bucketName' already exists" -ForegroundColor Yellow
} else {
    Write-Host "  Creating bucket '$bucketName'..." -ForegroundColor Gray
    gcloud storage buckets create gs://$bucketName --location=$REGION --project=$PROJECT_ID

    # Enable static website hosting
    gcloud storage buckets update gs://$bucketName `
        --web-main-page-suffix=index.html `
        --web-error-page=index.html

    # Make bucket public
    gcloud storage buckets add-iam-policy-binding gs://$bucketName `
        --member=allUsers `
        --role=roles/storage.objectViewer

    Write-Host "  Bucket created and configured!" -ForegroundColor Green
}

# Summary
Write-Host "`n=== Setup Complete! ===" -ForegroundColor Cyan
Write-Host "`nAdd these secrets to GitHub:" -ForegroundColor Yellow
Write-Host "Go to: https://github.com/$GITHUB_REPO/settings/secrets/actions`n" -ForegroundColor Cyan

Write-Host "GCP_PROJECT_ID" -ForegroundColor Green
Write-Host "  $PROJECT_ID`n" -ForegroundColor White

Write-Host "GCP_REGION" -ForegroundColor Green
Write-Host "  $REGION`n" -ForegroundColor White

Write-Host "GCP_SERVICE_ACCOUNT_EMAIL" -ForegroundColor Green
Write-Host "  $serviceAccountEmail`n" -ForegroundColor White

Write-Host "GCP_WORKLOAD_IDP" -ForegroundColor Green
Write-Host "  $workloadIdpResourceName`n" -ForegroundColor White

Write-Host "GCS_BUCKET" -ForegroundColor Green
Write-Host "  $bucketName`n" -ForegroundColor White

Write-Host "`nFrontend URL (after deployment):" -ForegroundColor Yellow
Write-Host "  https://storage.googleapis.com/$bucketName/index.html`n" -ForegroundColor Cyan

Write-Host "Next step: Copy the values above to GitHub Secrets, then push to trigger deployment!" -ForegroundColor Green
