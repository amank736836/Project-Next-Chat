# Widget — Negative Test Cases

---

## TC-WGT-010: Update widget settings without authentication

- **Test Case ID**: TC-WGT-010
- **Feature**: FEAT-007
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: No auth cookie
- **Related Requirement**: REQ-F-061

**Steps**:
1. Send PUT to `/api/v1/widget/settings` without cookie
2. Verify response status is 401

**Expected Result**: Request rejected with 401.

**Status**: NOT_EXECUTED

---

## TC-WGT-011: Update widget settings for another user

- **Test Case ID**: TC-WGT-011
- **Feature**: FEAT-007
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: Authenticated as user A
- **Related Requirement**: REQ-BR-033

**Steps**:
1. Send PUT to `/api/v1/widget/settings` with username="userB"
2. Verify response status is 403

**Expected Result**: Request rejected with 403.

**Status**: NOT_EXECUTED