param(
    [string]$Environment = "dev",
    [string]$Region = "ap-south-1"
)

$ProjectName = "suraksha-ai"
$StackName = "$ProjectName-infrastructure-$Environment"

Write-Host "Deploying Suraksha AI Infrastructure..." -ForegroundColor Cyan
Write-Host "Stack: $StackName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow

aws cloudformation deploy `
    --template-file $PSScriptRoot/../cloudformation/suraksha-infrastructure.yaml `
    --stack-name $StackName `
    --parameter-overrides Environment=$Environment ProjectName=$ProjectName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -eq 0) {
    Write-Host "Infrastructure deployed successfully!" -ForegroundColor Green
    Write-Host "Stack Outputs:" -ForegroundColor Cyan

    $outputs = aws cloudformation describe-stacks `
        --stack-name $StackName `
        --region $Region `
        --query "Stacks[0].Outputs" `
        --output json | ConvertFrom-Json

    $outputMap = @{}
    foreach ($output in $outputs) {
        Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
        $outputMap[$output.OutputKey] = $output.OutputValue
    }

    $outputMap | ConvertTo-Json | Out-File -FilePath "$PSScriptRoot/stack-outputs.json"
    Write-Host "Outputs saved to infrastructure/scripts/stack-outputs.json" -ForegroundColor Green

} else {
    Write-Host "Deployment failed! Check errors above." -ForegroundColor Red
}