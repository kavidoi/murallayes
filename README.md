# Muralla 4.0

**Coffee shop management system with POS integration, finance tracking, and project management.**

> NestJS • React • Prisma • PostgreSQL • Render • MercadoPago

📍 **Production**: [admin.murallacafe.cl](https://admin.murallacafe.cl) | **API**: [api.murallacafe.cl](https://api.murallacafe.cl)

## 🚀 Quick Start

### Local Development
```bash
# 1. Install dependencies
pnpm install

# 2. Set up environment
cd muralla-backend
cp .env.example .env
# Edit .env with your database URL and credentials

# 3. Start backend (port 4000)
DATABASE_URL="postgresql://muralla:1234@localhost:5433/muralla_db" pnpm run start:dev

# 4. In another terminal, start frontend (port 5173)
cd muralla-frontend
pnpm run dev
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Health Check**: http://localhost:4000/health/healthz
- **MercadoPago Status**: http://localhost:4000/mercadopago/status

## 📁 Project Structure

| Package | Description | Location |
|---------|-------------|----------|
| `muralla-backend/` | NestJS API, GraphQL, authentication, Prisma ORM | Backend service |
| `muralla-frontend/` | React + Vite SPA | Frontend service |
| `docs/` | Technical documentation | Reference materials |

## 🌍 Deployment & Branches

### Branch Strategy
- **`main`** → Backend deployment (https://api.murallacafe.cl)
- **`frontend-deploy`** → Frontend deployment (https://admin.murallacafe.cl)
- **`master`** → Legacy (unused)

### Deployment (Render)
- **Automatic**: Push to `main` deploys backend, push to `frontend-deploy` deploys frontend
- **Environment Variables**: Set in Render dashboard (not in code)
- **Database**: Render PostgreSQL service
- **Health Monitoring**: `/health/healthz` endpoint

## ⚙️ Environment Configuration

### Local Development (.env files)
```bash
# Backend (muralla-backend/.env)
DATABASE_URL="postgresql://muralla:1234@localhost:5433/muralla_db"
JWT_SECRET="local-dev-secret"
FRONTEND_URL="http://localhost:3000"

# MercadoPago (use real credentials)
MP_PUBLIC_KEY=APP_USR-your-public-key
MP_ACCESS_TOKEN=APP_USR-your-access-token
MP_CLIENT_ID=your-client-id
MP_CLIENT_SECRET=your-client-secret
MP_CURRENCY=CLP

# Frontend (muralla-frontend/.env)
VITE_API_BASE_URL=http://localhost:4000
VITE_MP_PUBLIC_KEY=APP_USR-your-public-key
```

### Production (Render Dashboard)
**Backend Service Variables:**
- `DATABASE_URL` (auto-provided by Render PostgreSQL)
- `JWT_SECRET`, `FRONTEND_URL=https://admin.murallacafe.cl`
- `MP_PUBLIC_KEY`, `MP_ACCESS_TOKEN`, `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `MP_CURRENCY`

**Frontend Service Variables:**
- `VITE_API_BASE_URL=https://api.murallacafe.cl`
- `VITE_MP_PUBLIC_KEY`

## 🔧 Key Features & Integrations

### POS System Integration
- **Tuu API Integration**: Automatic transaction sync
- **Problem Solved**: Enhanced ID generation for missing transaction IDs
- **Test**: `DATABASE_URL="postgresql://muralla:1234@localhost:5433/muralla_db" node test-pos-fix.js`
- **Endpoints**: `/pos/sync`, `/pos/transactions`, `/pos/health`

### MercadoPago Payment Processing
- **SDK v2 Implementation**: Official MercadoPago SDK for compliance
- **Configuration Check**: `/mercadopago/status` endpoint
- **Test Cards**: 4509 9535 6623 3704 (approved), 4013 5406 8274 6260 (rejected)
- **Currency**: Chilean Peso (CLP)

### Authentication & Security
- **JWT Authentication**: Access token + refresh token system
- **CORS Configuration**: Configured for frontend URL
- **Environment Security**: No secrets in code, all via environment variables

## 🔍 Development Commands

### Backend (muralla-backend/)
```bash
pnpm run start:dev     # Development server
pnpm run build         # Production build
pnpm run test          # Run tests
pnpm prisma migrate dev # Create database migration
pnpm prisma generate   # Generate Prisma client
```

### Frontend (muralla-frontend/)
```bash
pnpm run dev           # Development server
pnpm run build         # Production build
pnpm run preview       # Preview production build
```

### Database Operations
```bash
# Connect to local database
PGPASSWORD=1234 psql -h localhost -p 5433 -U muralla -d muralla_db

# Check POS transactions
PGPASSWORD=1234 psql -h localhost -p 5433 -U muralla -d muralla_db -c "SELECT COUNT(*) FROM pos_transactions;"

# Manual POS sync
curl -X POST http://localhost:4000/pos/sync -H "Content-Type: application/json" -d '{"fromDate": "2024-01-01", "toDate": "2024-12-31"}'
```

## 📚 Documentation

### Essential References
- **[Environment Variables](docs/reference/env-vars.md)** - Complete environment variable reference
- **[MercadoPago Integration](docs/integrations/mercadopago.md)** - Payment processing setup
- **[Database Backup Plan](DATABASE_BACKUP_PLAN.md)** - Backup and recovery procedures
- **[Changelog](CHANGELOG.md)** - Recent updates and fixes

### Quick References
- **[SSL/TLS Setup](docs/security/ssl-tls.md)** - Security configuration
- **[Repository Info](docs/REPOSITORY.md)** - Git and repository details

## ❗ Known Issues & Solutions

### 1. POS Sync: "20 transactions processed 0 created"
**Fixed** ✅ Enhanced ID generation in `pos-sync.service.ts` handles missing/undefined transaction IDs from Tuu API.

### 2. "MercadoPago public key not configured"
**Fixed** ✅ Status endpoint `/mercadopago/status` provides configuration validation and proper error messaging.

### 3. Port Conflicts
```bash
# Check what's using port 4000/5173
lsof -i :4000
lsof -i :5173

# Kill if needed
kill -9 <PID>
```

## 🛠️ Troubleshooting

### Common Issues
| Problem | Solution |
|---------|----------|
| Database connection fails | Check if PostgreSQL is running: `brew services list \| grep postgresql` |
| Backend won't start | Check for port conflicts, verify environment variables |
| Frontend 404 errors | Ensure backend is running, check CORS configuration |
| MercadoPago errors | Verify all MP_ environment variables are set |

### Health Checks
- **Backend**: `curl http://localhost:4000/health/healthz`
- **API**: `curl http://localhost:4000/api/health`
- **MercadoPago**: `curl http://localhost:4000/mercadopago/status`
- **Database**: Connection checked via backend health endpoint

## 🎯 For AI Assistants

### Critical Project Context
- **Branch Usage**: `main` for backend, `frontend-deploy` for frontend
- **Environment Strategy**: Local (.env files) vs Production (Render dashboard)
- **Database**: Local PostgreSQL on port 5433 for development
- **Recent Fixes**: POS transaction ID generation, MercadoPago status endpoint

### Decision Framework
**Work Locally When:**
- User is developing/testing
- Commands use localhost URLs
- Working directory contains local project files

**Work with Render When:**
- Production issues mentioned
- URLs are `*.murallacafe.cl`
- Environment variable configuration needed

## 📞 Support

### Repository
- **GitHub**: https://github.com/kavidoi/murallayes.git
- **Main Branch**: Backend development and deployment
- **Frontend Branch**: frontend-deploy

### Monitoring
- **Backend Health**: https://api.murallacafe.cl/health/healthz
- **Frontend**: https://admin.murallacafe.cl
- **Render Dashboard**: Monitor deployments and logs

---

**Last Updated**: September 2024 | **Version**: 4.0.1

🎉 **Happy coding!**