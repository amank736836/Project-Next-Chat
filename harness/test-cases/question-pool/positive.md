# Question Pool — Positive Test Cases

---

## TC-QP-001: Question normalization strips punctuation and lowercases

- **Test Case ID**: TC-QP-001
- **Feature**: FEAT-008
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: None
- **Related Requirement**: REQ-BR-020

**Steps**:
1. Call normalizeBoardQuestion("What inspires YOU?! ")
2. Verify result is "what inspires you"

**Expected Result**: Normalized lowercase, punctuation stripped.

**Status**: NOT_EXECUTED

---

## TC-QP-002: Near-duplicate detection with Jaccard similarity

- **Test Case ID**: TC-QP-002
- **Feature**: FEAT-008
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: None
- **Related Requirement**: REQ-BR-023

**Steps**:
1. Call similarity("What inspires your creative work?", "What motivates your creative projects?")
2. Verify similarity >= 0.7 (near-duplicate)

**Expected Result**: High similarity score for near-duplicate questions.

**Status**: NOT_EXECUTED

---

## TC-QP-003: Host sanitization extracts domain correctly

- **Test Case ID**: TC-QP-003
- **Feature**: FEAT-008
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: None
- **Related Requirement**: REQ-BR-028

**Steps**:
1. Call sanitizeHost("https://Example.com:3000/path")
2. Verify result is "example.com"

**Expected Result**: Domain extracted and lowercased.

**Status**: NOT_EXECUTED