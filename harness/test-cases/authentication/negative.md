# Authentication — Negative Test Cases

---

## TC-AUTH-010: Login with wrong password

- **Test Case ID**: TC-AUTH-010
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: User exists in database
- **Related Requirement**: REQ-F-008

**Steps**:
1. Send POST to `/api/v1/user/login` with JSON: { identifier: "test@example.com", password: "wrongpassword" }
2. Verify response status is 401
3. Verify response message is "Invalid password"

**Expected Result**: Login rejected with 401.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-011: Login with non-existent user

- **Test Case ID**: TC-AUTH-011
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: No user with this email exists
- **Related Requirement**: REQ-F-008

**Steps**:
1. Send POST to `/api/v1/user/login` with JSON: { identifier: "nonexistent@example.com", password: "password123" }
2. Verify response status is 404
3. Verify response message is "User not found"

**Expected Result**: Login rejected with 404.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-012: Login with unverified account

- **Test Case ID**: TC-AUTH-012
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: User exists but isVerified is false
- **Related Requirement**: REQ-F-009

**Steps**:
1. Send POST to `/api/v1/user/login` with JSON: { identifier: "unverified@example.com", password: "password123" }
2. Verify response status is 401
3. Verify response message is "Please verify your account"

**Expected Result**: Login rejected with 401.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-013: Register with missing required fields

- **Test Case ID**: TC-AUTH-013
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: None
- **Related Requirement**: REQ-F-001

**Steps**:
1. Send POST to `/api/v1/user/new` with FormData missing avatar
2. Verify response status is 400
3. Verify response message is "All fields are required"

**Expected Result**: Registration rejected with 400.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-014: Register with duplicate email

- **Test Case ID**: TC-AUTH-014
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: User with this email already exists
- **Related Requirement**: REQ-F-003

**Steps**:
1. Send POST to `/api/v1/user/new` with existing email
2. Verify response status is 400
3. Verify response message is "User already exists"

**Expected Result**: Registration rejected with 400.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-015: Verify with expired code

- **Test Case ID**: TC-AUTH-015
- **Feature**: FEAT-001
- **Priority**: P1
- **Type**: Negative
- **Preconditions**: User exists with expired verify code
- **Related Requirement**: REQ-F-012

**Steps**:
1. Send POST to `/api/v1/user/verify` with expired code
2. Verify response status is 400
3. Verify response message is "Verification code expired"

**Expected Result**: Verification rejected with 400.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-016: Access protected route without authentication

- **Test Case ID**: TC-AUTH-016
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: No auth cookie present
- **Related Requirement**: REQ-F-008

**Steps**:
1. Send GET to `/api/v1/user/me` without cookie
2. Verify response status is 401
3. Verify response message contains "Please login"

**Expected Result**: Request rejected with 401.

**Status**: NOT_EXECUTED
**Automation**: MANUAL