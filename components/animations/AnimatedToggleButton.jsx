"use client";

import useReducedMotionSafe from "./useReducedMotionSafe";

import { Button } from "@mui/material";
import { motion } from "framer-motion";

const MotionButton = motion.create(Button);

/**
 * Secondary CTA (Login <-> Sign Up switch).
 * Hover paints a soft gradient sweep across the button and nudges the trailing
 * icon forward; press springs it down.
 */
export default function AnimatedToggleButton({
  children,
  icon,
  disabled,
  sx,
  ...buttonProps
}) {
  const reducedMotion = useReducedMotionSafe();

  return (
    <MotionButton
      {...buttonProps}
      disabled={disabled}
      className="auth-slide"
      whileHover={reducedMotion || disabled ? undefined : { y: -2 }}
      whileTap={reducedMotion || disabled ? undefined : { scale: 0.98 }}
      sx={{
        position: "relative",
        overflow: "hidden",
        minHeight: 44,
        borderRadius: "var(--champ-control-radius)",
        textTransform: "none",
        fontWeight: 600,
        transition: "border-color 0.25s ease, color 0.25s ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(110deg, rgba(var(--champ-primary-rgb),0.16), rgba(var(--champ-primary-rgb),0.14) 45%, rgba(var(--champ-primary-rgb),0.18))",
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        },
        "&:hover::before": { transform: "scaleX(1)" },
        ...sx,
      }}
    >
      <span
        style={{
          position: "relative",
          zIndex: 1,
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {children}
        {icon ? (
          <span className="auth-slide-icon" style={{ display: "inline-flex" }}>
            {icon}
          </span>
        ) : null}
      </span>
    </MotionButton>
  );
}
