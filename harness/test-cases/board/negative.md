# Board — Negative Test Cases

---

## TC-BRD-010: Ask question without username returns 400

- **Test Case ID**: TC-BRD-010
- **Feature**: FEAT-006
- **Priority**: P1
- **Type**: Negative
- **Related Requirement**: REQ-F-051

**Steps**:
1. Send POST to `/api/v1/chat/questions` with JSON: { question: "What inspires you?" }
2. Verify response status is 400

**Expected Result**: Request rejected with 400.

**Status**: NOT_EXECUTED

---

## TC-BRD-011: Delete custom question by non-owner returns 403

- **Test Case ID**: TC-BRD-011
- **Feature**: FEAT-006
- **Priority**: P1
- **Type**: Negative
- **Preconditions**: User authenticated but not the question owner
- **Related Requirement**: REQ-BR-024

**Steps**:
1. Send DELETE to `/api/v1/chat/questions` as non-owner
2. Verify response status is 403

**Expected Result**: Delete rejected with 403.

**Status**: NOT_EXECUTED

---

## TC-BRD-012: Get question pool without username returns 400

- **Test Case ID**: TC-BRD-012
- **Feature**: FEAT-006
- **Priority**: P1
- **Type**: Negative
- **Related Requirement**: REQ-F-050

**Steps**:
1. Send GET to `/api/v1/chat/questions` without username param
2. Verify response status is 400

**Expected Result**: Request rejected with 400.

**Status**: NOT_EXECUTED