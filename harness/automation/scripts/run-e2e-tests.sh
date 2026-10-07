#!/bin/bash
# Run E2E tests and save results
# Usage: bash harness/automation/scripts/run-e2e-tests.sh
# Prerequisites: npm run dev (in another terminal)

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/harness/test-results/latest"

mkdir -p "$RESULTS_DIR"

echo "=== Running E2E Tests ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Commit: $(cd "$PROJECT_ROOT" && git rev-parse --short HEAD)"
echo "NOTE: Requires dev server running on port 3000"
echo ""

cd "$PROJECT_ROOT"

# Install browser if needed
npx playwright install chromium 2>/dev/null || true

# Run tests
npx test:e2e 2>&1 | tee "$RESULTS_DIR/e2e-test-output.txt"

echo ""
echo "Results saved to: $RESULTS_DIR/e2e-test-output.txt"