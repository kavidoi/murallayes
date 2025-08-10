# murallayes Monorepo

> NestJS • React • Prisma • BullMQ • PostgreSQL • Redis • Railway

## Contents

| Package / Folder | Description |
|------------------|-------------|
| `muralla-backend` | NestJS API, GraphQL, authentication, BullMQ queues, Prisma ORM |
| `muralla-frontend` | React + Vite SPA served as static files (Brand: murallayes) |
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
See `DEPLOYMENT.md` for the full guide.

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
| `FRONTEND_URL` | CORS allowed origin | `${{Frontend.RAILWAY_PUBLIC_DOMAIN}}` |
| `DISABLE_QUEUES` | Disable BullMQ queues | `true` to disable when Redis absent |

### Frontend service
| Variable | Purpose | Example / Note |
|----------|---------|-----------------|
| `VITE_API_BASE_URL` | Backend base URL | `${{Backend.RAILWAY_PUBLIC_DOMAIN}}` |
| `VITE_ENABLE_DEMO` | Preload demo token (non-prod) | `true` only for staging/dev | 