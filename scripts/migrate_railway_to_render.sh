#!/usr/bin/env bash
set -euo pipefail

# Migrate env vars from Railway services to Render services
# - Pulls vars from Railway (Backend, Frontend)
# - Pushes to Render via REST API for corresponding services
# - Does not print secret values

# Requirements: railway CLI, curl, jq

RENDER_API_URL="https://api.render.com/v1"

require() {
	local var_name="$1"
	if [[ -z "${!var_name:-}" ]]; then
		echo "❌ Missing required env: $var_name" >&2
		exit 1
	fi
}

auth_header() {
	echo "Authorization: Bearer ${RENDER_API_KEY}"
}

api_get() {
	curl -sS -H "$(auth_header)" -H 'Accept: application/json' "$RENDER_API_URL$1"
}

api_patch() {
	local path="$1"; shift
	local body="$1"
	curl -sS -H "$(auth_header)" -H 'Content-Type: application/json' -X PATCH "$RENDER_API_URL$path" -d "$body"
}

ensure_cli() {
	if ! command -v railway >/dev/null 2>&1; then
		echo "❌ Railway CLI not found. Install: npm i -g @railway/cli" >&2
		exit 1
	fi
	# If tokens are provided, allow non-interactive auth without whoami check
	if [[ -n "${RAILWAY_API_TOKEN:-}" || -n "${RAILWAY_TOKEN:-}" ]]; then
		return 0
	fi
	if ! railway whoami >/dev/null 2>&1; then
		echo "❌ Not logged in to Railway. Run: railway login --browserless" >&2
		exit 1
	fi
}

rw_link() {
	local svc="$1"
	railway link -p "$RAILWAY_PROJECT_NAME" -e "$RAILWAY_ENVIRONMENT" -s "$svc" >/dev/null
}

# Convert Railway key=value stream to JSON array for Render API
kvs_to_json_array() {
	local allow_overwrite_db="${ALLOW_DB_FROM_RAILWAY:-false}"
	awk -F'=' 'NR>0 {print}' | \
		sed '/^#/d;/^\s*$/d' | \
		awk -F'=' '{key=$1; $1=""; sub(/^=/,""); val=$0; gsub(/^\s+|\s+$/,"",key); print key "\t" val}' | \
		while IFS=$'\t' read -r k v; do
			# Skip Railway-injected or empty keys
			if [[ -z "$k" || "$k" == RAILWAY_* ]]; then continue; fi
			# Prefer new DB on Render; skip old Railway DATABASE_URL unless override
			if [[ "$k" == "DATABASE_URL" && "$allow_overwrite_db" != "true" ]]; then continue; fi
			jq -cn --arg k "$k" --arg v "$v" '{key:$k,value:$v}'
		done | jq -s '.'
}

find_render_service_id() {
	local name="$1"
	# Fetch services and handle both array and error/object shapes
	local raw
	raw=$(api_get "/services?limit=200")
	if ! echo "$raw" | jq -e . >/dev/null 2>&1; then
		printf ""
		return 0
	fi
	echo "$raw" | jq -r --arg NAME "$name" '
	  if type=="array" then
	    ( .[] | select(.service.name==$NAME) | .service.id )
	  elif type=="object" then
	    if has("service") then .service.id else empty end
	  else empty end
	' | head -n1
}

push_env_vars() {
	local service_id="$1"; shift
	local json_array="$1"
	local body
	body=$(jq -cn --argjson envs "$json_array" '{envVars: $envs}')
	api_patch "/services/${service_id}" "$body" >/dev/null
}

migrate_service() {
	local railway_svc="$1"; local render_name="$2"; local render_id_env="$3"
	echo "\n=== ${railway_svc} → ${render_name} ==="
	rw_link "$railway_svc"
	# Stream variables from Railway, convert to JSON array
	local envs_json
	envs_json=$(railway variables -k | kvs_to_json_array)
	local count
	count=$(echo "$envs_json" | jq 'length')
	echo "Found $count variables in Railway ($railway_svc) after filtering"
	local sid
	if [[ -n "${render_id_env}" && -n "${!render_id_env:-}" ]]; then
		sid="${!render_id_env}"
	else
		sid=$(find_render_service_id "$render_name")
	fi
	if [[ -z "$sid" ]]; then
		echo "❌ Render service not found by name: $render_name" >&2; exit 1
	fi
	echo "Render service id: $sid"
	push_env_vars "$sid" "$envs_json"
	echo "✅ Applied $count environment variables to Render: $render_name"
}

# Inputs
RENDER_API_KEY=${RENDER_API_KEY:-}
RAILWAY_PROJECT_NAME=${RAILWAY_PROJECT_NAME:-}
RAILWAY_ENVIRONMENT=${RAILWAY_ENVIRONMENT:-}

# Mapping
RAILWAY_BACKEND_NAME=${RAILWAY_BACKEND_NAME:-"Backend"}
RAILWAY_FRONTEND_NAME=${RAILWAY_FRONTEND_NAME:-"Frontend"}
RENDER_BACKEND_NAME=${RENDER_BACKEND_NAME:-"muralla-backend"}
RENDER_FRONTEND_NAME=${RENDER_FRONTEND_NAME:-"muralla-frontend"}
# Optional direct service IDs (skip name lookups if set)
RENDER_BACKEND_ID=${RENDER_BACKEND_ID:-}
RENDER_FRONTEND_ID=${RENDER_FRONTEND_ID:-}

require RENDER_API_KEY
require RAILWAY_PROJECT_NAME
require RAILWAY_ENVIRONMENT

ensure_cli

migrate_service "$RAILWAY_BACKEND_NAME" "$RENDER_BACKEND_NAME" RENDER_BACKEND_ID
migrate_service "$RAILWAY_FRONTEND_NAME" "$RENDER_FRONTEND_NAME" RENDER_FRONTEND_ID

echo "\n🎉 Migration complete. Review secrets and update domains as needed."



