# Authentication — Edge Case Test Cases

---

## TC-AUTH-020: Register with minimum valid name length

- **Test Case ID**: TC-AUTH-020
- **Feature**: FEAT-001
- **Priority**: P2
- **Type**: Edge Case
- **Related Requirement**: REQ-F-002

**Steps**:
1. Send POST to `/api/v1/user/new` with name="Abc" (3 chars)
2. Verify registration succeeds

**Expected Result**: Registration succeeds with 3-character name.

**Status**: NOT_EXECUTED

---

## TC-AUTH-021: Register with maximum valid name length

- **Test Case ID**: TC-AUTH-021
- **Feature**: FEAT-001
- **Priority**: P2
- **Type**: Edge Case
- **Related Requirement**: REQ-F-002

**Steps**:
1. Send POST to `/api/v1/user/new` with name at 30 characters
2. Verify registration succeeds

**Expected Result**: Registration succeeds with 30-character name.

**Status**: NOT_EXECUTED

---

## TC-AUTH-022: Register with username containing underscores

- **Test Case ID**: TC-AUTH-022
- **Feature**: FEAT-001
- **Priority**: P2
- **Type**: Edge Case
- **Related Requirement**: REQ-BR-001

**Steps**:
1. Send POST to `/api/v1/user/new` with username="test_user_123"
2. Verify registration succeeds

**Expected Result**: Registration succeeds with alphanumeric + underscore username.

**Status**: NOT_EXECUTED

---

## TC-AUTH-023: Register with password at minimum length

- **Test Case ID**: TC-AUTH-023
- **Feature**: FEAT-001
- **Priority**: P2
- **Type**: Edge Case
- **Related Requirement**: REQ-F-002

**Steps**:
1. Send POST to `/api/v1/user/new` with password="123456" (6 chars)
2. Verify registration succeeds

**Expected Result**: Registration succeeds with 6-character password.

**Status**: NOT_EXECUTED