"use client";

import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { EASE_OUT_EXPO, seededRandom } from "./motionConfig";

const MotionButton = motion.create(Button);

const BURST_COLORS = ["#4facfe", "#00f2fe", "#ff7e5f", "#feb47b", "#ffffff"];
const BURST_COUNT = 16;

const ACTIVE_GRADIENT = "linear-gradient(110deg, #4facfe 0%, #00c6ff 100%)";
const ERROR_GRADIENT = "linear-gradient(110deg, #ff5f6d 0%, #ff8a5b 100%)";
const LOCKED_GRADIENT =
  "linear-gradient(110deg, rgba(126, 148, 173, 0.55) 0%, rgba(154, 172, 194, 0.45) 100%)";

/** Self-drawing tick shown on success. */
function SuccessTick() {
  const reducedMotion = useReducedMotion();

  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      initial={reducedMotion ? false : { scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
      style={{ transformBox: "fill-box", transformOrigin: "center" }}
    >
      <motion.path
        d="M4.5 12.6 L9.6 17.7 L19.5 6.9"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reducedMotion ? false : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, ease: EASE_OUT_EXPO, delay: 0.05 }}
      />
    </motion.svg>
  );
}

/** Deterministic confetti burst fired on success. */
function Burst({ burstKey }) {
  const reducedMotion = useReducedMotion();
  if (reducedMotion || !burstKey) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 2,
      }}
    >
      {Array.from({ length: BURST_COUNT }, (_, index) => {
        const angle = (index / BURST_COUNT) * Math.PI * 2 + seededRandom(index) * 0.5;
        const distance = 52 + seededRandom(index + 31) * 58;
        const size = 5 + seededRandom(index + 71) * 5;

        return (
          <motion.span
            key={`${burstKey}-${index}`}
            initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance * 0.75 - 14,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: size,
              height: size,
              marginLeft: -size / 2,
              marginTop: -size / 2,
              borderRadius: index % 3 === 0 ? "2px" : "50%",
              background: BURST_COLORS[index % BURST_COLORS.length],
              boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
            }}
          />
        );
      })}
    </Box>
  );
}

/**
 * Primary CTA with four animated states (idle / loading / success / error):
 *  - animated gradient + a light sweep on hover
 *  - magnetic pull toward the cursor and a spring press
 *  - label cross-fades into a spinner, then into a self-drawing tick
 *  - confetti burst on success
 */
export default function MorphSubmitButton({
  status = "idle",
  idleLabel,
  loadingLabel = "Please wait…",
  successLabel = "Success",
  errorLabel,
  disabled,
  sx,
  ...buttonProps
}) {
  const reducedMotion = useReducedMotion();
  const [burstKey, setBurstKey] = useState(0);

  const magnetX = useMotionValue(0);
  const magnetY = useMotionValue(0);
  const springX = useSpring(magnetX, { stiffness: 220, damping: 16, mass: 0.35 });
  const springY = useSpring(magnetY, { stiffness: 220, damping: 16, mass: 0.35 });

  useEffect(() => {
    if (status === "success") setBurstKey((key) => key + 1);
  }, [status]);

  const busy = status === "loading" || status === "success";
  const isError = status === "error";
  /** disabled because the form is still incomplete (vs. disabled while busy) */
  const locked = Boolean(disabled) && !busy;

  const label =
    status === "loading"
      ? loadingLabel
      : status === "success"
        ? successLabel
        : isError && errorLabel
          ? errorLabel
          : idleLabel;

  const handlePointerMove = (event) => {
    if (reducedMotion || busy) return;
    const rect = event.currentTarget.getBoundingClientRect();
    magnetX.set((event.clientX - rect.left - rect.width / 2) * 0.14);
    magnetY.set((event.clientY - rect.top - rect.height / 2) * 0.28);
  };

  const resetMagnet = () => {
    magnetX.set(0);
    magnetY.set(0);
  };

  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Burst burstKey={burstKey} />

      <MotionButton
        {...buttonProps}
        disabled={disabled || busy}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetMagnet}
        whileHover={reducedMotion || busy ? undefined : { scale: 1.02 }}
        whileTap={reducedMotion || busy ? undefined : { scale: 0.97 }}
        style={{ x: springX, y: springY }}
        className={isError || locked ? undefined : "auth-cta"}
        sx={{
          position: "relative",
          overflow: "hidden",
          minHeight: 46,
          borderRadius: "14px",
          textTransform: "none",
          fontWeight: 700,
          letterSpacing: "0.01em",
          color: "#fff",
          boxShadow: locked
            ? "none"
            : isError
              ? "0 10px 26px -12px rgba(211, 47, 47, 0.8)"
              : "0 12px 28px -12px rgba(0, 122, 255, 0.75)",
          transition: "box-shadow 0.25s ease, background 0.3s ease",
          "&:hover": {
            boxShadow: locked
              ? "none"
              : isError
                ? "0 14px 30px -12px rgba(211, 47, 47, 0.9)"
                : "0 18px 34px -12px rgba(0, 122, 255, 0.85)",
          },
          ...(locked
            ? {
                background: LOCKED_GRADIENT,
                color: "rgba(255, 255, 255, 0.92)",
                "&.Mui-disabled": {
                  background: LOCKED_GRADIENT,
                  color: "rgba(255, 255, 255, 0.92)",
                  boxShadow: "none",
                },
              }
            : {
                ...(isError ? { background: ERROR_GRADIENT } : {}),
                // keep the vivid gradient while the button is busy/disabled
                "&.Mui-disabled": {
                  background: isError ? ERROR_GRADIENT : ACTIVE_GRADIENT,
                  color: "#fff",
                  opacity: 1,
                },
              }),
          ...sx,
        }}
      >
        {/* light sweep */}
        <span aria-hidden className="auth-shine" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`${status}-${label}`}
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              position: "relative",
              zIndex: 1,
            }}
          >
            {status === "loading" ? (
              <motion.span
                initial={reducedMotion ? false : { scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
                style={{ display: "inline-flex" }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.35)",
                    borderTopColor: "#fff",
                    display: "inline-block",
                    animation: reducedMotion
                      ? undefined
                      : "authSpinSlow 0.75s linear infinite",
                  }}
                />
              </motion.span>
            ) : null}

            {status === "success" ? <SuccessTick /> : null}

            {label}
          </motion.span>
        </AnimatePresence>
      </MotionButton>
    </Box>
  );
}
