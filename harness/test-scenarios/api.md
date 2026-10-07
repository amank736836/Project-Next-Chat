# API Test Scenarios

| ID | Scenario | Endpoint | Method | Priority |
|----|----------|----------|--------|----------|
| SCN-API-001 | Register new user successfully | `/api/v1/user/new` | POST | P0 |
| SCN-API-002 | Register rejects duplicate email | `/api/v1/user/new` | POST | P0 |
| SCN-API-003 | Register rejects missing fields | `/api/v1/user/new` | POST | P0 |
| SCN-API-004 | Login with valid credentials | `/api/v1/user/login` | POST | P0 |
| SCN-API-005 | Login rejects wrong password | `/api/v1/user/login` | POST | P0 |
| SCN-API-006 | Login rejects unverified user | `/api/v1/user/login` | POST | P0 |
| SCN-API-007 | Logout clears cookie | `/api/v1/user/logout` | GET | P0 |
| SCN-API-008 | Get authenticated user | `/api/v1/user/me` | GET | P0 |
| SCN-API-009 | Verify email with valid code | `/api/v1/user/verify` | POST | P1 |
| SCN-API-010 | Verify email with expired code | `/api/v1/user/verify` | POST | P1 |
| SCN-API-011 | Get chat list for user | `/api/v1/chat` | GET | P0 |
| SCN-API-012 | Get chat details | `/api/v1/chat/:chatId` | GET | P1 |
| SCN-API-013 | Get messages with pagination | `/api/v1/chat/message/:chatId` | GET | P1 |
| SCN-API-014 | Get question pool | `/api/v1/chat/questions` | GET | P0 |
| SCN-API-015 | Ask question anonymously | `/api/v1/chat/questions` | POST | P0 |
| SCN-API-016 | Get widget settings | `/api/v1/widget/settings` | GET | P1 |
| SCN-API-017 | Save widget settings (owner) | `/api/v1/widget/settings` | PUT | P1 |
| SCN-API-018 | Admin login with secret key | `/api/v1/admin/verify` | POST | P0 |
| SCN-API-019 | Get admin dashboard stats | `/api/v1/admin/stats` | GET | P1 |
| SCN-API-020 | Get AI question suggestions | `/api/v1/chat/suggestMessages` | POST | P1 |