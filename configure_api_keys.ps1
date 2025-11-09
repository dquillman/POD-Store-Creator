# Configure API Keys for Cloud Run Backend
# This script reads your .env file and sets environment variables in Cloud Run

$ErrorActionPreference = "Stop"

Write-Host "Configuring API Keys for Cloud Run Backend..." -ForegroundColor Cyan

# Read .env file
if (Test-Path ".env") {
    Write-Host "`nReading .env file..." -ForegroundColor Yellow

    $envContent = Get-Content ".env"

    # Extract values with proper null handling
    $shopifyStoreMatch = $envContent | Select-String "^SHOPIFY_STORE=(.+)$" | Select-Object -First 1
    $SHOPIFY_STORE = if ($shopifyStoreMatch) { $shopifyStoreMatch.Matches.Groups[1].Value } else { $null }

    $shopifyTokenMatch = $envContent | Select-String "^SHOPIFY_ACCESS_TOKEN=(.+)$" | Select-Object -First 1
    $SHOPIFY_ACCESS_TOKEN = if ($shopifyTokenMatch) { $shopifyTokenMatch.Matches.Groups[1].Value } else { $null }

    $printfulMatch = $envContent | Select-String "^PRINTFUL_API_KEY=(.+)$" | Select-Object -First 1
    $PRINTFUL_API_KEY = if ($printfulMatch) { $printfulMatch.Matches.Groups[1].Value } else { $null }

    $openaiMatch = $envContent | Select-String "^OPENAI_API_KEY=(.+)$" | Select-Object -First 1
    $OPENAI_API_KEY = if ($openaiMatch) { $openaiMatch.Matches.Groups[1].Value } else { $null }

    Write-Host "`nFound API keys:" -ForegroundColor Green
    if ($SHOPIFY_STORE) { Write-Host "  - SHOPIFY_STORE: $SHOPIFY_STORE" -ForegroundColor White }
    if ($SHOPIFY_ACCESS_TOKEN) { Write-Host "  - SHOPIFY_ACCESS_TOKEN: ******" -ForegroundColor White }
    if ($PRINTFUL_API_KEY -and $PRINTFUL_API_KEY -notlike "*xxx*") {
        Write-Host "  - PRINTFUL_API_KEY: ******" -ForegroundColor White
    } else {
        Write-Host "  - PRINTFUL_API_KEY: (placeholder - not configured)" -ForegroundColor Yellow
    }
    if ($OPENAI_API_KEY) {
        Write-Host "  - OPENAI_API_KEY: ******" -ForegroundColor White
    } else {
        Write-Host "  - OPENAI_API_KEY: (not configured - will use mock data)" -ForegroundColor Yellow
    }

    Write-Host "`nUpdating Cloud Run service..." -ForegroundColor Yellow

    $envVars = @()
    if ($SHOPIFY_STORE) { $envVars += "SHOPIFY_STORE=$SHOPIFY_STORE" }
    if ($SHOPIFY_ACCESS_TOKEN) { $envVars += "SHOPIFY_ACCESS_TOKEN=$SHOPIFY_ACCESS_TOKEN" }
    if ($PRINTFUL_API_KEY -and $PRINTFUL_API_KEY -notlike "*xxx*") {
        $envVars += "PRINTFUL_API_KEY=$PRINTFUL_API_KEY"
    }
    if ($OPENAI_API_KEY) { $envVars += "OPENAI_API_KEY=$OPENAI_API_KEY" }

    if ($envVars.Count -gt 0) {
        $envVarsString = $envVars -join ","

        gcloud run services update pod-creator-api `
            --region=us-central1 `
            --project=pod-store-creator `
            --set-env-vars="$envVarsString"

        if ($LASTEXITCODE -eq 0) {
            Write-Host "`nAPI keys configured successfully!" -ForegroundColor Green
            Write-Host "`nYour POD Console features:" -ForegroundColor Cyan
            if ($OPENAI_API_KEY) {
                Write-Host "  - Generate Trends (AI-powered)" -ForegroundColor Green
                Write-Host "  - Generate Prompts (AI-powered)" -ForegroundColor Green
            } else {
                Write-Host "  - Generate Trends (mock data)" -ForegroundColor Yellow
                Write-Host "  - Generate Prompts (mock data)" -ForegroundColor Yellow
            }
            if ($PRINTFUL_API_KEY -and $PRINTFUL_API_KEY -notlike "*xxx*") {
                Write-Host "  - Create Mockups (Printful integration)" -ForegroundColor Green
            } else {
                Write-Host "  - Create Mockups (placeholder)" -ForegroundColor Yellow
            }
            if ($SHOPIFY_ACCESS_TOKEN) {
                Write-Host "  - Create Listings (Shopify integration)" -ForegroundColor Green
                Write-Host "  - Publish Products (Shopify integration)" -ForegroundColor Green
            }
        } else {
            Write-Host "`nFailed to configure API keys!" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "`nNo valid API keys found in .env file!" -ForegroundColor Yellow
    }
} else {
    Write-Host "`nNo .env file found!" -ForegroundColor Red
    exit 1
}
