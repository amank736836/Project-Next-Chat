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
