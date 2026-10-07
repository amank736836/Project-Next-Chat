# Chat — Positive Test Cases

---

## TC-CHAT-001: Get chat list for authenticated user

- **Test Case ID**: TC-CHAT-001
- **Feature**: FEAT-002
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: User is authenticated, has chats
- **Related Requirement**: REQ-F-020

**Steps**:
1. Send GET to `/api/v1/chat` with valid cookie
2. Verify response status is 200
3. Verify chats array is returned
4. Verify each chat has _id, name, groupChat, avatar, members

**Expected Result**: Chat list returned with populated data.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-CHAT-002: Get chat details with populated members

- **Test Case ID**: TC-CHAT-002
- **Feature**: FEAT-002
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: User is authenticated, chat exists
- **Related Requirement**: REQ-F-021

**Steps**:
1. Send GET to `/api/v1/chat/<chatId>?populate=true` with valid cookie
2. Verify response status is 200
3. Verify chat object has populated members

**Expected Result**: Chat details with member info returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-CHAT-003: Get messages with pagination

- **Test Case ID**: TC-CHAT-003
- **Feature**: FEAT-002
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Chat has messages
- **Related Requirement**: REQ-F-022

**Steps**:
1. Send GET to `/api/v1/chat/message/<chatId>?page=1` with valid cookie
2. Verify response status is 200
3. Verify messages array (max 20), totalPages, currentPage returned
4. Verify messages are in chronological order

**Expected Result**: Paginated messages returned.

**Status**: NOT_EXECUTED
**Automation**: MANUAL