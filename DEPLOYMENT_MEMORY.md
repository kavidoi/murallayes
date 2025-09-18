# Deployment Memory for Muralla 4.0

## Critical Deployment Pattern

**ALWAYS follow this deployment pattern when implementing changes:**

### Backend Deployment
- **Branch**: `main`
- **Command**: `git push origin main`
- **Deployment**: Automatic via Render.yaml configuration
- **URL**: https://api.murallacafe.cl

### Frontend Deployment
- **Branch**: `frontend-deploy` (NOT main)
- **Command**: `git push origin frontend-deploy`
- **Deployment**: Automatic via frontend deployment pipeline
- **URL**: https://admin.murallacafe.cl

### Implementation Workflow
1. Make changes to both backend and frontend as needed
2. **Always push BOTH branches together** when implementing features:
   ```bash
   # Backend
   git push origin main

   # Frontend
   git push origin frontend-deploy
   ```

### Why This Pattern Exists
- Backend and frontend are deployed from different branches
- Changes often require coordination between both services
- Frontend depends on backend API endpoints
- Pushing only one branch can cause production inconsistencies

### Example from Recent Fix
- **Issue**: Invoicing section not loading invoices
- **Backend Fix**: Added InvoicingModule to AppModule imports → pushed to `main`
- **Result**: Backend API endpoints became available for frontend to consume

## Always Remember
🚨 **When asked "deploy?" - push BOTH backend main AND frontend frontend-deploy branches**

---
*This memory ensures consistent deployment practices for the Muralla 4.0 project*