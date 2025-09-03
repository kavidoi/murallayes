# Rapid Audit Findings (2025-08-27)

_Time-boxed AI-driven scan; duration ≈7 min._

| # | Area | Severity | Finding | Evidence | Quick Fix |
|---|------|----------|---------|----------|-----------|
| 1 | Dependencies | HIGH | `xlsx` <0.19.3 vulnerable to Prototype Pollution (CVE-2023-30533) & ReDoS (CVE-2024-22363). Present in `muralla-frontend`. | `pnpm_audit.json` (2 high) | Pin `xlsx@0.20.2` and `@types/xlsx` ≥0.0.39, run `pnpm audit` again. |
| 2 | Static analysis | MEDIUM | Lint/type check step failed (turbo argument `--json` not supported). | `lint_type.json` empty & script stderr | Adjust audit script to run `pnpm -r run lint` and `pnpm exec tsc --noEmit`. |
| 3 | DB Schema | INFO | Prisma schema validated; no errors. | `prisma_validate.log` empty (success) | – |
| 4 | Schema Drift | UNKNOWN | Drift check skipped – `DATABASE_URL` not set in shell. | `drift.sql` placeholder | Re-run with prod DB URL via `export DATABASE_URL=…`. |
| 5 | Container CVEs | INFO | Trivy not installed, scan skipped. | `trivy.json` placeholder | Install Trivy (`brew install trivy`) & rerun. |

## Summary
Blockers detected: **0**
High severity: **1** (dependency CVEs)
Medium: **1** (audit coverage gap)

### Immediate Actions (<30 min)
1. Upgrade `xlsx` & `@types/xlsx`, commit lockfile.
2. Export `DATABASE_URL` locally and rerun `drift` check.
3. Install Trivy and execute container scan.

### Next Steps (<2 h total)
• Fix lint command in script, capture ESLint/TS errors.
• Review `deps.json` (>1 k deps) for other outdated packages via `npm-check-updates`.
• Consider scheduling weekly automated run under GitHub Actions.

---
_Artifacts located in `audit/rapid-20250827/logs/` & `audit/rapid-20250827/reports/`_
