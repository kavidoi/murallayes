#!/usr/bin/env bash
set -euo pipefail

# Cleanup and retention for .shared-state
# - Prunes old logs/events
# - Enforces a soft size cap by deleting oldest files

# Resolve repo root from this script's location; allow override via env/flag
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT_DIR_DEFAULT="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="${PROJECT_ROOT:-$ROOT_DIR_DEFAULT}"
SS_DIR="$ROOT_DIR/.shared-state"
LOGS_DIR="$SS_DIR/logs"
EVENTS_DIR="$SS_DIR/events"
ARCHIVE_DIR="$SS_DIR/archives"

# Defaults
RETENTION_DAYS_LOGS="14"
RETENTION_DAYS_EVENTS="7"
SIZE_CAP="500M"   # overall .shared-state soft cap
DRY_RUN=0

usage() {
  cat <<EOF
Usage: $(basename "$0") [options]
  --days-logs N         Retain logs for N days (default: $RETENTION_DAYS_LOGS)
  --days-events N       Retain events for N days (default: $RETENTION_DAYS_EVENTS)
  --cap SIZE            Soft size cap (e.g., 500M, 1G)
  --root PATH           Override repo root (default: script/..)
  --dry-run             Show actions without deleting
  -h, --help            Show this help
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --days-logs) RETENTION_DAYS_LOGS="$2"; shift 2;;
    --days-events) RETENTION_DAYS_EVENTS="$2"; shift 2;;
    --cap) SIZE_CAP="$2"; shift 2;;
    --root) ROOT_DIR="$2"; shift 2;;
    --dry-run) DRY_RUN=1; shift;;
    -h|--help) usage; exit 0;;
    *) echo "Unknown option: $1"; usage; exit 1;;
  esac
done

SS_DIR="$ROOT_DIR/.shared-state"
LOGS_DIR="$SS_DIR/logs"
EVENTS_DIR="$SS_DIR/events"
ARCHIVE_DIR="$SS_DIR/archives"

if [[ ! -d "$SS_DIR" ]]; then
  echo ".shared-state directory not found at $SS_DIR"
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

echo "[cleanup] Target: $SS_DIR"
echo "[cleanup] Retain logs: ${RETENTION_DAYS_LOGS}d, events: ${RETENTION_DAYS_EVENTS}d, cap: $SIZE_CAP, dry-run: $DRY_RUN"

run_or_echo() {
  if [[ "$DRY_RUN" -eq 1 ]]; then
    echo "DRY-RUN: $*"
  else
    eval "$@"
  fi
}

# 1) Prune old logs
if [[ -d "$LOGS_DIR" ]]; then
  echo "[cleanup] Pruning logs older than ${RETENTION_DAYS_LOGS} days..."
  if [[ "$DRY_RUN" -eq 1 ]]; then
    find "$LOGS_DIR" -type f -mtime +"$RETENTION_DAYS_LOGS" -print | sed 's/^/DRY-RUN: rm -f /'
  else
    find "$LOGS_DIR" -type f -mtime +"$RETENTION_DAYS_LOGS" -delete || true
  fi
fi

# 2) Prune old events
if [[ -d "$EVENTS_DIR" ]]; then
  echo "[cleanup] Deleting events older than ${RETENTION_DAYS_EVENTS} days..."
  if [[ "$DRY_RUN" -eq 1 ]]; then
    find "$EVENTS_DIR" -type f -mtime +"$RETENTION_DAYS_EVENTS" -print | sed 's/^/DRY-RUN: rm -f /'
  else
    find "$EVENTS_DIR" -type f -mtime +"$RETENTION_DAYS_EVENTS" -delete || true
  fi
fi

# 3) Enforce soft size cap by deleting oldest files in batches, skipping today's files
human_size() { du -sh "$1" 2>/dev/null | awk '{print $1}'; }
current_size_kb() { du -sk "$SS_DIR" 2>/dev/null | awk '{print $1}'; }
target_kb() {
  local s="$1"
  case "$s" in
    *[Gg]) echo $(( ${s%[Gg]} * 1024 * 1024 ));;
    *[Mm]) echo $(( ${s%[Mm]} * 1024 ));;
    *[Kk]) echo $(( ${s%[Kk]} ));;
    *) echo "$s";;
  esac
}

CAP_KB=$(target_kb "$SIZE_CAP")
CUR_KB=$(current_size_kb)
echo "[cleanup] Current size: $(human_size "$SS_DIR") (KB=$CUR_KB), cap: $SIZE_CAP (KB=$CAP_KB)"

if [[ "$CUR_KB" -gt "$CAP_KB" ]]; then
  echo "[cleanup] Over cap; pruning oldest files in batches..."
  today="$(date +%Y-%m-%d)"
  while [[ "$CUR_KB" -gt "$CAP_KB" ]]; do
    # Build oldest 200 candidates across archives/logs/events using stat per-file to avoid arg limits
    candidates=$( { find "$ARCHIVE_DIR" -type f 2>/dev/null; find "$LOGS_DIR" -type f 2>/dev/null; find "$EVENTS_DIR" -type f 2>/dev/null; } \
      | while read -r f; do
          if stat -f "%m %N" "$f" >/dev/null 2>&1; then
            stat -f "%m %N" "$f"
          else
            stat -c "%Y %n" "$f" 2>/dev/null || true
          fi
        done \
      | sort -n | awk 'NR<=200 { $1=""; sub(/^ /,"",$0); print }')

    if [[ -z "$candidates" ]]; then
      echo "[cleanup] No more candidates to prune."
      break
    fi

    echo "$candidates" | while read -r f; do
      [[ -f "$f" ]] || continue
      fday=$(date -r "$f" +%Y-%m-%d 2>/dev/null || date -d @$(stat -f %m "$f" 2>/dev/null || stat -c %Y "$f" 2>/dev/null) +%Y-%m-%d)
      [[ "$fday" == "$today" ]] && return 0
      if [[ "$DRY_RUN" -eq 1 ]]; then
        echo "DRY-RUN: rm -f $(printf %q "$f")"
      else
        rm -f "$f"
      fi
    done

    CUR_KB=$(current_size_kb)
    echo "[cleanup] Size after batch: $(human_size "$SS_DIR") (KB=$CUR_KB)"
  done
fi

echo "[cleanup] Done. Final size: $(human_size "$SS_DIR")"

