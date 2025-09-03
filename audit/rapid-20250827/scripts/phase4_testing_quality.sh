#!/bin/bash

# Phase 4: Testing & Quality Analysis
# Comprehensive test coverage, code quality, and QA automation analysis

set -e

ROOT_DIR="$(pwd)"
LOG_DIR="$ROOT_DIR/audit/rapid-20250827/logs"

echo "🧪 Phase 4: Testing & Quality Analysis"
echo "====================================="

# 4.1 Test Coverage Analysis
echo "[4.1] Test coverage analysis..."

echo "  → Frontend test coverage"
cd "$ROOT_DIR/muralla-frontend"
if [ -f "package.json" ] && grep -q "test" package.json; then
  # Run tests with coverage
  pnpm test --coverage --watchAll=false --passWithNoTests > "$LOG_DIR/frontend-test-coverage.txt" 2>&1 || echo "Frontend tests completed with issues"
  
  # Check for test files
  find src/ -name "*.test.*" -o -name "*.spec.*" | wc -l > "$LOG_DIR/frontend-test-count.txt"
  
  # Analyze test patterns
  grep -r "describe\|it\|test(" src/ 2>/dev/null | wc -l > "$LOG_DIR/frontend-test-cases.txt" || echo "0" > "$LOG_DIR/frontend-test-cases.txt"
else
  echo "No test configuration found" > "$LOG_DIR/frontend-test-coverage.txt"
  echo "0" > "$LOG_DIR/frontend-test-count.txt"
  echo "0" > "$LOG_DIR/frontend-test-cases.txt"
fi

echo "  → Backend test coverage"
cd "$ROOT_DIR/muralla-backend"
if [ -f "package.json" ] && grep -q "test" package.json; then
  # Run backend tests
  pnpm test --coverage --passWithNoTests > "$LOG_DIR/backend-test-coverage.txt" 2>&1 || echo "Backend tests completed with issues"
  
  # Check for test files
  find . -name "*.test.*" -o -name "*.spec.*" | wc -l > "$LOG_DIR/backend-test-count.txt"
  
  # API endpoint test coverage
  grep -r "describe\|it\|test(" . 2>/dev/null | wc -l > "$LOG_DIR/backend-test-cases.txt" || echo "0" > "$LOG_DIR/backend-test-cases.txt"
else
  echo "No test configuration found" > "$LOG_DIR/backend-test-coverage.txt"
  echo "0" > "$LOG_DIR/backend-test-count.txt"
  echo "0" > "$LOG_DIR/backend-test-cases.txt"
fi

cd "$ROOT_DIR"

# 4.2 Code Quality Metrics
echo "[4.2] Code quality metrics..."

echo "  → Complexity analysis"
# Cyclomatic complexity
if command -v npx >/dev/null; then
  npx --yes complexity-report muralla-frontend/src/ muralla-backend/src/ --format json > "$LOG_DIR/complexity-report.json" 2>/dev/null || echo "Complexity analysis completed"
fi

echo "  → Code duplication analysis (detailed)"
# More detailed duplication analysis
if command -v npx >/dev/null; then
  npx --yes jscpd --threshold 5 --reporters json,html --output "$LOG_DIR/" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null || echo "Duplication analysis completed"
fi

echo "  → Technical debt assessment"
# Count TODO, FIXME, HACK comments
grep -r "TODO\|FIXME\|HACK\|XXX" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null | wc -l > "$LOG_DIR/technical-debt-count.txt" || echo "0" > "$LOG_DIR/technical-debt-count.txt"
grep -r "TODO\|FIXME\|HACK\|XXX" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null > "$LOG_DIR/technical-debt-items.txt" || echo "No technical debt markers found" > "$LOG_DIR/technical-debt-items.txt"

# 4.3 API Testing & Documentation
echo "[4.3] API testing and documentation..."

echo "  → API endpoint discovery"
# Find API routes and endpoints
grep -r "app\.\(get\|post\|put\|delete\|patch\)" muralla-backend/ 2>/dev/null > "$LOG_DIR/api-endpoints.txt" || echo "No Express routes found" > "$LOG_DIR/api-endpoints.txt"
grep -r "router\.\(get\|post\|put\|delete\|patch\)" muralla-backend/ 2>/dev/null >> "$LOG_DIR/api-endpoints.txt" || echo "No router endpoints found" >> "$LOG_DIR/api-endpoints.txt"

echo "  → API documentation coverage"
# Check for OpenAPI/Swagger documentation
find muralla-backend/ -name "*swagger*" -o -name "*openapi*" -o -name "*.yaml" -o -name "*.yml" | grep -E "(api|doc)" > "$LOG_DIR/api-docs-files.txt" 2>/dev/null || echo "No API documentation found" > "$LOG_DIR/api-docs-files.txt"

echo "  → Postman/API test collections"
find . -name "*.postman*" -o -name "*insomnia*" -o -name "*thunder*" > "$LOG_DIR/api-test-collections.txt" 2>/dev/null || echo "No API test collections found" > "$LOG_DIR/api-test-collections.txt"

# 4.4 Frontend Quality Analysis
echo "[4.4] Frontend quality analysis..."

