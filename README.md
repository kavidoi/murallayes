# Muralla 4.0 Monorepo

Repository: https://github.com/kavidoi/murallayes.git

> NestJS • React • Prisma • BullMQ • PostgreSQL • Redis • Render

## Contents

| Package / Folder | Description |
|------------------|-------------|
| `muralla-backend` | NestJS API, GraphQL, authentication, BullMQ queues, Prisma ORM |
| `muralla-frontend` | React + Vite SPA served as static files |
| `packages/common` | Shared TypeScript utilities & DTOs |
| `scripts` | Bash deployment helpers |

## Local development

```bash
# install all workspaces
pnpm install

# backend dev (runs on :4000)
cd muralla-backend && pnpm start:dev

# frontend dev (runs on :5173)
cd muralla-frontend && pnpm dev
```

### Environment
Use local `.env` files for development. See `docs/reference/env-vars.md` for details.

```sh
# Backend (.env file in muralla-backend/)
cd muralla-backend && pnpm start:dev

# Frontend (.env file in muralla-frontend/)
cd muralla-frontend && pnpm dev
```

## Deployment (Render)
Deploy using Render's Git integration:

1. **Backend**: Connect your repo to a new Render Web Service
2. **Frontend**: Connect your repo to a new Render Static Site
3. Set environment variables in Render dashboard

Backend health check: `https://your-api.onrender.com/health/healthz`

## Auth flow
1. `POST /auth/login` returns `{access_token}`.  
2. Store token in `localStorage` under key `authToken` (handled by `AuthService`).  
3. Frontend attaches `Authorization: Bearer <token>` on each call.

## Repository policy
- Always use `origin = https://github.com/kavidoi/murallayes.git`.
- Do not reference `admin.muralla.git` anywhere (historical repo).

�� Have fun building! 

## Environment variables

See `docs/reference/env-vars.md` for the canonical list and details. Summary below:

### Backend service
| Variable | Purpose | Example / Note |
|----------|---------|-----------------|
| `DATABASE_URL` | Postgres connection string | Provided by Render PostgreSQL |
| `REDIS_URL` | Redis connection string | Provided by Render Redis |
| `JWT_SECRET` | JWT signing secret | Use a strong random string |
| `JWT_EXPIRES_IN` | Token lifetime | e.g. `24h` |
| `FRONTEND_URL` | CORS allowed origin | Your Render frontend URL |
| `BACKEND_URL` | Public API base URL | Your Render backend URL |
| `DISABLE_QUEUES` | Disable BullMQ queues | `true` to disable when Redis absent |
| `LOG_LEVEL` | Backend log level | `info` (default) |
| `SMTP_HOST` | SMTP server host (email) | Optional |
| `SMTP_PORT` | SMTP server port | Optional (e.g., `587`) |
| `SMTP_SECURE` | Use TLS for SMTP | `true` or `false` |
| `SMTP_USER` | SMTP username | Optional |
| `SMTP_PASS` | SMTP password | Optional |
| `SMTP_FROM` | Default From: address | e.g., `noreply@muralla.org` |
| `MP_ACCESS_TOKEN` | MercadoPago access token | Optional |
| `MP_CLIENT_ID` | MercadoPago client ID | Optional |
| `MP_CLIENT_SECRET` | MercadoPago client secret | Optional |
| `MP_CURRENCY` | MercadoPago currency | e.g., `CLP` |
| `MP_STATEMENT_DESCRIPTOR` | MP statement descriptor | e.g., `MURALLA` |
| `NIXPACKS_NODE_VERSION` | Node pin for Nixpacks | `20.19.0` |
| `NODE_VERSION` | Node pin for build env | `20.19.0` |

## Docs
- SSL/TLS setup: `docs/security/ssl-tls.md`
- MercadoPago integration: `docs/integrations/mercadopago.md`

### Frontend service
| Variable | Purpose | Example / Note |
|----------|---------|-----------------|
| `VITE_API_BASE_URL` | Backend base URL | Your Render backend URL |
| `VITE_MP_PUBLIC_KEY` | MercadoPago public key (if using payments) | Set in Frontend service |
| `VITE_ENABLE_DEMO` | Preload demo token (non-prod) | `true` only for staging/dev |
| `NIXPACKS_NODE_VERSION` | Node pin for Nixpacks | `20.19.0` |
| `NODE_VERSION` | Node pin for build env | `20.19.0` |