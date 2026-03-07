Write-Host "Building Lambda functions..." -ForegroundColor Cyan

# Clean dist
if (Test-Path dist) { Remove-Item -Recurse -Force dist }

# Compile TypeScript
npx tsc

if ($LASTEXITCODE -ne 0) {
    Write-Host "TypeScript compilation failed!" -ForegroundColor Red
    exit 1
}

Write-Host "TypeScript compiled!" -ForegroundColor Green

# Show what was compiled
Write-Host "Compiled files:" -ForegroundColor Yellow
Get-ChildItem -Recurse dist | Select-Object FullName

# Package each function into a single zip-ready folder
$functions = @(
  @{name="upload"},
  @{name="analysis"},
  @{name="policy"}
)

foreach ($func in $functions) {
  $outDir = "dist/packages/$($func.name)"
  New-Item -ItemType Directory -Force $outDir | Out-Null

  # Copy everything from dist (all compiled JS)
  Get-ChildItem -Recurse dist -Filter "*.js" | Where-Object {
    $_.FullName -notlike "*packages*"
  } | ForEach-Object {
    $relativePath = $_.FullName.Replace((Resolve-Path dist).Path + "\", "")
    $destPath = Join-Path $outDir $relativePath
    $destDir = Split-Path $destPath -Parent
    New-Item -ItemType Directory -Force $destDir | Out-Null
    Copy-Item $_.FullName $destPath
  }

  Write-Host "Packaged $($func.name) function" -ForegroundColor Green
}

Write-Host "Build complete!" -ForegroundColor Green