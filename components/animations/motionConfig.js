/**
 * Shared motion primitives for the animated auth screens.
 *
 * Keeping the curves/variants in one place means every animation on the login
 * flow shares the same "feel" and can be tuned from a single file.
 */

/** Smooth, slightly dramatic deceleration (great for entrances). */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1];

/** Snappy deceleration used for micro-interactions. */
export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1];

export const SPRING_SOFT = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.6,
};

export const SPRING_BOUNCY = {
  type: "spring",
  stiffness: 420,
  damping: 16,
  mass: 0.7,
};

export const SPRING_POINTER = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.5,
};

/** Parent variant: staggers the entrance of its children. */
export const staggerContainer = (stagger = 0.06, delayChildren = 0) => ({
  hidden: {},
  show: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delayChildren,
    },
  },
});

/** Child variant: fades + slides up into place. */
export const fadeUpItem = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SPRING_SOFT },
};

/**
 * Card shake used for failed submissions ("nope" feedback).
 * Applied through animation controls so it can be replayed on demand.
 */
export const SHAKE_KEYFRAMES = {
  x: [0, -16, 14, -11, 8, -4, 0],
  rotate: [0, -1.3, 1.1, -0.7, 0.4, 0],
  transition: { duration: 0.5, ease: "easeInOut" },
};

export const CARD_ENTRANCE = {
  initial: { opacity: 0, y: 34, scale: 0.96, rotateX: 6 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.75, ease: EASE_OUT_EXPO },
  },
};

/**
 * Deterministic pseudo random number in [0, 1).
 * Used instead of Math.random() during render so server and client markup
 * always match (avoids hydration warnings) and so particles are stable.
 */
export const seededRandom = (seed) => {
  const value = Math.sin((seed + 1) * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};
