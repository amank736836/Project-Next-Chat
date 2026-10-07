# Performance Test Scenarios

| ID | Scenario | Target | Priority |
|----|----------|--------|----------|
| SCN-PF-001 | Chat list API responds under 500ms | `/api/v1/chat` | P2 |
| SCN-PF-002 | Message pagination API responds under 300ms | `/api/v1/chat/message/:chatId` | P2 |
| SCN-PF-003 | Board question pool loads under 1s | `/api/v1/chat/questions` | P2 |
| SCN-PF-004 | Widget settings API responds under 200ms | `/api/v1/widget/settings` | P2 |
| SCN-PF-005 | AI suggestion API responds under 5s (with AI providers) | `/api/v1/chat/suggestMessages` | P2 |
| SCN-PF-006 | Database connection reuse (no reconnect per request) | `lib/server/db.js` | P1 |