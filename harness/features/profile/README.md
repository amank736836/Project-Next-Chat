# FEAT-011: Profile

## Purpose
Display and manage user profile information.

## Users
Authenticated users.

## Entry Points
- UI: `components/shared/Profile.jsx` (rendered in workspace sidebar)

## Dependencies
- User model
- Auth state (Redux)

## Business Rules
- Profile shows user name, avatar, and settings
- Toggle accepting messages on/off
- Copy shareable profile link

## Existing Tests
- None

## Missing Tests
- Profile rendering
- Toggle accepting messages
- Copy link functionality