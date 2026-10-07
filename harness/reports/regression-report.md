# Regression Report — Stealthy Note

Last Updated: 2026-10-07

## Regression Test Suite

### Automated Regression (Unit Tests)

All 37 unit tests serve as the regression baseline:

| Test File | Tests | What It Guards |
|-----------|-------|----------------|
| AdminMotion.test.jsx | 8 | Admin counter animation, reduced motion |
| WelcomeStage.test.jsx | 4 | Welcome page navigation, walkthrough |
| useReducedMotionSafe.test.jsx | 4 | Motion preference hook (SSR-safe) |
| AdminProtectedRoute.test.jsx | 2 | Admin session verification, redirect |
| AdminAsyncContent.test.jsx | 3 | Loading/error/retry states |
| ChatList.test.jsx | 4 | Conversation filtering, search, delete |
| Table.test.jsx | 6 | Data grid animation, search, pagination |
| brand.test.jsx | 5 | Theme token consistency, contrast, widget colors |
| Charts.test.jsx | 1 | Chart animation with motion preference |

### Risk Areas Requiring Manual Regression

| Area | Risk | Reason |
|------|------|--------|
| Authentication flow | High | Cookie handling, JWT verification |
| Chat message delivery | High | Socket.io real-time, proxy routes |
| Board question dedup | Medium | Complex normalization + ranking logic |
| Widget embed | Medium | Cross-origin, settings sanitization |
| AI suggestions | Medium | External API dependency, fallback logic |
| Admin middleware | Low | Well-tested in unit tests |

### Regression Checklist

- [ ] Login with valid credentials
- [ ] Login rejects invalid credentials
- [ ] Chat list loads after login
- [ ] Messages load in chat view
- [ ] Board page loads for a user
- [ ] Admin dashboard loads after admin login
- [ ] Widget settings save and load
- [ ] Animations respect reduced motion
- [ ] Brand colors consistent across pages
- [ ] CORS headers present on public endpoints