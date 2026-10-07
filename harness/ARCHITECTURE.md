# Architecture — Stealthy Note

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CLIENT (Browser)                   │
│  Next.js 15 App Router (React 19)                   │
│  Redux Toolkit + RTK Query                          │
│  Socket.io Client                                   │
│  MUI 7 / Framer Motion / Chart.js                   │
└──────────┬──────────────┬───────────────┬───────────┘
           │              │               │
    ┌──────▼──────┐ ┌─────▼─────┐  ┌──────▼──────┐
    │  Next.js    │ │  Socket   │  │  External   │
    │  API Routes │ │  Server   │  │  Widget     │
    │  (Local)    │ │  (Remote) │  │  (Embed)    │
    └──────┬──────┘ └─────┬─────┘  └──────┬──────┘
           │              │               │
    ┌──────▼──────────────▼───────────────▼──────┐
    │              MongoDB (StealthyNote)         │
    └────────────────────────────────────────────┘
```

## Data Flow

### Authentication Flow
1. Client sends credentials to `/api/v1/user/login` (or remote backend)
2. Server validates credentials, generates JWT
3. JWT set as HTTP-only cookie (`StealthyNoteToken`)
4. Subsequent requests include cookie automatically
5. Server verifies JWT on protected routes

### Real-time Chat Flow
1. Client connects to Socket.io server with JWT auth
2. Server validates token, assigns socket to user room
3. Messages sent via socket → server persists to MongoDB
4. Server broadcasts to chat members via socket events
5. RTK Query caches for offline/paginated access

### Board/Q&A Flow
1. Anonymous visitor loads `/u/[username]` or embed widget
2. Client fetches question pool from `/api/v1/chat/questions?username=...`
3. Visitor asks question → `/api/v1/chat/questions` POST
4. Owner answers on board → message created with `replyTo`
5. Showcase displays answered questions + board replies

## Database Schema

### Collections
- `users` — User accounts
- `chats` — 1-on-1 and group chats
- `messages` — Chat messages with attachments
- `requests` — Friend requests
- `suggestedquestions` — Question pool (per-user + global)
- `widgetsettings` — Embed widget configuration

### Key Relationships
- User → owns → Chat (creator)
- User → member of → Chat[] (members)
- Chat → contains → Message[]
- User → sends/receives → Request[]
- User → has → SuggestedQuestion[] (targetUsername)
- User → has → WidgetSettings (username)

## Deployment Architecture

| Component | Platform | Purpose |
|-----------|----------|---------|
| Next.js Frontend + API | Vercel | Web application + local API routes |
| Express + Socket.io | Render | Real-time messaging backend |
| MongoDB | Atlas/Remote | Primary database |
| Cloudinary | Cloud CDN | File/image storage |
| NVIDIA NIM | API | AI suggestions |
| Google Gemini | API | AI suggestions (fallback) |
| Gmail SMTP | SMTP | Email delivery |

## CORS Configuration

- Public endpoints (`/questions`, `/widget/settings`, `/ask-and-record`): `Access-Control-Allow-Origin: *`
- Protected endpoints: Cookie-based auth, same-origin or `NEXT_PUBLIC_REMOTE_AUTH`
- Widget embed: Cross-origin via `<script>` or `<iframe>`