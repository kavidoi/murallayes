# Muralla 4.0 Deployment Guide

## Repository Structure

The Muralla system is now split into two separate repositories for easier deployment:

- **Backend**: https://github.com/kavidoi/muralla-backend
- **Frontend**: https://github.com/kavidoi/muralla-frontend

## Render Deployment Configuration

### Backend Service (muralla-backend)

**Repository**: `kavidoi/muralla-backend`
**Branch**: `main`
**Service Type**: Web Service

#### Build Settings:
- **Build Command**: `npm ci --legacy-peer-deps && npx prisma generate && npm run build`
- **Start Command**: `npm run start`
- **Pre-Deploy Command**: `npx prisma migrate deploy`
- **Health Check Path**: `/health/healthz`

#### Environment Variables:
```
NODE_ENV=production
DATABASE_URL=[from Render database]

# Authentication
JWT_SECRET=[generate secure secret]
ADMIN_EMAIL=[primary admin email]
ADMIN_PASSWORD=[primary admin password]
ADMIN_USER=[primary admin name]
SECONDARY_ADMIN_EMAIL=[secondary admin email]
SECONDARY_ADMIN_PASSWORD=[secondary admin password]
SECONDARY_ADMIN_USER=[secondary admin name]
TERTIARY_ADMIN_EMAIL=[tertiary admin email]
TERTIARY_ADMIN_PASSWORD=[tertiary admin password]
TERTIARY_ADMIN_USER=[tertiary admin name]

# OpenFactura Integration
OPENFACTURA_API_KEY=717c541483da4406af113850262ca09c
OPENFACTURA_BASE_URL=https://api.haulmer.com
COMPANY_RUT=78188363-8

# URLs
BACKEND_URL=https://api.murallacafe.cl
FRONTEND_URL=https://admin.murallacafe.cl

# MercadoPago (if needed)
MP_PUBLIC_KEY=[your public key]
MP_ACCESS_TOKEN=[your access token]
```

### Frontend Service (muralla-frontend)

**Repository**: `kavidoi/muralla-frontend`
**Branch**: `main`
**Service Type**: Static Site

#### Build Settings:
- **Build Command**: `npm ci && npm run build:prod`
- **Publish Directory**: `./dist`

#### Environment Variables:
```
VITE_API_BASE_URL=https://api.murallacafe.cl
VITE_WS_URL=https://api.murallacafe.cl
VITE_ENABLE_DEMO=false
VITE_MP_PUBLIC_KEY=[MercadoPago public key]
```

## Custom Domains

- **Backend**: api.murallacafe.cl
- **Frontend**: admin.murallacafe.cl

## Database

Using Render PostgreSQL database with automatic connection string injection.

## Deployment Process

1. **Backend Deployment**:
   - Push changes to `kavidoi/muralla-backend`
   - Render auto-deploys from main branch
   - Migrations run automatically via pre-deploy command

2. **Frontend Deployment**:
   - Push changes to `kavidoi/muralla-frontend`
   - Render auto-deploys from main branch
   - Static files served via CDN

## Monitoring

- Backend health: https://api.murallacafe.cl/health/healthz
- Frontend: https://admin.murallacafe.cl

## Troubleshooting

### Backend Issues
- Check logs in Render dashboard
- Verify DATABASE_URL is set correctly
- Ensure all environment variables are configured
- Check Prisma migrations status

### Frontend Issues
- Verify VITE_API_BASE_URL points to correct backend
- Check browser console for errors
- Ensure build completes successfully

## Local Development

### Backend
```bash
cd muralla-backend
npm install
npm run dev
```

### Frontend
```bash
cd muralla-frontend
npm install
npm run dev
```

## Support

For deployment issues, check:
1. Render Status: https://status.render.com
2. GitHub Actions (if configured)
3. Application logs in Render dashboard
