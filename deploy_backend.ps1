# Deploy Backend to Cloud Run
# Run this script to manually deploy the backend API

$ErrorActionPreference = "Stop"

Write-Host "Deploying Backend to Cloud Run..." -ForegroundColor Cyan

# Configuration
$PROJECT_ID = "pod-store-creator"
$REGION = "us-central1"
$SERVICE_NAME = "pod-creator-api"

# Navigate to backend directory
Set-Location backend

Write-Host "`nBuilding and deploying to Cloud Run..." -ForegroundColor Yellow

# Deploy using gcloud
gcloud run deploy $SERVICE_NAME `
  --source . `
  --region=$REGION `
  --project=$PROJECT_ID `
  --allow-unauthenticated `
  --platform=managed `
  --memory=512Mi `
  --port=8080

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nDeployment successful!" -ForegroundColor Green

    # Get the service URL
    Write-Host "`nGetting service URL..." -ForegroundColor Yellow
    $SERVICE_URL = gcloud run services describe $SERVICE_NAME `
      --region=$REGION `
      --project=$PROJECT_ID `
      --format="value(status.url)"

    Write-Host "`nBackend deployed successfully!" -ForegroundColor Green
    Write-Host "Service URL: $SERVICE_URL" -ForegroundColor Cyan

    Write-Host "`nNext steps:" -ForegroundColor Yellow
    Write-Host "1. Update frontend/index.html line 68 with this URL:" -ForegroundColor White
    Write-Host "   const API_URL = window.location.hostname === 'storage.googleapis.com'" -ForegroundColor Gray
    Write-Host "     ? '$SERVICE_URL'" -ForegroundColor Gray
    Write-Host "     : 'http://localhost:8080';" -ForegroundColor Gray
    Write-Host "2. Commit and push the frontend update" -ForegroundColor White
    Write-Host "3. Test POD Console buttons!" -ForegroundColor White

} else {
    Write-Host "`nDeployment failed!" -ForegroundColor Red
    exit 1
}

# Return to root directory
Set-Location ..
