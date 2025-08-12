# Muralla 4.0 Monorepo

> NestJS • React • Prisma • BullMQ • PostgreSQL • Redis • Railway

## Contents

| Package / Folder | Description |
|------------------|-------------|
| `muralla-backend` | NestJS API, GraphQL, authentication, BullMQ queues, Prisma ORM |
| `muralla-frontend` | React + Vite SPA served as static files |
| `packages/common` | Shared TypeScript utilities & DTOs |
| `scripts` | Bash helpers for Railway automation |

## Local development

```bash
# install all workspaces
pnpm install

# backend dev (runs on :3000)
pnpm -C muralla-backend run start:dev

# frontend dev (runs on :5173)
pnpm -C muralla-frontend run dev
```

### Environment
Create `.env` in `muralla-backend` if you need local DB creds, or spin up Postgres/Redis with Docker.

## Deployment (Railway)
See `Railway_API_AI_Management_Guide.md` for the full guide.

TL;DR:
```bash
./scripts/set_railway_vars.sh   # sets env vars via CLI
railway up -s Backend           # deploy API
railway up -s Frontend          # deploy SPA
```

Backend health check: `https://api.<domain>/health/healthz`

## Auth flow
1. `POST /auth/login` returns `{access_token}`.  
2. Store token in `localStorage` under key `authToken` (handled by `AuthService`).  
3. Frontend attaches `Authorization: Bearer <token>` on each call.

�� Have fun building! 

## Environment variables

### Backend service
| Variable | Purpose | Example / Note |
|----------|---------|-----------------|
| `DATABASE_URL` | Postgres connection string | Provided by Railway Postgres |
| `REDIS_URL` | Redis connection string | Provided by Railway Redis |
| `JWT_SECRET` | JWT signing secret | Use a strong random string |
| `JWT_EXPIRES_IN` | Token lifetime | e.g. `24h` |
| `FRONTEND_URL` | CORS allowed origin | `${{ Frontend.RAILWAY_PUBLIC_DOMAIN }}` |
| `BACKEND_URL` | Public API base URL | `${{ Backend.RAILWAY_PUBLIC_DOMAIN }}` |
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

### Frontend service
| Variable | Purpose | Example / Note |
|----------|---------|-----------------|
| `VITE_API_BASE_URL` | Backend base URL | `${{ Backend.RAILWAY_PUBLIC_DOMAIN }}` |
| `VITE_MP_PUBLIC_KEY` | MercadoPago public key (if using payments) | Set in Frontend service |
| `VITE_ENABLE_DEMO` | Preload demo token (non-prod) | `true` only for staging/dev |
| `NIXPACKS_NODE_VERSION` | Node pin for Nixpacks | `20.19.0` |
| `NODE_VERSION` | Node pin for build env | `20.19.0` |