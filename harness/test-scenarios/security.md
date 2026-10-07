# Security Test Scenarios

| ID | Scenario | Feature | Priority |
|----|----------|---------|----------|
| SCN-SEC-001 | JWT token is HTTP-only (not accessible via JavaScript) | FEAT-001 | P0 |
| SCN-SEC-002 | JWT token is Secure in production | FEAT-001 | P0 |
| SCN-SEC-003 | Password is never returned in API responses | FEAT-001 | P0 |
| SCN-SEC-004 | Admin middleware blocks unauthenticated admin access | FEAT-005 | P0 |
| SCN-SEC-005 | Widget settings sanitize hex color inputs | FEAT-007 | P0 |
| SCN-SEC-006 | Widget settings prevent script injection in text fields | FEAT-007 | P0 |
| SCN-SEC-007 | Question PUT/PATCH/DELETE requires ownership | FEAT-006 | P0 |
| SCN-SEC-008 | Widget PUT requires ownership | FEAT-007 | P0 |
| SCN-SEC-009 | AI mode toggle requires chat membership | FEAT-004 | P1 |
| SCN-SEC-010 | User search excludes own user from results | FEAT-011 | P1 |
| SCN-SEC-011 | Expired admin token is cleared automatically | FEAT-005 | P1 |
| SCN-SEC-012 | Dev tools routes return 404 in production | FEAT-005 | P1 |