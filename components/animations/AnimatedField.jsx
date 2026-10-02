"use client";

import useReducedMotionSafe from "./useReducedMotionSafe";

import { useState } from "react";
import { IconButton, TextField } from "@mui/material";
import {
  VisibilityOffOutlined as VisibilityOffIcon,
  VisibilityOutlined as VisibilityIcon,
} from "@mui/icons-material";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO, SPRING_BOUNCY } from "./motionConfig";

const ACCENT = "79, 172, 254";
const DANGER = "211, 47, 47";
const SUCCESS = "46, 125, 50";

/** Leading icon that reacts when its field is focused. */
function FieldIcon({ icon, active, tone }) {
  const reducedMotion = useReducedMotionSafe();
  const color =
    tone === "error"
      ? `rgb(${DANGER})`
      : tone === "success"
        ? `rgb(${SUCCESS})`
        : active
          ? `rgb(${ACCENT})`
          : "rgba(0, 0, 0, 0.42)";

  return (
    <motion.span
      animate={
        active && !reducedMotion
          ? { scale: 1.2, rotate: -8, y: -1 }
          : { scale: 1, rotate: 0, y: 0 }
      }
      transition={reducedMotion ? { duration: 0 } : SPRING_BOUNCY}
      style={{
        display: "inline-flex",
        marginRight: 10,
        color,
        transition: "color 0.22s ease",
      }}
    >
      {icon}
    </motion.span>
  );
}

/**
 * TextField with micro-interactions:
 *  - staggered entrance
 *  - lifts + glows on focus (ring, border and label all animate)
 *  - optional leading icon that springs to life on focus
 *  - `validColor` keeps the existing green/red availability feedback
 *
 * Everything else is forwarded straight to the MUI TextField.
 */
export default function AnimatedField({
  icon,
  index = 0,
  validColor,
  error,
  sx,
  InputProps,
  disabled,
  ...textFieldProps
}) {
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotionSafe();

  const tone = error ? "error" : validColor === "green" ? "success" : "default";
  const glowRgb = error ? DANGER : validColor === "red" ? DANGER : ACCENT;
  const outlineColor =
    validColor || (focused ? `rgba(${ACCENT}, 0.95)` : "rgba(15, 23, 42, 0.2)");

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: reducedMotion ? 0 : 0.05 * index,
        ease: EASE_OUT_EXPO,
      }}
      style={{ width: "100%" }}
    >
      <motion.div
        animate={reducedMotion ? {} : { y: focused ? -2 : 0 }}
        transition={reducedMotion ? { duration: 0 } : SPRING_BOUNCY}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={() => setFocused(false)}
        style={{ width: "100%" }}
      >
        <TextField
          fullWidth
          margin="normal"
          variant="outlined"
          disabled={disabled}
          error={error}
          {...textFieldProps}
          InputProps={{
            ...InputProps,
            startAdornment: icon ? (
              <FieldIcon icon={icon} active={focused} tone={tone} />
            ) : (
              InputProps?.startAdornment
            ),
          }}
          sx={{
            width: "100%",
            "& .MuiOutlinedInput-root": {
              borderRadius: "14px",
              backgroundColor: focused
                ? "rgba(255, 255, 255, 0.98)"
                : "rgba(255, 255, 255, 0.72)",
              boxShadow: focused
                ? `0 10px 24px -14px rgba(${glowRgb}, 0.75), 0 0 0 3px rgba(${glowRgb}, 0.18)`
                : "0 1px 2px rgba(15, 23, 42, 0.06)",
              transition:
                "background-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease",
              "& fieldset": {
                borderColor: outlineColor,
                transition: "border-color 0.25s ease",
              },
              "&:hover fieldset": {
                borderColor: validColor || `rgba(${ACCENT}, 0.55)`,
              },
            },
            "& .MuiInputLabel-root": {
              transition: "color 0.22s ease",
              "&.Mui-focused": {
                color: error
                  ? `rgb(${DANGER})`
                  : validColor || `rgb(${ACCENT})`,
                fontWeight: 600,
              },
            },
            "& .MuiFormHelperText-root": {
              marginLeft: "2px",
            },
            ...sx,
          }}
        />
      </motion.div>
    </motion.div>
  );
}

/**
 * Validity indicator that pops in/out (used as an endAdornment).
 */
export function ValidityIcon({ state, checking }) {
  const reducedMotion = useReducedMotionSafe();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {checking ? (
        <motion.span
          key="checking"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.18 }}
          style={{ display: "inline-flex" }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid rgba(79,172,254,0.25)",
              borderTopColor: "rgb(79,172,254)",
              animation: reducedMotion
                ? undefined
                : "authSpinSlow 0.8s linear infinite",
              display: "inline-block",
            }}
          />
        </motion.span>
      ) : state === null || state === undefined ? null : (
        <motion.span
          key={state ? "valid" : "invalid"}
          initial={
            reducedMotion ? false : { opacity: 0, scale: 0.4, rotate: -25 }
          }
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, scale: 0.4 }}
          transition={reducedMotion ? { duration: 0 } : SPRING_BOUNCY}
          style={{ display: "inline-flex" }}
        >
          {state ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="rgba(46,125,50,0.12)"
                stroke="rgb(46,125,50)"
                strokeWidth="1.6"
              />
              <motion.path
                d="M7.5 12.4 L10.8 15.6 L16.8 8.9"
                stroke="rgb(46,125,50)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={reducedMotion ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{
                  duration: 0.35,
                  ease: EASE_OUT_EXPO,
                  delay: 0.08,
                }}
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="rgba(211,47,47,0.12)"
                stroke="rgb(211,47,47)"
                strokeWidth="1.6"
              />
              <motion.path
                d="M8.6 8.6 L15.4 15.4 M15.4 8.6 L8.6 15.4"
                stroke="rgb(211,47,47)"
                strokeWidth="2.2"
                strokeLinecap="round"
                initial={reducedMotion ? false : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT_EXPO, delay: 0.06 }}
              />
            </svg>
          )}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/**
 * Show/hide password affordance with a rotating eye swap.
 */
export function RevealPasswordToggle({ visible, onToggle, disabled }) {
  const reducedMotion = useReducedMotionSafe();

  return (
    <IconButton
      edge="end"
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-label={visible ? "Hide password" : "Show password"}
      sx={{ color: "rgba(0, 0, 0, 0.55)", mr: 0.25 }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={visible ? "hide" : "show"}
          initial={
            reducedMotion ? false : { opacity: 0, rotate: -45, scale: 0.6 }
          }
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={
            reducedMotion ? undefined : { opacity: 0, rotate: 45, scale: 0.6 }
          }
          transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
          style={{ display: "inline-flex" }}
        >
          {visible ? (
            <VisibilityOffIcon fontSize="small" />
          ) : (
            <VisibilityIcon fontSize="small" />
          )}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
