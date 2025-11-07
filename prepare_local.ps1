# --- POD Store Creator: local prep ---
$Expected = "G:\Users\daveq\POD-Store-Creator"

# 1) Confirm we’re in the right folder
$pwdPath = (Get-Location).Path
if ($pwdPath -ne $Expected) {
  Write-Host "⚠️  Please run this from: $Expected" -ForegroundColor Yellow
  Write-Host "Current: $pwdPath"
  exit 1
}

# 2) Ensure basic folders exist
$dirs = @(".github\workflows","frontend","backend")
foreach ($d in $dirs) { if (-not (Test-Path $d)) { New-Item -ItemType Directory -Force -Path $d | Out-Null } }

# 3) Optional: initialize git if needed
if (-not (Test-Path ".git")) {
  git init
  Write-Host "✅ Initialized git repository."
} else {
  Write-Host "ℹ️  Git repo already exists."
}

# 4) Show next steps
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1) Add your GitHub remote:"
Write-Host "     git remote add origin https://github.com/<YOUR_GITHUB>/POD-Store-Creator.git"
Write-Host "  2) Commit & push:"
Write-Host "     git add ."
Write-Host "     git commit -m 'init: POD Store Creator'"
Write-Host "     git branch -M main"
Write-Host "     git push -u origin main"
Write-Host "  3) In GitHub → Settings → Secrets → Actions, add:"
Write-Host "     GCP_PROJECT_ID, GCP_REGION, GCP_SERVICE_ACCOUNT_EMAIL, GCP_WORKLOAD_IDP, GCS_BUCKET"
Write-Host "  4) Push any change to main to trigger deploys."
