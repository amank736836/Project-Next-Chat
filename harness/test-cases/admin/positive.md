# Admin — Positive Test Cases

---

## TC-ADM-001: Admin login with valid secret key

- **Test Case ID**: TC-ADM-001
- **Feature**: FEAT-005
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: ADMIN_SECRET_KEY configured
- **Related Requirement**: REQ-F-070

**Steps**:
1. Send POST to `/api/v1/admin/verify` with JSON: { secretKey: "<valid_key>" }
2. Verify response status is 200
3. Verify Set-Cookie contains StealthyNoteAdminToken
4. Verify cookie is HTTP-only

**Expected Result**: Admin logged in, JWT cookie set.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-ADM-002: Admin dashboard returns statistics

- **Test Case ID**: TC-ADM-002
- **Feature**: FEAT-005
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Admin authenticated
- **Related Requirement**: REQ-F-072

**Steps**:
1. Send GET to `/api/v1/admin/stats` with admin cookie
2. Verify response status is 200
3. Verify stats contains totalUsers, totalChats, totalMessages, groupChatCount, singleChatCount, last7DaysMessages

**Expected Result**: Dashboard statistics returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-ADM-003: Admin users list

- **Test Case ID**: TC-ADM-003
- **Feature**: FEAT-005
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Admin authenticated, users exist
- **Related Requirement**: REQ-F-073

**Steps**:
1. Send GET to `/api/v1/admin/users` with admin cookie
2. Verify response status is 200
3. Verify users array contains user objects with friends/groups counts

**Expected Result**: User list with counts returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-ADM-004: Admin logout clears cookie

- **Test Case ID**: TC-ADM-004
- **Feature**: FEAT-005
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: Admin authenticated
- **Related Requirement**: REQ-F-070

**Steps**:
1. Send GET to `/api/v1/admin/logout` with admin cookie
2. Verify response status is 200
3. Verify Set-Cookie clears admin token

**Expected Result**: Admin cookie cleared.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-ADM-005: Admin middleware redirects unauthenticated access

- **Test Case ID**: TC-ADM-005
- **Feature**: FEAT-005
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: No admin cookie
- **Related Requirement**: REQ-F-071

**Steps**:
1. Request `/admin/dashboard` without admin cookie
2. Verify redirect to `/admin/login`

**Expected Result**: Redirect to admin login page.

**Status**: NOT_EXECUTED
**Automation**: AUTOMATED (AdminProtectedRoute.test.jsx)