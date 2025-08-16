# CI with GitHub Actions

This document explains the CI pipeline defined in `.github/workflows/ci.yml`.

## Triggers
- Push to `main` or `develop`
- Pull requests targeting `main` or `develop`

## Environments and Tooling
- Node.js: 20.19.0
- pnpm: 8 (via Corepack)
- Container registry: `ghcr.io`
- Image name: `${{ github.repository }}/muralla-backend`

## Jobs

### 1) lint-and-test
Runs on `ubuntu-latest` and provisions ephemeral services:
- Postgres 15 (exposed on 5432)
- Redis 7 (exposed on 6379)

Steps:
1. Checkout repository
2. Setup Node 20.19.0 with pnpm cache
3. Install pnpm 8 via action
4. Install dependencies: `pnpm install --no-frozen-lockfile`
5. Build common workspace: `pnpm --filter @muralla/common build`
6. Generate Prisma client for backend:
   ```sh
   pnpm --filter ./muralla-backend exec prisma generate
   # DATABASE_URL=postgresql://postgres:postgres@localhost:5432/muralla_test
   ```
7. Apply DB migrations:
   ```sh
   pnpm --filter ./muralla-backend exec prisma migrate deploy
   ```
8. Lint backend sources only:
   ```sh
   pnpm --filter ./muralla-backend exec eslint 'src/**/*.ts'
   ```
9. Run unit tests:
   ```sh
   pnpm --filter ./muralla-backend test:unit
   ```
10. Run e2e tests:
    ```sh
    pnpm --filter ./muralla-backend test:e2e
    ```
11. Generate coverage:
    ```sh
    pnpm --filter ./muralla-backend test:cov
    ```
12. Upload coverage to Codecov (if token configured) using `./muralla-backend/coverage/lcov.info`.

Environment used for tests:
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/muralla_test`
- `JWT_SECRET=test-jwt-secret`
- `JWT_EXPIRES_IN=1h`
- `REDIS_URL=redis://localhost:6379`

### 2) build-and-push
Builds and pushes the backend Docker image to GHCR on push to `main`/`develop` after tests pass.

Steps:
1. Checkout repository
2. Setup Docker Buildx
3. Login to GHCR with `GITHUB_TOKEN`
4. Extract metadata and tags (branch, PR, SHA, latest on default)
5. Build and push with cache:
   - `context: .`
   - `file: ./muralla-backend/Dockerfile.ci`
   - `cache-from: type=gha`
   - `cache-to: type=gha,mode=max`

### 3) deploy-staging / deploy-production
Placeholder jobs gated by branch:
- `develop` → staging
- `main` → production

Replace the echo commands with your deployment mechanism (Railway GraphQL API scripts, k8s manifests, etc.).

## Notes
- Frontend lint currently fails; only backend lint is enforced in CI to keep the pipeline green.
- Node and pnpm versions are pinned to avoid EBADENGINE differences.
- Prisma client generation and migrations run against an ephemeral Postgres provided by services.
