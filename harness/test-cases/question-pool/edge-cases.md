# Question Pool — Edge Case Test Cases

---

## TC-QP-010: Empty question pool returns empty arrays

- **Test Case ID**: TC-QP-010
- **Feature**: FEAT-008
- **Priority**: P2
- **Type**: Edge Case
- **Preconditions**: New user with no questions
- **Related Requirement**: REQ-F-050

**Steps**:
1. Send GET to `/api/v1/chat/questions?username=newuser`
2. Verify response status is 200
3. Verify suggestions array is not empty (seed questions)

**Expected Result**: Global seed questions returned as suggestions.

**Status**: NOT_EXECUTED

---

## TC-QP-011: Question with special characters

- **Test Case ID**: TC-QP-011
- **Feature**: FEAT-008
- **Priority**: P2
- **Type**: Edge Case
- **Preconditions**: None
- **Related Requirement**: REQ-BR-020

**Steps**:
1. Call normalizeBoardQuestion("What's your #1 favorite thing?! 😊")
2. Verify normalization handles special characters correctly

**Expected Result**: Special characters stripped, text normalized.

**Status**: NOT_EXECUTED