#!/usr/bin/env bash
# Rapid automated audit script for Muralla repository
# Generated on 2025-08-27
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
AUDIT_DIR="$ROOT_DIR/audit/rapid-20250827"
LOG_DIR="$AUDIT_DIR/logs"
REPORT_DIR="$AUDIT_DIR/reports"

mkdir -p "$LOG_DIR" "$REPORT_DIR"

echo "[1/6] Generating dependency inventory …"
pnpm -r exec -- pnpm ls --depth 0 --json > "$LOG_DIR/deps.json"

echo "[2/6] Listing tracked files …"
git ls-files > "$LOG_DIR/files.txt"

echo "[3/6] Running ESLint checks across all packages …"
pnpm -r run lint > "$LOG_DIR/eslint.log" || true

echo "[3b] Running TypeScript type-check across all packages …"
pnpm -r exec tsc --noEmit > "$LOG_DIR/tsc.log" || true

echo "[4/6] Running pnpm audit …"
pnpm audit --json > "$LOG_DIR/pnpm_audit.json" || true

echo "[5/6] Prisma validation & schema diff …"
SCHEMA_DIR="$ROOT_DIR/muralla-backend/prisma"
if [ -f "$SCHEMA_DIR/schema.prisma" ]; then
  cd "$ROOT_DIR/muralla-backend"
  pnpm prisma validate > "$LOG_DIR/prisma_validate.log" || true
  if [ -n "${DATABASE_URL:-}" ]; then
    pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --script > "$LOG_DIR/drift.sql" || true
  else
    echo "DATABASE_URL not set, skipping migrate diff" > "$LOG_DIR/drift.sql"
  fi
  cd "$ROOT_DIR"
fi

echo "[6/6] Trivy filesystem scan (if available) …"
if command -v trivy >/dev/null; then
  trivy fs "$ROOT_DIR" --skip-dirs .git --format json -o "$LOG_DIR/trivy.json" || true
else
  echo "Trivy not installed; skipping scan" > "$LOG_DIR/trivy.json"
fi

echo "Rapid audit logs are available in $LOG_DIR"
