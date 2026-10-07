# FEAT-012: Search

## Purpose
Search for users by name to start conversations or send friend requests.

## Users
Authenticated users.

## Entry Points
- UI: `specific/Search.jsx`
- API: `app/api/v1/user/search/route.js`

## Dependencies
- MongoDB (User model)

## Business Rules
- Search uses regex, case-insensitive
- Excludes current user from results
- Returns name, username, avatar

## Existing Tests
- E2E workspace.spec.js: search dialog

## Missing Tests
- Search API test
- Search result filtering
- Empty result handling