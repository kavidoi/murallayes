#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SS_DIR="$ROOT_DIR/.shared-state"
SERVERS_DIR="$SS_DIR/servers"
cd "$ROOT_DIR"

kill_if_running() {
  local pid="$1" name="$2" port="$3"
  if [[ -n "$pid" ]] && kill -0 "$pid" >/dev/null 2>&1; then
    echo "[restart] Stopping $name (pid=$pid, port=$port)"
    kill "$pid" 2>/dev/null || true
    for i in {1..20}; do
      sleep 0.25
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi
    done
    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "[restart] Force killing $name (pid=$pid)"
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
}

json_val() { # json_val <key> <file>
  awk -v k="\"$1\"" -F: '$1~k {print $2}' "$2" | sed 's/[",]//g' | awk '{print $1}' | head -n1
}

restart_one() { # restart_one <name> <port>
  local name="$1" port="$2" lock="$SERVERS_DIR/$1.json" pid=""
  mkdir -p "$SERVERS_DIR"
  if [[ -f "$lock" ]]; then
    pid=$(json_val pid "$lock" || true)
    kill_if_running "$pid" "$name" "$port"
    rm -f "$lock" || true
  fi
  # Also ensure port is free (if lsof available)
  if command -v lsof >/dev/null 2>&1; then
    for p in $(lsof -ti :"$port" -sTCP:LISTEN 2>/dev/null || true); do
      echo "[restart] Freeing port $port (killing pid=$p)"
      kill "$p" 2>/dev/null || true
    done
  fi
}

# Restart backend and frontend
restart_one backend 4000
restart_one frontend 5173

echo "[restart] Starting backend and frontend with locks"
set +e
bash "$SCRIPT_DIR/dev-backend.sh" &
PID_BACK=$!
bash "$SCRIPT_DIR/dev-frontend.sh" &
PID_FRONT=$!
set -e
echo "[restart] Launched backend (pid=$PID_BACK) and frontend (pid=$PID_FRONT) wrappers"

