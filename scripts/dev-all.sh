#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$ROOT_DIR"

# Start a background heartbeat for this terminal
AGENT_NAME="${AGENT_NAME:-$(whoami 2>/dev/null || echo agent)}"
nohup bash scripts/heartbeat.sh --agent "$AGENT_NAME" --interval 20 >/dev/null 2>&1 &
echo "[dev:all] Heartbeat started for agent=$AGENT_NAME"

# Start backend and frontend with server locks
set +e
bash scripts/dev-backend.sh &
PID_BACK=$!
bash scripts/dev-frontend.sh &
PID_FRONT=$!
set -e

echo "[dev:all] Launched backend (pid=$PID_BACK) and frontend (pid=$PID_FRONT) wrappers"
echo "[dev:all] Use 'bash scripts/server-lock.sh status' to see lock owners"

# Wait on either to exit, then exit (leave the other running)
wait -n "$PID_BACK" "$PID_FRONT" || true
echo "[dev:all] One of the dev servers exited. Check logs above."

