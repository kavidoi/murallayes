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