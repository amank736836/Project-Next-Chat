#!/bin/bash
# Run all unit tests and save results
# Usage: bash harness/automation/scripts/run-unit-tests.sh

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
RESULTS_DIR="$PROJECT_ROOT/harness/test-results/latest"

mkdir -p "$RESULTS_DIR"

echo "=== Running Unit Tests ==="
echo "Date: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "Commit: $(cd "$PROJECT_ROOT" && git rev-parse --short HEAD)"
echo ""

cd "$PROJECT_ROOT"

# Run tests and capture output
npx vitest run 2>&1 | tee "$RESULTS_DIR/unit-test-output.txt"

echo ""
echo "Results saved to: $RESULTS_DIR/unit-test-output.txt"