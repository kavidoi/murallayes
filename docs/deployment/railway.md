# Muralla 4.0 – Railway Deployment Guide (2025-08)

This short guide replaces the older, dashboard-heavy instructions.  All essential build & start settings now live **inside the repo** (`railway.json` + `nixpacks.toml`).

## 1 · Prerequisites

• Railway project with **Backend** and **Frontend** services created and linked to this GitHub repo.  
• PostgreSQL & Redis services added (Railway plugins).  
• Local `pnpm` ≥ 8 if you want to run commands below.

## 2 · One-time setup (per environment)

```bash
# clone & install dependencies
pnpm install

# set common Railway variables (uses CLI)
./scripts/set_railway_vars.sh               # non-interactive
```

The script fills in:
* DATABASE_URL / REDIS_URL references
* JWT settings
* CROSS-SERVICE references (`${{Backend.RAILWAY_PUBLIC_DOMAIN}}`, etc.)

## 3 · Deploy

```bash
# Backend – Nixpacks builds with pnpm -C muralla-backend …
railway up -s Backend    # or Redeploy in UI

# Frontend – static vite build served via Nixpacks
railway up -s Frontend
```

That’s it.  Because the services rely on `railway.json`, you **do not** need to touch the dashboard build / start commands.

### Post-install Prisma
A `postinstall` script runs `prisma generate` automatically during the build phase, so the Prisma client is ready at runtime.

## 4 · Health checks
• Backend exposes `/health/healthz` (configured in `railway.json`).  
• Thresholds set to 512 MB RSS to avoid false positives.

## 5 · Environment variables
See table in `README.md`  
Frontend also supports `VITE_ENABLE_DEMO=true` for a temporary demo token (dev/staging only).

## 6 · Troubleshooting cheat-sheet
| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails with workspace pkg not found | Root directory mismatch | Ensure service root is correct in Railway UI |
| Runtime `MODULE_NOT_FOUND .prisma/client` | Prisma client not generated | Confirm `postinstall` ran; redeploy |
| 401s from API | Missing JWT token | Authenticate (`/auth/login`) or enable demo flag |

Happy shipping 🚀

## 7 · Node version policy (must-read)

To avoid EBADENGINE warnings and flaky builds, the repo is pinned to Node 20.19.0 across local, CI and Railway.

- Root `.nvmrc` and `muralla-frontend/.nvmrc` are set to `20.19.0`.
- Root `package.json` and each workspace `package.json` specify `"engines.node": "^20.19.0"`.
- `muralla-frontend/nixpacks.toml` and `muralla-backend/nixpacks.toml` set `NODE_VERSION = "20.19.0"`.
- Root `.npmrc` enables `engine-strict=true` to fail fast if a mismatched Node is used.

If you need to bump Node, change all of the above in a single PR to keep environments unified.
