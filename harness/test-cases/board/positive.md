# Board — Positive Test Cases

---

## TC-BRD-001: Get question pool for valid username

- **Test Case ID**: TC-BRD-001
- **Feature**: FEAT-006
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: User with questions exists
- **Related Requirement**: REQ-F-050

**Steps**:
1. Send GET to `/api/v1/chat/questions?username=testuser`
2. Verify response status is 200
3. Verify response contains suggestions, answered, customQuestions, priorityQuestions arrays

**Expected Result**: Question pool returned with all sections.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-BRD-002: Ask question anonymously

- **Test Case ID**: TC-BRD-002
- **Feature**: FEAT-006
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: Valid username exists
- **Related Requirement**: REQ-F-051

**Steps**:
1. Send POST to `/api/v1/chat/questions` with JSON: { username: "testuser", question: "What inspires you?" }
2. Verify response status is 200
3. Verify question recorded in database

**Expected Result**: Question asked and recorded.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-BRD-003: Owner creates custom question

- **Test Case ID**: TC-BRD-003
- **Feature**: FEAT-006
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Owner authenticated
- **Related Requirement**: REQ-F-052

**Steps**:
1. Send PUT to `/api/v1/chat/questions` with JSON: { username: "owner", question: "Custom question?" }
2. Verify response status is 200
3. Verify question created with askedCount=0

**Expected Result**: Custom question created.

**Status**: NOT_EXECUTED
**Automation**: MANUAL

---

## TC-BRD-004: Owner hides showcase item

- **Test Case ID**: TC-BRD-004
- **Feature**: FEAT-006
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Owner authenticated, answered question exists
- **Related Requirement**: REQ-F-053

**Steps**:
1. Send PATCH to `/api/v1/chat/questions` with JSON: { username: "owner", itemId: "...", itemType: "question", action: "hide" }
2. Verify response status is 200
3. Verify hiddenFromShowcase is true in database

**Expected Result**: Item hidden from showcase.

**Status**: NOT_EXECUTED
**Automation**: MANUAL