# Chat Champ – QA / UX / Accessibility Audit & Fix Report

Date: 2026-10-11 · Branch: `arena/867d4455-project-next-chat` · Stack: Next.js 16.4 (Turbopack), React 19, MUI 9.4.0

## 1. Scope, method and honest limits

| Item | Detail |
|---|---|
| App tested | Production build (`next build` + `next start`), 21 routes (public, auth, signed-in workspace, admin, embed, 404) |
| Browser engine actually executed | **Chromium 153.0.8010.0 (headless, Playwright 1.63.0) only** |
| Viewports | 320, 375, 390, 425, 768, 820, 1024, 1280, 1366, 1440, 1920, 2560 (audit sweep); the regression spec adds 640×360 landscape and a 320×180 viewport that simulates 400 % zoom |
| Backend | **No real MongoDB / socket server was available.** The API was mocked at the network layer (`tests/support/mockApi.js`) for signed-in pages. Real server-side auth flows (login, sign-up e-mail, OTP, cookies) and real-time socket behaviour were **not** verified end to end. `/board` always redirects to login without a real cookie, so the board page was audited via `/u/<username>`. |

### Browsers that could NOT be tested
| Browser | Status |
|---|---|
| Firefox | **UNTESTED**. The Playwright download CDN is unreachable from the sandbox and no system build exists. |
| Safari / WebKit | **UNTESTED**. Same reason. Safari-specific risks (`100vh`/`dvh`, `backdrop-filter`, date/focus behaviour) are unverified. |
| Microsoft Edge | **UNTESTED**. Not installed. It is Chromium-based, so results likely carry over, but this is an inference and not a measurement. |
| Chrome stable | **UNTESTED** as a branded build. Headless Chromium 153 was used. |

Other things not done: no real device or touch hardware, no screen-reader session (NVDA/VoiceOver) – only axe-core and DOM/role assertions; no Lighthouse run; no throttled-network/CPU profiling; no long-session memory-leak test (only an idle heap snapshot, see §6). There is **no dark theme** in the app (`WorkspaceTheme` is light-only), so dark-mode checks do not apply.

## 2. Headline results

| Metric (252 page × viewport samples) | Before | After |
|---|---|---|
| Pages with horizontal overflow | 6 | **0** |
| Console / page errors | 75 | **0** |
| axe-core WCAG A/AA violations | 533 | **0** |
| Sub-24px stand-alone targets | 111 | 24 (all the inline "Create an account" link inside a sentence – exempt under WCAG 2.5.8) |
| Failed requests | 44 | 55 – all `ERR_ABORTED` Next.js link prefetches and the intentional 404 on `/definitely-missing`. These are not defects. |
| Text below 12px (heuristic) | 363 | 416 – **not fixed**, see Pending. The count rose because pages that used to render broken now render fully. |

Source: `qa-report/audit-before.json`, `qa-report/audit-after.json` (produced by `tests/qa/audit.js --axe --shots`).

## 3. Issues found

Severity: C = Critical, H = High, M = Medium, L = Low. Viewport "All" means every width tested.

