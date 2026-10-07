# FEAT-001: Authentication

## Purpose
Allow users to register, verify email, login, logout, and reset passwords.

## Users
All visitors and registered users.

## Entry Points
- UI: `app/(auth)/login/`, `app/(auth)/forgot/`, `app/(auth)/verify/`
- API: `app/api/v1/user/new/`, `login/`, `logout/`, `me/`, `verify/`, `forgotPassword/`, `updatePassword/`, `check-username/`, `check-email/`

## Dependencies
- MongoDB (User model)
- bcrypt (password hashing)
- jsonwebtoken (JWT)
- Nodemailer (verification emails)
- Cloudinary (avatar upload)

## Inputs
- Registration: name, email, username, password, avatar file
- Login: identifier (email or username), password
- Verify: identifier, verifyCode
- Forgot Password: identifier
- Update Password: identifier, password, verifyCode

## Outputs
- JWT cookie on success
- User object (without password)
- Success/error JSON responses

## Business Rules
- Username: 3-30 chars, alphanumeric + underscore, unique
- Email: valid format, unique
- Password: min 6 chars, bcrypt hashed
- Avatar: required, uploaded to Cloudinary
- Verify code: 6-digit numeric, 10-minute expiry
- Unverified users cannot login

## Error Handling
- 400: Missing/invalid fields
- 401: Wrong password, unverified account
- 404: User not found
- 500: Server error

## Permissions
- Registration: public
- Login: public
- Verify: public
- Logout: authenticated
- Me: authenticated
- Password reset: public (requires email)

## Related APIs
- REQ-F-001 through REQ-F-016

## Existing Tests
- `components/auth/__tests__/AdminProtectedRoute.test.jsx` (admin auth)
- E2E: workspace.spec.js includes login flow stubs

## Missing Tests
- User registration API
- Login API (valid/invalid credentials)
- Email verification API
- Password reset flow
- JWT token validation
- Cookie handling
- Username/email uniqueness checks
- Input validation edge cases