# Check Deployment Status for POD Store Creator

Write-Host "`n=== POD Store Creator Deployment Status ===" -ForegroundColor Cyan

# 1. Check GitHub Actions
Write-Host "`n1. GitHub Actions Workflows:" -ForegroundColor Yellow
Write-Host "   View at: https://github.com/dquillman/POD-Store-Creator/actions"

# 2. Check GCP Project
Write-Host "`n2. Google Cloud Project:" -ForegroundColor Yellow
try {
    $project = gcloud config get-value project 2>$null
    if ($project) {
        Write-Host "   Project ID: $project" -ForegroundColor Green

        # Check Cloud Run services
        Write-Host "`n3. Cloud Run Services:" -ForegroundColor Yellow
        $services = gcloud run services list --platform=managed --format="table(name,region,url)" 2>$null
        if ($services) {
            Write-Host $services
        } else {
            Write-Host "   No Cloud Run services found" -ForegroundColor Gray
        }

        # Check GCS buckets
        Write-Host "`n4. Cloud Storage Buckets:" -ForegroundColor Yellow
        $buckets = gcloud storage buckets list --format="value(name)" 2>$null
        if ($buckets) {
            foreach ($bucket in $buckets) {
                Write-Host "   - $bucket" -ForegroundColor Green
                Write-Host "     Frontend URL: https://storage.googleapis.com/$bucket/index.html" -ForegroundColor Cyan
            }
        } else {
            Write-Host "   No buckets found" -ForegroundColor Gray
        }

    } else {
        Write-Host "   Not logged in. Run: gcloud auth login" -ForegroundColor Red
    }
} catch {
    Write-Host "   gcloud CLI not installed or configured" -ForegroundColor Red
}

# 3. Check GitHub Secrets (you need to check manually)
Write-Host "`n5. GitHub Secrets (check manually):" -ForegroundColor Yellow
Write-Host "   https://github.com/dquillman/POD-Store-Creator/settings/secrets/actions"
Write-Host "   Required secrets:"
Write-Host "   - GCP_PROJECT_ID"
Write-Host "   - GCP_REGION"
Write-Host "   - GCP_SERVICE_ACCOUNT_EMAIL"
Write-Host "   - GCP_WORKLOAD_IDP"
Write-Host "   - GCS_BUCKET"

Write-Host "`n" -ForegroundColor Cyan
