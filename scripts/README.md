# Scripts

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