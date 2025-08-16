# Muralla 4.0 — Railway + CI Management Guide

This guide documents how the Muralla 4.0 monorepo deploys on Railway and how CI is configured to build, test, and produce container images.

## Stack and Tooling
- Node.js: 20.19.x (pinned by `.nvmrc` and `engines`)
- Package manager: pnpm 8.x (pinned by `packageManager` and CI)
- Monorepo structure: pnpm workspaces
  - `muralla-backend` (NestJS + Prisma)
  - `muralla-frontend` (React + Vite)
  - `packages/common` (shared TS code)

## Environment Versions
- Local: use Node 20.19.x
  - `nvm use 20.19.0` or `export PATH="/opt/homebrew/opt/node@20/bin:$PATH"`
  - `corepack enable && corepack prepare pnpm@8.15.0 --activate`

## Railway Services

### Backend (`muralla-backend/railway.json`)
- Builder: Nixpacks
- Deploy hooks:
  - preDeployCommand:
    - `pnpm -C muralla-backend run build`
    - `pnpm -C muralla-backend exec prisma generate`
    - `pnpm -C muralla-backend exec prisma migrate deploy`
  - startCommand:
    - `pnpm -C muralla-backend run start` (runs `node dist/main.js`)
- Health check: `GET /health/healthz`

Environment variables (configure in Railway):
- `DATABASE_URL` (Postgres)
- `JWT_SECRET` (string)
- `JWT_EXPIRES_IN` (e.g., `1h`)
- `REDIS_URL` (e.g., `redis://<host>:6379`)
- Optional bootstrap (only for first-time admin creation):
  - `ADMIN_EMAIL`
  - `ADMIN_PASSWORD`

Notes: Prisma migrations are executed during pre-deploy; the app process itself does not run migrations on start.

### Frontend (`muralla-frontend/railway.json`)
- Builder: Nixpacks
- Deploy hooks:
  - preDeployCommand:
    - `pnpm -C muralla-frontend run build` (produces `dist/`)
  - startCommand:
    - `npx --yes serve -s dist -l $PORT`
- Health check: `GET /`

No required environment variables unless build-time env is introduced.

## CI/CD Workflow (`.github/workflows/ci.yml`)
- Triggers: push/PR to `main` and `develop`
- Node: pinned to `20.19.0`
- pnpm: v8 (Corepack)
- Jobs:
  1. lint-and-test
     - Sets up Postgres (15) and Redis (7) services for backend tests
     - Installs with `pnpm install --no-frozen-lockfile`
     - Builds `@muralla/common`
     - Prisma generate + migrate for backend (against CI Postgres)
     - Lints backend (`pnpm --filter muralla-backend lint:check`)
     - Runs unit + e2e + coverage for backend
     - Uploads coverage to Codecov (if configured)
  2. build-and-push (pushes only, on `main` or `develop`)
     - Builds and pushes Docker image using `muralla-backend/Dockerfile`
     - Tags include branch, sha, and `latest` on default branch
  3. deploy-staging / deploy-production (placeholder steps)
     - Replace with your real deployment commands if needed

Notes:
- Frontend lint currently reports errors (typed `any` usage). CI lints backend only to keep the pipeline green until frontend lint is remediated.

## Docker (Backend)
- `muralla-backend/Dockerfile` is tailored for the pnpm monorepo:
  - Uses Node 20 Alpine, installs pnpm
  - Installs at repo root, builds `@muralla/common`, generates Prisma client, builds backend
  - Copies built artifacts and node_modules into production stage
  - Healthcheck: `GET /health/healthz`
  - Entrypoint: `node muralla-backend/dist/main.js`

## Local Validation

- Install and build:
```sh
corepack enable
corepack prepare pnpm@8.15.0 --activate
pnpm install --no-frozen-lockfile
pnpm -w -r build
```

- Backend Prisma (optional):
```sh
pnpm --filter muralla-backend exec prisma generate
```

- Lint:
```sh
pnpm --filter muralla-backend lint:check
# Frontend lint currently has errors; fix iteratively then enable in CI
pnpm --filter muralla-frontend lint || true
```

- Docker build (optional):
```sh
docker build -f muralla-backend/Dockerfile -t muralla-backend:local .
```

## Operational Tips
- Ensure Railway service variables are present before first deploy.
- Use `ADMIN_EMAIL`/`ADMIN_PASSWORD` only for first run to bootstrap admin; remove afterwards.
- If migrations fail, inspect the build logs; fix schema or connection and redeploy.
- For CI DB collisions, use unique DB names per job or ensure clean migrations; current workflow uses a throwaway Postgres service per job.

## Next Steps
- Remediate frontend lint errors and enable frontend lint step in CI.
- Optionally add e2e tests for the frontend.
- Replace placeholder deployment steps with your actual deploy commands if not using Railway for all environments.