| # | Page / Component | Issue | Sev | Viewport | Root cause | Fix | Status |
|---|---|---|---|---|---|---|---|
| 1 | Whole app (~35 files, ~122 usages of Box/Stack/Typography/Grid) | Layouts silently broken. Chat Grid was 359px tall instead of 603px, the composer was not pinned to the bottom, lists had no padding, and message bubbles spilled to the edge. | **C** | All (worst ≤425) | MUI 9 removed system props (`p`, `mt`, `sx`-less shorthands, `justifyContent`, `spacing` etc.) from `Box`/`Stack`/`Typography`/`Grid`. They were passed as plain props and ignored. | Ran the official system-props codemod via jscodeshift and reviewed the output. | Fixed |
| 2 | `/privacy`, `/terms`, `/embed/*` | React hydration error #418 in the console. | H | All | Emotion SSR `<style>` tags were injected inside `<body>`, so the server and client DOM disagreed. | Added `AppRouterCacheProvider` (`@mui/material-nextjs`) in `app/layout.js`. | Fixed |
| 3 | `/login`, `/forgot`, `/verify`, fields, menus | Password reveal toggle and field icons missing. Some menus/papers ignored their props. | H | All | MUI 9 removed `InputProps`/`inputProps`/`PaperProps` (replaced by `slotProps`). | Migrated to `slotProps`. | Fixed |
| 4 | `/` and `/chat/[chatId]` on first load | About 300ms flash. The visible page was replaced by 8 full-width skeletons, then the page returned (layout shift/flicker). | M | 320–1280 | `next/dynamic` Header/ChatList/Profile chunks suspended after first paint, so the route-level `loading.jsx` took over. | Static imports for those components. Verified with a polling script: before, h1 went visible→hidden at ~620ms. After, no flip. | Fixed |
| 5 | Logo link (`Header`, `AuthShell`, `WelcomeStage`) | axe `label-content-name-mismatch`: the accessible name "Chat Champ home" did not contain the visible text "chatchamp." (WCAG 2.5.3). 109 hits. | M | All | aria-label differed from the visible wordmark. `aria-hidden` on the visible text does not satisfy the rule. | aria-label is now `chatchamp home`. Updated the existing e2e selector. | Fixed |
| 6 | `/login`, `/forgot`, `/verify` fields | Invalid `autocomplete` tokens (axe `autocomplete-valid`, 12 hits). | M | All | Non-standard values. | Replaced the invalid `identifier email` token with `username` (the other fields already used valid tokens). | Fixed |
| 7 | Several pages (muted text, eyebrow labels, chips) | Insufficient colour contrast (axe `color-contrast`, 34 hits). | M | All | Light-green/grey text on pale backgrounds below 4.5:1. | Darkened the offending text colours only; the brand primary `#44775b` is unchanged. | Fixed |
| 8 | Many pages | No `<h1>` (99), wrong heading order (58). | M | All | Headings rendered as styled `div`/skipped levels. | Added or re-levelled headings (`h1` per page, `component=` overrides, visual style unchanged). | Fixed |
| 9 | Many pages | No `<main>` (99) and content outside landmarks (`region`, 120). | M | All | Plain `div` wrappers. | Added `<main>`/`<header>`/`<nav>`/`<footer>` landmarks. | Fixed |
| 10 | Sign-up availability checks, forgot-password identifier | `+`, `&`, `#`, spaces in the e-mail or username were put into URLs unencoded, so checks hit the wrong value (`jane+test` read as `jane test`; `a&b#c` truncated). | H | All | String-concatenated query/path params. | `encodeURIComponent` on check-username, check-email and identifier URLs. | Fixed |
| 11 | Error/success toasts | Auto-dismissed after 1s, too fast to read (WCAG 2.2.1 Timing Adjustable). | M | All | `autoClose: 1000`. | 4000ms. | Fixed |
| 12 | 404 page | Auto-redirected away after a few seconds (WCAG 2.2.1), duplicate 404 implementations (`app/not-found.jsx` and `app/not-found/page.jsx`), off-brand colours. | M | All | Timer redirect + copy-pasted page. | One brand-consistent 404 with a "Go Home" button and no auto-redirect. The old route re-exports it. | Fixed |
| 13 | All routes | Every tab showed the same/default title. | M | All | No per-route metadata for client pages. | 12 small `layout.js` files exporting `metadata.title`. | Fixed |
| 14 | `/embed/[username]` widget | `&amp;` shown literally (double-escaped text), missing web fonts, textarea without label, no live region for send result. | M | All | `esc()` applied twice; fonts not linked; markup gaps. | Single-escape, added `<main>`/`<h1>`/`aria-label`/fonts/`aria-live`. | Fixed |
| 15 | Chat message "Reply" | Tap target was 34×13px. | M | ≤425 | Tiny text button. | Padded to a ≥24px (WCAG 2.5.8) target. | Fixed |
| 16 | `/admin/messages` empty state | Oversized "No Attachments" text. | L | All | Typography variant. | Normal body size. | Fixed |
| 17 | `/login` welcome nav, footer links, "Forgot password?" | Stand-alone links 15–17px high (WCAG 2.5.8). | L | All | Text-only controls. | `min-height: 24px` (`welcome.css`). | Fixed |
| 18 | `/admin/login`, `/admin/forgot` (both steps), `/chat/[id]` | Still no `<h1>` after fix 8. | M | All | Headings were `div` / `caption` spans. | `component="h1"` on `AnimatedHeading` and the chat title. | Fixed |
| 19 | Admin layout (mobile top bar) | "Admin portal" bar was outside any landmark (axe `region`). | L | ≤768 | Plain `Stack`. | `component="header"`. | Fixed |

