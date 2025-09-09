#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

# Avoid duplicate frontend servers on Vite default port 5173
bash scripts/server-lock.sh start frontend 5173 -- pnpm -C muralla-frontend dev
