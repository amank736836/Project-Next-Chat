"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  Suspense,
} from "react";
import { Box, CircularProgress, Container } from "@mui/material";
import { MotionConfig, useAnimationControls } from "framer-motion";
import AuthBackdrop from "./AuthBackdrop";
import TiltCard from "./TiltCard";
import { CARD_ENTRANCE, SHAKE_KEYFRAMES } from "./motionConfig";
import useReducedMotionSafe from "./useReducedMotionSafe";

/**
 * Lets any descendant (e.g. the login form) shake the whole card on failure:
 *
 *   const shake = useAuthShake();
 *   shake();
 *
 * Falls back to a no-op when used outside the shell so components stay reusable.
 */
const AuthShakeContext = createContext(() => {});

export const useAuthShake = () => useContext(AuthShakeContext);

/**
 * Shared stage for the auth screens: living gradient backdrop, the tilting
 * glass card, entrance choreography and the error shake — all in one place so
 * login / sign up / forgot / verify stay visually consistent.
 */
export default function AuthShell({
  children,
  fallback,
  maxTilt = 7,
  maxWidth = "xs",
  className = "",
}) {
  const controls = useAnimationControls();
  const reducedMotion = useReducedMotionSafe();
  const [shakeNonce, setShakeNonce] = useState(0);

  const shake = useCallback(() => {
    setShakeNonce((nonce) => nonce + 1);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      controls.set({ opacity: 1, y: 0, scale: 1, rotateX: 0, x: 0, rotate: 0 });
    } else {
      controls.start(CARD_ENTRANCE.animate);
    }
  }, [controls, reducedMotion]);

  useEffect(() => {
    if (shakeNonce > 0 && !reducedMotion) controls.start(SHAKE_KEYFRAMES);
  }, [shakeNonce, controls, reducedMotion]);

  return (
    <AuthShakeContext.Provider value={shake}>
      <MotionConfig reducedMotion="user">
        <Box
          className={`auth-motion-root ${className}`.trim()}
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            overflowX: "clip",
            isolation: "isolate",
            py: { xs: 3, sm: 5 },
            "@supports (min-height: 100dvh)": { minHeight: "100dvh" },
          }}
        >
          <AuthBackdrop />

          <Container
            component="main"
            maxWidth={maxWidth}
            sx={{
              position: "relative",
              zIndex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              // auto margins (instead of relying on align-items) keep a tall
              // sign-up form fully reachable when it exceeds the viewport
              my: "auto",
            }}
          >
            <TiltCard controls={controls} maxTilt={maxTilt}>
              <Suspense
                fallback={
                  fallback || (
                    <Box sx={{ p: 4, display: "grid", placeItems: "center" }}>
                      <CircularProgress color="primary" />
                    </Box>
                  )
                }
              >
                {children}
              </Suspense>
            </TiltCard>
          </Container>
        </Box>
      </MotionConfig>
    </AuthShakeContext.Provider>
  );
}
