"use client";

import {
  ErrorOutline as ErrorOutlineIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Box, Button, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT_EXPO } from "../animations/motionConfig";
import useReducedMotionSafe from "../animations/useReducedMotionSafe";

function LoadingContent({ label, variant }) {
  return (
    <Box role="status" aria-busy="true" sx={{ p: { xs: 3, md: 4 } }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
        <span className="admin-loading-spinner" aria-hidden="true" />
        <Typography fontWeight={600}>{label}</Typography>
      </Stack>
      <Box aria-hidden="true">
        <Skeleton variant="rounded" width="45%" height={32} sx={{ mb: 3 }} />
        {variant === "dashboard" && (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 2,
              mb: 3,
            }}
          >
            {[0, 1, 2].map((index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={128}
                animation="wave"
              />
            ))}
          </Box>
        )}
        <Paper elevation={0} sx={{ p: 3, borderRadius: 3 }}>
          {Array.from(
            { length: variant === "dashboard" ? 4 : 7 },
            (_, index) => (
              <Skeleton
                key={index}
                variant="rounded"
                height={variant === "dashboard" ? 48 : 36}
                animation="wave"
                sx={{ mb: index === 6 ? 0 : 2 }}
              />
            ),
          )}
        </Paper>
      </Box>
    </Box>
  );
}

/** Cross-fades loading, error, and ready states without hiding refetched data. */
export default function AdminAsyncContent({
  children,
  isLoading = false,
  error,
  loadingLabel = "Loading admin portal…",
  variant = "table",
  onRetry,
}) {
  const reducedMotion = useReducedMotionSafe();
  const state = isLoading ? "loading" : error ? "error" : "ready";
  const errorMessage =
    error?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again.";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={state}
        data-admin-reveal=""
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -4 }}
        transition={{ duration: reducedMotion ? 0 : 0.2, ease: EASE_OUT_EXPO }}
      >
        {state === "loading" ? (
          <LoadingContent label={loadingLabel} variant={variant} />
        ) : state === "error" ? (
          <Box sx={{ p: { xs: 3, md: 4 } }}>
            <Paper
              role="alert"
              elevation={0}
              sx={{
                p: 4,
                borderRadius: 3,
                border: "1px solid rgba(211, 47, 47, 0.15)",
                textAlign: "center",
              }}
            >
              <ErrorOutlineIcon color="error" sx={{ fontSize: 36, mb: 1 }} />
              <Typography variant="h6" component="h2" fontWeight={700}>
                Unable to load this page
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {errorMessage}
              </Typography>
              {onRetry && (
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={onRetry}
                >
                  Try again
                </Button>
              )}
            </Paper>
          </Box>
        ) : (
          children
        )}
      </motion.div>
    </AnimatePresence>
  );
}
