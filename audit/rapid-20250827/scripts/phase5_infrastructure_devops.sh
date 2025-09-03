#!/bin/bash

# Phase 5: Infrastructure & DevOps Analysis
# Deployment, CI/CD, monitoring, and operational readiness assessment

set -e

ROOT_DIR="$(pwd)"
LOG_DIR="$ROOT_DIR/audit/rapid-20250827/logs"

echo "🏗️ Phase 5: Infrastructure & DevOps Analysis"
echo "============================================="

# 5.1 Deployment Configuration Analysis
echo "[5.1] Deployment configuration analysis..."

echo "  → Docker and containerization"
# Check for Docker files and container configuration
find . -name "Dockerfile*" -o -name "docker-compose*" -o -name ".dockerignore" > "$LOG_DIR/docker-files.txt"
if [ -f "Dockerfile" ]; then
  echo "Dockerfile found" > "$LOG_DIR/docker-analysis.txt"
  grep -E "FROM|RUN|COPY|EXPOSE|CMD|ENTRYPOINT" Dockerfile >> "$LOG_DIR/docker-analysis.txt" 2>/dev/null || echo "Docker analysis completed"
else
  echo "No Dockerfile found" > "$LOG_DIR/docker-analysis.txt"
fi

echo "  → Cloud deployment configuration"
# Check for cloud deployment files
find . -name "render.yaml" -o -name "vercel.json" -o -name "netlify.toml" -o -name "railway.json" -o -name "nixpacks.toml" > "$LOG_DIR/cloud-deploy-files.txt"

# Analyze deployment configurations
if [ -f "render.yaml" ]; then
  echo "Render deployment configuration:" > "$LOG_DIR/render-config-analysis.txt"
  grep -E "name:|buildCommand:|startCommand:|env:" render.yaml >> "$LOG_DIR/render-config-analysis.txt" 2>/dev/null || echo "Render config analyzed"
fi

if [ -f "muralla-backend/nixpacks.toml" ]; then
  echo "Nixpacks configuration found" >> "$LOG_DIR/render-config-analysis.txt"
  cat muralla-backend/nixpacks.toml >> "$LOG_DIR/render-config-analysis.txt" 2>/dev/null || echo "Nixpacks config analyzed"
fi

echo "  → Environment configuration"
# Check environment files and configuration
find . -name ".env*" -o -name "*.env" | head -10 > "$LOG_DIR/env-files.txt"
if [ -f ".env.example" ]; then
  echo "Environment variables template:" > "$LOG_DIR/env-analysis.txt"
  wc -l .env.example >> "$LOG_DIR/env-analysis.txt"
  grep -c "=" .env.example >> "$LOG_DIR/env-analysis.txt" 2>/dev/null || echo "0" >> "$LOG_DIR/env-analysis.txt"
else
  echo "No .env.example found" > "$LOG_DIR/env-analysis.txt"
fi

# 5.2 CI/CD Pipeline Analysis
echo "[5.2] CI/CD pipeline analysis..."

