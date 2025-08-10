#!/bin/bash
# Backend Environment Variables Setup Script for Railway

echo "Setting up Backend Environment Variables..."

# Link to backend service first
echo "1. Link to backend service:"
echo "railway link"
echo "   -> Select: kavidoi's Projects"
echo "   -> Select: murallayes" 
echo "   -> Select: production"
echo "   -> Select: Backend"

echo ""
echo "2. Set backend environment variables:"
echo "railway variables --set \"DATABASE_URL=\${POSTGRES_URL}\""
echo "railway variables --set \"JWT_SECRET=muralla-super-secret-jwt-key-2024-production-secure-long-random-string\""
echo "railway variables --set \"JWT_EXPIRES_IN=60m\""

echo ""
echo "3. Deploy backend with new variables:"
echo "railway up"

echo ""
echo "4. Get backend public URL for frontend:"
echo "railway domain"
