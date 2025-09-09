#!/usr/bin/env bash
set -euo pipefail

# Simple server lock/registry using .shared-state to avoid duplicate servers

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SS_DIR="$ROOT_DIR/.shared-state"
SERVERS_DIR="$SS_DIR/servers"
HOST="$(hostname 2>/dev/null || uname -n)"
# Allow override of displayed user in lock files via SERVER_LOCK_USER
USER_NAME="${SERVER_LOCK_USER:-$(whoami 2>/dev/null || echo unknown)}"
# Track child PID globally for trap safety with set -u
CHILD_PID=""

mkdir -p "$SERVERS_DIR"

usage() {
  cat <<EOF
Usage: $(basename "$0") <command> [args]
Commands
  status [name]             Show lock status for all or a specific server
  cleanup                   Remove stale locks (dead PID and port free)
  claim <name> <port>       Exit 0 if available (prints FREE), 1 if taken
  release <name>            Release lock if owned by this host/user or stale
  start <name> <port> -- <command...>
                            Acquire lock and run command; releases on exit
EOF
}

json_val() { # json_val <key> <file>
  awk -v k="\"$1\"" -F: 'BEGIN{IGNORECASE=0} $1~k {print $2}' "$2" \
    | sed 's/[",]//g' | awk '{print $1}' | head -n1
}

is_alive() { # is_alive <pid>
  kill -0 "$1" >/dev/null 2>&1
}

port_in_use() { # port_in_use <port>
  if command -v lsof >/dev/null 2>&1; then
    lsof -i :"$1" -sTCP:LISTEN -n -P >/dev/null 2>&1
  else
    return 1
  fi
}

lock_file() { echo "$SERVERS_DIR/$1.json"; }

write_lock() { # write_lock <name> <port> <pid>
  local name="$1" port="$2" pid="$3" now
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  cat > "$(lock_file "$name")" <<EOF
{
  "name": "${name}",
  "host": "${HOST}",
  "user": "${USER_NAME}",
  "port": ${port},
  "pid": ${pid},
  "started_at": "${now}",
  "last_seen": "${now}",
  "status": "running"
}
EOF
}

touch_lock() { # touch_lock <name>
  local f="$(lock_file "$1")" now
  [[ -f "$f" ]] || return 0
  now="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  # naive touch: replace last_seen
  tmp="$f.tmp" && sed "s/\(\"last_seen\"\): \".*\"/\1: \"$now\"/" "$f" > "$tmp" && mv "$tmp" "$f"
}

cleanup_stale_one() { # cleanup_stale_one <name>
  local name="$1" f pid port
  f="$(lock_file "$name")"
  [[ -f "$f" ]] || return 0
  pid=$(json_val pid "$f" || true)
  port=$(json_val port "$f" || true)
  if [[ -n "$pid" ]] && is_alive "$pid"; then
    return 0
  fi
  if [[ -n "$port" ]] && port_in_use "$port"; then
    return 0
  fi
  rm -f "$f"
}

cmd_status() {
  if [[ $# -eq 0 ]]; then
    ls -1 "$SERVERS_DIR" 2>/dev/null | sed 's/\.json$//' || true
    return 0
  fi
  local f="$(lock_file "$1")"
  if [[ -f "$f" ]]; then
    cat "$f"
  else
    echo "FREE"
  fi
}

cmd_cleanup() {
  for f in "$SERVERS_DIR"/*.json; do
    [[ -e "$f" ]] || continue
    cleanup_stale_one "$(basename "$f" .json)"
  done
}

cmd_claim() { # claim <name> <port>
  local name="$1" port="$2" f pid
  f="$(lock_file "$name")"
  if [[ -f "$f" ]]; then
    pid=$(json_val pid "$f" || true)
    if [[ -n "$pid" ]] && is_alive "$pid"; then
      echo "TAKEN: $(cat "$f")"
      return 1
    fi
    if port_in_use "$port"; then
      echo "TAKEN (port in use): $port"
      return 1
    fi
    # stale
    rm -f "$f"
  fi
  if port_in_use "$port"; then
    echo "TAKEN (port in use): $port"
    return 1
  fi
  echo "FREE"
  return 0
}

cmd_release() { # release <name>
  local name="$1" f
  f="$(lock_file "$name")"
  [[ -f "$f" ]] || { echo "No lock for $name"; return 0; }
  rm -f "$f"
  echo "Released $name"
}

cmd_start() { # start <name> <port> -- <command...>
  local name="$1" port="$2"
  shift 2
  [[ "${1:-}" == "--" ]] || { echo "Missing -- before command"; exit 2; }
  shift
  cmd_claim "$name" "$port" || exit 1
  # start command
  "$@" &
  CHILD_PID=$!
  # Precompute lock path to avoid referencing $name inside trap under set -u
  local LOCK_PATH
  LOCK_PATH="$(lock_file "$name")"
  write_lock "$name" "$port" "$CHILD_PID"
  echo "Started $name (pid=$CHILD_PID, port=$port)"
  # Wait and update last_seen periodically
  trap 'if [[ -n "${CHILD_PID:-}" ]]; then kill "${CHILD_PID}" 2>/dev/null || true; fi; [[ -n "${LOCK_PATH:-}" ]] && rm -f "$LOCK_PATH"; exit 0' INT TERM EXIT
  while kill -0 "$CHILD_PID" >/dev/null 2>&1; do
    sleep 10
    touch_lock "$name"
  done
  rm -f "$LOCK_PATH"
}

case "${1:-}" in
  status) shift; cmd_status "$@" ;;
  cleanup) shift; cmd_cleanup ;;
  claim) shift; cmd_claim "$@" ;;
  release) shift; cmd_release "$@" ;;
  start) shift; cmd_start "$@" ;;
  -h|--help|"") usage ;;
  *) echo "Unknown command: $1"; usage; exit 1 ;;
esac
