# Edge Case Test Scenarios

| ID | Scenario | Feature | Priority |
|----|----------|---------|----------|
| SCN-EC-001 | Register with name at minimum length (3 chars) | FEAT-001 | P2 |
| SCN-EC-002 | Register with name at maximum length (30 chars) | FEAT-001 | P2 |
| SCN-EC-003 | Register with username at boundary (3 chars) | FEAT-001 | P2 |
| SCN-EC-004 | Register with password at minimum length (6 chars) | FEAT-001 | P2 |
| SCN-EC-005 | Username with underscores and numbers | FEAT-001 | P2 |
| SCN-EC-006 | Widget title at max length (80 chars) | FEAT-007 | P2 |
| SCN-EC-007 | Widget auto-open delay at boundaries (0 and 120) | FEAT-007 | P2 |
| SCN-EC-008 | Question pool with empty suggestions | FEAT-004 | P2 |
| SCN-EC-009 | Messages page beyond total pages returns empty | FEAT-002 | P2 |
| SCN-EC-010 | Chat with no messages returns empty array | FEAT-002 | P2 |
| SCN-EC-011 | User with no chats returns empty array | FEAT-002 | P2 |
| SCN-EC-012 | Question with special characters in content | FEAT-006 | P2 |