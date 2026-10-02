"use client";

import { useEffect, useRef } from "react";
import { Box } from "@mui/material";
import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
} from "framer-motion";
import { EASE_OUT_EXPO } from "./motionConfig";
import useReducedMotionSafe from "./useReducedMotionSafe";

const MotionBox = motion.create(Box);
const countFormatter = new Intl.NumberFormat("en");
const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/** A short, shared entrance for admin surfaces; optionally lifts on hover. */
export function AdminReveal({ children, delay = 0, lift = false, ...props }) {
  const reducedMotion = useReducedMotionSafe();

  return (
    <MotionBox
      {...props}
      data-admin-reveal=""
      initial={reducedMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        lift && !reducedMotion
          ? {
              y: -4,
              transition: { duration: 0.22, delay: 0, ease: EASE_OUT_EXPO },
            }
          : undefined
      }
      transition={{
        duration: reducedMotion ? 0 : 0.45,
        delay: reducedMotion ? 0 : delay,
        ease: EASE_OUT_EXPO,
      }}
    >
      {children}
    </MotionBox>
  );
}

/**
 * Counts up without re-rendering the dashboard every frame. Assistive tech gets
 * the final number immediately, not dozens of intermediate announcements.
 */
export function AnimatedCounter({ value = 0, duration = 0.9 }) {
  const reducedMotion = useReducedMotionSafe();
  const target = Number.isFinite(value) ? Math.max(0, value) : 0;
  const counter = useMotionValue(0);
  const textRef = useRef(null);
  const formattedTarget = countFormatter.format(Math.round(target));

  useMotionValueEvent(counter, "change", (latest) => {
    if (textRef.current) {
      textRef.current.textContent = countFormatter.format(Math.round(latest));
    }
  });

  useEffect(() => {
    if (reducedMotion) {
      counter.set(target);
      if (textRef.current) textRef.current.textContent = formattedTarget;
      return;
    }

    if (textRef.current) {
      textRef.current.textContent = countFormatter.format(
        Math.round(counter.get()),
      );
    }
    const animation = animate(counter, target, {
      duration,
      ease: EASE_OUT_EXPO,
    });

    // Stop an old count on refetch, route changes, and unmount.
    return () => animation.stop();
  }, [counter, duration, formattedTarget, reducedMotion, target]);

  return (
    <span data-admin-counter="" style={{ fontVariantNumeric: "tabular-nums" }}>
      <span style={visuallyHidden}>{formattedTarget}</span>
      <span ref={textRef} aria-hidden="true">
        {formattedTarget}
      </span>
    </span>
  );
}
