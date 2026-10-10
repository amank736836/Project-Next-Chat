# Security Policy

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Report them
privately via GitHub's *Security → Advisories → Report a vulnerability* flow
on this repository, or by emailing the maintainer. You should receive an
initial response within a few days.

## Required environment variables

The application **fails closed** when secrets are missing in production:

| Variable | Required | Notes |
| --- | --- | --- |
| `JWT_SECRET` | **Yes, in production** | Used to sign/verify all session tokens. If unset in a production build, a random per-process value is used: sessions will not survive restarts and — importantly — cannot be forged. |
| `ADMIN_SECRET_KEY` | **Yes, to use the admin portal** | If unset in production it becomes a random value, so the admin login is effectively disabled. |
| `MONGODB_URI` | Yes, for local auth | |

In `development`/`test` environments clearly-labelled, deterministic fallback
secrets are used so local flows (including the Playwright harness) stay
stable. Next.js forces `NODE_ENV=production` for `next build`/`next start`,
so those fallbacks can never be active in a production deployment.

## Security controls in the application

- **Verification codes** (email verification / password reset) are generated
  with `crypto.randomInt`, never `Math.random`, and are protected by a
  per-user attempt limit (lockout after 5 failures) plus per-IP rate limits.
- **Rate limiting** is applied to login, registration, password reset, admin
  key verification and the anonymous ask-and-record endpoint (per-process
  sliding window; put a shared store such as Redis in front of it for
  multi-instance deployments).
- **Session cookies** are `httpOnly`, `Secure` in production, and
  `SameSite=Lax` by default (override with `COOKIE_SAMESITE` only when a
  cross-origin flow explicitly requires it; `none` always forces `Secure`).
- **Admin tokens** carry a `role: "admin"` claim only — the admin secret key
  is never embedded in a token payload. Legacy tokens embedding the key are
  still accepted and compared in constant time.
- **Secret comparisons** (admin key, verification codes) use constant-time
  comparison to avoid timing side channels.
- **Input hardening**: user search escapes regex metacharacters (ReDoS
  protection); chat details are only returned to chat members (IDOR
  protection); error responses do not leak internal exception messages;
  login/password-reset responses do not reveal whether an account exists.
- **Security headers** are set in `next.config.js` (`X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, and `X-Frame-Options: SAMEORIGIN`
  everywhere except `/embed/*`, which is designed to be iframed).
- **Image optimization** is restricted to an allowlist of remote hosts
  (extend with `NEXT_IMAGE_HOSTS` if needed).

## Dependency vulnerabilities

- `npm audit` is expected to report **0 vulnerabilities**. Patched
  transitive versions are pinned via npm `overrides` (see `package.json`).
- `eslint-config-next` was removed: it transitively pinned
  `fast-glob → micromatch → braces`, which carry unpatched high-severity DoS
  advisories (e.g. GHSA-vfj7-8cjw-p6xm, no fixed `braces` release exists).
  The chain only affected developer linting, never the production bundle;
  removing it eliminates the advisories. The four warn-level `@next/next`
  lint rules it provided were dropped as a result.
- Dependabot is configured (`.github/dependabot.yml`) to keep dependencies
  current and open security-update PRs automatically.
