# FEAT-005: Admin Dashboard

## Purpose
Provide administrators with system overview, user management, and content monitoring.

## Users
Admin users (authenticated with secret key).

## Entry Points
- UI: `app/admin/login/`, `app/admin/dashboard/`, `app/admin/users/`, `app/admin/chats/`, `app/admin/messages/`
- API: `app/api/v1/admin/*`
- Middleware: `middleware.js` (route protection)

## Dependencies
- MongoDB (all models)
- jsonwebtoken (admin JWT)
- Redux (admin thunks)

## Inputs
- Secret key for login
- No inputs for stats/users/chats/messages (GET only)

## Outputs
- Dashboard stats: totalUsers, totalChats, totalMessages, groupChatCount, last7DaysMessages
- User list: name, email, username, avatar, friends count, groups count
- Chat list: name, members, message count, creator
- Message list: content, sender, chat, attachments

## Business Rules
- Admin auth is separate from user auth
- Admin token encodes secret key claim
- Admin token expires after 12 hours
- Middleware protects all /admin/* routes except /admin/login
- Expired tokens are auto-cleared

## Error Handling
- 401: Invalid secret key or expired session
- 500: Server error

## Permissions
- All admin endpoints require admin authentication
- No user-level permissions within admin

## Existing Tests
- `components/auth/__tests__/AdminProtectedRoute.test.jsx` (session check, redirect)
- `components/layout/__tests__/AdminAsyncContent.test.jsx` (loading, error, retry)
- `components/shared/__tests__/Table.test.jsx` (data grid, search, animation)
- E2E workspace.spec.js: admin screens

## Missing Tests
- Admin login API (valid/invalid secret key)
- Admin stats API
- Admin users list API
- Admin chats list API
- Admin messages list API
- Admin middleware (token verification, expired token handling)
- Admin logout