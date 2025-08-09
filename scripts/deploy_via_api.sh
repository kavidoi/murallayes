#!/usr/bin/env bash
# Deploy Backend and/or Frontend on Railway using ONLY the GraphQL API (no CLI)
#
# Required env vars:
#   RAILWAY_TOKEN            – Project token (Project-Access-Token)
# Optional:
#   RAILWAY_API_TOKEN        – Account or Team token (Authorization: Bearer)
#   RAILWAY_PROJECT_NAME     – Project name (default: murallayes)
#   RAILWAY_ENVIRONMENT      – Environment name (default: production)
#   SERVICES                 – Space-separated list: Backend Frontend (default: both)
#   BACKEND_SERVICE_ID       – If set, use directly
#   FRONTEND_SERVICE_ID      – If set, use directly
#
set -euo pipefail

GRAPHQL_ENDPOINT="https://backboard.railway.com/graphql/v2"
PROJECT_NAME=${RAILWAY_PROJECT_NAME:-murallayes}
ENVIRONMENT_NAME=${RAILWAY_ENVIRONMENT:-production}
SERVICES_TO_DEPLOY=${SERVICES:-"Backend Frontend"}

jq_bin() { if command -v jq >/dev/null 2>&1; then echo jq; else echo "❌ jq is required" >&2; exit 1; fi; }
JQ=$(jq_bin)

call_gql() {
  local query="$1"; local variables_json="${2:-{}}"
  local curl_args; curl_args=(-sS -H "Content-Type: application/json")
  if [[ -n "${RAILWAY_API_TOKEN:-}" ]]; then curl_args+=( -H "Authorization: Bearer ${RAILWAY_API_TOKEN}" ); fi
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then curl_args+=( -H "Project-Access-Token: ${RAILWAY_TOKEN}" ); fi
  curl "${curl_args[@]}" -d "{\"query\":${query},\"variables\":${variables_json}}" "$GRAPHQL_ENDPOINT"
}

get_project_id() {
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
    local resp=$(call_gql '"query { projectToken { projectId } }"')
    local id=$(echo "$resp" | $JQ -r '.data.projectToken.projectId // empty')
    if [[ -n "$id" ]]; then echo "$id"; return 0; fi
  fi
  if [[ -n "${RAILWAY_API_TOKEN:-}" ]]; then
    local q='"query { me { projects { edges { node { id name } } } } }"'
    local resp=$(call_gql "$q")
    echo "$resp" | $JQ -r --arg NAME "$PROJECT_NAME" '.data.me.projects.edges[] | select(.node.name==$NAME) | .node.id' | head -n1
    return 0
  fi
  echo ""
}

get_environment_id() {
  local project_id="$1"
  if [[ -n "${RAILWAY_TOKEN:-}" ]]; then
    local resp=$(call_gql '"query { projectToken { environmentId } }"')
    local id=$(echo "$resp" | $JQ -r '.data.projectToken.environmentId // empty')
    if [[ -n "$id" ]]; then echo "$id"; return 0; fi
  fi
  if [[ -n "${RAILWAY_API_TOKEN:-}" ]]; then
    local q=$(cat <<'EOF'
"query GetEnvs($projectId: String!) {\n  project(id: $projectId) {\n    environments { edges { node { id name } } }\n  }\n}"
EOF
)
    local vars=$(printf '{"projectId":"%s"}' "$project_id")
    local resp=$(call_gql "$q" "$vars")
    echo "$resp" | $JQ -r --arg NAME "$ENVIRONMENT_NAME" '.data.project.environments.edges[] | select(.node.name==$NAME) | .node.id' | head -n1
    return 0
  fi
  echo ""
}

get_service_id() {
  local project_id="$1"; local service_name="$2"
  # Allow env override
  if [[ "$service_name" == "Backend" && -n "${BACKEND_SERVICE_ID:-}" ]]; then echo "$BACKEND_SERVICE_ID"; return 0; fi
  if [[ "$service_name" == "Frontend" && -n "${FRONTEND_SERVICE_ID:-}" ]]; then echo "$FRONTEND_SERVICE_ID"; return 0; fi
  # edges style
  local q_edges=$(cat <<'EOF'
"query GetServices($projectId: String!) {\n  project(id: $projectId) {\n    services { edges { node { id name } } }\n  }\n}"
EOF
)
  local vars=$(printf '{"projectId":"%s"}' "$project_id")
  local resp=$(call_gql "$q_edges" "$vars")
  local id=$(echo "$resp" | $JQ -r --arg NAME "$service_name" '.data.project.services.edges[] | select(.node.name==$NAME) | .node.id' 2>/dev/null | head -n1 || true)
  if [[ -n "$id" ]]; then echo "$id"; return 0; fi
  # nodes style fallback
  local q_nodes=$(cat <<'EOF'
"query GetServicesNodes($projectId: String!) {\n  project(id: $projectId) {\n    services { nodes { id name } }\n  }\n}"
EOF
)
  resp=$(call_gql "$q_nodes" "$vars")
  id=$(echo "$resp" | $JQ -r --arg NAME "$service_name" '.data.project.services.nodes[] | select(.name==$NAME) | .id' 2>/dev/null | head -n1 || true)
  if [[ -n "$id" ]]; then echo "$id"; return 0; fi
  # environment scoped fallback
  if [[ -n "${ENV_ID:-}" ]]; then
    local q_env=$(cat <<'EOF'
"query GetEnvServices($projectId: String!, $environmentId: String!) {\n  project(id: $projectId) {\n    environment(id: $environmentId) {\n      services { nodes { id name } }\n    }\n  }\n}"
EOF
)
    local vars_env=$(printf '{"projectId":"%s","environmentId":"%s"}' "$project_id" "$ENV_ID")
    resp=$(call_gql "$q_env" "$vars_env")
    echo "$resp" | $JQ -r --arg NAME "$service_name" '.data.project.environment.services.nodes[] | select(.name==$NAME) | .id' | head -n1
    return 0
  fi
  echo ""
}

