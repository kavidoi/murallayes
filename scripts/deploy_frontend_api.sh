#!/usr/bin/env bash
# Deploy the Muralla Frontend via Railway GraphQL API (no interactive prompts)
# Requires the following environment variables to be exported beforehand:
#   RAILWAY_TOKEN         – project-scoped or account token
#   RAILWAY_API_TOKEN     – account token (optional; CLI fallback)
#   RAILWAY_PROJECT_NAME  – "murallayes"
#   RAILWAY_ENVIRONMENT   – "production"
#
# Usage:
#   export RAILWAY_TOKEN=...  # do NOT commit this line
#   ./scripts/deploy_frontend_api.sh

set -euo pipefail

GRAPHQL_ENDPOINT="https://backboard.railway.app/graphql/v2"
PROJECT_NAME=${RAILWAY_PROJECT_NAME:-murallayes}
ENVIRONMENT=${RAILWAY_ENVIRONMENT:-production}

query() {
  local payload=$1
  curl -sSL -H "Content-Type: application/json" \
       -H "Authorization: Bearer ${RAILWAY_TOKEN}" \
       --data "{\"query\":${payload}}" \
       "$GRAPHQL_ENDPOINT"
}

# 0. Use preset IDs if provided
if [[ -n "${PROJECT_ID:-}" && -n "${SERVICE_ID:-}" ]]; then
  echo "✅ Using preset PROJECT_ID=$PROJECT_ID and SERVICE_ID=$SERVICE_ID"
else
  # 1. Fetch project ID by name
read -r PROJECT_ID <<< $(query '"query{me{projects{edges{node{id name}}}}}"' | jq -r \
  --arg NAME "$PROJECT_NAME" '.data.me.projects.edges[] | select(.node.name==$NAME) | .node.id')

fi

if [[ -z "$PROJECT_ID" ]]; then
  echo "❌ Project $PROJECT_NAME not found for current token" >&2
  exit 1
fi

echo "✅ Project ID: $PROJECT_ID"

# 2. Fetch Frontend service ID (skip if preset)
if [[ -z "${SERVICE_ID:-}" ]]; then
read -r SERVICE_ID <<< $(query "\"query{project(id:\"$PROJECT_ID\"){services{edges{node{id name}}}}}\"" \
  | jq -r '.data.project.services.edges[] | select(.node.name=="Frontend") | .node.id')

if [[ -z "$SERVICE_ID" ]]; then
  echo "❌ Frontend service not found in project" >&2
  exit 1
fi

echo "✅ Frontend Service ID: $SERVICE_ID"
fi

# 3. Trigger deploy from GitHub source (latest commit on main)
echo "🚀 Triggering deploy via Railway CLI…"
DEPLOY_ID=$(railway deployment create --service "$SERVICE_ID" 2>/dev/null | grep -Eo "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}")
if [[ -z "$DEPLOY_ID" ]]; then
  echo "❌ Failed to trigger deploy via CLI" >&2
  exit 1
fi

echo "🎉 Deployment created: $DEPLOY_ID"

echo "⏳ Waiting for deployment to finish… (this polls every 10s)"
while true; do
  status=$(query "\"query{deployment(id:\"$DEPLOY_ID\"){status}}\"" | jq -r '.data.deployment.status')
  echo "Status: $status";
  case "$status" in
    SUCCESS|FAILED) break;;
  esac
  sleep 10
done

echo "📜 Fetching last 200 log lines…"
logs=$(query "\"query{logs(serviceId:\"$SERVICE_ID\", limit:200){message timestamp}}\"" | jq -r '.data.logs[] | "[" + .timestamp + "] " + .message')

echo "$logs"

[[ "$status" == "SUCCESS" ]] && echo "✅ Deploy finished successfully" || echo "❌ Deploy failed"
