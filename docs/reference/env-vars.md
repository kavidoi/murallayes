# Environment Variables Reference

This reference consolidates all environment variables used across the Muralla 4.0 monorepo.

- Backend path: `muralla-backend/`
- Frontend path: `muralla-frontend/`
- Deployment scripts: `scripts/`

Notes
- Render is the source of truth for environment variables. Manage per-service variables directly in Render dashboard.
- Run locally using local .env files for development.
- Vite only exposes variables prefixed with `VITE_` to the browser.
- Render provides built-ins like `PORT` automatically.

## Backend (muralla-backend)

Required
- DATABASE_URL — Postgres connection string used by Prisma.
- JWT_SECRET — Secret for JWT signing/verification.

Common/Feature-Dependent
- FRONTEND_URL — Full URL of the Frontend. Used for CORS and building links in emails and redirects.
- BACKEND_URL — Full URL of the Backend. Required when Mercado Pago is enabled to generate webhook URLs.

Optional
- JWT_EXPIRES_IN — JWT expiry. Defaults: App modules use '60m' or '1d' where noted.
- NODE_ENV — Set to 'production' in Railway; enables HTTPS redirect middleware.
- PORT — Server port. Set by Railway. Defaults to 3000 locally.
- RAILWAY_PUBLIC_DOMAIN — Set by Railway; used for logs and allowed origins.
- LOG_LEVEL — Pino log level. Default 'info'.
- Admin bootstrap
  - ADMIN_EMAIL — If set with ADMIN_PASSWORD, ensures an admin user on boot.
  - ADMIN_PASSWORD — Admin password.

Queues (Bull / Redis)
- DISABLE_QUEUES — 'true' to disable queues entirely.
- REDIS_URL — Standard Redis URL. Preferred.
- REDIS_HOST — Fallback host when REDIS_URL not set. Default 'localhost'.
- REDIS_PORT — Fallback port. Default '6379'.
- REDIS_PASSWORD — Optional Redis password.

Email (SMTP)
- SMTP_HOST — SMTP server host. Default 'localhost'.
- SMTP_PORT — SMTP server port. Default '587'.
- SMTP_SECURE — 'true' to use TLS. Default 'false'.
- SMTP_USER — SMTP username.
- SMTP_PASS — SMTP password.
- SMTP_FROM — From address. Default 'noreply@muralla.org'.

Mercado Pago
- MP_ACCESS_TOKEN — Required to enable Mercado Pago operations.
- MP_STATEMENT_DESCRIPTOR — Descriptor shown on card statements. Default 'MURALLA'.
- MP_CURRENCY — Currency code for preferences. Default 'CLP'.

Builder/Runtime pins (for Railway/Nixpacks)
- NIXPACKS_NODE_VERSION — Node version pin for Nixpacks build image (e.g. 20.19.0).
- NODE_VERSION — Node version pin for tools/scripts (e.g. 20.19.0).

Code references
- `src/main.ts` uses FRONTEND_URL, RAILWAY_PUBLIC_DOMAIN, NODE_ENV, PORT.
- `src/auth/*.ts` uses JWT_SECRET, JWT_EXPIRES_IN.
- `src/queue/queue.module.ts` uses DISABLE_QUEUES, REDIS_URL or REDIS_HOST/PORT/PASSWORD.
- `src/notifications/processors/notification.processor.ts` uses SMTP_* and FRONTEND_URL.
- `src/common/logger.module.ts` uses LOG_LEVEL.
- `src/app.module.ts` uses ADMIN_EMAIL, ADMIN_PASSWORD.
- `src/finance/mercado-pago.service.ts` uses MP_ACCESS_TOKEN, MP_STATEMENT_DESCRIPTOR, MP_CURRENCY, BACKEND_URL, FRONTEND_URL.

## Frontend (muralla-frontend)

Required
- VITE_API_BASE_URL — Backend API base URL.

Optional
- VITE_ENABLE_DEMO — Enable demo flows in non-production. Default 'false'.
- VITE_MP_PUBLIC_KEY — Mercado Pago public key for browser SDK, if payments UI is enabled.

Code references
- `.env.example` defines VITE_API_BASE_URL, VITE_ENABLE_DEMO, VITE_MP_PUBLIC_KEY.
- Various components under `src/components/modules/finance/*` and utilities under `src/utils/https.ts` read `import.meta.env.*`.

