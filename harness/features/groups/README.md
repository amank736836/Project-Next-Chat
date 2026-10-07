# FEAT-003: Group Chat

## Purpose
Enable multi-user group conversations.

## Users
Registered, authenticated users.

## Entry Points
- UI: `app/groups/page.jsx`
- API: `app/api/v1/chat/group/route.js` (GET)
- Socket: External backend for group mutations (create, rename, add/remove members, leave)

## Dependencies
- MongoDB (Chat model)
- Socket.io (real-time)
- Redux (RTK Query mutations)

## Business Rules
- Group creator is the owner
- Only creator can rename, add/remove members
- Group chat has `groupChat: true` flag
- Group avatar shows first 3 member avatars

## Existing Tests
- E2E workspace.spec.js: group creation dialog, management

## Missing Tests
- Group creation API
- Group listing API
- Member management
- Group rename
- Group deletion