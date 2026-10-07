# AI Test Agent Instructions — Stealthy Note

## Overview

These instructions tell an AI agent how to test the Stealthy Note project using this harness.

## Mandatory Cycle

Every testing task must follow:

```
Analyze → Plan → Test → Record → Verify → Report
```

## Step 1: Understand the Project

Before testing anything:

1. Read `harness/PROJECT_OVERVIEW.md`
2. Read `harness/ARCHITECTURE.md`
3. Read `harness/features/README.md`
4. Read the relevant feature doc in `harness/features/<feature>/`

## Step 2: Find Test Scenarios and Cases

1. Check `harness/test-scenarios/` for the relevant scenario file
2. Check `harness/test-cases/<module>/` for detailed test cases
3. Check `harness/reports/traceability.md` for requirement-to-test mapping

## Step 3: Run Existing Tests

```bash
# Unit tests
cd /home/user/Project-Next-Chat
npx vitest run

# E2E tests (requires dev server)
npm run dev &
npm run test:e2e
```

## Step 4: Generate New Tests

When test coverage is missing:

1. Read the feature documentation
2. Read the API route source code
3. Follow `harness/ai/test-generation-rules.md`
4. Create test cases in `harness/test-cases/<module>/`
5. If automating, use Vitest + Testing Library for unit tests
6. If automating, use Playwright for E2E tests

## Step 5: Record Results

1. Update `harness/test-results/latest/execution-RUN-XXX.md`
2. Mark each test case status: PASS / FAIL / BLOCKED / NOT_EXECUTED
3. For failures, create bug reports in `harness/bugs/open/`
4. Save evidence (logs, screenshots, API responses) in `harness/evidence/`

## Step 6: Verify

1. Re-run failed tests to confirm
2. Check that test data is correct
3. Check that assertions are meaningful (not just status codes)

## Step 7: Report

1. Update `harness/reports/test-summary.md`
2. Update `harness/reports/coverage.md`
3. Update `harness/TESTING_STATUS.md`

## Rules

### DO
- Read source code before writing tests
- Test what the code actually does, not what you assume
- Use real API endpoints and data structures from the codebase
- Use environment variables for secrets (never hardcode)
- Mark untested items as NOT_EXECUTED
- Create bug reports for discovered issues
- Use IDs (REQ-xxx, FEAT-xxx, SCN-xxx, TC-xxx, BUG-xxx)

### DON'T
- Claim a test passed without executing it
- Invent functionality that doesn't exist
- Store real passwords, API keys, or tokens
- Modify application source code unless required for testing
- Create empty files with no value
- Duplicate information across files

## Project Structure Reference

```
/home/user/Project-Next-Chat/
├── app/
│   ├── (auth)/          # Login, forgot, verify pages
│   ├── admin/           # Admin dashboard pages
│   ├── api/v1/          # All API routes
│   │   ├── user/        # User APIs
│   │   ├── chat/        # Chat APIs
│   │   ├── admin/       # Admin APIs
│   │   └── widget/      # Widget APIs
│   ├── chat/            # Chat page
│   └── u/               # Board page
├── components/          # React components
├── lib/                 # Utilities and server code
│   ├── server/          # Server-side code (auth, db, models)
│   └── *.js             # Client-side utilities
├── redux/               # State management
├── tests/               # Test files
│   ├── e2e/             # Playwright tests
│   └── __tests__/       # Vitest tests (co-located)
└── harness/             # THIS FOLDER - testing harness
```

## Test Commands

```bash
# Install dependencies
npm install

# Run unit tests (no server needed)
npx vitest run

# Run unit tests in watch mode
npm run test

# Run E2E tests (needs dev server on port 3000)
npm run test:e2e

# Run specific test file
npx vitest run path/to/test.test.jsx

# Run specific E2E spec
npm run test:e2e -- tests/e2e/workspace.spec.js --workers=1
```