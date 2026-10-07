# Test Generation Rules — Stealthy Note

## Rule 1: Read Before Write

Always read the source code before generating tests. Never generate tests based on assumptions.

## Rule 2: Use Actual Endpoints

Use the actual API paths from `app/api/v1/`. Don't invent endpoints.

## Rule 3: Match Data Structures

Use the actual field names from the Mongoose models and API responses.

## Rule 4: Follow Naming Conventions

- Test Case IDs: `TC-<MODULE>-<NUMBER>`
- Test Scenarios: `SCN-<TYPE>-<NUMBER>`
- Bug IDs: `BUG-<NUMBER>`

## Rule 5: Separate Documentation from Results

- Test cases describe what SHOULD happen
- Test results describe what DID happen
- Never mark a test as PASS without evidence

## Rule 6: Use Placeholders for Secrets

```javascript
// WRONG
const password = "MyRealPassword123";

// RIGHT
const password = process.env.TEST_USER_PASSWORD || "test-password-placeholder";
```

## Rule 7: Cover All Response Codes

For each API endpoint, test:
- 200/201: Success
- 400: Bad request (missing/invalid fields)
- 401: Unauthorized (no token)
- 403: Forbidden (wrong permissions)
- 404: Not found
- 500: Server error

## Rule 8: Test Business Rules

For each business rule in `requirements/business-rules.md`:
- Verify the rule is enforced
- Verify violations are rejected
- Test boundary conditions

## Rule 9: Reuse Existing Infrastructure

- Use Vitest for unit tests (already configured)
- Use @testing-library/react for component tests (already installed)
- Use Playwright for E2E tests (already configured)
- Use MSW for API mocking (already installed)
- Don't install new frameworks unnecessarily

## Rule 10: Keep Tests Independent

- Each test should set up its own state
- Tests should not depend on execution order
- Clean up after each test