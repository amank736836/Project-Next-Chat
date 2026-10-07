# Non-Functional Requirements — Stealthy Note

## Security

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-NF-001 | Passwords must be hashed with bcrypt (cost factor 10) | `user.model.js` pre-save hook |
| REQ-NF-002 | JWT tokens must be stored in HTTP-only cookies | `lib/server/auth.js` |
| REQ-NF-003 | Cookies must be Secure in production, SameSite=None | `lib/server/auth.js` cookieOptions |
| REQ-NF-004 | Admin routes must be protected by middleware | `middleware.js` |
| REQ-NF-005 | Password field must be excluded from queries by default (select: false) | `user.model.js` |
| REQ-NF-006 | Verification codes must expire after 10 minutes | `user.model.js`, API routes |
| REQ-NF-007 | Widget settings must be sanitized to prevent CSS/script injection | `lib/widgetConfig.js` |
| REQ-NF-008 | Dev tools must be disabled in production unless explicitly enabled | `middleware.js` |

## Performance

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-NF-010 | Messages must be paginated (20 per page) | `app/api/v1/chat/message/[chatId]/route.js` |
| REQ-NF-011 | Database connections must be cached and reused | `lib/server/db.js` |
| REQ-NF-012 | AI API calls must timeout after 45 seconds | `lib/server/nvidia.js` |
| REQ-NF-013 | Question suggestions must use indexed queries | `suggestedQuestion.model.js` (indexes) |

## Reliability

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-NF-020 | AI suggestion failures must not crash the endpoint (return fallback) | `app/api/v1/chat/suggestMessages/route.js` |
| REQ-NF-021 | Email sending failures must be handled gracefully | `lib/server/email.js` |
| REQ-NF-022 | Socket connection must support reconnection | `providers/SocketProvider.jsx` |

## Accessibility

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-NF-030 | Animations must respect prefers-reduced-motion | `components/animations/useReducedMotionSafe.js` |
| REQ-NF-031 | Color contrast must meet WCAG AA (4.5:1 for text) | `components/styles/__tests__/brand.test.jsx` |
| REQ-NF-032 | Interactive elements must have accessible names | Existing tests |

## Compatibility

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-NF-040 | Widget must work as both script tag and iframe embed | `lib/widgetConfig.js` |
| REQ-NF-041 | CORS must allow cross-origin widget requests | `lib/server/cors.js` |
| REQ-NF-042 | App must support remote auth for cross-origin backends | `constants/config.js` |