trigger_deploy_api() {
  local service_id="$1"; local environment_id="$2"
  local qA='"mutation Deploy($input: DeploymentCreateInput!) { deploymentCreate(input: $input) { id status } }"'
  local varsA
  if [[ -n "$environment_id" ]]; then varsA=$(printf '{"input": {"serviceId":"%s","environmentId":"%s"}}' "$service_id" "$environment_id"); else varsA=$(printf '{"input": {"serviceId":"%s"}}' "$service_id"); fi
  local resp=$(call_gql "$qA" "$varsA" || true)
  local id=$(echo "$resp" | $JQ -r '.data.deploymentCreate.id // empty' 2>/dev/null || true)
  if [[ -n "$id" && "$id" != "null" ]]; then echo "$id"; return 0; fi
  local qB='"mutation CreateDeployment($serviceId: String!, $environmentId: String) { createDeployment(serviceId: $serviceId, environmentId: $environmentId) { id status } }"'
  local varsB
  if [[ -n "$environment_id" ]]; then varsB=$(printf '{"serviceId":"%s","environmentId":"%s"}' "$service_id" "$environment_id"); else varsB=$(printf '{"serviceId":"%s"}' "$service_id"); fi
  resp=$(call_gql "$qB" "$varsB" || true)
  id=$(echo "$resp" | $JQ -r '.data.createDeployment.id // empty' 2>/dev/null || true)
  if [[ -n "$id" && "$id" != "null" ]]; then echo "$id"; return 0; fi
  echo ""
}

get_deploy_status() {
  local deployment_id="$1"
  local q='"query Deployment($id: String!) { deployment(id: $id) { id status } }"'
  local vars=$(printf '{"id":"%s"}' "$deployment_id")
  local resp=$(call_gql "$q" "$vars")
  echo "$resp" | $JQ -r '.data.deployment.status'
}

print_recent_logs() {
  local service_id="$1"; local limit="${2:-200}"
  local q='"query Logs($serviceId: String!, $limit: Int) { logs(serviceId: $serviceId, limit: $limit) { message timestamp } }"'
  local vars=$(printf '{"serviceId":"%s","limit":%d}' "$service_id" "$limit")
  local resp=$(call_gql "$q" "$vars")
  echo "$resp" | $JQ -r '.data.logs[] | "[" + .timestamp + "] " + .message'
}

main() {
  if [[ -z "${RAILWAY_TOKEN:-}" && -z "${RAILWAY_API_TOKEN:-}" ]]; then
    echo "❌ RAILWAY_TOKEN or RAILWAY_API_TOKEN is required in env" >&2; exit 1
  fi

  echo "🔎 Resolving project: $PROJECT_NAME"
  PROJECT_ID=$(get_project_id || true)
  if [[ -z "$PROJECT_ID" ]]; then
    echo "❌ Project not found or token lacks access" >&2; exit 1
  fi
  echo "✅ Project ID: $PROJECT_ID"

  echo "🔎 Resolving environment: $ENVIRONMENT_NAME"
  ENV_ID=$(get_environment_id "$PROJECT_ID" || true)
  if [[ -z "$ENV_ID" ]]; then
    echo "⚠️ Could not resolve environment '$ENVIRONMENT_NAME'." >&2
  else
    echo "✅ Environment ID: $ENV_ID"
  fi

  for SVC in $SERVICES_TO_DEPLOY; do
    echo "\n=== 🚀 Deploying service: $SVC ==="
    SID=$(get_service_id "$PROJECT_ID" "$SVC" || true)
    if [[ -z "$SID" ]]; then
      echo "❌ Service '$SVC' not found in project" >&2; exit 1
    fi
    echo "✅ $SVC service ID: $SID"

    DPL=$(trigger_deploy_api "$SID" "${ENV_ID:-}" || true)
    if [[ -z "$DPL" ]]; then
      echo "❌ Failed to trigger deployment via Public API mutation for '$SVC'." >&2
      exit 1
    fi

    echo "🎉 Deployment created: $DPL"
    echo "⏳ Waiting for deployment to finish… (poll every 10s)"
    while true; do
      STATUS=$(get_deploy_status "$DPL" || true)
      echo "Status: ${STATUS:-unknown}"
      case "$STATUS" in
        SUCCESS|FAILED) break;;
      esac
      sleep 10
    done

    echo "\n📜 Last 200 log lines for $SVC:"
    print_recent_logs "$SID" 200 || true

    if [[ "$STATUS" == "SUCCESS" ]]; then
      echo "✅ $SVC: Deploy finished successfully"
    else
      echo "❌ $SVC: Deploy failed"
      exit 1
    fi
  done
}

main "$@" 