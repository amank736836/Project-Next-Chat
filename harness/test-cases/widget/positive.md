# Widget — Positive Test Cases

---

## TC-WGT-001: Get widget settings for valid username

- **Test Case ID**: TC-WGT-001
- **Feature**: FEAT-007
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: User exists
- **Related Requirement**: REQ-F-060

**Steps**:
1. Send GET to `/api/v1/widget/settings?username=testuser`
2. Verify response status is 200
3. Verify settings object with all expected fields
4. Verify CORS headers present

**Expected Result**: Widget settings returned with defaults.

**Status**: NOT_EXECUTED

---

## TC-WGT-002: Owner saves widget settings

- **Test Case ID**: TC-WGT-002
- **Feature**: FEAT-007
- **Priority**: P1
- **Type**: Functional
- **Preconditions**: Owner authenticated
- **Related Requirement**: REQ-F-061

**Steps**:
1. Send PUT to `/api/v1/widget/settings` with JSON: { username: "owner", settings: { themeColor: "#ff0000", title: "Custom Title" } }
2. Verify response status is 200
3. Verify settings saved and returned

**Expected Result**: Settings saved successfully.

**Status**: NOT_EXECUTED

---

## TC-WGT-003: Widget settings sanitize invalid color

- **Test Case ID**: TC-WGT-003
- **Feature**: FEAT-007
- **Priority**: P0
- **Type**: Functional
- **Preconditions**: None
- **Related Requirement**: REQ-F-062, REQ-NF-007

**Steps**:
1. Call sanitizeWidgetSettings({ themeColor: "not-a-color" })
2. Verify output uses default themeColor

**Expected Result**: Invalid color replaced with default.

**Status**: NOT_EXECUTED
**Automation**: AUTOMATED (brand.test.jsx partial)