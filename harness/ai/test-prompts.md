# Test Prompts — Stealthy Note

Reusable prompts for AI-assisted test generation.

## API Route Test Generation

```
Given the Next.js API route at [PATH]:
1. Read the source code
2. Identify all HTTP methods (GET, POST, PUT, DELETE)
3. Identify required inputs and validation
4. Identify authentication requirements
5. Identify success and error responses
6. Generate test cases covering:
   - Happy path (valid input, valid auth)
   - Missing fields
   - Invalid input
   - Unauthorized access
   - Not found scenarios
```

## Component Test Generation

```
Given the React component at [PATH]:
1. Read the source code
2. Identify props and their types
3. Identify user interactions (clicks, inputs)
4. Identify conditional rendering
5. Generate test cases covering:
   - Renders correctly with default props
   - Handles user interactions
   - Shows correct content for different states
   - Handles edge cases (empty data, loading, error)
```

## Security Test Generation

```
Given the endpoint at [PATH]:
1. Identify authentication mechanism (JWT cookie, admin token)
2. Identify authorization rules (owner, member, public)
3. Generate test cases covering:
   - No authentication → 401
   - Wrong authentication → 401
   - Wrong authorization → 403
   - IDOR (accessing another user's data)
   - Input injection (NoSQL, XSS)
```

## Database Model Test Generation

```
Given the Mongoose model at [PATH]:
1. Read the schema definition
2. Identify required fields, types, validators
3. Identify indexes and unique constraints
4. Identify pre/post hooks
5. Generate test cases covering:
   - Required field validation
   - Type coercion
   - Default values
   - Unique constraint enforcement
   - Hook behavior (e.g., password hashing)
```