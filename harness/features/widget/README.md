# FEAT-007: Widget / Embed

## Purpose
Embeddable feedback widget that external websites can add via script tag or iframe.

## Users
Widget owners (authenticated), external website visitors (anonymous).

## Entry Points
- UI: `app/embed/[username]/page.jsx`
- API: `app/api/v1/widget/settings/route.js` (GET public, PUT owner-only)
- Script: `public/widget.js`

## Dependencies
- MongoDB (WidgetSettings model)
- lib/widgetConfig.js (sanitization, snippet generation)

## Inputs
- GET: username (query param)
- PUT: username, settings object (position, colors, text, shape, size, etc.)

## Outputs
- Settings JSON (sanitized)
- Script snippet HTML
- Iframe snippet HTML

## Business Rules
- Settings are sanitized: hex colors validated, strings trimmed, enums checked
- Title max 80 chars, subtitle max 140, placeholder max 200, button max 40
- Auto-open delay 0-120 seconds
- Max 20 sites per widget
- Only owner can update settings
- Public GET has CORS headers

## Error Handling
- Invalid colors fall back to defaults
- Missing settings use WIDGET_DEFAULTS

## Permissions
- GET: public (CORS *)
- PUT: owner-only (authenticated, username must match)

## Existing Tests
- `components/styles/__tests__/brand.test.jsx` (widget color preservation)

## Missing Tests
- Widget settings GET API
- Widget settings PUT API
- Settings sanitization (all fields)
- Snippet generation
- Embed page rendering
- Cross-origin access