**Total found: 19 confirmed defects · Fixed: 19 · Verified-fixed by automated test: 19 (most through the regression spec, the rest through the audit sweep).**

### Pending / not fixed

| # | Page / Component | Issue | Sev | Viewport | Root cause (as understood) | Status |
|---|---|---|---|---|---|---|
| P1 | `/embed/[username]` | Page hangs when MongoDB is unreachable (no `connectDB` timeout), so the embedded widget never renders. In the test env it passes only because the mock `fetchSettings` fallback is used. | M | All | Server component awaits `connectDB` without a timeout. | **Pending** (backend/robustness; not modified per the "no backend changes unless required" rule) |
| P2 | `/login`, `/u/*`, overline labels, tabs | 9–11px text (e.g. "Free to be yourself" 9px, tab labels 11px, `overline` 10px). Reads poorly on phones and fails zoom-comfort guidance. WCAG has no minimum font size, so axe does not flag it. | L–M | All | Design choice (small caps/eyebrow styles). | **Pending** (design decision; raising sizes alters the visual design) |
| P3 | Signed-in header at 320px | Six icon buttons in one row is dense (each meets 24px but not the 44px recommended size). | L | 320–375 | Header layout. | **Pending** (needs a design decision, e.g. overflow menu) |
| P4 | `components/NoContextMenu.jsx` | Code-read observation: blocks the right-click menu app-wide. Not tested in a browser. It hinders accessibility tools and users, and gives no real protection. | L | Desktop | Intentional global handler. | **Pending / unverified** |
| P5 | `redux/api/api.js` | Code-read observation: socket-backed mutations throw when `NEXT_PUBLIC_SOCKET_SERVER_URL` is unset. Configuration issue; real-time behaviour not tested. | L | n/a | Missing env fallback. | **Pending / unverified** |
| P6 | `npm ci` | Failed at baseline: lockfile out of sync (msw, graphql missing). `npm install` was used and `package-lock.json` is regenerated in this branch; `npm ci` has not been re-run to confirm. | M | CI | Lockfile drift. | **Likely fixed, not re-verified** |
| P7 | Firefox / WebKit / Edge / Chrome stable | Cross-browser not executed. | – | – | Environment. | **Blocked** |

False-positive/noise items excluded: `/_vercel/*` 404s (analytics script absent outside Vercel), 401 on `/user/me` when anonymous (expected), "socket URL" warning, `ERR_ABORTED` prefetches, zero-width clipped spans (visually-hidden text used for screen readers in animated headings).

## 4. Automated test evidence

All results below come from actually executed runs against the production build on localhost.

| Suite | Result |
|---|---|
| `tests/e2e/qa-regression.spec.js` (new, 92 tests) vs **original code** (`master` commit 15f843e built separately) | 18 passed, **74 failed** – the tests do detect the original defects (`qa-report/regression-baseline.json`) |
| Same spec vs **fixed code** | **92 / 92 passed** |
| Full Playwright run (new spec + existing `workspace.spec.js` + `board.spec.js`) | **110 / 110 passed**, 0 flaky (`qa-report/regression-fixed.json`) |
| Vitest unit tests (`npx vitest run`) | **37 / 37 passed** (9 files) |
| ESLint (`npx eslint .`) | exit 0, no findings |
| `tests/qa/audit.js --axe --shots` after fixes | 0 overflow, 0 console errors, 0 axe violations (§2) |

Regression spec coverage, by group (baseline fail → fixed pass): overflow across 16 viewports incl. landscape and 400 % zoom (0/33 → 33/33), MUI 9 regressions (0/5 → 5/5), hydration/console (3/6 → 6/6), 404 (0/1 → 1/1), document structure – titles/main/h1 (2/14 → 14/14), axe A/AA (7/23 → 23/23), forms with special characters and failures (0/2 → 2/2), edge cases – long text, empty data, rapid clicks, toast duration (6/7 → 7/7), embed (0/1 → 1/1).

