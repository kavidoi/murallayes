#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

# Avoid duplicate backend servers on port 4000
bash scripts/server-lock.sh start backend 4000 -- pnpm -C muralla-backend start:dev
