# Test Summary — Stealthy Note

Last Updated: 2026-10-07

## Overall Status

| Category | Total | Passed | Failed | Blocked | Not Executed |
|----------|-------|--------|--------|---------|--------------|
| Unit Tests | 37 | 37 | 0 | 0 | 0 |
| E2E Tests | 2 files | 0 | 0 | 0 | 2 |
| API Tests | 20 scenarios | 0 | 0 | 0 | 20 |
| Security Tests | 12 scenarios | 0 | 0 | 0 | 12 |
| Total | 71 | 37 | 0 | 0 | 34 |

## Pass Rate

- **Unit Tests**: 100% (37/37)
- **Overall**: 52% (37/71)

## Critical Failures

None (all executed tests pass).

## Known Issues

See `bugs/known-issues.md`

## Test Coverage Gaps

1. **No API route tests** — All 25+ endpoints untested
2. **No database model tests** — All 6 models untested
3. **No security tests** — Auth bypass, IDOR untested
4. **No AI feature tests** — NVIDIA/Gemini untested
5. **No question pool tests** — Complex logic untested
6. **E2E tests not executed** — Requires dev server