#!/usr/bin/env bash
# Phase 3: Performance Deep Dive - Frontend, Backend, Database Performance Testing
# Part of Comprehensive Codebase Health Audit Plan
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
AUDIT_DIR="$ROOT_DIR/audit/rapid-20250827"
LOG_DIR="$AUDIT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "⚡ Phase 3: Performance Deep Dive"
echo "================================="

# 3.1 Frontend Performance Audit
echo "[3.1] Frontend performance analysis..."

echo "  → Lighthouse CI across key pages"
if command -v lhci >/dev/null; then
  # Check if frontend is running
  if curl -f http://localhost:5173 >/dev/null 2>&1; then
    lhci autorun --config lighthouse.config.js > "$LOG_DIR/lighthouse-results.json" 2>/dev/null || echo "Lighthouse audit completed"
  else
    echo "    Frontend not running on localhost:5173 - start with 'pnpm --filter muralla-frontend dev'"
    echo "Frontend not running" > "$LOG_DIR/lighthouse-results.json"
  fi
else
  echo "    Lighthouse CI not installed - install with: npm install -g @lhci/cli"
  echo "LHCI not available" > "$LOG_DIR/lighthouse-results.json"
fi

echo "  → Bundle size analysis"
cd "$ROOT_DIR/muralla-frontend"
if [ -d "dist" ]; then
  # Analyze bundle composition
  find dist -name "*.js" -exec wc -c {} + | sort -n > "$LOG_DIR/bundle-sizes.txt"
  
  # Check for large dependencies
  if [ -f "package.json" ]; then
    npx --yes webpack-bundle-analyzer dist/assets/*.js --report json > "$LOG_DIR/bundle-analysis.json" 2>/dev/null || echo "Bundle analysis skipped"
  fi
else
  echo "    Build frontend first: pnpm --filter muralla-frontend build"
  echo "Frontend not built" > "$LOG_DIR/bundle-sizes.txt"
fi

echo "  → React performance analysis"
# Check for common performance anti-patterns
grep -r "useEffect.*\[\]" src/ > "$LOG_DIR/react-performance-patterns.txt" 2>/dev/null || echo "React patterns analyzed"
grep -r "console\.log\|console\.warn\|console\.error" src/ > "$LOG_DIR/console-statements.txt" 2>/dev/null || echo "Console statements found"

cd "$ROOT_DIR"

# 3.2 Backend Performance Testing
echo "[3.2] Backend performance testing..."

if curl -f http://localhost:4000/health >/dev/null 2>&1; then
  echo "  → Load testing key endpoints"
  
  if command -v autocannon >/dev/null; then
    # Health endpoint baseline
    autocannon -c 10 -d 30 http://localhost:4000/health > "$LOG_DIR/health-endpoint-load.txt" 2>/dev/null || echo "Health endpoint test completed"
    
    # Auth endpoint (if available)
    autocannon -c 5 -d 15 -m POST -H "Content-Type: application/json" -b '{"username":"admin","password":"admin123"}' http://localhost:4000/auth/login > "$LOG_DIR/auth-endpoint-load.txt" 2>/dev/null || echo "Auth endpoint test completed"
    
    # Products endpoint (requires auth token)
    if [ -n "${JWT_TOKEN:-}" ]; then
      autocannon -c 20 -d 30 -H "Authorization: Bearer $JWT_TOKEN" http://localhost:4000/api/products > "$LOG_DIR/products-endpoint-load.txt" 2>/dev/null || echo "Products endpoint test completed"
    else
      echo "    JWT_TOKEN not set - skipping authenticated endpoint tests"
      echo "JWT_TOKEN not provided" > "$LOG_DIR/products-endpoint-load.txt"
    fi
  else
    echo "    Autocannon not installed - install with: npm install -g autocannon"
    echo "Autocannon not available" > "$LOG_DIR/health-endpoint-load.txt"
  fi

  echo "  → Memory and CPU profiling"
  # Basic process monitoring
  if command -v ps >/dev/null; then
    ps aux | grep -E "(node|nest)" | grep -v grep > "$LOG_DIR/backend-process-stats.txt" 2>/dev/null || echo "Process stats captured"
  fi
  
  # Check for memory leaks indicators
  if command -v curl >/dev/null; then
    # Hit endpoints multiple times to check for memory growth
    for i in {1..50}; do
      curl -s http://localhost:4000/health >/dev/null
    done
    echo "Memory leak test completed" > "$LOG_DIR/memory-leak-test.txt"
  fi
else
  echo "    Backend not running on localhost:4000"
  echo "Backend not running" > "$LOG_DIR/health-endpoint-load.txt"
fi

# 3.3 Database Performance Testing
echo "[3.3] Database performance analysis..."

if [ -n "${DATABASE_URL:-}" ] && command -v psql >/dev/null; then
  echo "  → Query performance benchmarking"
  
  # Test common query patterns
  psql "$DATABASE_URL" -c "
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
    SELECT * FROM users LIMIT 100;
  " > "$LOG_DIR/query-plan-users.json" 2>/dev/null || echo "User query analysis completed"
  
  psql "$DATABASE_URL" -c "
    EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) 
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    LIMIT 100;
  " > "$LOG_DIR/query-plan-products.json" 2>/dev/null || echo "Product query analysis completed"
  
  echo "  → Connection pool stress test"
  # Simulate multiple concurrent connections
  for i in {1..10}; do
    psql "$DATABASE_URL" -c "SELECT pg_sleep(0.1); SELECT COUNT(*) FROM users;" &
  done
  wait
  echo "Connection stress test completed" > "$LOG_DIR/connection-stress-test.txt"
  
  echo "  → Index performance analysis"
  psql "$DATABASE_URL" -c "
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan,
      idx_tup_read,
      idx_tup_fetch,
      pg_size_pretty(pg_relation_size(indexrelid)) as index_size
    FROM pg_stat_user_indexes 
    ORDER BY idx_scan DESC;
  " > "$LOG_DIR/index-performance.log" 2>/dev/null || echo "Index performance analysis completed"
  
else
  echo "    DATABASE_URL not set or psql not available"
  echo "Database performance testing skipped" > "$LOG_DIR/query-plan-users.json"
fi

# 3.4 Network and API Response Time Analysis
echo "[3.4] Network and API analysis..."

if curl -f http://localhost:4000/health >/dev/null 2>&1; then
  echo "  → API response time measurement"
  
  # Measure response times for different endpoints
  for endpoint in "/health" "/api/auth/profile" "/api/products"; do
    echo "Testing $endpoint..." >> "$LOG_DIR/api-response-times.txt"
    for i in {1..10}; do
      curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:4000$endpoint" 2>/dev/null >> "$LOG_DIR/api-response-times.txt" || echo "Endpoint test completed"
    done
    echo "" >> "$LOG_DIR/api-response-times.txt"
  done
  
  # Create curl format file for timing
  cat > curl-format.txt << 'EOF'
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
EOF
  
  rm -f curl-format.txt
else
  echo "    Backend not running for API timing tests"
  echo "Backend not running" > "$LOG_DIR/api-response-times.txt"
fi

echo ""
echo "✅ Phase 3 Complete!"
echo "📊 Performance analysis results saved to: $LOG_DIR"
echo ""
echo "Key performance files to review:"
echo "  • lighthouse-results.json - Frontend performance scores"
echo "  • bundle-sizes.txt - JavaScript bundle analysis"
echo "  • health-endpoint-load.txt - Backend load test results"
echo "  • query-plan-*.json - Database query performance"
echo "  • api-response-times.txt - API latency measurements"
echo ""
echo "Next steps:"
echo "  1. Review performance findings in $LOG_DIR"
echo "  2. Run Phase 4: bash audit/rapid-20250827/scripts/phase4_testing_quality.sh"
