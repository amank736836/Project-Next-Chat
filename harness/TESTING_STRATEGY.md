# Testing Strategy — Stealthy Note

## Approach

The testing strategy follows a pyramid approach:

```
        ┌───────────┐
        │    E2E    │  ← Playwright (browser journeys)
        │   (few)   │
        ├───────────┤
        │Integration│  ← RTK Query, API proxy, socket
        ├───────────┤
        │   Unit    │  ← Vitest + Testing Library + jsdom
        │  (many)   │
        └───────────┘
```

## Test Levels

### 1. Unit Tests (Vitest)
- **Location**: `**/__tests__/*.test.{js,jsx}` and `tests/unit/`
- **Framework**: Vitest 4 + @testing-library/react + jsdom
- **Run**: `npm run test:unit` or `npm run test`
- **Coverage**: Components, Redux slices, utilities, validators, brand tokens
- **Current**: 9 test files, 37 tests, all passing

### 2. Integration Tests (Vitest)
- **Location**: `tests/integration/`
- **Framework**: Vitest + MSW for API mocking
- **Coverage**: API proxy routing, RTK Query endpoints, frontend-backend communication

### 3. E2E Tests (Playwright)
- **Location**: `tests/e2e/`
- **Framework**: Playwright 1.59 with Chromium
- **Run**: `npm run test:e2e`
- **Coverage**: Workspace UI, board page, admin panel, chat flows
- **Current**: 2 spec files (workspace.spec.js, board.spec.js)

### 4. API Tests
- **Approach**: Test Next.js API routes directly via HTTP
- **Tools**: curl, fetch, or automated scripts
- **Coverage**: All REST endpoints

### 5. Security Tests
- **Focus**: Authentication bypass, IDOR, injection, token handling
- **Approach**: Manual + automated scripts

### 6. Performance Tests
- **Focus**: API response times, database query performance, page load times
- **Tools**: Built-in timing, Lighthouse

## Testing Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1+ | Unit & integration test runner |
| @testing-library/react | 16.3+ | React component testing |
| @testing-library/jest-dom | 6.9+ | DOM matchers |
| Playwright | 1.59+ | E2E browser testing |
| MSW | 2.13+ | API mocking |
| jsdom | 29+ | Browser environment |

## Environment Requirements

### Unit Tests
- No database required
- No backend server required
- Run in jsdom environment

### E2E Tests
- Frontend dev server on port 3000 (`npm run dev`)
- For full integration: backend on port 4000, MongoDB configured
- For UI-only: API routes stubbed in browser (no backend needed)

### API Tests
- MongoDB configured and running
- Environment variables set (see `.env.example`)

## Test Commands

```bash
# Run all unit tests (watch mode)
npm run test

# Run all unit tests (single run)
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run E2E with visible browser
npx playwright test --headed

# Run specific E2E spec
npm run test:e2e -- tests/e2e/workspace.spec.js --workers=1

# View E2E report
npx playwright show-report
```

## What Is NOT Covered

- Real-time socket message delivery (requires live backend)
- Cloudinary file upload (requires credentials)
- Email sending (requires SMTP credentials)
- NVIDIA/Gemini AI responses (requires API keys)
- Production deployment verification
- Load/stress testing
- Accessibility audit (automated)
- Cross-browser testing (currently Chromium only)