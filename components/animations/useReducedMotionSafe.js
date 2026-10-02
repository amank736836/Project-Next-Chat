"use client";

import { useSyncExternalStore } from "react";

const query = "(prefers-reduced-motion: reduce)";
const serverSnapshot = () => false;
const getSnapshot = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(query).matches
    : false;

function subscribe(onChange) {
  if (typeof window.matchMedia !== "function") return () => {};
  const media = window.matchMedia(query);

  if (media.addEventListener) {
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }

  // Older Safari supports only the original MediaQueryList listener API.
  media.addListener(onChange);
  return () => media.removeListener(onChange);
}

/**
 * SSR and the initial hydration render agree on false. React then reads the
 * real preference and subscribes to changes, including OS changes mid-session.
 * Unlike framer-motion's cached preference, this snapshot stays up to date.
 */
export default function useReducedMotionSafe() {
  return useSyncExternalStore(subscribe, getSnapshot, serverSnapshot);
}
