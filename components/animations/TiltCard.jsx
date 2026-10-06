"use client";

import { useEffect, useRef, useState } from "react";
import { Paper } from "@mui/material";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { CARD_ENTRANCE } from "./motionConfig";
import useReducedMotionSafe from "./useReducedMotionSafe";

/**
 * Glassmorphic card that tilts toward the cursor in faux-3D, with a specular
 * highlight that follows the pointer across its surface.
 *
 * `controls` is passed in by AuthShell so a failed submit can shake the card.
 */
export default function TiltCard({ children, controls, maxTilt = 7 }) {
  const reducedMotion = useReducedMotionSafe();
  const cardRef = useRef(null);
  const [canTilt, setCanTilt] = useState(false);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const springX = useSpring(px, { stiffness: 150, damping: 18, mass: 0.4 });
  const springY = useSpring(py, { stiffness: 150, damping: 18, mass: 0.4 });

  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt]);
  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt]);
  const glareX = useTransform(springX, [0, 1], ["-10%", "110%"]);
  const glareY = useTransform(springY, [0, 1], ["-10%", "110%"]);
  const glare = useMotionTemplate`radial-gradient(360px circle at ${glareX} ${glareY}, rgba(255,255,255,0.55), rgba(255,255,255,0) 68%)`;

  // Touch devices have no hover, so skip the tilt entirely there.
  useEffect(() => {
    if (reducedMotion) return;
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanTilt(query.matches);
    const onChange = (event) => setCanTilt(event.matches);
    query.addEventListener?.("change", onChange);
    return () => query.removeEventListener?.("change", onChange);
  }, [reducedMotion]);

  const tiltEnabled = canTilt && !reducedMotion;

  const handlePointerMove = (event) => {
    if (!tiltEnabled) return;
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    px.set((event.clientX - rect.left) / Math.max(rect.width, 1));
    py.set((event.clientY - rect.top) / Math.max(rect.height, 1));
  };

  const handlePointerLeave = () => {
    px.set(0.5);
    py.set(0.5);
  };

  return (
    <div style={{ perspective: 1200, width: "100%" }}>
      {/* entrance + error shake (driven by AuthShell's animation controls) */}
      <motion.div
        data-auth-card=""
        initial={reducedMotion ? false : CARD_ENTRANCE.initial}
        animate={controls}
        style={{ width: "100%" }}
      >
        {/* cursor tilt */}
        <motion.div
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{
            rotateX: tiltEnabled ? rotateX : 0,
            rotateY: tiltEnabled ? rotateY : 0,
            transformStyle: "preserve-3d",
            willChange: tiltEnabled ? "transform" : undefined,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              position: "relative",
              width: "100%",
              overflow: "hidden",
              isolation: "isolate",
              padding: { xs: "1.75rem 1.25rem", sm: "2.25rem 2rem" },
              borderRadius: "var(--champ-card-radius)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background:
                "var(--champ-surface)",
              backdropFilter: "blur(22px) saturate(160%)",
              WebkitBackdropFilter: "blur(22px) saturate(160%)",
              border: "1px solid var(--champ-border)",
              boxShadow:
                "0 16px 45px -22px #30433024, 0 3px 9px #30433003",
            }}
          >
            {/* shimmering top edge */}
            <span
              aria-hidden
              className="auth-card-edge"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                borderRadius: "24px 24px 0 0",
              }}
            />

            {/* cursor-tracked specular highlight */}
            {tiltEnabled && (
              <motion.span
                aria-hidden
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 0,
                  pointerEvents: "none",
                  background: glare,
                  opacity: 0.55,
                }}
              />
            )}

            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>
              {children}
            </div>
          </Paper>
        </motion.div>
      </motion.div>
    </div>
  );
}