echo "  → GitHub Actions workflows"
if [ -d ".github/workflows" ]; then
  find .github/workflows -name "*.yml" -o -name "*.yaml" > "$LOG_DIR/github-workflows.txt"
  echo "GitHub Actions workflows found:" > "$LOG_DIR/cicd-analysis.txt"
  ls -la .github/workflows/ >> "$LOG_DIR/cicd-analysis.txt" 2>/dev/null || echo "Workflows listed"
  
  # Analyze workflow content
  for workflow in .github/workflows/*.yml .github/workflows/*.yaml; do
    if [ -f "$workflow" ]; then
      echo "=== $(basename $workflow) ===" >> "$LOG_DIR/cicd-analysis.txt"
      grep -E "name:|on:|jobs:|runs-on:|steps:" "$workflow" >> "$LOG_DIR/cicd-analysis.txt" 2>/dev/null || echo "Workflow analyzed"
    fi
  done
else
  echo "No GitHub Actions workflows found" > "$LOG_DIR/github-workflows.txt"
  echo "No CI/CD pipelines configured" > "$LOG_DIR/cicd-analysis.txt"
fi

echo "  → Build and deployment scripts"
# Check for build and deployment scripts
find . -name "deploy*" -o -name "build*" -o -name "*deploy*" -type f | grep -E "\.(sh|js|ts|py)$" > "$LOG_DIR/deploy-scripts.txt"
find scripts/ -name "*.sh" 2>/dev/null >> "$LOG_DIR/deploy-scripts.txt" || echo "No scripts directory"

echo "  → Package manager and dependency management"
# Analyze package managers and lockfiles
find . -name "package-lock.json" -o -name "pnpm-lock.yaml" -o -name "yarn.lock" > "$LOG_DIR/lockfiles.txt"
if [ -f "pnpm-workspace.yaml" ]; then
  echo "Monorepo configuration:" > "$LOG_DIR/monorepo-analysis.txt"
  cat pnpm-workspace.yaml >> "$LOG_DIR/monorepo-analysis.txt"
else
  echo "No monorepo configuration" > "$LOG_DIR/monorepo-analysis.txt"
fi

# 5.3 Monitoring and Observability
echo "[5.3] Monitoring and observability..."

echo "  → Application monitoring setup"
# Check for monitoring and logging libraries
grep -r "winston\|pino\|bunyan\|console\." muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/logging-implementation.txt" || echo "0" > "$LOG_DIR/logging-implementation.txt"
grep -r "sentry\|datadog\|newrelic\|honeycomb" . 2>/dev/null | wc -l > "$LOG_DIR/monitoring-tools.txt" || echo "0" > "$LOG_DIR/monitoring-tools.txt"

echo "  → Health check endpoints"
# Check for health check implementations
grep -r "/health\|/status\|/ping" muralla-backend/ 2>/dev/null > "$LOG_DIR/health-endpoints.txt" || echo "No health endpoints found" > "$LOG_DIR/health-endpoints.txt"

echo "  → Error tracking and alerting"
# Check for error tracking setup
grep -r "try.*catch\|\.catch(" muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/error-handling-backend.txt" || echo "0" > "$LOG_DIR/error-handling-backend.txt"
grep -r "ErrorBoundary\|componentDidCatch" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/error-handling-frontend.txt" || echo "0" > "$LOG_DIR/error-handling-frontend.txt"

# 5.4 Security and Compliance
echo "[5.4] Security and compliance..."

echo "  → Security headers and middleware"
# Check for security middleware
grep -r "helmet\|cors\|rate.*limit" muralla-backend/ 2>/dev/null > "$LOG_DIR/security-middleware.txt" || echo "No security middleware found" > "$LOG_DIR/security-middleware.txt"

echo "  → SSL/TLS configuration"
# Check for HTTPS/SSL configuration
grep -r "https\|ssl\|tls" . --include="*.js" --include="*.ts" --include="*.yaml" --include="*.yml" 2>/dev/null | wc -l > "$LOG_DIR/ssl-config.txt" || echo "0" > "$LOG_DIR/ssl-config.txt"

echo "  → Authentication and authorization"
# Check for auth implementation
grep -r "jwt\|passport\|auth" muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/auth-implementation.txt" || echo "0" > "$LOG_DIR/auth-implementation.txt"
grep -r "middleware.*auth\|protect.*route" muralla-backend/ 2>/dev/null >> "$LOG_DIR/auth-implementation.txt" || echo "Auth analysis completed"

# 5.5 Database and Data Management
echo "[5.5] Database and data management..."

echo "  → Database migration strategy"
# Check Prisma migrations
if [ -d "muralla-backend/prisma/migrations" ]; then
  find muralla-backend/prisma/migrations -name "*.sql" | wc -l > "$LOG_DIR/migration-count.txt"
  ls -la muralla-backend/prisma/migrations/ | tail -5 > "$LOG_DIR/recent-migrations.txt"
else
  echo "0" > "$LOG_DIR/migration-count.txt"
  echo "No migrations found" > "$LOG_DIR/recent-migrations.txt"
fi

echo "  → Backup and recovery setup"
# Check for backup scripts and strategies
find . -name "*backup*" -o -name "*restore*" | grep -E "\.(sh|js|ts|py)$" > "$LOG_DIR/backup-scripts.txt"
grep -r "backup\|dump\|restore" scripts/ 2>/dev/null >> "$LOG_DIR/backup-scripts.txt" || echo "No backup scripts in scripts/"

echo "  → Data seeding and fixtures"
# Check for data seeding
find . -name "*seed*" -o -name "*fixture*" -o -name "*sample*" | grep -E "\.(js|ts|sql)$" > "$LOG_DIR/seed-files.txt"
grep -r "seed\|fixture" muralla-backend/ 2>/dev/null | wc -l >> "$LOG_DIR/seed-files.txt" || echo "0" >> "$LOG_DIR/seed-files.txt"

# 5.6 Performance and Scalability
echo "[5.6] Performance and scalability..."

echo "  → Caching strategy"
# Check for caching implementation
grep -r "redis\|memcached\|cache" muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/caching-strategy.txt" || echo "0" > "$LOG_DIR/caching-strategy.txt"
grep -r "Cache-Control\|ETag\|expires" . 2>/dev/null | wc -l >> "$LOG_DIR/caching-strategy.txt" || echo "0" >> "$LOG_DIR/caching-strategy.txt"

echo "  → Load balancing and scaling"
# Check for load balancing configuration
grep -r "load.*balanc\|cluster\|pm2" . 2>/dev/null | wc -l > "$LOG_DIR/scaling-config.txt" || echo "0" > "$LOG_DIR/scaling-config.txt"

echo "  → Resource limits and optimization"
# Check for resource configuration
grep -r "memory\|cpu\|limit" render.yaml nixpacks.toml 2>/dev/null > "$LOG_DIR/resource-limits.txt" || echo "No resource limits configured" > "$LOG_DIR/resource-limits.txt"

# 5.7 Documentation and Runbooks
echo "[5.7] Documentation and runbooks..."

echo "  → Deployment documentation"
# Check for deployment and operational documentation
find . -name "*deploy*" -o -name "*setup*" -o -name "*install*" | grep -E "\.(md|txt|rst)$" > "$LOG_DIR/deploy-docs.txt"
find docs/ -name "*.md" 2>/dev/null >> "$LOG_DIR/deploy-docs.txt" || echo "No docs directory"

echo "  → Operational runbooks"
# Check for operational documentation
find . -name "*runbook*" -o -name "*troubleshoot*" -o -name "*incident*" | grep -E "\.(md|txt)$" > "$LOG_DIR/runbooks.txt"
grep -r "troubleshoot\|incident\|outage" . --include="*.md" 2>/dev/null | wc -l >> "$LOG_DIR/runbooks.txt" || echo "0" >> "$LOG_DIR/runbooks.txt"

echo "  → API and integration documentation"
# Check for API documentation
find . -name "*api*" -o -name "*swagger*" -o -name "*openapi*" | grep -E "\.(md|yaml|yml|json)$" > "$LOG_DIR/api-documentation.txt"

echo ""
echo "✅ Phase 5 Complete!"
echo "📊 Infrastructure and DevOps analysis results saved to: $LOG_DIR"
echo ""
echo "Key infrastructure files to review:"
echo "  • cicd-analysis.txt - CI/CD pipeline assessment"
echo "  • docker-analysis.txt - Containerization status"
echo "  • render-config-analysis.txt - Cloud deployment setup"
echo "  • monitoring-tools.txt - Observability implementation"
echo "  • security-middleware.txt - Security posture"
echo ""
echo "Next steps:"
echo "  1. Review infrastructure gaps and implement missing components"
echo "  2. Set up proper monitoring and alerting"
echo "  3. Run Phase 6: bash audit/rapid-20250827/scripts/phase6_final_report.sh"
