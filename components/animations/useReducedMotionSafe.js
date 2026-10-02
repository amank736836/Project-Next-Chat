"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Hydration-safe wrapper around framer-motion's `useReducedMotion`.
 *
 * `useReducedMotion()` reads `matchMedia` during render, so a server render
 * always answers `false` while the client may answer `true` — that difference
 * produces a hydration mismatch for users who asked for reduced motion.
 *
 * Server-rendered pieces of the auth shell use this hook instead: it agrees
 * with the server on the first paint and switches over right after mount.
 */
export default function useReducedMotionSafe() {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? Boolean(prefersReducedMotion) : false;
}
