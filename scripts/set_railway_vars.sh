#!/usr/bin/env bash
# Set Backend and Frontend variables on Railway using CLI (non-interactive)
# Requires Railway CLI installed and login completed (railway login)
#
# Required env vars:
#   RAILWAY_PROJECT_NAME   – e.g. murallayes
#   RAILWAY_ENVIRONMENT    – e.g. production
#   JWT_SECRET             – strong random string
#
# Optional env vars:
#   JWT_EXPIRES_IN         – default 60m
#   DB_SERVICE_NAME        – if set, backend DATABASE_URL will reference ${{ <DB_SERVICE_NAME>.DATABASE_URL }}
#   REDIS_SERVICE_NAME     – if set, backend REDIS_URL will reference ${{ <REDIS_SERVICE_NAME>.REDIS_URL }}
#   DATABASE_URL           – if you prefer passing a concrete URL instead of a reference
#   REDIS_URL              – concrete URL instead of a reference
#   VITE_ENABLE_DEMO       – default false for Frontend
#   MP_ACCESS_TOKEN        – MercadoPago access token
#   MP_PUBLIC_KEY          – MercadoPago public key
#   MP_CLIENT_ID           – MercadoPago client ID
#   MP_CLIENT_SECRET       – MercadoPago client secret
#   VITE_MP_PUBLIC_KEY     – Frontend-only MercadoPago public key (for JS SDK)
#   NIXPACKS_NODE_VERSION  – Node version pin for Nixpacks (default 20.19.0)
#   NODE_VERSION           – Node version pin for build env (default 20.19.0)
#
# Notes:
# - FRONTEND_URL and BACKEND_URL are set using Railway-provided domains via reference variables.
# - Frontend VITE_API_BASE_URL is set to Backend public domain.
#
set -euo pipefail

: "${RAILWAY_PROJECT_NAME:?RAILWAY_PROJECT_NAME is required}"
: "${RAILWAY_ENVIRONMENT:?RAILWAY_ENVIRONMENT is required}"
: "${JWT_SECRET:?JWT_SECRET is required}"

JWT_EXPIRES_IN=${JWT_EXPIRES_IN:-60m}
VITE_ENABLE_DEMO=${VITE_ENABLE_DEMO:-false}
NIXPACKS_NODE_VERSION=${NIXPACKS_NODE_VERSION:-20.19.0}
NODE_VERSION=${NODE_VERSION:-20.19.0}

# Helper to run railway with project/env/service context
rw() {
  railway "$@"
}

link_backend() {
  rw link -p "$RAILWAY_PROJECT_NAME" -e "$RAILWAY_ENVIRONMENT" -s Backend >/dev/null
}

link_frontend() {
  rw link -p "$RAILWAY_PROJECT_NAME" -e "$RAILWAY_ENVIRONMENT" -s Frontend >/dev/null
}

set_backend_vars() {
  echo "Setting Backend variables…"
  link_backend

  # JWT
  rw variables --set "JWT_SECRET=$JWT_SECRET"
  rw variables --set "JWT_EXPIRES_IN=$JWT_EXPIRES_IN"

  # FRONTEND/BACKEND URLs via reference to Railway-provided domains
  rw variables --set "FRONTEND_URL=https://\$\{\{ Frontend.RAILWAY_PUBLIC_DOMAIN \}\}"
  rw variables --set "BACKEND_URL=https://\$\{\{ Backend.RAILWAY_PUBLIC_DOMAIN \}\}"

  # Node version pins for Nixpacks/build
  rw variables --set "NIXPACKS_NODE_VERSION=$NIXPACKS_NODE_VERSION"
  rw variables --set "NODE_VERSION=$NODE_VERSION"

  # Database
  if [[ -n "${DATABASE_URL:-}" ]]; then
    rw variables --set "DATABASE_URL=$DATABASE_URL"
  elif [[ -n "${DB_SERVICE_NAME:-}" ]]; then
    rw variables --set "DATABASE_URL=\$\{\{ ${DB_SERVICE_NAME}.DATABASE_URL \}\}"
  else
    echo "⚠️ DATABASE_URL not set (set DATABASE_URL or DB_SERVICE_NAME to reference a DB service)."
  fi

  # Redis
  if [[ -n "${REDIS_URL:-}" ]]; then
    rw variables --set "REDIS_URL=$REDIS_URL"
  elif [[ -n "${REDIS_SERVICE_NAME:-}" ]]; then
    rw variables --set "REDIS_URL=\$\{\{ ${REDIS_SERVICE_NAME}.REDIS_URL \}\}"
  else
    echo "ℹ️ Skipping REDIS_URL (set REDIS_URL or REDIS_SERVICE_NAME if using queues)."
  fi

  # MercadoPago (optional)
  if [[ -n "${MP_ACCESS_TOKEN:-}" ]]; then
    rw variables --set "MP_ACCESS_TOKEN=$MP_ACCESS_TOKEN"
    echo "✓ MP_ACCESS_TOKEN set"
  fi
  if [[ -n "${MP_CLIENT_ID:-}" ]]; then
    rw variables --set "MP_CLIENT_ID=$MP_CLIENT_ID"
    echo "✓ MP_CLIENT_ID set"
  fi
  if [[ -n "${MP_CLIENT_SECRET:-}" ]]; then
    rw variables --set "MP_CLIENT_SECRET=$MP_CLIENT_SECRET"
    echo "✓ MP_CLIENT_SECRET set"
  fi
}

set_frontend_vars() {
  echo "Setting Frontend variables…"
  link_frontend

  # Point frontend to backend public domain
  rw variables --set "VITE_API_BASE_URL=https://\$\{\{ Backend.RAILWAY_PUBLIC_DOMAIN \}\}"
  rw variables --set "VITE_ENABLE_DEMO=$VITE_ENABLE_DEMO"

  # MercadoPago public key for browser SDK (optional)
  if [[ -n "${VITE_MP_PUBLIC_KEY:-}" ]]; then
    rw variables --set "VITE_MP_PUBLIC_KEY=$VITE_MP_PUBLIC_KEY"
    echo "✓ VITE_MP_PUBLIC_KEY set"
  elif [[ -n "${MP_PUBLIC_KEY:-}" ]]; then
    # Backward-compat: allow MP_PUBLIC_KEY to feed VITE_MP_PUBLIC_KEY
    rw variables --set "VITE_MP_PUBLIC_KEY=$MP_PUBLIC_KEY"
    echo "✓ VITE_MP_PUBLIC_KEY set from MP_PUBLIC_KEY"
  fi

  # Node version pins for Nixpacks/build
  rw variables --set "NIXPACKS_NODE_VERSION=$NIXPACKS_NODE_VERSION"
  rw variables --set "NODE_VERSION=$NODE_VERSION"
}

main() {
  # Verify CLI present
  if ! command -v railway >/dev/null 2>&1; then
    echo "❌ Railway CLI not found. Install: npm i -g @railway/cli" >&2
    exit 1
  fi

  # Ensure logged in
  if ! rw whoami >/dev/null 2>&1; then
    echo "❌ Not logged in. Run: railway login --browserless" >&2
    exit 1
  fi

  set_backend_vars
  set_frontend_vars

  echo "✅ Variables configured for Backend and Frontend in $RAILWAY_PROJECT_NAME / $RAILWAY_ENVIRONMENT"
}

main "$@" 