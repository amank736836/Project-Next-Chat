# FEAT-002: Chat (1-on-1)

## Purpose
Enable private real-time messaging between two users.

## Users
Registered, authenticated users.

## Entry Points
- UI: `app/chat/[chatId]/page.jsx`
- API: `app/api/v1/chat/route.js`, `app/api/v1/chat/[chatId]/route.js`, `app/api/v1/chat/message/[chatId]/route.js`
- Socket: External backend for real-time delivery

## Dependencies
- MongoDB (Chat, Message models)
- Socket.io (real-time)
- Redux (state management)
- RTK Query (data fetching)

## Inputs
- Chat ID, message content, attachments, reply references

## Outputs
- Chat list, chat details, paginated messages

## Business Rules
- Messages paginated at 20 per page
- Private AI answers visible only to asker (privateTo filter)
- Chat name for 1-on-1 shows other member's name
- Chat update/delete proxied to external backend

## Error Handling
- 401: Not authenticated
- 404: Chat/message not found
- 500: Server error

## Permissions
- Only chat members can view messages
- Only authenticated users can access chats

## Existing Tests
- E2E workspace.spec.js: chat list filtering, message display

## Missing Tests
- Chat listing API
- Chat details API
- Message pagination API
- Message visibility (privateTo) filtering
- Attachment handling
- Reply threading