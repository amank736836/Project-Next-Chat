# FEAT-006: Board / Q&A

## Purpose
Public anonymous question-and-answer boards where visitors can ask questions and owners can answer them.

## Users
Board owners (authenticated), visitors (anonymous or authenticated).

## Entry Points
- UI: `app/u/[username]/page.jsx`, `app/board/page.jsx` (redirect)
- API: `app/api/v1/chat/questions/route.js` (GET/POST/PUT/PATCH/DELETE)

## Dependencies
- MongoDB (SuggestedQuestion, Message, Chat, User models)
- lib/questionFilters.js (normalization, ranking, dedup)

## Inputs
- GET: username, exclude list, host, refresh flag
- POST: username, question, host
- PUT: username, questionId, question
- PATCH: username, itemId, itemType, action
- DELETE: username, questionId

## Outputs
- suggestions, answered, customQuestions, priorityQuestions, availableHosts, activeHost, ownerView

## Business Rules
- Questions normalized (lowercase, punctuation stripped)
- Near-duplicates excluded (Jaccard similarity >= 0.7)
- Board replies merged with SuggestedQuestion answers
- Personal vs global suggestions mixed (1:2 ratio)
- Ranked by topic relevance
- Owner can hide/show/delete custom questions
- Questions tracked by origin host

## CORS
- GET and POST are CORS-enabled (Access-Control-Allow-Origin: *)
- PUT/PATCH/DELETE require authentication

## Existing Tests
- E2E board.spec.js: owner tabs, visitor composer, question management

## Missing Tests
- Question pool GET API
- Question ask POST API
- Custom question CRUD (PUT/PATCH/DELETE)
- Question normalization
- Near-duplicate detection
- Topic relevance ranking
- Host tracking and filtering
- CORS headers