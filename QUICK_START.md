# Muralla 4.0 - Quick Start

## 🚀 Development Setup

### Prerequisites
- Node.js 20.19.0
- pnpm package manager
- PostgreSQL database
- Redis (optional for queues)

### Quick Start
```bash
# 1. Install dependencies
pnpm install

# 2. Start backend (port 4000)
cd muralla-backend
pnpm start:dev

# 3. Start frontend (port 5173) 
cd muralla-frontend
pnpm dev
```

### Access URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:4000
- **Backend Health**: http://localhost:4000/health/healthz

## 🛠️ Development Commands

### Backend (muralla-backend/)
```bash
pnpm start:dev    # Development server
pnpm build        # Production build
pnpm test         # Run tests
```

### Frontend (muralla-frontend/)
```bash
pnpm dev          # Development server
pnpm build        # Production build
pnpm preview      # Preview production build
```

## 🔧 Troubleshooting

### Frontend 404 Issues
If frontend shows 404, ensure `vite.config.ts` has:
```typescript
export default defineConfig({
  base: '/',  // Not base: './'
  // ... other config
})
```

### Backend Connection Issues
1. Check if backend is running on port 4000
2. Verify database connection in logs
3. Ensure no port conflicts

### Port Conflicts
```bash
# Kill processes on specific ports
lsof -ti :5173 | xargs kill -9  # Frontend
lsof -ti :4000 | xargs kill -9  # Backend
```

## 📝 Key Files

| File | Purpose |
|------|---------|
| `README.md` | Complete project documentation |
| `muralla-frontend/CLAUDE.md` | Frontend development guide |
| `docs/` | Detailed documentation |
| `vite.config.ts` | Vite configuration |
| `package.json` | Project dependencies |

## 🔄 Git Workflow

```bash
git status              # Check changes
git add .               # Stage changes  
git commit -m "message" # Commit changes
git push                # Push to remote
```

**Repository**: https://github.com/kavidoi/murallayes.git