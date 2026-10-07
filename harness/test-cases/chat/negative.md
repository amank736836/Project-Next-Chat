# Chat — Negative Test Cases

---

## TC-CHAT-010: Get chat list without authentication

- **Test Case ID**: TC-CHAT-010
- **Feature**: FEAT-002
- **Priority**: P0
- **Type**: Negative
- **Preconditions**: No auth cookie
- **Related Requirement**: REQ-F-020

**Steps**:
1. Send GET to `/api/v1/chat` without cookie
2. Verify response status is 401

**Expected Result**: Request rejected with 401.

**Status**: NOT_EXECUTED

---

## TC-CHAT-011: Get messages for non-existent chat

- **Test Case ID**: TC-CHAT-011
- **Feature**: FEAT-002
- **Priority**: P1
- **Type**: Negative
- **Preconditions**: User authenticated, chat ID doesn't exist
- **Related Requirement**: REQ-F-022

**Steps**:
1. Send GET to `/api/v1/chat/message/000000000000000000000000` with valid cookie
2. Verify response status is 200 with empty messages array

**Expected Result**: Empty messages returned (no error for non-existent chat).

**Status**: NOT_EXECUTED