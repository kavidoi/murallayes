# Scripts

## Render API automation

This repo now includes example references from Render's public API examples in `scripts/render-api-examples` (source: https://github.com/render-examples/render-api-examples).

We'll add an automation script `scripts/render_deploy.sh` to create/update services via the Render API.

Repository: https://github.com/kavidoi/murallayes.git

## pull_railway_vars.sh
Export Railway service variables to local dotenv files for development. Railway remains the source of truth.

Usage:
```bash
RAILWAY_PROJECT_NAME=<project> RAILWAY_ENVIRONMENT=<environment> \
  ./scripts/pull_railway_vars.sh
# Writes muralla-backend/.env.railway and muralla-frontend/.env.railway (gitignored)
```

Tip: You can also avoid writing files and run with Railway-injected vars:
```bash
railway run -s Backend -e <environment> -- pnpm -C muralla-backend start:dev
railway run -s Frontend -e <environment> -- pnpm -C muralla-frontend dev
```

## set_railway_vars.sh
Non-interactive helper to set required environment variables for Backend and Frontend services via the Railway CLI.

Usage:
```bash
./scripts/set_railway_vars.sh
```
What it sets:
- Backend: `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`, `DATABASE_URL`, `REDIS_URL`
- Frontend: `VITE_API_BASE_URL`, optional `VITE_ENABLE_DEMO`

Notes:
- Uses Railway variable references (e.g., `${{Backend.RAILWAY_PUBLIC_DOMAIN}}`).
- Assumes you are logged in (`railway login`) and the project is linked.

## deploy_via_api.sh (advanced / optional)
Attempts to deploy via Railway GraphQL API (no CLI). Includes fallback strategies and multiple mutation attempts.

Requirements:
- `RAILWAY_TOKEN` (project token) or `RAILWAY_API_TOKEN` (account/team token with deploy scope).

Limitations:
- Some accounts/tokens cannot trigger deploys due to API permissions; prefer the CLI unless you must automate via API.

Usage:
```bash
RAILWAY_API_TOKEN=xxxxx ./scripts/deploy_via_api.sh --project <projectId> --env <envId> --service <serviceId>
``` 