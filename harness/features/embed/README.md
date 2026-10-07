# FEAT-010: Embed Page

## Purpose
Render the feedback widget as a standalone page for iframe embedding.

## Users
External website visitors.

## Entry Points
- UI: `app/embed/[username]/page.jsx`

## Dependencies
- Widget settings API
- Question pool API

## Business Rules
- Embed page renders with URL query parameters for customization
- Supports question suggestions and anonymous message sending

## Existing Tests
- E2E board.spec.js: widget preview, save

## Missing Tests
- Embed page rendering
- Query parameter handling
- Message sending from embed