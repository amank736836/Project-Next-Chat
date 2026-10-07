# Requirements → Tests Traceability — Stealthy Note

Last Updated: 2026-10-07

## Traceability Matrix

### Authentication (FEAT-001)

| Requirement | Test Scenario | Test Case | Automated | Status |
|-------------|--------------|-----------|-----------|--------|
| REQ-F-001 Register user | SCN-SM-001, SCN-FN-001 | TC-AUTH-001 | No | NOT_EXECUTED |
| REQ-F-002 Validate fields | SCN-FN-001 | TC-AUTH-001, TC-AUTH-020-023 | No | NOT_EXECUTED |
| REQ-F-003 Unique email/username | SCN-FN-002, SCN-FN-003 | TC-AUTH-014 | No | NOT_EXECUTED |
| REQ-F-004 Hash password | SCN-DB-004 | TC-AUTH-001 | No | NOT_EXECUTED |
| REQ-F-008 Login | SCN-SM-002, SCN-FN-004, SCN-FN-005 | TC-AUTH-002, TC-AUTH-003 | No | NOT_EXECUTED |
| REQ-F-009 Reject unverified | SCN-FN-006 | TC-AUTH-012 | No | NOT_EXECUTED |
| REQ-F-010 JWT cookie | SCN-SM-002 | TC-AUTH-002 | No | NOT_EXECUTED |
| REQ-F-011 Logout | SCN-SM-011 | TC-AUTH-005 | No | NOT_EXECUTED |
| REQ-F-012 Verify email | SCN-FN-007, SCN-FN-008 | TC-AUTH-004, TC-AUTH-015 | No | NOT_EXECUTED |

### Admin (FEAT-005)

| Requirement | Test Scenario | Test Case | Automated | Status |
|-------------|--------------|-----------|-----------|--------|
| REQ-F-070 Admin login | SCN-SM-005 | TC-ADM-001, TC-ADM-010 | No | NOT_EXECUTED |
| REQ-F-071 Middleware protection | SCN-SM-012 | TC-ADM-005, TC-ADM-011 | Yes | PASS |
| REQ-F-072 Dashboard stats | SCN-SM-006 | TC-ADM-002 | No | NOT_EXECUTED |
| REQ-F-073 User list | — | TC-ADM-003 | No | NOT_EXECUTED |

### Board/Q&A (FEAT-006)

| Requirement | Test Scenario | Test Case | Automated | Status |
|-------------|--------------|-----------|-----------|--------|
| REQ-F-050 Question pool GET | SCN-SM-007 | TC-BRD-001, TC-BRD-012 | No | NOT_EXECUTED |
| REQ-F-051 Ask question | SCN-SM-008 | TC-BRD-002, TC-BRD-010 | No | NOT_EXECUTED |
| REQ-F-052 Custom questions | SCN-FN-020 | TC-BRD-003 | No | NOT_EXECUTED |
| REQ-F-053 Hide/show items | SCN-FN-022 | TC-BRD-004 | No | NOT_EXECUTED |
| REQ-BR-020 Normalization | — | TC-QP-001 | No | NOT_EXECUTED |
| REQ-BR-023 Near-duplicates | — | TC-QP-002 | No | NOT_EXECUTED |

### Widget (FEAT-007)

| Requirement | Test Scenario | Test Case | Automated | Status |
|-------------|--------------|-----------|-----------|--------|
| REQ-F-060 Public settings | SCN-SM-009 | TC-WGT-001 | No | NOT_EXECUTED |
| REQ-F-061 Owner settings | SCN-FN-023 | TC-WGT-002 | No | NOT_EXECUTED |
| REQ-F-062 Sanitization | SCN-SEC-005, SCN-SEC-006 | TC-WGT-003 | Partial | PASS |
| REQ-BR-033 Owner-only | SCN-SEC-008 | TC-WGT-011 | No | NOT_EXECUTED |

### UI Components

| Requirement | Test Scenario | Test Case | Automated | Status |
|-------------|--------------|-----------|-----------|--------|
| SCN-UI-001 Chat list filter | — | — | Yes (ChatList.test.jsx) | PASS |
| SCN-UI-002 Chat list search | — | — | Yes (ChatList.test.jsx) | PASS |
| SCN-UI-004 Admin table | — | — | Yes (Table.test.jsx) | PASS |
| SCN-UI-006 Protected route | — | — | Yes (AdminProtectedRoute.test.jsx) | PASS |
| SCN-UI-007 Brand consistency | — | — | Yes (brand.test.jsx) | PASS |
| SCN-UI-008 Reduced motion | — | — | Yes (useReducedMotionSafe.test.jsx) | PASS |