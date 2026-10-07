# Functional Requirements — Stealthy Note

## Authentication

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-001 | System shall allow user registration with name, email, username, password, and avatar | `app/api/v1/user/new/route.js` |
| REQ-F-002 | System shall validate name (3-30 chars), email (valid format), username (3-30 chars, alphanumeric+underscore), password (min 6 chars) | `lib/server/models/user.model.js` |
| REQ-F-003 | System shall check email and username uniqueness before registration | `app/api/v1/user/new/route.js` |
| REQ-F-004 | System shall hash passwords with bcrypt before storage | `lib/server/models/user.model.js` (pre-save hook) |
| REQ-F-005 | System shall upload avatar to Cloudinary during registration | `app/api/v1/user/new/route.js` |
| REQ-F-006 | System shall send email verification code (6-digit, 10-min expiry) on registration | `app/api/v1/user/new/route.js` |
| REQ-F-007 | System shall create a default personal chat for new users | `app/api/v1/user/new/route.js` |
| REQ-F-008 | System shall authenticate users with email/username + password | `app/api/v1/user/login/route.js` |
| REQ-F-009 | System shall reject login for unverified users | `app/api/v1/user/login/route.js` |
| REQ-F-010 | System shall issue JWT in HTTP-only cookie on successful login | `lib/server/auth.js` |
| REQ-F-011 | System shall clear auth cookie on logout | `app/api/v1/user/logout/route.js` |
| REQ-F-012 | System shall verify email via 6-digit code | `app/api/v1/user/verify/route.js` |
| REQ-F-013 | System shall send password reset code via email | `app/api/v1/user/forgotPassword/route.js` |
| REQ-F-014 | System shall allow password reset with valid code | `app/api/v1/user/updatePassword/route.js` |
| REQ-F-015 | System shall check username availability via public endpoint | `app/api/v1/user/check-username/route.js` |
| REQ-F-016 | System shall check email availability via public endpoint | `app/api/v1/user/check-email/route.js` |

## Chat

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-020 | System shall list all chats for authenticated user | `app/api/v1/chat/route.js` |
| REQ-F-021 | System shall show chat details with optional member population | `app/api/v1/chat/[chatId]/route.js` |
| REQ-F-022 | System shall list messages for a chat with pagination (20 per page) | `app/api/v1/chat/message/[chatId]/route.js` |
| REQ-F-023 | System shall hide private AI answers from other users | `app/api/v1/chat/message/[chatId]/route.js` |
| REQ-F-024 | System shall forward chat update/delete to external backend | `app/api/v1/chat/[chatId]/route.js` |

## Group Chat

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-030 | System shall list groups created by authenticated user | `app/api/v1/chat/group/route.js` |
| REQ-F-031 | System shall support group chat creation via socket backend | RTK Query `newGroup` mutation |
| REQ-F-032 | System shall support adding/removing members via socket backend | RTK Query `addMembers`/`removeMember` mutations |

## AI Features

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-040 | System shall generate question suggestions using NVIDIA NIM API | `lib/server/nvidia.js` |
| REQ-F-041 | System shall fallback to Gemini for question suggestions | `app/api/v1/chat/suggestMessages/route.js` |
| REQ-F-042 | System shall track and avoid repeating suggested questions | `app/api/v1/chat/suggestMessages/route.js` |
| REQ-F-043 | System shall support in-chat AI answers via external backend | `app/api/v1/chat/ask-ai/route.js` |
| REQ-F-044 | System shall support sharing private AI answers to chat | `app/api/v1/chat/ask-ai/share/route.js` |
| REQ-F-045 | System shall allow toggling AI mode per chat | `app/api/v1/chat/ai-mode/route.js` |
| REQ-F-046 | System shall allow deleting private AI answers | `app/api/v1/chat/ai-message/[messageId]/route.js` |

## Board / Q&A

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-050 | System shall provide public question pool per user (GET) | `app/api/v1/chat/questions/route.js` |
| REQ-F-051 | System shall accept anonymous questions (POST) | `app/api/v1/chat/questions/route.js` |
| REQ-F-052 | System shall allow owner to create/edit custom questions (PUT) | `app/api/v1/chat/questions/route.js` |
| REQ-F-053 | System shall allow owner to hide/show showcase items (PATCH) | `app/api/v1/chat/questions/route.js` |
| REQ-F-054 | System shall allow owner to delete custom questions (DELETE) | `app/api/v1/chat/questions/route.js` |
| REQ-F-055 | System shall rank suggestions by topic relevance | `lib/questionFilters.js` |
| REQ-F-056 | System shall exclude near-duplicate questions from suggestions | `lib/questionFilters.js` |
| REQ-F-057 | System shall track question ask origins (hosts) | `app/api/v1/chat/questions/route.js` |
| REQ-F-058 | System shall filter questions by website host | `app/api/v1/chat/questions/route.js` |

## Widget

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-060 | System shall serve widget settings publicly for any username | `app/api/v1/widget/settings/route.js` |
| REQ-F-061 | System shall allow owner to save widget display settings | `app/api/v1/widget/settings/route.js` |
| REQ-F-062 | System shall sanitize all widget settings to prevent CSS injection | `lib/widgetConfig.js` |
| REQ-F-063 | System shall generate embeddable script and iframe snippets | `lib/widgetConfig.js` |

## Admin

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-070 | System shall authenticate admin with secret key | `app/api/v1/admin/verify/route.js` |
| REQ-F-071 | System shall protect all admin routes via middleware | `middleware.js` |
| REQ-F-072 | System shall provide dashboard statistics (users, chats, messages) | `app/api/v1/admin/stats/route.js` |
| REQ-F-073 | System shall list all users with friend/group counts | `app/api/v1/admin/users/route.js` |
| REQ-F-074 | System shall list all chats with member details | `app/api/v1/admin/chats/route.js` |
| REQ-F-075 | System shall list all messages with sender details | `app/api/v1/admin/messages/route.js` |

## User Management

| ID | Requirement | Source |
|----|-------------|--------|
| REQ-F-080 | System shall allow toggling message acceptance | `app/api/v1/user/acceptMessages/route.js` |
| REQ-F-081 | System shall list user's friends from direct chats | `app/api/v1/user/friends/route.js` |
| REQ-F-082 | System shall search users by name (regex, case-insensitive) | `app/api/v1/user/search/route.js` |
| REQ-F-083 | System shall provide notification count for pending requests | `app/api/v1/user/me/route.js` |