How to run: `E2E_BASE_URL` (default `http://localhost:3000`) and `PW_CHROMIUM_PATH` (optional Chromium path) are read by `playwright.config.js`; `npm run test:e2e` runs everything. The audit is `node tests/qa/audit.js [--axe] [--shots] [--vp=375] [--only=login]` with `QA_OUT=<dir>`. `.gitignore` now whitelists the new test files.

### Screenshots (before → after, 375 and 1280)
`qa-report/screenshots/{before,after}-<route>-<viewport>.png` for home, chat, groups, login, own-profile, public-profile and admin-dashboard. The most visible example is `before-chat-375.png` (composer floating mid-screen, bubbles touching the screen edges) against `after-chat-375.png` (composer pinned to the bottom, bubbles padded).
Full sweep screenshots (all 21 routes × 12 viewports, 29 MB) are produced by the audit script and are not committed.

## 5. Accessibility findings (WCAG 2.2 AA)

- axe-core (A/AA tags) across 21 routes × 12 viewports: 533 violations → 0. Rules fixed: label-content-name-mismatch, color-contrast, page-has-heading-one, heading-order, landmark-one-main, region, autocomplete-valid, aria-progressbar-name.
- 2.2.1 Timing: toasts now 4s, 404 no longer auto-redirects.
- 2.5.3 Label in Name: logo link names include the visible text.
- 2.5.8 Target Size: stand-alone controls ≥24px. Reply and login links fixed. The only remaining sub-24px target is an inline link in a sentence (exempt).
- 3.3.x: forms accept special characters without breaking, and error paths have visible messages (covered by tests).
- Reduced motion: the animation helpers already honour `prefers-reduced-motion` (`useReducedMotionSafe`); not independently measured.
- Not covered: manual screen-reader testing, focus-order walkthrough on every page (only the dialogs/menus/tabs touched by tests), colour-blindness checks. axe catches only a subset of WCAG issues, so this is **not** a certification of conformance.

## 6. Performance observations

Measured with headless Chromium on localhost, no throttling, single run each, so treat them as indicative only (`qa-report/perf-observations.txt`):

| Page | Viewport | FCP | LCP | CLS | JS transferred (KB, encoded) |
|---|---|---|---|---|---|
| /login | 375 / 1280 | 180 / 484ms | 444 / 484ms | 0.0007 / 0.0006 | 388 / 394 |
| /privacy | 375 / 1280 | 136 / 152ms | 136 / 152ms | 0.004 / 0 | 263 |
| / (signed-in, mocked) | 375 / 1280 | 368 / 556ms | 428 / 556ms | 0.065 / 0.035 | 360 |
| /chat/design (signed-in, mocked) | 375 / 1280 | 752 / 564ms | n/a (375: not reported) / 564ms | 0 / 0 | 443 |

- The idle JS heap was 10–12MB after load. No leak test over a long session was run.
- The loading-skeleton flash (issue 4) was the one real layout-shift/flicker source found. Home CLS is still 0.035–0.065 (inside the "good" < 0.1 band) and was not investigated further.
- INP was not measured. Real-network latency, large-asset behaviour and caching were not assessed because the backend is mocked. Console errors: 75 → 0.

## 7. Readiness assessment

**Frontend: ready for staging; not yet signed off for production.**

- The layout-breaking MUI 9 migration regressions (the Critical issue), hydration errors, URL-encoding bugs and the axe-detected accessibility defects are fixed and covered by a regression suite that fails on the original code and passes on the fixed code.
- Remaining blockers before a production sign-off:
  1. Run the suite against a real backend (MongoDB, sockets, real auth and cookies); only mocked API behaviour was verified.
  2. Run Firefox, WebKit/Safari and Edge – none were tested.
  3. Decide P2/P3 (small type, dense mobile header) with design, and fix P1 (embed DB timeout).
  4. Do a manual screen-reader pass and real-device mobile pass.
