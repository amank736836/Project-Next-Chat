"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import useReducedMotionSafe from "./useReducedMotionSafe";

/**
 * Animates the container height whenever its children change size, so swapping
 * between the compact login form and the tall sign-up form glides instead of
 * snapping. Height is measured (ResizeObserver) rather than projected, which
 * keeps it accurate inside the 3D-tilted card.
 */
export default function SmoothHeight({ children, className }) {
  const innerRef = useRef(null);
  const reducedMotion = useReducedMotionSafe();
  const [height, setHeight] = useState("auto");

  useEffect(() => {
    const element = innerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return undefined;

    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.height;
      if (typeof next === "number") setHeight(Math.round(next));
    });
    observer.observe(element);
    setHeight(Math.round(element.getBoundingClientRect().height));

    return () => observer.disconnect();
  }, []);

  return (
    <motion.div
      className={className}
      animate={{ height }}
      initial={false}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 190, damping: 28, mass: 0.7 }
      }
      style={{
        width: "100%",
        position: "relative",
        overflow: "clip",
        overflowClipMargin: "18px",
      }}
    >
      <div ref={innerRef} style={{ position: "relative", width: "100%" }}>
        {children}
      </div>
    </motion.div>
  );
}
