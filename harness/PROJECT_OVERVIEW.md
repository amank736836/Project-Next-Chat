# Project Overview — Stealthy Note

## Purpose

Stealthy Note is a real-time anonymous social messaging platform built with Next.js. Users can chat privately, create group conversations, ask anonymous questions on public "boards," and embed a feedback widget on external websites. The platform integrates AI-powered question suggestions and in-chat AI assistance.

## Main Users

| User Type | Description |
|-----------|-------------|
| Registered User | Authenticated user who can chat, create groups, manage a board |
| Anonymous Visitor | Unauthenticated visitor who can ask questions on user boards or via the embed widget |
| Admin | Elevated user who can view all users, chats, messages, and dashboard statistics |

## Main Workflows

1. **User Registration** → Email verification → Login → Workspace
2. **1-on-1 Chat** → Search user → Send friend request → Accept → Chat
3. **Group Chat** → Create group → Add members → Group messaging
4. **Anonymous Q&A Board** → Owner creates custom questions → Visitors ask/answer → Showcase
5. **Embed Widget** → Owner configures widget → Generates snippet → External site visitors send messages
6. **AI Features** → Suggested questions (NVIDIA/Gemini) → In-chat AI answers
7. **Admin Dashboard** → Login with secret key → View stats/users/chats/messages

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.2+ | React framework (App Router) |
| React | 19 | UI library |
| MUI (Material UI) | 7 | Component library |
| Redux Toolkit | 2.7+ | State management + RTK Query |
| Socket.io Client | 4.8+ | Real-time communication |
| Framer Motion | 12 | Animations |
| Chart.js / react-chartjs-2 | 4 / 5 | Admin dashboard charts |
| Axios | 1.8+ | HTTP client |
| React Hot Toast | 2 | Notifications |

### Backend (Next.js API Routes + External Express Backend)
| Technology | Purpose |
|------------|---------|
| Next.js API Routes (app/api/v1/) | Local API endpoints |
| Express + Socket.io (external) | Real-time messaging backend at `mern-chatapp-backend-oyek.onrender.com` |
| Mongoose 9 | MongoDB ODM |
| jsonwebtoken | JWT authentication |
| bcrypt | Password hashing |
| Nodemailer | Email sending (verification, password reset) |
| Cloudinary | File/image uploads |
| NVIDIA NIM API | AI question suggestions |
| Google Generative AI | AI question suggestions (fallback) |

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB (via Mongoose) | Primary data store |

### Testing
| Technology | Purpose |
|------------|---------|
| Vitest 4 | Unit & integration tests |
| @testing-library/react 16 | React component testing |
| @testing-library/jest-dom | DOM assertions |
| Playwright 1.59 | End-to-end tests |
| MSW 2 | API mocking |
| jsdom 29 | Browser environment for unit tests |

## Authentication & Authorization

### User Authentication
- JWT tokens stored in HTTP-only cookies
- Cookie name: `StealthyNoteToken`
- Token expiry: 7 days (configurable)
- Password: bcrypt hashed, minimum 6 characters
- Email verification via 6-digit code (10-minute expiry)

### Admin Authentication
- Separate JWT cookie: `StealthyNoteAdminToken`
- Secret key authentication (`ADMIN_SECRET_KEY` env var)
- Admin token encodes the secret key claim
- Middleware protects all `/admin/*` routes

### Remote Auth
- Optional `NEXT_PUBLIC_REMOTE_AUTH=true` for cross-origin backend authentication
- Cookies set on the remote backend's origin for socket compatibility

## APIs

### User APIs (`/api/v1/user/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/new` | POST | Register new user |
| `/login` | POST | User login |
| `/logout` | GET | User logout |
| `/me` | GET | Get authenticated user |
| `/verify` | POST | Verify email with code |
| `/forgotPassword` | POST | Send password reset code |
| `/updatePassword` | POST | Reset password with code |
| `/acceptMessages` | POST | Toggle message acceptance |
| `/friends` | GET | Get user's friends |
| `/search` | GET | Search users by name |
| `/notifications` | GET | Get pending friend requests |
| `/check-username` | GET | Check username availability |
| `/check-email` | GET | Check email availability |

### Chat APIs (`/api/v1/chat/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Get user's chats |
| `/:chatId` | GET | Get chat details |
| `/:chatId` | PUT | Update chat (proxied) |
| `/:chatId` | DELETE | Delete chat (proxied) |
| `/group` | GET | Get user's groups |
| `/message/:chatId` | GET | Get messages (paginated) |
| `/suggestMessages` | POST | Get AI question suggestions |
| `/questions` | GET/POST/PUT/PATCH/DELETE | Question pool CRUD |
| `/ask-ai` | POST | Ask AI in chat |
| `/ask-ai/share` | POST | Share AI answer to chat |
| `/ask-and-record` | POST | Ask question and record |
| `/ai-mode` | PUT | Toggle per-chat AI mode |
| `/ai-message/:messageId` | DELETE | Delete private AI answer |

