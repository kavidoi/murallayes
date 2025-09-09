# Muralla 4.0 – Deployment Guide (2025-09)

This guide covers deployment to **Render** (production) and local development setup.

## 1 · Prerequisites

### For Production (Render)
• Render account with **Backend** and **Frontend** services created and linked to this GitHub repo
• PostgreSQL database service added in Render
• `render.yaml` configuration file (already included in repo)

### For Local Development
• Node.js 20.19.0 (use `.nvmrc`)
• `pnpm` ≥ 8.15.0
• PostgreSQL database (local or cloud)

## 2 · Local Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local database URL and other settings

# Start backend
cd muralla-backend
pnpm run dev

# In another terminal, start frontend
cd muralla-frontend  
pnpm run dev
```

## 3 · Render Deployment

### Automated Deployment
Deployment is handled via `render.yaml` blueprint:
- **Backend**: Docker-based web service with health checks
- **Frontend**: Static site build
- **Database**: Managed PostgreSQL

### Manual Deployment via Render Dashboard
1. Connect your GitHub repository
2. Deploy using the `render.yaml` blueprint
3. Set required environment variables in Render dashboard

### Required Environment Variables
Set these in your Render dashboard:
- `JWT_SECRET` - Secure random string
- `MP_ACCESS_TOKEN` - MercadoPago access token (optional)
- `MP_CLIENT_ID` - MercadoPago client ID (optional) 
- `MP_CLIENT_SECRET` - MercadoPago client secret (optional)

## 4 · Health Checks
• Backend exposes `/health/healthz` endpoint
• Frontend serves from root `/` 
• Database connectivity verified on backend startup

## 5 · Environment Variables
See `render.yaml` for complete environment variable configuration.
Frontend supports `VITE_ENABLE_DEMO=true` for demo mode (dev/staging only).

## 6 · Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Build fails | Missing dependencies | Check `pnpm install` in build logs |
| Runtime `MODULE_NOT_FOUND .prisma/client` | Prisma client not generated | Verify build process includes `prisma generate` |
| 401s from API | Missing JWT token | Check authentication setup |
| CORS errors | Frontend/backend URL mismatch | Verify CORS settings in backend |

## 7 · Node Version Policy

The repo is pinned to Node 20.19.0 for consistency:
- `.nvmrc` files set to `20.19.0`
- `package.json` engines specify `"node": "^20.19.0"`
- `engine-strict=true` in `.npmrc` enforces version matching

If updating Node version, change all references in a single PR.

## 8 · Local Development Workflow

```bash
# Full stack development
pnpm run dev          # Starts backend only
# In separate terminal:
cd muralla-frontend && pnpm run dev

# Build for production testing
pnpm run build        # Builds both frontend and backend

# Database operations
pnpm run bootstrap    # Set up database schema
pnpm run reset-db     # Reset database (dev only)
```

Happy shipping 🚀
