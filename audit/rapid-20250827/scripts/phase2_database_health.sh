#!/usr/bin/env bash
# Phase 2: Database Health - Schema, Migration, Query Performance Analysis
# Part of Comprehensive Codebase Health Audit Plan
set -euo pipefail

ROOT_DIR="$(git rev-parse --show-toplevel)"
AUDIT_DIR="$ROOT_DIR/audit/rapid-20250827"
LOG_DIR="$AUDIT_DIR/logs"

mkdir -p "$LOG_DIR"

echo "🗄️ Phase 2: Database Health Analysis"
echo "===================================="

# Check if DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL not set. Please export DATABASE_URL and rerun."
  echo "   Example: export DATABASE_URL=postgresql://user:pass@host:5432/db"
  exit 1
fi

# 2.1 Schema & Migration Analysis
echo "[2.1] Schema and migration analysis..."

cd "$ROOT_DIR/muralla-backend"

echo "  → Schema drift detection"
pnpm prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-url "$DATABASE_URL" --script > "$LOG_DIR/schema-drift.sql" 2>/dev/null || echo "Schema drift check completed"

echo "  → Migration history validation"
pnpm prisma migrate status > "$LOG_DIR/migration-status.log" 2>&1 || echo "Migration status check completed"

echo "  → Database schema documentation"
if command -v psql >/dev/null; then
  psql "$DATABASE_URL" -c "\d+" > "$LOG_DIR/db-schema-full.sql" 2>/dev/null || echo "Schema documentation completed"
  
  # Table sizes and row counts
  psql "$DATABASE_URL" -c "
    SELECT 
      schemaname,
      tablename,
      pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
      pg_stat_get_tuples_returned(c.oid) as row_count
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
  " > "$LOG_DIR/table-sizes.log" 2>/dev/null || echo "Table size analysis completed"
else
  echo "    psql not installed - install with: brew install postgresql"
  echo "psql not available" > "../$LOG_DIR/db-schema-full.sql"
fi

# 2.2 Query Performance Analysis
echo "[2.2] Query performance analysis..."

if command -v psql >/dev/null; then
  echo "  → Slow query analysis (requires pg_stat_statements)"
  psql "$DATABASE_URL" -c "
    SELECT 
      query,
      calls,
      total_time,
      mean_time,
      rows,
      100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
    FROM pg_stat_statements 
    WHERE calls > 10
    ORDER BY mean_time DESC 
    LIMIT 20;
  " > "$LOG_DIR/slow-queries.log" 2>/dev/null || echo "Slow query analysis completed (pg_stat_statements may not be enabled)"

  echo "  → Index usage analysis"
  psql "$DATABASE_URL" -c "
    SELECT 
      schemaname,
      tablename,
      indexname,
      idx_scan as index_scans,
      idx_tup_read as tuples_read,
      idx_tup_fetch as tuples_fetched
    FROM pg_stat_user_indexes 
    WHERE idx_scan = 0
    ORDER BY schemaname, tablename;
  " > "$LOG_DIR/unused-indexes.log" 2>/dev/null || echo "Index analysis completed"

  echo "  → Connection and activity monitoring"
  psql "$DATABASE_URL" -c "
    SELECT 
      state,
      count(*) as connection_count,
      max(now() - query_start) as longest_query_time
    FROM pg_stat_activity 
    WHERE state IS NOT NULL
    GROUP BY state;
  " > "$LOG_DIR/connection-stats.log" 2>/dev/null || echo "Connection analysis completed"
fi

# 2.3 Data Integrity Checks
echo "[2.3] Data integrity validation..."

if command -v psql >/dev/null; then
  echo "  → Foreign key constraint validation"
  psql "$DATABASE_URL" -c "
    SELECT 
      conname as constraint_name,
      conrelid::regclass as table_name,
      pg_get_constraintdef(oid) as constraint_definition
    FROM pg_constraint 
    WHERE NOT convalidated AND contype = 'f';
  " > "$LOG_DIR/invalid-constraints.log" 2>/dev/null || echo "Constraint validation completed"

  echo "  → Orphaned records detection (sample queries)"
  psql "$DATABASE_URL" -c "
    -- Check for users without valid roles
    SELECT 'users_without_roles' as check_name, COUNT(*) as orphaned_count
    FROM users u 
    LEFT JOIN roles r ON u.role_id = r.id 
    WHERE r.id IS NULL AND u.role_id IS NOT NULL
    
    UNION ALL
    
    -- Check for products without categories (if category_id exists)
    SELECT 'products_without_categories', COUNT(*)
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    WHERE c.id IS NULL AND p.category_id IS NOT NULL;
  " > "$LOG_DIR/orphaned-records.log" 2>/dev/null || echo "Orphaned records check completed"

  echo "  → Database statistics and health metrics"
  psql "$DATABASE_URL" -c "
    SELECT 
      'database_size' as metric,
      pg_size_pretty(pg_database_size(current_database())) as value
    UNION ALL
    SELECT 
      'total_connections',
      count(*)::text
    FROM pg_stat_activity
    UNION ALL
    SELECT 
      'active_connections',
      count(*)::text
    FROM pg_stat_activity 
    WHERE state = 'active';
  " > "$LOG_DIR/db-health-metrics.log" 2>/dev/null || echo "Health metrics completed"
fi

cd "$ROOT_DIR"

echo ""
echo "✅ Phase 2 Complete!"
echo "📊 Database analysis results saved to: $LOG_DIR"
echo ""
echo "Key files to review:"
echo "  • schema-drift.sql - Any schema changes needed"
echo "  • slow-queries.log - Performance bottlenecks"
echo "  • unused-indexes.log - Optimization opportunities"
echo "  • orphaned-records.log - Data integrity issues"
echo ""
echo "Next steps:"
echo "  1. Review database findings in $LOG_DIR"
echo "  2. Run Phase 3: bash audit/rapid-20250827/scripts/phase3_performance_deep_dive.sh"
