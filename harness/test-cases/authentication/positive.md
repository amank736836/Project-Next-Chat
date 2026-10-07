# Authentication — Positive Test Cases

---

## TC-AUTH-001: Register new user with valid data

- **Test Case ID**: TC-AUTH-001
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: MongoDB connected, Cloudinary configured, SMTP configured
- **Related Requirement**: REQ-F-001, REQ-F-002, REQ-F-003

**Steps**:
1. Send POST to `/api/v1/user/new` with FormData: name="Test User", email="test@example.com", username="testuser", password="password123", avatar=file
2. Verify response status is 201
3. Verify response contains user object without password
4. Verify user exists in MongoDB
5. Verify default chat was created for user
6. Verify verification email was sent

**Test Data**:
```
name: "Test User"
email: "test@example.com"
username: "testuser"
password: "password123"
avatar: <test image file>
```

**Expected Result**: User created successfully, JWT cookie set, default chat created, verification email sent.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-002: Login with valid email credentials

- **Test Case ID**: TC-AUTH-002
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: Verified user exists in database
- **Related Requirement**: REQ-F-008, REQ-F-010

**Steps**:
1. Send POST to `/api/v1/user/login` with JSON: { identifier: "test@example.com", password: "password123" }
2. Verify response status is 200
3. Verify response contains user object
4. Verify Set-Cookie header contains StealthyNoteToken
5. Verify cookie is HTTP-only

**Test Data**:
```
identifier: "test@example.com"
password: "password123"
```

**Expected Result**: Login successful, JWT cookie set, user returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-003: Login with valid username credentials

- **Test Case ID**: TC-AUTH-003
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: Verified user exists in database
- **Related Requirement**: REQ-F-008

**Steps**:
1. Send POST to `/api/v1/user/login` with JSON: { identifier: "testuser", password: "password123" }
2. Verify response status is 200
3. Verify user object returned

**Test Data**:
```
identifier: "testuser"
password: "password123"
```

**Expected Result**: Login successful with username as identifier.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-004: Verify email with correct code

- **Test Case ID**: TC-AUTH-004
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: Unverified user exists with known verify code
- **Related Requirement**: REQ-F-012

**Steps**:
1. Send POST to `/api/v1/user/verify` with JSON: { identifier: "testuser", verifyCode: "123456" }
2. Verify response status is 200
3. Verify user.isVerified is true in database
4. Verify verifyCode is cleared

**Test Data**:
```
identifier: "testuser"
verifyCode: "123456"
```

**Expected Result**: User verified, code cleared, JWT cookie set.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-005: Logout clears authentication cookie

- **Test Case ID**: TC-AUTH-005
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: User is authenticated with valid cookie
- **Related Requirement**: REQ-F-011

**Steps**:
1. Send GET to `/api/v1/user/logout` with valid cookie
2. Verify response status is 200
3. Verify Set-Cookie clears StealthyNoteToken

**Expected Result**: Cookie cleared, user logged out.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-AUTH-006: Get authenticated user profile

- **Test Case ID**: TC-AUTH-006
- **Feature**: FEAT-001
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: User is authenticated
- **Related Requirement**: REQ-F-008

**Steps**:
1. Send GET to `/api/v1/user/me` with valid cookie
2. Verify response status is 200
3. Verify response contains user object
4. Verify notification count is included

**Expected Result**: User profile and notification count returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL