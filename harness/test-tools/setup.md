# Test Tools Setup — Stealthy Note

## Vitest (Unit & Integration Tests)

- **Purpose**: Run unit and integration tests
- **Version**: 4.1+
- **Configuration**: `vitest.config.js`
- **Setup file**: `vitest.setup.js` (imports @testing-library/jest-dom)

### How to Run

```bash
# Watch mode (re-runs on file changes)
npm run test

# Single run
npm run test:unit

# Run specific test file
npx vitest run path/to/test.test.jsx

# Run with coverage
npx vitest run --coverage
```

### Test Include Patterns
- `tests/unit/**/*.{test,spec}.{js,jsx,ts,tsx}`
- `tests/integration/**/*.{test,spec}.{js,jsx,ts,tsx}`
- `**/__tests__/*.{test,spec}.{js,jsx,ts,tsx}`

### Test Exclude Patterns
- `tests/e2e/**`
- `node_modules/**`
- `dist/**`
- `.next/**`

## Playwright (E2E Tests)

- **Purpose**: End-to-end browser testing
- **Version**: 1.59+
- **Configuration**: `playwright.config.js`
- **Browser**: Chromium (Desktop Chrome)

### How to Run

```bash
# Install browser
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run specific spec
npm run test:e2e -- tests/e2e/workspace.spec.js --workers=1

# Run with visible browser
npx playwright test --headed

# View HTML report
npx playwright show-report
```

### Prerequisites
- Frontend dev server running on port 3000 (`npm run dev`)
- For full integration: backend on port 4000, MongoDB configured
- For UI-only testing: API routes stubbed in browser (no backend needed)

## MSW (API Mocking)

- **Purpose**: Mock API responses in tests
- **Version**: 2.13+
- **Usage**: Used in Vitest tests for mocking HTTP requests

## @testing-library/react

- **Purpose**: React component testing utilities
- **Version**: 16.3+
- **Key APIs**: render, screen, fireEvent, waitFor, within

## @testing-library/jest-dom

- **Purpose**: Custom DOM matchers for Vitest
- **Version**: 6.9+
- **Matchers**: toBeVisible, toHaveTextContent, toHaveAttribute, etc.