# Database Test Scenarios

| ID | Scenario | Model | Priority |
|----|----------|-------|----------|
| SCN-DB-001 | User model validates required fields | User | P0 |
| SCN-DB-002 | User model enforces unique email | User | P0 |
| SCN-DB-003 | User model enforces unique username | User | P0 |
| SCN-DB-004 | User model hashes password on save | User | P0 |
| SCN-DB-005 | User model excludes password from queries by default | User | P1 |
| SCN-DB-006 | Chat model defaults groupChat to false | Chat | P1 |
| SCN-DB-007 | Chat model defaults aiEnabled to true | Chat | P1 |
| SCN-DB-008 | SuggestedQuestion enforces unique compound index | SuggestedQuestion | P1 |
| SCN-DB-009 | WidgetSettings enforces unique username | WidgetSettings | P1 |
| SCN-DB-010 | Message model indexes privateTo and hiddenFromShowcase | Message | P2 |