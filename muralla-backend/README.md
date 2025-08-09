# Muralla Backend (NestJS)

## Run locally
```bash
pnpm -C muralla-backend install
pnpm -C muralla-backend run start:dev   # http://localhost:3000
```

## Environment
See root `README.md` for full table. Common vars:
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `FRONTEND_URL`
- `DISABLE_QUEUES=true` to start without Redis/Bull

## Health
- Liveness: `/health/healthz` (RSS/heap checks; 512 MB RSS threshold)
- Readiness: `/health/readyz` (DB ping + basic DB op)

## GraphQL
- Endpoint: `/graphql`
- Schema: `muralla-backend/src/schema.graphql`

## Queues
- BullMQ configured; can be disabled via `DISABLE_QUEUES=true`
- Redis URL is auto-consumed when present

## Prisma
- `postinstall` runs `prisma generate`
- Migrations run via `pnpm -C muralla-backend exec prisma migrate deploy` (handled in Railway `preDeployCommand`)

## CORS
- Honors `FRONTEND_URL` and allows localhost in dev

## Build
```bash
pnpm -C muralla-backend run build   # outputs to dist/
``` 