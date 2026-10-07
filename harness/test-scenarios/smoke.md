# Smoke Test Scenarios

Critical path tests that must pass for the application to be considered functional.

| ID | Scenario | Feature | Priority |
|----|----------|---------|----------|
| SCN-SM-001 | New user can register with valid data | FEAT-001 | P0 |
| SCN-SM-002 | Registered user can login with valid credentials | FEAT-001 | P0 |
| SCN-SM-003 | Authenticated user can view their chat list | FEAT-002 | P0 |
| SCN-SM-004 | Authenticated user can send a message | FEAT-002 | P0 |
| SCN-SM-005 | Admin can login with valid secret key | FEAT-005 | P0 |
| SCN-SM-006 | Admin dashboard loads with statistics | FEAT-005 | P0 |
| SCN-SM-007 | Board page loads for a valid username | FEAT-006 | P0 |
| SCN-SM-008 | Anonymous visitor can ask a question on a board | FEAT-006 | P0 |
| SCN-SM-009 | Widget settings API returns settings for valid username | FEAT-007 | P0 |
| SCN-SM-010 | Question suggestions API returns 3 suggestions | FEAT-004 | P0 |
| SCN-SM-011 | User can logout and cookie is cleared | FEAT-001 | P0 |
| SCN-SM-012 | Middleware redirects unauthenticated admin access | FEAT-005 | P0 |