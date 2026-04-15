#!/usr/bin/env bash
# deploy.sh — Deploy Suraksha AI infrastructure to AWS
#
# Usage:
#   ./deploy.sh [environment] [region]
#   ./deploy.sh dev ap-south-1
#
# To also deploy the Amplify Hosting stack:
#   DEPLOY_AMPLIFY=true \
#   GITHUB_REPOSITORY=https://github.com/milind-garg/suraksha-ai \
#   GITHUB_OAUTH_TOKEN=ghp_xxx \
#   GITHUB_BRANCH=main \
#   ./deploy.sh dev ap-south-1

set -euo pipefail

ENVIRONMENT="${1:-dev}"
REGION="${2:-ap-south-1}"
PROJECT_NAME="suraksha-ai"
STACK_NAME="${PROJECT_NAME}-infrastructure-${ENVIRONMENT}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Deploying Suraksha AI Infrastructure..."
echo "Stack:       $STACK_NAME"
echo "Region:      $REGION"
echo "Environment: $ENVIRONMENT"

# ── Core backend stack (Cognito, S3, DynamoDB, Lambda, IAM) ──────────────────
aws cloudformation deploy \
  --template-file "${SCRIPT_DIR}/../cloudformation/suraksha-infrastructure.yaml" \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides Environment="${ENVIRONMENT}" ProjectName="${PROJECT_NAME}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${REGION}"

echo "Infrastructure deployed successfully!"
echo "Stack Outputs:"

aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}" \
  --output table

# Save outputs to JSON for local reference
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${REGION}" \
  --query "Stacks[0].Outputs" \
  --output json > "${SCRIPT_DIR}/stack-outputs.json"

echo "Outputs saved to infrastructure/scripts/stack-outputs.json"

# ── Optional: Amplify Hosting stack ──────────────────────────────────────────
if [[ "${DEPLOY_AMPLIFY:-false}" == "true" ]]; then
  : "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY env var is required for Amplify deployment}"
  : "${GITHUB_OAUTH_TOKEN:?GITHUB_OAUTH_TOKEN env var is required for Amplify deployment}"
  # Security: retrieve the token from Secrets Manager rather than storing it
  # in the environment long-term, e.g.:
  #   GITHUB_OAUTH_TOKEN=$(aws secretsmanager get-secret-value \
  #     --secret-id suraksha-ai/github-token --query SecretString --output text)
  GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

  AMPLIFY_STACK_NAME="${PROJECT_NAME}-amplify-${ENVIRONMENT}"
  echo ""
  echo "Deploying Amplify Hosting stack: ${AMPLIFY_STACK_NAME}"

  aws cloudformation deploy \
    --template-file "${SCRIPT_DIR}/../cloudformation/amplify-hosting.yaml" \
    --stack-name "${AMPLIFY_STACK_NAME}" \
    --parameter-overrides \
      ProjectName="${PROJECT_NAME}" \
      Environment="${ENVIRONMENT}" \
      GitHubRepository="${GITHUB_REPOSITORY}" \
      GitHubOAuthToken="${GITHUB_OAUTH_TOKEN}" \
      GitHubBranch="${GITHUB_BRANCH}" \
    --region "${REGION}"

  echo "Amplify Hosting stack deployed successfully!"
  aws cloudformation describe-stacks \
    --stack-name "${AMPLIFY_STACK_NAME}" \
    --region "${REGION}" \
    --query "Stacks[0].Outputs[*].{Key:OutputKey,Value:OutputValue}" \
    --output table
fi
