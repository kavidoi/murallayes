#!/bin/bash
# Frontend Environment Variables Setup Script for Railway

echo "Setting up Frontend Environment Variables..."

echo "1. Link to frontend service:"
echo "railway link"
echo "   -> Select: kavidoi's Projects"
echo "   -> Select: murallayes" 
echo "   -> Select: production"
echo "   -> Select: Frontend"

echo ""
echo "2. Update frontend API URL with actual backend URL:"
echo "railway variables --set \"VITE_API_BASE_URL=https://YOUR-BACKEND-URL.railway.app\""
echo ""
echo "   (Replace YOUR-BACKEND-URL with the actual backend domain from step 4 of backend setup)"

echo ""
echo "3. Deploy frontend with new variables:"
echo "railway up"

echo ""
echo "Current frontend variable already set:"
echo "VITE_API_BASE_URL=https://web-production-5dc2.up.railway.app"
