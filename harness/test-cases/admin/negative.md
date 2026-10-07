# Admin — Negative Test Cases

---

## TC-ADM-010: Admin login with wrong secret key

- **Test Case ID**: TC-ADM-010
- **Feature**: FEAT-005
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: None
- **Related Requirement**: REQ-F-070

**Steps**:
1. Send POST to `/api/v1/admin/verify` with JSON: { secretKey: "wrong_key" }
2. Verify response status is 401
3. Verify response message is "Invalid secret key"

**Expected Result**: Admin login rejected.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-ADM-011: Admin stats without authentication

- **Test Case ID**: TC-ADM-011
- **Feature**: FEAT-005
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: No admin cookie
- **Related Requirement**: REQ-F-072

**Steps**:
1. Send GET to `/api/v1/admin/stats` without cookie
2. Verify response status is 401

**Expected Result**: Request rejected with 401.

**Status**: NOT_EXECUTED
**Automation**: MANUAL