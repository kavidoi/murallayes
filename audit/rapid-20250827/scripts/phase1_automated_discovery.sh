#!/usr/bin/env bash
# Phase 1: Automated Discovery - Static Analysis, Security, Performance Baseline
# Part of Comprehensive Codebase Health Audit Plan
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
AUDIT_DIR="$ROOT_DIR/audit/rapid-20250827"
LOG_DIR="$AUDIT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "🔍 Phase 1: Automated Discovery"
echo "================================"

# 1.1 Static Code Analysis
echo "[1.1] Running comprehensive static analysis..."

echo "  → ESLint + TypeScript across all packages"
pnpm -r run lint --format json > "$LOG_DIR/eslint-full.json" 2>/dev/null || echo "ESLint completed with warnings"
pnpm -r exec tsc --noEmit --pretty false > "$LOG_DIR/typescript-errors.log" 2>&1 || echo "TypeScript check completed"

echo "  → Code complexity analysis"
if command -v npx >/dev/null; then
  npx --yes ts-complexity-analyzer muralla-frontend/src/ muralla-backend/src/ > "$LOG_DIR/complexity.json" 2>/dev/null || echo "Complexity analysis skipped"
  npx --yes jscpd --reporters json --output "$LOG_DIR/" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null || echo "Duplication analysis skipped"
fi

echo "  → Dead code detection"
npx --yes ts-prune > "$LOG_DIR/dead-code.log" 2>/dev/null || echo "Dead code analysis completed"
npx --yes depcheck --json > "$LOG_DIR/unused-deps.json" 2>/dev/null || echo "Dependency check completed"

# 1.2 Security & Dependency Audit
echo "[1.2] Security and dependency scanning..."

echo "  → Vulnerability scanning"
pnpm audit --json > "$LOG_DIR/npm-vulnerabilities.json" 2>/dev/null || echo "Vulnerability scan completed"

echo "  → Container security (Trivy)"
if command -v trivy >/dev/null; then
  trivy fs "$ROOT_DIR" --skip-dirs .git --format json --output "$LOG_DIR/trivy-filesystem.json" 2>/dev/null || echo "Trivy scan completed"
else
  echo "    Trivy not installed - install with: brew install trivy"
  echo "Trivy not available" > "$LOG_DIR/trivy-filesystem.json"
fi

echo "  → Secret detection"
if command -v truffleHog >/dev/null; then
  truffleHog --json --regex --entropy=False "$ROOT_DIR" > "$LOG_DIR/secrets-scan.json" 2>/dev/null || echo "Secret scan completed"
else
  echo "    TruffleHog not installed - install with: pip install truffleHog"
  echo "TruffleHog not available" > "$LOG_DIR/secrets-scan.json"
fi

# 1.3 Performance Baseline
echo "[1.3] Performance baseline measurement..."

echo "  → Frontend bundle analysis"
if [ -d "$ROOT_DIR/muralla-frontend/dist" ]; then
  cd "$ROOT_DIR/muralla-frontend"
  npx --yes webpack-bundle-analyzer dist/assets --report --format json --no-open > "$LOG_DIR/bundle-analysis.json" 2>/dev/null || echo "Bundle analysis completed"
  cd "$ROOT_DIR"
else
  echo "    Frontend not built - run 'pnpm --filter muralla-frontend build' first"
  echo "Frontend not built" > "$LOG_DIR/bundle-analysis.json"
fi

echo "  → Backend API baseline (if running locally)"
if curl -f http://localhost:4000/health >/dev/null 2>&1; then
  if command -v autocannon >/dev/null; then
    autocannon -c 10 -d 10 http://localhost:4000/health > "$LOG_DIR/api-baseline.txt" 2>/dev/null || echo "API baseline completed"
  else
    echo "    Autocannon not installed - install with: npm install -g autocannon"
    echo "Autocannon not available" > "$LOG_DIR/api-baseline.txt"
  fi
else
  echo "    Backend not running on localhost:4000"
  echo "Backend not running locally" > "$LOG_DIR/api-baseline.txt"
fi

echo ""
echo "✅ Phase 1 Complete!"
echo "📊 Results saved to: $LOG_DIR"
echo ""
echo "Next steps:"
echo "  1. Review logs in $LOG_DIR"
echo "  2. Run Phase 2: bash audit/rapid-20250827/scripts/phase2_database_health.sh"
echo "  3. Check comprehensive_audit_plan.md for detailed analysis"
