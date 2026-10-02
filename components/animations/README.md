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
| `useReducedMotionSafe.js` | Hydration-safe `useReducedMotion()` for components that render on the server. |

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