### Admin APIs (`/api/v1/admin/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | Verify admin session |
| `/verify` | POST | Admin login |
| `/logout` | GET | Admin logout |
| `/stats` | GET | Dashboard statistics |
| `/users` | GET | All users list |
| `/chats` | GET | All chats list |
| `/messages` | GET | All messages list |

### Widget APIs (`/api/v1/widget/`)
| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/settings` | GET | Get widget settings (public) |
| `/settings` | PUT | Save widget settings (owner) |

### Proxy Route (`/api/v1/[...slug]`)
- Catch-all proxy to the external Express backend
- Forwards cookies, handles multipart/form-data

## Database Models

### User
`name`, `email` (unique), `username` (unique, alphanumeric), `password` (bcrypt, select:false), `avatar` (Cloudinary), `isAcceptingMessage`, `verifyCode`, `verifyCodeExpiry`, `isVerified`, timestamps

### Chat
`name`, `groupChat` (boolean), `aiEnabled` (boolean, default true), `creator` (ref User), `members` (ref User[]), timestamps

### Message
`sender` (ref User), `host` (origin attribution), `privateTo` (ref User, for private AI), `chat` (ref Chat), `content`, `replyTo` ({senderName, content}), `hiddenFromShowcase` (boolean), `attachments` (Cloudinary), timestamps

### Request
`status` (pending/accepted/rejected), `sender` (ref User), `receiver` (ref User), timestamps

### SuggestedQuestion
`targetUsername`, `question`, `normalizedQuestion` (unique compound index), `askedCount`, `hosts[]`, `answer`, `answeredAt`, `hiddenFromShowcase`, timestamps

### WidgetSettings
`username` (unique), `position`, `themeColor`, `backgroundColor`, `textColor`, `title`, `subtitle`, `placeholder`, `buttonText`, `bubbleLabel`, `shape`, `size`, `autoOpenDelay`, `showSuggestions`, `enabled`, `sites[]`, timestamps

## Important Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Auth utilities | `lib/server/auth.js` | JWT sign/verify, cookie management |
| Database connection | `lib/server/db.js` | Mongoose connection pooling |
| Email service | `lib/server/email.js` | Nodemailer verification/reset emails |
| Cloudinary | `lib/server/cloudinary.js` | File upload/delete |
| NVIDIA AI | `lib/server/nvidia.js` | AI suggestions + chat answers |
| CORS | `lib/server/cors.js` | CORS headers for public endpoints |
| Validators | `lib/validators.js` | Username and verify code validation |
| Widget config | `lib/widgetConfig.js` | Widget settings sanitization |
| Question filters | `lib/questionFilters.js` | Board question matching/ranking |
| Features | `lib/features.js` | File format detection, image transforms |
| Middleware | `middleware.js` | Admin route protection, dev tools gating |
| Config | `constants/config.js` | API backend URL resolution |
| Events | `constants/events.js` | Socket.io event names |
| Brand | `constants/brand.js` | Design tokens |
| Redux API | `redux/api/api.js` | RTK Query endpoint definitions |
| Socket Provider | `providers/SocketProvider.jsx` | Socket.io context |

## Environments

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes (local auth) | MongoDB connection string |
| `JWT_SECRET` | Yes (local auth) | JWT signing secret |
| `ADMIN_SECRET_KEY` | Yes (admin) | Admin login secret |
| `CLOUDINARY_*` | Yes (file uploads) | Cloudinary credentials |
| `NODE_MAILER_*` | Yes (emails) | SMTP credentials |
| `NEXT_PUBLIC_SOCKET_SERVER_URL` | Optional | External socket backend |
| `NEXT_PUBLIC_REMOTE_AUTH` | Optional | Cross-origin auth |
| `BACKEND_SERVER_URL` | Optional | Proxy target |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional | Gemini AI |
| `NVIDIA_API_KEY` | Optional | NVIDIA NIM AI |
| `ENABLE_DEV_TOOLS` | Optional | Dev tools in production |
| `ALLOWED_DEV_ORIGINS` | Optional | Dev HMR proxy origins |

## Deployment

- **Platform**: Vercel (analytics + speed insights integrated)
- **Frontend**: Next.js on Vercel
- **Backend**: Express + Socket.io on Render (`mern-chatapp-backend-oyek.onrender.com`)
- **Database**: MongoDB (Atlas or self-hosted)
- **File Storage**: Cloudinary
- **Fonts**: Self-hosted DM Sans (WOFF2)