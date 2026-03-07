Write-Host "Building Lambda functions..." -ForegroundColor Cyan

# Clean dist
if (Test-Path dist) { Remove-Item -Recurse -Force dist }
New-Item -ItemType Directory dist | Out-Null

# Compile TypeScript
npx tsc

Write-Host "TypeScript compiled!" -ForegroundColor Green

# Package each function
$functions = @(
  @{name="upload"; handler="functions/upload/handler"},
  @{name="analysis"; handler="functions/analysis/handler"},
  @{name="policy"; handler="functions/policy/handler"}
)

foreach ($func in $functions) {
  $outDir = "dist/packages/$($func.name)"
  New-Item -ItemType Directory -Force $outDir | Out-Null

  # Copy compiled files
  Copy-Item -Recurse dist/lib $outDir/lib
  Copy-Item -Recurse "dist/$($func.handler)" $outDir/ -ErrorAction SilentlyContinue

  # Copy the specific handler
  $handlerDir = "dist/functions/$($func.name)"
  if (Test-Path $handlerDir) {
    Copy-Item -Recurse $handlerDir $outDir/functions/$($func.name) -ErrorAction SilentlyContinue
  }

  Write-Host "Packaged $($func.name) function" -ForegroundColor Green
}

Write-Host "Build complete!" -ForegroundColor Green