echo "  → Component analysis"
cd "$ROOT_DIR/muralla-frontend"
# Count components and their complexity
find src/ -name "*.tsx" -o -name "*.jsx" | wc -l > "$LOG_DIR/component-count.txt"
find src/ -name "*.tsx" -o -name "*.jsx" -exec wc -l {} + | sort -n | tail -10 > "$LOG_DIR/largest-components.txt"

echo "  → Hook usage analysis"
# Custom hooks analysis
grep -r "use[A-Z]" src/ 2>/dev/null | grep -v "node_modules" | wc -l > "$LOG_DIR/hook-usage-count.txt" || echo "0" > "$LOG_DIR/hook-usage-count.txt"
find src/ -name "use*.ts" -o -name "use*.tsx" | wc -l > "$LOG_DIR/custom-hooks-count.txt"

echo "  → State management analysis"
# Redux, Zustand, Context usage
grep -r "useSelector\|useDispatch\|createSlice" src/ 2>/dev/null | wc -l > "$LOG_DIR/redux-usage.txt" || echo "0" > "$LOG_DIR/redux-usage.txt"
grep -r "useContext\|createContext" src/ 2>/dev/null | wc -l > "$LOG_DIR/context-usage.txt" || echo "0" > "$LOG_DIR/context-usage.txt"
grep -r "zustand\|create(" src/ 2>/dev/null | wc -l > "$LOG_DIR/zustand-usage.txt" || echo "0" > "$LOG_DIR/zustand-usage.txt"

cd "$ROOT_DIR"

# 4.5 Accessibility & UX Analysis
echo "[4.5] Accessibility and UX analysis..."

echo "  → Accessibility audit"
# Check for accessibility attributes and patterns
grep -r "aria-\|role=\|alt=" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/accessibility-attributes.txt" || echo "0" > "$LOG_DIR/accessibility-attributes.txt"
grep -r "tabIndex\|onKeyDown\|onKeyPress" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/keyboard-navigation.txt" || echo "0" > "$LOG_DIR/keyboard-navigation.txt"

echo "  → Internationalization analysis"
# Check for i18n implementation
grep -r "useTranslation\|t(\|i18n" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/i18n-usage.txt" || echo "0" > "$LOG_DIR/i18n-usage.txt"
find muralla-frontend/ -name "*locale*" -o -name "*i18n*" -o -name "*translation*" | wc -l > "$LOG_DIR/i18n-files.txt"

echo "  → Form validation analysis"
# Form validation patterns
grep -r "validation\|validate\|yup\|zod\|joi" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/form-validation.txt" || echo "0" > "$LOG_DIR/form-validation.txt"

# 4.6 Error Handling & Monitoring
echo "[4.6] Error handling and monitoring..."

echo "  → Error boundary analysis"
# Error boundaries and error handling
grep -r "ErrorBoundary\|componentDidCatch\|getDerivedStateFromError" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/error-boundaries.txt" || echo "0" > "$LOG_DIR/error-boundaries.txt"

echo "  → Exception handling patterns"
# Try-catch blocks and error handling
grep -r "try\s*{" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null | wc -l > "$LOG_DIR/try-catch-blocks.txt" || echo "0" > "$LOG_DIR/try-catch-blocks.txt"
grep -r "\.catch(\|catch\s*(" muralla-frontend/src/ muralla-backend/src/ 2>/dev/null | wc -l > "$LOG_DIR/promise-error-handling.txt" || echo "0" > "$LOG_DIR/promise-error-handling.txt"

echo "  → Logging and monitoring setup"
# Check for logging libraries and monitoring
grep -r "winston\|pino\|bunyan\|sentry\|datadog" muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/logging-setup.txt" || echo "0" > "$LOG_DIR/logging-setup.txt"

# 4.7 Performance Testing Patterns
echo "[4.7] Performance testing patterns..."

echo "  → Load testing setup"
# Check for performance testing tools
find . -name "*load*test*" -o -name "*perf*test*" -o -name "*benchmark*" | wc -l > "$LOG_DIR/performance-tests.txt"
grep -r "autocannon\|artillery\|k6\|jmeter" . 2>/dev/null | wc -l >> "$LOG_DIR/performance-tests.txt" || echo "0" >> "$LOG_DIR/performance-tests.txt"

echo "  → Caching strategy analysis"
# Caching implementation
grep -r "cache\|redis\|memcached" muralla-backend/ 2>/dev/null | wc -l > "$LOG_DIR/caching-usage.txt" || echo "0" > "$LOG_DIR/caching-usage.txt"
grep -r "useMemo\|useCallback\|React.memo" muralla-frontend/src/ 2>/dev/null | wc -l > "$LOG_DIR/react-memoization.txt" || echo "0" > "$LOG_DIR/react-memoization.txt"

echo ""
echo "✅ Phase 4 Complete!"
echo "📊 Testing and quality analysis results saved to: $LOG_DIR"
echo ""
echo "Key quality files to review:"
echo "  • frontend-test-coverage.txt - Test coverage metrics"
echo "  • complexity-report.json - Code complexity analysis"
echo "  • technical-debt-items.txt - TODO/FIXME items to address"
echo "  • api-endpoints.txt - API surface area analysis"
echo "  • accessibility-attributes.txt - A11y implementation status"
echo ""
echo "Next steps:"
echo "  1. Review testing gaps and implement missing test coverage"
echo "  2. Address technical debt items identified"
echo "  3. Run Phase 5: bash audit/rapid-20250827/scripts/phase5_infrastructure_devops.sh"
