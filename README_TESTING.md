# Frontend Testing Guide

This directory contains the test suite for the chat-next frontend.

## 🚀 Running Tests

### Unit & Integration Tests
Run tests using Vitest:
```bash
npm run test
```
For a single run:
```bash
npm run test:unit
```

### End-to-End (E2E) Tests
Run tests using Playwright:
```bash
npm run test:e2e
```
To view the visual report after tests complete:
```bash
npx playwright show-report
```

## 📁 Structure
- `tests/unit/`: Redux slices and utility functions.
- `tests/integration/`: API proxy and frontend-backend communication.
- `tests/e2e/`: Full user journeys (Auth, Admin Panel, Chat).

## 📝 Notes
- **E2E Requirements:** The backend server must be running on port 4000 and the frontend on port 3000 for E2E tests to pass.
- **Assets:** Registration tests use the dummy image at `tests/e2e/test-avatar.png`.
