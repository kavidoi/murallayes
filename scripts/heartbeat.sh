#!/usr/bin/env bash
set -euo pipefail

# Simple per-agent heartbeat writer for .shared-state/sessions
# Writes/updates a JSON file with last_seen, pid, user, and cwd.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SS_DIR="$ROOT_DIR/.shared-state"
SESSIONS_DIR="$SS_DIR/sessions"

AGENT_NAME="${AGENT_NAME:-}"
INTERVAL="20"
ONE_SHOT=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [--agent NAME] [--interval SECONDS] [--one-shot]
  --agent NAME        Agent name to record (default: $AGENT_NAME or whoami)
  --interval SECONDS  Update interval (default: 20)
  --one-shot          Write once and exit
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --agent) AGENT_NAME="$2"; shift 2;;
    --interval) INTERVAL="$2"; shift 2;;
    --one-shot) ONE_SHOT=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown option: $1"; usage; exit 1;;
  esac
done

AGENT_NAME=${AGENT_NAME:-$(whoami)}
mkdir -p "$SESSIONS_DIR"

HOST="$(hostname 2>/dev/null || uname -n)"
TTY_BASENAME="$(basename "${TTY:-$(tty 2>/dev/null || echo unknown)}" 2>/dev/null || echo unknown)"
PID="$$"
SESSION_ID="${AGENT_NAME}-${HOST}-tty${TTY_BASENAME}-pid${PID}"
SESSION_FILE="$SESSIONS_DIR/${SESSION_ID}.json"

write_heartbeat() {
  NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat > "$SESSION_FILE" <<EOF
{
  "agent": "${AGENT_NAME}",
  "session_id": "${SESSION_ID}",
  "host": "${HOST}",
  "pid": ${PID},
  "tty": "${TTY_BASENAME}",
  "cwd": "$(pwd)",
  "project_root": "${ROOT_DIR}",
  "last_seen": "${NOW}",
  "status": "active"
}
EOF
}

cleanup() {
  NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  if [[ -f "$SESSION_FILE" ]]; then
    # mark stopped but keep file briefly so others see the stop
    cat > "$SESSION_FILE" <<EOF
{
  "agent": "${AGENT_NAME}",
  "session_id": "${SESSION_ID}",
  "host": "${HOST}",
  "pid": ${PID},
  "tty": "${TTY_BASENAME}",
  "cwd": "$(pwd)",
  "project_root": "${ROOT_DIR}",
  "last_seen": "${NOW}",
  "status": "stopped",
  "ended_at": "${NOW}"
}
EOF
  fi
}

trap cleanup EXIT INT TERM

write_heartbeat
if [[ "$ONE_SHOT" -eq 1 ]]; then
  exit 0
fi

while true; do
  sleep "$INTERVAL"
  write_heartbeat
done

