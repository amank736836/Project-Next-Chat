"use client";

import { Box, Typography } from "@mui/material";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_EXPO } from "./motionConfig";

/** Keeps the animated letters out of the a11y tree while AT still gets the word. */
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

const containerVariants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.035, delayChildren: 0.06 },
  },
  exit: {
    transition: { staggerChildren: 0.014, staggerDirection: -1 },
  },
};

const charVariants = {
  hidden: { opacity: 0, y: 18, rotateX: -72 },
  show: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: 0.55, ease: EASE_OUT_EXPO },
  },
  exit: {
    opacity: 0,
    y: -12,
    rotateX: 45,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

/**
 * Kinetic headline: every letter flips in on a stagger, an accent underline
 * draws itself underneath, and the sub-line cross-fades. Changing `text`
 * replays the whole sequence (used when toggling Login <-> Sign Up).
 */
export default function AnimatedHeading({
  text,
  subtext,
  align = "center",
  color = "text.primary",
}) {
  const reducedMotion = useReducedMotion();
  const characters = Array.from(text);

  return (
    <Box sx={{ width: "100%", mb: 0.5 }}>
      <Typography
        variant="h5"
        component="div"
        fontWeight={800}
        color={color}
        textAlign={align}
        sx={{ letterSpacing: "-0.02em", minHeight: "1.6em" }}
      >
        <span style={visuallyHidden}>{text}</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            aria-hidden
            key={text}
            variants={reducedMotion ? undefined : containerVariants}
            initial={reducedMotion ? false : "hidden"}
            animate="show"
            exit={reducedMotion ? undefined : "exit"}
            style={{ display: "inline-flex", perspective: 600 }}
          >
            {characters.map((character, index) => (
              <motion.span
                // eslint-disable-next-line react/no-array-index-key
                key={`${text}-${index}`}
                variants={reducedMotion ? undefined : charVariants}
                style={{
                  display: "inline-block",
                  whiteSpace: "pre",
                  transformOrigin: "center bottom",
                }}
              >
                {character}
              </motion.span>
            ))}
          </motion.span>
        </AnimatePresence>
      </Typography>

      {/* self-drawing accent underline */}
      <Box
        sx={{
          display: "flex",
          justifyContent: align === "center" ? "center" : "flex-start",
          mt: 0.75,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={`rule-${text}`}
            initial={reducedMotion ? false : { scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={reducedMotion ? undefined : { scaleX: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE_OUT_EXPO, delay: 0.12 }}
            style={{
              display: "block",
              height: 3,
              width: 74,
              borderRadius: 999,
              transformOrigin: "left center",
              backgroundImage:
                "linear-gradient(90deg, #4facfe 0%, #00f2fe 45%, #ff7e5f 100%)",
            }}
          />
        </AnimatePresence>
      </Box>

      {subtext ? (
        <Typography
          variant="body2"
          textAlign={align}
          color="text.secondary"
          sx={{ mt: 1, minHeight: "1.4em" }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={subtext}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              style={{ display: "inline-block" }}
            >
              {subtext}
            </motion.span>
          </AnimatePresence>
        </Typography>
      ) : null}
    </Box>
  );
}
