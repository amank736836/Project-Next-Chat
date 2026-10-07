# Negative Test Scenarios

| ID | Scenario | Feature | Priority |
|----|----------|---------|----------|
| SCN-NG-001 | Register with missing required fields returns 400 | FEAT-001 | P0 |
| SCN-NG-002 | Login with wrong password returns 401 | FEAT-001 | P0 |
| SCN-NG-003 | Login with non-existent user returns 404 | FEAT-001 | P0 |
| SCN-NG-004 | Access protected route without token returns 401 | FEAT-001 | P0 |
| SCN-NG-005 | Access admin route with invalid token redirects to login | FEAT-005 | P0 |
| SCN-NG-006 | Verify with expired code returns 400 | FEAT-001 | P1 |
| SCN-NG-007 | Verify with wrong code returns 400 | FEAT-001 | P1 |
| SCN-NG-008 | Ask question with empty username returns 400 | FEAT-006 | P1 |
| SCN-NG-009 | Ask question with empty question text returns 400 | FEAT-006 | P1 |
| SCN-NG-010 | Update widget settings for another user returns 403 | FEAT-007 | P1 |
| SCN-NG-011 | Toggle AI mode with non-member returns 403 | FEAT-004 | P1 |
| SCN-NG-012 | Delete custom question by non-owner returns 403 | FEAT-006 | P1 |
| SCN-NG-013 | Admin login with wrong secret key returns 401 | FEAT-005 | P0 |
| SCN-NG-014 | Check username without param returns 400 | FEAT-001 | P2 |
| SCN-NG-015 | Check email without param returns 400 | FEAT-001 | P2 |