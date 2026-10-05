# Auth animation kit

Reusable, interactive motion pieces used by the `/login`, `/forgot` and
`/verify` screens. Everything is built on `framer-motion` (already a project
dependency) plus a few CSS keyframes in `app/globals.css`.

## Pieces

| File | What it does |
| --- | --- |
| `AuthShell.jsx` | Page wrapper: mounts the backdrop, the tilting glass card, the entrance choreography and the error shake. Exposes `useAuthShake()`. |
| `AuthBackdrop.jsx` | Ambient background: drifting gradient wash, parallax blobs, a cursor-trailing glow and a `<canvas>` constellation that links up, leans away from the pointer and reacts to clicks with a shockwave. |
| `TiltCard.jsx` | Faux-3D card that tilts toward the cursor with a specular highlight tracking the pointer. Disabled on touch devices. |
| `SmoothHeight.jsx` | Animates container height so switching Login ↔ Sign Up glides instead of snapping. |
| `AnimatedLogo.jsx` | Self-drawing chat bubble whose dots keep "typing". Pass `redrawKey` to replay. |
| `AnimatedHeading.jsx` | Kinetic headline — letters flip in on a stagger, accent rule draws itself. Screen readers get the whole word via a visually-hidden span. |
| `AnimatedField.jsx` | MUI `TextField` with staggered entrance, focus lift + glow ring, a leading icon that springs on focus, plus `ValidityIcon` (drawn tick/cross) and `RevealPasswordToggle`. |
| `MorphSubmitButton.jsx` | CTA with four states — idle (animated gradient, light sweep, magnetic pull), loading (spinner), success (self-drawing tick + confetti burst), error (red flash). |
| `AnimatedToggleButton.jsx` | Secondary CTA with a gradient sweep on hover and a sliding trailing icon. |
| `AnimatedAvatarUpload.jsx` | Avatar picker with a spinning dashed ring and a spring pop when a photo is chosen. |
| `motionConfig.js` | Shared springs, easings, variants and `seededRandom()` (deterministic, so SSR markup matches the client). |
| `useReducedMotionSafe.js` | Hydration-safe, live reduced-motion preference subscription for server-rendered components. |

## Usage

```jsx
// app/(auth)/login/page.jsx
import AuthShell from "../../../components/animations/AuthShell";
import LoginContent from "./LoginContent";

export default function Login() {
  return (
    <AuthShell maxTilt={7}>
      <LoginContent />
    </AuthShell>
  );
}
```

Shake the card from anywhere inside the shell (used for failed submits):

```jsx
import { useAuthShake } from "../../../components/animations/AuthShell";

const shake = useAuthShake();
shake();
```

## Accessibility & performance notes

- `prefers-reduced-motion` is respected twice over: framer animations are
  skipped in JS and the ambient CSS loops are neutralised by the
  `.auth-motion-root` media query in `globals.css`.
- The pointer tilt is disabled for coarse pointers (`hover: none`).
- The particle canvas caps its particle count by viewport area, clamps
  `devicePixelRatio` to 2 and pauses when the tab is hidden.
- Decorative layers are `aria-hidden`; the animated headline keeps its text in
  the a11y tree through a visually-hidden span.

## Admin portal

The same kit now powers `/admin/login` and the existing recovery screen. The
portal has a persistent shell in `app/admin/layout.jsx`: navigation remains
mounted while each page fades/slides in, and the active tab's highlight moves
between links. Desktop and mobile highlights use separate `LayoutGroup` IDs.

- `AdminMotion.jsx` exports `AdminReveal` (short, staggerable surface entrances
  and an optional hover lift) and `AnimatedCounter` (count-up values with a
  stable screen-reader value and animation cleanup on update/unmount).
- `AdminAsyncContent.jsx` cross-fades skeleton, error/retry, and ready states.
  Initial loading is separate from background refetching, so existing data
  stays visible during refreshes.
- Admin tables use opacity-only row entrances, capped staggering, and a 650 ms
  entrance window. No transforms are applied to virtualised rows, and scrolling
  does not keep replaying animations. Sorting, filtering, and pagination keep
  the same DataGrid instance.
- Chart.js animations, counters, drawer transitions, hover transforms, card
  shakes, and ambient CSS loops respect reduced motion. The shared hook uses
  `useSyncExternalStore` to hydrate safely and react to live preference changes.
- Existing authentication and APIs are retained. The admin guard checks the
  cookie on a hard refresh before redirecting, and middleware uses the Node
  runtime required by `jsonwebtoken`.

Co-located regression tests cover entrances, counters and cleanup, loading and
retry states, table animation windows, charts, preference changes/hydration,
and admin session restoration. Run them with `npm run test:unit`; they do not
require a database or backend server.

## Logged-in workspace

The chat and group workspaces now share the scoped `WorkspaceTheme`, the
`WorkspaceEmpty` illustration, and `.workspace-*` motion styles in
`app/globals.css`. Entrances use short opacity/vertical translations; the empty
state bubbles drift for two iterations rather than looping forever. Chat message
entrances use `useReducedMotionSafe` and do not replay on every viewport entry.
Conversation rows use background/focus transitions without transforming the
scroll container or replaying the entire list. The admin portal retains its
existing reduced-motion-aware page/card reveals, counters, and virtualized row
entrances while using the same workspace palette.

Landing/auth routes keep their existing theme. CSS class names for workspace
illustrations are namespaced to avoid the public welcome page's artwork styles.
All workspace CSS animation and transitions respect `prefers-reduced-motion`;
interactive controls retain visible keyboard focus states.

The `/u/[username]` board now shares the workspace theme as well: owner overview,
questions, showcase, embed setup, and public visitor views. `BoardSection` and
`BoardEmpty` keep surface/empty-state styling consistent. Tab panels use the same
short entrance, prompt arrows have small hover translations, and all motion is
covered by the workspace reduced-motion rules. Account ownership resolves behind
a loading shell before showing owner controls or the visitor composer.
