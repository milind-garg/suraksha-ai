param(
    [string]$Environment = "dev",
    [string]$Region = "ap-south-1",
    # Set to deploy the optional Amplify Hosting CloudFormation stack.
    # Requires -GitHubRepository and -GitHubOAuthToken to be supplied.
    [switch]$DeployAmplify,
    [string]$GitHubRepository = "",
    [string]$GitHubOAuthToken = "",
    [string]$GitHubBranch = "main"
)

$ProjectName = "suraksha-ai"
$StackName = "$ProjectName-infrastructure-$Environment"

Write-Host "Deploying Suraksha AI Infrastructure..." -ForegroundColor Cyan
Write-Host "Stack: $StackName" -ForegroundColor Yellow
Write-Host "Region: $Region" -ForegroundColor Yellow
Write-Host "Environment: $Environment" -ForegroundColor Yellow

# ── Core backend stack (Cognito, S3, DynamoDB, Lambda, IAM) ──────────────────
aws cloudformation deploy `
    --template-file $PSScriptRoot/../cloudformation/suraksha-infrastructure.yaml `
    --stack-name $StackName `
    --parameter-overrides Environment=$Environment ProjectName=$ProjectName `
    --capabilities CAPABILITY_NAMED_IAM `
    --region $Region

if ($LASTEXITCODE -ne 0) {
    Write-Host "Infrastructure deployment failed! Check errors above." -ForegroundColor Red
    exit 1
}

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

# ── Optional: Amplify Hosting stack ──────────────────────────────────────────
if ($DeployAmplify) {
    if (-not $GitHubRepository -or -not $GitHubOAuthToken) {
        Write-Host "ERROR: -GitHubRepository and -GitHubOAuthToken are required with -DeployAmplify" -ForegroundColor Red
        Write-Host "TIP: Retrieve the token from Secrets Manager rather than passing it in plain text:" -ForegroundColor Yellow
        Write-Host '  $GitHubOAuthToken = (aws secretsmanager get-secret-value --secret-id suraksha-ai/github-token --query SecretString --output text)' -ForegroundColor Yellow
        exit 1
    }

    $AmplifyStackName = "$ProjectName-amplify-$Environment"
    Write-Host "`nDeploying Amplify Hosting stack: $AmplifyStackName" -ForegroundColor Cyan

    aws cloudformation deploy `
        --template-file $PSScriptRoot/../cloudformation/amplify-hosting.yaml `
        --stack-name $AmplifyStackName `
        --parameter-overrides `
            ProjectName=$ProjectName `
            Environment=$Environment `
            GitHubRepository=$GitHubRepository `
            GitHubOAuthToken=$GitHubOAuthToken `
            GitHubBranch=$GitHubBranch `
        --region $Region

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Amplify Hosting stack deployed successfully!" -ForegroundColor Green

        $amplifyOutputs = aws cloudformation describe-stacks `
            --stack-name $AmplifyStackName `
            --region $Region `
            --query "Stacks[0].Outputs" `
            --output json | ConvertFrom-Json

        foreach ($output in $amplifyOutputs) {
            Write-Host "  $($output.OutputKey): $($output.OutputValue)" -ForegroundColor White
        }
    } else {
        Write-Host "Amplify Hosting deployment failed! Check errors above." -ForegroundColor Red
        exit 1
    }
}