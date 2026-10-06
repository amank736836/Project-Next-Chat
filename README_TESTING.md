# Frontend Testing Guide

This directory contains the test suite for the chat-next frontend.

## 🚀 Running Tests

### Unit & Integration Tests
Run tests using Vitest:
```bash
npm run test
```
For a single run:
```bash
npm run test:unit
```

### End-to-End (E2E) Tests
Run tests using Playwright:
```bash
npm run test:e2e
```
To view the visual report after tests complete:
```bash
npx playwright show-report
```

## 📁 Structure
- `tests/unit/`: Redux slices and utility functions.
- `tests/integration/`: API proxy and frontend-backend communication.
- `tests/e2e/`: Full user journeys (Auth, Admin Panel, Chat).

## 📝 Notes
- **E2E Requirements:** The backend server must be running on port 4000 and the frontend on port 3000 for E2E tests to pass.
- **Assets:** Registration tests use the dummy image at `tests/e2e/test-avatar.png`.

## 🔌 Realtime (socket.io) backend

The browser talks to the Express/socket.io backend configured by
`NEXT_PUBLIC_SOCKET_SERVER_URL` (see `.env.example`):

```bash
cp .env.example .env.local   # then restart: npm run dev
```

That single value drives both the socket connection
(`providers/SocketProvider.jsx`) and the realtime-backed REST calls in
`redux/api/api.js` (`${NEXT_PUBLIC_SOCKET_SERVER_URL}/api/v1/...`).
Because it is a `NEXT_PUBLIC_*` variable it is inlined at build time — restart
the dev server (or redeploy) after changing it.

### Live test bench: `/dev/socket`

A dev-only page that connects to the configured
server and streams the handshake: status, time-to-connect, transport
(polling → websocket upgrade), socket id, engine sid, heartbeats and every
`connect` / `connect_error` / `disconnect` / reconnect event.

Useful checks:
- **Transport** – force `WebSocket only` or `HTTP long-polling only` to see
  whether a proxy/firewall is blocking the upgrade.
- **Auth** – paste a JWT into the token field; it is sent as both
  `auth.token` and a query param. A `connect_error: Please Login` means the
  backend could not verify a session (see the note on the page).

Note: the socket is only opened by `SocketProvider` once a user exists in Redux
(`state.auth.user`), so the app itself connects after login — the test bench
connects independently so the transport can be verified without credentials.

Production builds answer `/dev/*` with a real **HTTP 404** (the app's 404 page).
`middleware.js` blocks the path before it renders — a `notFound()` thrown while a
page streams cannot change the already-sent 200 status line — and the page itself
repeats the check as a second layer.

To debug a deployed origin (where cookie/CORS behaviour differs from localhost)
set `ENABLE_DEV_TOOLS=true` in the host's environment and the page is served
again. Leave it unset otherwise.

### Logging in when the backend lives on another origin: `NEXT_PUBLIC_REMOTE_AUTH`

The app ships its own Next API routes (`app/api/v1/user/*`, backed by Mongo +
JWT), so by default login/session calls stay same-origin. A session cookie set
by *this* origin is never sent to a different backend origin — which is exactly
why a socket pointed at `NEXT_PUBLIC_SOCKET_SERVER_URL` can fail its handshake
with `connect_error: Please Login`.

Set both variables to move authentication (and the RTK Query calls) onto the
remote backend:

```bash
NEXT_PUBLIC_SOCKET_SERVER_URL=https://your-backend.example.com
NEXT_PUBLIC_REMOTE_AUTH=true
```

What that does (see `constants/config.js`):

- `apiBackend` becomes `${NEXT_PUBLIC_SOCKET_SERVER_URL}/api/v1` instead of
  `/api/v1`, and `authApiBase` becomes `${apiBackend}/user`.
- `login`, `me`, `logout`, `acceptMessage` and every RTK Query endpoint are
  issued by the browser straight at the backend with `credentials: "include"`,
  so the session cookie is stored on — and sent to — the backend's origin, and
  the socket handshake carries it too.
- The login body additionally sends `username` or `email` alongside `identifier`
  so backends that key off those field names (e.g. the mern-chat-app server)
  accept it.

Leaving the flag unset/`false` keeps today's behaviour: local Next API routes,
zero change for existing deployments. Note that `redux/thunks/admin.thunk.js`
still targets the local `/api/v1/admin` routes either way, so the admin
dashboard stays local-backed.

Backend requirements for a browser to log in cross-origin:

1. CORS must allow the frontend origin **with credentials** —
   `Access-Control-Allow-Origin: <that exact origin>` (never `*`) plus
   `Access-Control-Allow-Credentials: true`.
2. The session cookie must be `SameSite=None; Secure` and served over HTTPS.

`/dev/socket` has a **Backend session** card that performs exactly this login
(username + password), reports the HTTP status and message, re-checks
`GET /user/me` to prove the cookie landed, and only then opens the socket — the
quickest way to separate a CORS/cookie problem from a socket problem.

## Logged-in workspace UI regression suite

`tests/e2e/workspace.spec.js` covers chat search/type filters, group creation and
management dialogs, the reply composer, mobile drawers, reduced motion, and the
admin overview/users/chats/messages screens. It stubs API responses **inside the
test browser only**; no fixture data or authentication bypass is added to the app.

```bash
# Terminal 1: local Next dev server (no database needed for this fixture suite)
npm run dev
# Terminal 2
npx playwright install chromium
npm run test:e2e -- tests/e2e/workspace.spec.js --workers=1
```

Run against localhost only. If the dev server uses custom `JWT_SECRET`,
`ADMIN_SECRET_KEY`, or `STEALTHY_NOTE_ADMIN_TOKEN_NAME`, pass the same test values
to Playwright so its local admin test cookie is valid. The suite verifies UI
behavior, not real message delivery or database mutations; those still require
a configured MongoDB and socket backend.

The new unit tests in `components/shared/__tests__` cover conversation filtering
(including records beyond the initial render window), accessible deletion
controls, empty states, and admin record search/clear behavior.

For production compilation, `MONGODB_URI` must be defined because the existing
server DB module validates it at import time. A build-only placeholder can check
compilation but does not validate database connectivity.

### Board coverage

`tests/e2e/board.spec.js` exercises the actual `/u/[username]` page reached by
`/board`, not just the redirect. It covers owner Overview/Questions/Showcase/Embed
tabs, clipboard sharing, question create/delete, showcase visibility and
pagination, website filters, widget preview/save, anonymous and signed-in visitor
composers, empty/loading/error/retry states, and 320px/reduced-motion layouts.

```bash
npm run test:e2e -- tests/e2e/board.spec.js --workers=1
# Both authenticated workspace and board suites:
npm run test:e2e -- --workers=1
```

The board tests also intercept API responses in the browser only. The same-origin
send fallback is covered with `NEXT_PUBLIC_SOCKET_SERVER_URL` unset; real socket
message delivery, widget installation, and database writes still need backend
integration testing. No production fixture data is introduced.


### Theme consistency checks

The workspace and board browser suites compare **computed** primary-button,
canvas, message-bubble, logo, and font styles against the login reference. They
also cover recovery/admin-login shells and default embed colors. Unit tests in
`components/styles/__tests__/brand.test.jsx` keep CSS/MUI/chart/widget tokens in
sync, check text/button contrast, and ensure saved widget colors are not replaced
by a brand refresh. Existing user-selected widget colors are intentionally not
expected to match the application theme.
