"use client";

import { Avatar, IconButton } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CameraAlt as CameraAltIcon } from "@mui/icons-material";
import { EASE_OUT_EXPO, SPRING_BOUNCY } from "./motionConfig";
import { VisuallyHiddenInput } from "../styles/StyledComponents";

/**
 * Sign-up avatar picker with a bit of life:
 *  - the dashed ring spins while a photo is loaded
 *  - a new preview pops in with a spring (and the old one scales away)
 *  - the camera button rotates + lifts on hover
 */
export default function AnimatedAvatarUpload({
  preview,
  onChange,
  size = "7rem",
  disabled,
}) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      style={{
        position: "relative",
        width: size,
        height: size,
        margin: "0.25rem auto 0.5rem",
      }}
    >
      {/* spinning dashed ring */}
      <motion.span
        aria-hidden
        animate={
          reducedMotion || !preview ? {} : { rotate: 360 }
        }
        transition={
          reducedMotion || !preview
            ? undefined
            : { duration: 14, repeat: Infinity, ease: "linear" }
        }
        style={{
          position: "absolute",
          inset: -7,
          borderRadius: "50%",
          border: "2px dashed rgba(79, 172, 254, 0.55)",
          opacity: preview ? 1 : 0.35,
          transition: "opacity 0.3s ease",
        }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={preview ? "filled" : "empty"}
          initial={reducedMotion ? false : { scale: 0.82, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={reducedMotion ? undefined : { scale: 0.9, opacity: 0 }}
          transition={SPRING_BOUNCY}
          style={{ width: "100%", height: "100%" }}
        >
          <Avatar
            src={preview || undefined}
            alt="Avatar preview"
            sx={{
              width: "100%",
              height: "100%",
              bgcolor: preview ? "transparent" : "rgba(79, 172, 254, 0.12)",
              color: "rgb(79, 172, 254)",
              border: "2px solid rgba(255,255,255,0.9)",
              boxShadow: "0 10px 26px -12px rgba(15, 23, 42, 0.55)",
              fontSize: "2rem",
            }}
          >
            {preview ? null : "🙂"}
          </Avatar>
        </motion.div>
      </AnimatePresence>

      <motion.div
        whileHover={reducedMotion ? undefined : { scale: 1.12, rotate: 8 }}
        whileTap={reducedMotion ? undefined : { scale: 0.92 }}
        style={{ position: "absolute", bottom: -2, right: -2 }}
      >
        <IconButton
          component="label"
          disabled={disabled}
          sx={{
            bgcolor: "primary.main",
            color: "white",
            boxShadow: "0 8px 18px -8px rgba(25, 118, 210, 0.9)",
            "&:hover": { bgcolor: "primary.dark" },
          }}
        >
          <CameraAltIcon fontSize="small" />
          <VisuallyHiddenInput
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            onChange={onChange}
          />
        </IconButton>
      </motion.div>
    </motion.div>
  );
}
