# Environment Variables Reference

This reference consolidates all environment variables used across the Muralla 4.0 monorepo.

- Backend path: `muralla-backend/`
- Frontend path: `muralla-frontend/`
- Deployment scripts: `scripts/`

Notes
- **Render is the source of truth** for production environment variables. Manage per-service variables directly in Render dashboard.
- Run locally using local .env files for development.
- Vite only exposes variables prefixed with `VITE_` to the browser.
- Render provides built-ins like `PORT` automatically.
- **Use MP_ prefix** for all MercadoPago environment variables.

## Backend (muralla-backend)

Required
- DATABASE_URL — Postgres connection string used by Prisma.
- JWT_SECRET — Secret for JWT signing/verification.

Common/Feature-Dependent
- FRONTEND_URL — Full URL of the Frontend. Used for CORS and building links in emails and redirects.
- BACKEND_URL — Full URL of the Backend. Required when Mercado Pago is enabled to generate webhook URLs.

Optional
- JWT_EXPIRES_IN — JWT expiry. Defaults: App modules use '60m' or '1d' where noted.
- NODE_ENV — Set to 'production' in Render; enables HTTPS redirect middleware.
- PORT — Server port. Set by Render. Defaults to 3000 locally.
- RENDER_PUBLIC_DOMAIN — Set by Render; used for logs and allowed origins.
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
- MP_PUBLIC_KEY — Required for frontend SDK initialization.
- MP_ACCESS_TOKEN — Required to enable Mercado Pago backend operations.
- MP_CLIENT_ID — Optional client ID for advanced features.
- MP_CLIENT_SECRET — Optional client secret for advanced features.
- MP_STATEMENT_DESCRIPTOR — Descriptor shown on card statements. Default 'MURALLA'.
- MP_CURRENCY — Currency code for preferences. Default 'CLP'.
- MERCADOPAGO_ACCESS_TOKEN — Backward compatibility fallback for MP_ACCESS_TOKEN.

Builder/Runtime pins (for Render)
- NIXPACKS_NODE_VERSION — Node version pin for Nixpacks build image (e.g. 20.19.0).
- NODE_VERSION — Node version pin for tools/scripts (e.g. 20.19.0).

Code references
- `src/main.ts` uses FRONTEND_URL, RENDER_PUBLIC_DOMAIN, NODE_ENV, PORT.
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

## Render built-ins (runtime)
- PORT — Port the app must bind to (backend uses `process.env.PORT || 3000`).
- RENDER_PUBLIC_DOMAIN — Public domain assigned to the service, used in logs and for constructing URLs.

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
- Do not commit real tokens or secrets. Use Render dashboard environment variables for production.
- Prefer `REDIS_URL` over host/port triples. Use `DISABLE_QUEUES=true` if Redis is not configured.
- Use MP_ prefix for all MercadoPago environment variables for consistency.
- Pin Node version with `NIXPACKS_NODE_VERSION` and `NODE_VERSION` to avoid engine mismatch.
