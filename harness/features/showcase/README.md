# FEAT-009: Showcase

## Purpose
Public display of a user's answered Q&A.

## Users
Public visitors, board owner.

## Entry Points
- UI: `app/showcase/[username]/page.jsx`, `app/showcase/[username]/layout.js`

## Dependencies
- Question pool API (`/api/v1/chat/questions?username=...`)
- Board reply messages

## Business Rules
- Showcase shows answered questions + board replies
- Owner can hide items from showcase (hiddenFromShowcase)
- Hidden items visible to owner only
- Board replies merged with SuggestedQuestion answers

## Existing Tests
- E2E board.spec.js: showcase visibility, pagination, hide/show

## Missing Tests
- Showcase page rendering
- Hide/show API integration
- Board reply merge logic