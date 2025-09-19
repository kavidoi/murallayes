# Render Settings Configuration

## Backend Service (muralla-backend)
- **Root Directory**: `muralla-backend`
- **Build Command**: `npm ci --include=dev && npx prisma generate && npm run build`
- **Pre-Deploy Command**: `npx prisma migrate deploy`
- **Start Command**: `npm run start`

## Frontend Service (muralla-frontend)  
- **Root Directory**: (leave empty)
- **Build Command**: `npm ci && npm run build:prod`
- **Publish Directory**: `./dist`

## Important Notes:
1. Do NOT include the directory prefix in commands when Root Directory is set
2. Both services use npm, not pnpm
3. Make sure all secrets are set in Environment Variables section
