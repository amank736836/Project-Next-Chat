# Integration Test Scenarios

| ID | Scenario | Components | Priority |
|----|----------|------------|----------|
| SCN-IT-001 | Registration creates user and default chat | API → MongoDB | P0 |
| SCN-IT-002 | Login sets JWT cookie and returns user | API → Auth → Cookie | P0 |
| SCN-IT-003 | Chat list populates member details | API → MongoDB → Populate | P1 |
| SCN-IT-004 | Message list filters private answers | API → MongoDB → Filter | P1 |
| SCN-IT-005 | Board question deduplication works end-to-end | API → MongoDB → Filters | P1 |
| SCN-IT-006 | Widget settings CRUD round-trip | API → MongoDB → Sanitize | P1 |
| SCN-IT-007 | Proxy route forwards to external backend | Next.js → Express | P1 |
| SCN-IT-008 | Socket connection requires valid JWT | Socket → Auth | P1 |