# Feature Inventory — Stealthy Note

## Features

| ID | Feature | Description | Entry Point | Status |
|----|---------|-------------|-------------|--------|
| FEAT-001 | Authentication | User registration, login, logout, email verification, password reset | `/api/v1/user/*`, `app/(auth)/*` | Active |
| FEAT-002 | Chat (1-on-1) | Private messaging between two users | `/api/v1/chat/*`, `app/chat/[chatId]` | Active |
| FEAT-003 | Group Chat | Multi-user group conversations | `/api/v1/chat/group`, RTK mutations | Active |
| FEAT-004 | AI Features | Question suggestions, in-chat AI answers | `/api/v1/chat/suggestMessages`, `ask-ai` | Active |
| FEAT-005 | Admin Dashboard | Admin stats, user/chat/message management | `/admin/*`, `/api/v1/admin/*` | Active |
| FEAT-006 | Board / Q&A | Public anonymous question boards per user | `/api/v1/chat/questions`, `/u/[username]` | Active |
| FEAT-007 | Widget / Embed | Embeddable feedback widget for external sites | `/api/v1/widget/settings`, `/embed/[username]` | Active |
| FEAT-008 | Question Pool | Question management, relevance ranking, dedup | `/api/v1/chat/questions` | Active |
| FEAT-009 | Showcase | Display answered Q&A publicly | `/showcase/[username]` | Active |
| FEAT-010 | Profile | User profile display and management | `/app/page.jsx` (Profile component) | Active |
| FEAT-011 | Search | User search and friend discovery | `/api/v1/user/search` | Active |
| FEAT-012 | Notifications | Friend request notifications | `/api/v1/user/notifications` | Active |

## Navigation Map

```
/ (Home - Workspace)
├── /login              (Auth - Login)
├── /forgot             (Auth - Forgot Password)
├── /verify             (Auth - Email Verification)
├── /chat/[chatId]      (Chat Room)
├── /groups             (Group Management)
├── /board              (Board → redirects to /u/[username])
├── /u/[username]       (Public Board)
├── /showcase/[username] (Showcase Page)
├── /embed/[username]   (Embed Widget Page)
├── /privacy            (Privacy Policy)
├── /terms              (Terms of Service)
├── /admin/login        (Admin Login)
├── /admin/dashboard    (Admin Dashboard)
├── /admin/users        (Admin Users)
├── /admin/chats        (Admin Chats)
├── /admin/messages     (Admin Messages)
└── /dev/socket         (Dev Socket Playground)
```