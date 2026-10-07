# Business Rules — Stealthy Note

## User Rules

| ID | Rule | Source |
|----|------|--------|
| REQ-BR-001 | Username must be 3-30 characters, alphanumeric and underscores only | `user.model.js` |
| REQ-BR-002 | Email must be unique across all users | `user.model.js` (unique index) |
| REQ-BR-003 | Username must be unique across all users | `user.model.js` (unique index) |
| REQ-BR-004 | Name must be 3-30 characters | `user.model.js` |
| REQ-BR-005 | Password must be minimum 6 characters | `user.model.js` |
| REQ-BR-006 | User must verify email before logging in | `app/api/v1/user/login/route.js` |
| REQ-BR-007 | Avatar is required for registration | `app/api/v1/user/new/route.js` |

## Chat Rules

| ID | Rule | Source |
|----|------|--------|
| REQ-BR-010 | A personal chat is auto-created for each user at registration | `app/api/v1/user/new/route.js` |
| REQ-BR-011 | Private AI answers are visible only to the asker | `app/api/v1/chat/message/[chatId]/route.js` (privateTo filter) |
| REQ-BR-012 | AI mode defaults to enabled for all chats | `chat.model.js` (aiEnabled default) |
| REQ-BR-013 | Only chat members can toggle AI mode | `app/api/v1/chat/ai-mode/route.js` |

## Question Pool Rules

| ID | Rule | Source |
|----|------|--------|
| REQ-BR-020 | Questions are normalized (lowercase, punctuation stripped) before comparison | `lib/questionFilters.js` |
| REQ-BR-021 | Duplicate questions (by normalized form) are merged, not duplicated | `app/api/v1/chat/questions/route.js` |
| REQ-BR-022 | Questions answered via board replies are excluded from suggestion pool | `lib/questionFilters.js` |
| REQ-BR-023 | Near-duplicate questions (Jaccard >= 0.7) are excluded from suggestions | `lib/questionFilters.js` |
| REQ-BR-024 | Only the board owner can hide/show/delete custom questions | `app/api/v1/chat/questions/route.js` (PUT/PATCH/DELETE) |
| REQ-BR-025 | Question suggestions mix personal and global questions (1:2 ratio) | `app/api/v1/chat/questions/route.js` |
| REQ-BR-026 | Questions are ranked by topic relevance to answered content | `lib/questionFilters.js` |
| REQ-BR-027 | Maximum 20 sites can be tracked per widget | `widgetSettings.model.js` |
| REQ-BR-028 | Question ask host is resolved from body.host > Origin > Referer | `lib/questionFilters.js` |

## Widget Rules

| ID | Rule | Source |
|----|------|--------|
| REQ-BR-030 | Widget settings are sanitized: colors must be valid hex, strings are trimmed | `lib/widgetConfig.js` |
| REQ-BR-031 | Widget title max 80 chars, subtitle max 140 chars, placeholder max 200 chars | `widgetSettings.model.js` |
| REQ-BR-032 | Auto-open delay must be 0-120 seconds | `widgetSettings.model.js` |
| REQ-BR-033 | Only the widget owner can update settings | `app/api/v1/widget/settings/route.js` |

## Admin Rules

| ID | Rule | Source |
|----|------|--------|
| REQ-BR-040 | Admin authentication uses a shared secret key, not user accounts | `app/api/v1/admin/verify/route.js` |
| REQ-BR-041 | Admin token expires after 12 hours | `app/api/v1/admin/verify/route.js` |
| REQ-BR-042 | Expired admin tokens are automatically cleared | `lib/server/auth.js` getAuthenticatedAdmin |