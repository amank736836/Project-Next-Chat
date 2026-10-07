# FEAT-004: AI Features

## Purpose
Provide AI-powered question suggestions and in-chat AI assistance.

## Users
All visitors (suggestions), authenticated users (in-chat AI).

## Entry Points
- API: `app/api/v1/chat/suggestMessages/route.js`, `app/api/v1/chat/ask-ai/route.js`, `app/api/v1/chat/ask-ai/share/route.js`, `app/api/v1/chat/ai-mode/route.js`, `app/api/v1/chat/ai-message/[messageId]/route.js`

## Dependencies
- NVIDIA NIM API (primary AI provider)
- Google Gemini API (fallback)
- MongoDB (SuggestedQuestion model)
- External backend (ask-ai proxy)

## Inputs
- Suggest: exclude list, asked question
- Ask AI: chat context, question
- Share: message ID, chat ID
- AI Mode: chatId, enabled boolean

## Outputs
- Suggest: pipe-separated question suggestions
- Ask AI: AI-generated answer
- Share: confirmation
- AI Mode: updated setting

## Business Rules
- Suggestions avoid repeating questions
- NVIDIA used first, Gemini as fallback
- Seed questions provided as ultimate fallback
- AI mode defaults to enabled per chat
- Private AI answers visible only to asker
- Max 1200 chars for AI answers

## Error Handling
- Graceful fallback when AI providers fail
- 45-second timeout on AI calls

## Permissions
- Suggest: public
- Ask AI: authenticated (proxied)
- AI Mode: chat members only

## Existing Tests
- None

## Missing Tests
- NVIDIA suggestion parsing
- Gemini fallback behavior
- Suggestion deduplication
- AI mode toggle
- Private answer visibility
- AI timeout handling
- Prompt construction