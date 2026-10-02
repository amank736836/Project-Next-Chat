"use client";

import { Box } from "@mui/material";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO } from "./motionConfig";

const BUBBLE_PATH =
  "M18 16 H46 A8 8 0 0 1 54 24 V38 A8 8 0 0 1 46 46 H30 L21 55 L21 46 H18 A8 8 0 0 1 10 38 V24 A8 8 0 0 1 18 16 Z";

const DOTS = [
  { cx: 22, delay: 0.85 },
  { cx: 32, delay: 1.0 },
  { cx: 42, delay: 1.15 },
];

/**
 * Self-drawing chat bubble: the outline sketches itself in, then the three dots
 * drop in and keep "typing" — an on-brand loading/ambient loop for the auth
 * screens. Pass a new `redrawKey` (e.g. the current form mode) to replay it.
 */
export default function AnimatedLogo({ redrawKey = "login", size = 64 }) {
  const reducedMotion = useReducedMotion();

  return (
    <Box
      sx={{
        position: "relative",
        width: size + 20,
        height: size + 20,
        display: "grid",
        placeItems: "center",
        mb: 0.5,
      }}
    >
      {/* rotating halo */}
      <span
        aria-hidden
        className="auth-logo-halo"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          filter: "blur(14px)",
          opacity: reducedMotion ? 0.35 : 0.55,
        }}
      />

      <motion.div
        animate={reducedMotion ? {} : { y: [0, -5, 0] }}
        transition={
          reducedMotion
            ? undefined
            : { duration: 5, repeat: Infinity, ease: "easeInOut" }
        }
        style={{ position: "relative" }}
      >
        <motion.svg
          key={redrawKey}
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          role="img"
          aria-label="Chat Champ"
        >
          <defs>
            <linearGradient id="authLogoGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4facfe" />
              <stop offset="55%" stopColor="#00c6ff" />
              <stop offset="100%" stopColor="#ff7e5f" />
            </linearGradient>
          </defs>

          <motion.path
            d={BUBBLE_PATH}
            stroke="url(#authLogoGradient)"
            strokeWidth={3.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reducedMotion ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={
              reducedMotion
                ? { duration: 0 }
                : { duration: 1.15, ease: EASE_OUT_EXPO }
            }
          />

          {DOTS.map((dot, index) => (
            <motion.g
              key={dot.cx}
              style={{ transformBox: "fill-box", transformOrigin: "center" }}
              initial={reducedMotion ? false : { opacity: 0, y: -9, scale: 0.4 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.45,
                delay: reducedMotion ? 0 : dot.delay,
                ease: EASE_OUT_EXPO,
              }}
            >
              {/* endless "typing" bounce */}
              <motion.circle
                cx={dot.cx}
                cy={31}
                r={2.7}
                fill="url(#authLogoGradient)"
                animate={
                  reducedMotion
                    ? {}
                    : { y: [0, -4.5, 0], opacity: [1, 0.5, 1] }
                }
                transition={
                  reducedMotion
                    ? undefined
                    : {
                        duration: 1.4,
                        repeat: Infinity,
                        repeatDelay: 0.35,
                        delay: 1.4 + index * 0.18,
                        ease: "easeInOut",
                      }
                }
              />
            </motion.g>
          ))}
        </motion.svg>
      </motion.div>
    </Box>
  );
}