## Railway helper scripts (scripts/)

set_railway_vars.sh
- RAILWAY_PROJECT_NAME — Project name in Railway (e.g., murallayes). Required.
- RAILWAY_ENVIRONMENT — Environment name (e.g., production). Required.
- JWT_SECRET — Required (sets Backend).
- JWT_EXPIRES_IN — Optional. Default 60m.
- FRONTEND_URL — Set via reference: `https://${{ Frontend.RAILWAY_PUBLIC_DOMAIN }}`.
- BACKEND_URL — Set via reference: `https://${{ Backend.RAILWAY_PUBLIC_DOMAIN }}`.
- NIXPACKS_NODE_VERSION — Optional. Default 20.19.0.
- NODE_VERSION — Optional. Default 20.19.0.
- DATABASE_URL — Optional direct value.
- DB_SERVICE_NAME — Optional. If set, script sets `DATABASE_URL=${{ <DB_SERVICE_NAME>.DATABASE_URL }}`.
- REDIS_URL — Optional direct value.
- REDIS_SERVICE_NAME — Optional. If set, script sets `REDIS_URL=${{ <REDIS_SERVICE_NAME>.REDIS_URL }}`.
- Mercado Pago (optional)
  - MP_ACCESS_TOKEN
  - MP_CLIENT_ID
  - MP_CLIENT_SECRET
  - VITE_MP_PUBLIC_KEY — Frontend public key. If not provided, script falls back to MP_PUBLIC_KEY when present.
- Frontend variables
  - VITE_API_BASE_URL — `https://${{ Backend.RAILWAY_PUBLIC_DOMAIN }}`
  - VITE_ENABLE_DEMO — default false

deploy_via_api.sh
- RAILWAY_API_TOKEN — Account/Team token used as `Authorization: Bearer`. Strongly recommended for Public GraphQL API deploys.
- RAILWAY_TOKEN — Project-Access-Token used as `Project-Access-Token` header. May not be sufficient alone to trigger Public API deploy mutations.
- RAILWAY_PROJECT_NAME — Default 'murallayes'.
- RAILWAY_ENVIRONMENT — Default 'production'.
- SERVICES — Space-separated list (e.g., "Backend Frontend"). Default both.
- BACKEND_SERVICE_ID / FRONTEND_SERVICE_ID — Optional overrides.

deploy_frontend_api.sh
- RAILWAY_TOKEN — Used for Authorization header in example script.
- RAILWAY_API_TOKEN — Optional; noted for API calls.
- RAILWAY_PROJECT_NAME — Project name.
- RAILWAY_ENVIRONMENT — Environment name.
- PROJECT_ID / SERVICE_ID — Optional preset IDs to skip discovery.

## GitHub Actions (CI)

From `.github/workflows/ci.yml`
- DATABASE_URL — For tests and prisma generate/migrate (uses local postgres service in CI).
- JWT_SECRET — For tests.
- JWT_EXPIRES_IN — For tests.
- REDIS_URL — For tests.
- REGISTRY, IMAGE_NAME — Docker image naming (set in workflow env).
- GITHUB_TOKEN — Provided automatically; used for GHCR login.

## Railway built-ins (runtime)
- PORT — Port the app must bind to (backend uses `process.env.PORT || 3000`).
- RAILWAY_PUBLIC_DOMAIN — Public domain assigned to the service, used in logs and for constructing URLs.

## Examples

Backend .env (local)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/muralla
JWT_SECRET=dev-secret
JWT_EXPIRES_IN=60m
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:3000
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug
```

Frontend .env (local)
```
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_DEMO=true
VITE_MP_PUBLIC_KEY=
```

## Security and tips
- Do not commit real tokens or secrets. Use Railway variables and GitHub Actions secrets.
- Prefer `REDIS_URL` over host/port triples. Use `DISABLE_QUEUES=true` if Redis is not configured.
- For Public GraphQL API deploys, ensure `RAILWAY_API_TOKEN` is set; `RAILWAY_TOKEN` alone may not trigger deployments.
- Pin Node version with `NIXPACKS_NODE_VERSION` and `NODE_VERSION` to avoid engine mismatch.
