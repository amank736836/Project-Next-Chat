"use client";

import { useInputValidation } from "6pp";
import {
  AdminPanelSettingsOutlined as AdminPanelSettingsIcon,
  ArrowBack as ArrowBackIcon,
  KeyOutlined as KeyIcon,
} from "@mui/icons-material";
import { Alert, Box, Button } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell, {
  useAuthShake,
} from "../../../components/animations/AuthShell";
import AnimatedHeading from "../../../components/animations/AnimatedHeading";
import AnimatedField, {
  RevealPasswordToggle,
} from "../../../components/animations/AnimatedField";
import MorphSubmitButton from "../../../components/animations/MorphSubmitButton";
import SmoothHeight from "../../../components/animations/SmoothHeight";
import useReducedMotionSafe from "../../../components/animations/useReducedMotionSafe";
import { adminLogin, getAdmin } from "../../../redux/thunks/admin.thunk.js";

function AdminLoginContent() {
  const { isAdmin } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const router = useRouter();
  const shake = useAuthShake();
  const reducedMotion = useReducedMotionSafe();
  const secretKey = useInputValidation("");
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const busy = status === "loading" || status === "success";

  const submitHandler = async (event) => {
    event.preventDefault();
    if (busy) return;
    setError("");
    setStatus("loading");
    try {
      await dispatch(adminLogin(secretKey.value)).unwrap();
      setStatus("success");
    } catch (loginError) {
      setError(loginError?.message || "Unable to sign in. Please try again.");
      setStatus("error");
      shake();
    }
  };

  useEffect(() => {
    if (!isAdmin || status === "loading") return;
    // Briefly show the success state; an existing session redirects immediately.
    const timeout = setTimeout(
      () => router.replace("/admin/dashboard"),
      status === "success" && !reducedMotion ? 650 : 0,
    );
    return () => clearTimeout(timeout);
  }, [isAdmin, reducedMotion, router, status]);

  useEffect(() => {
    dispatch(getAdmin());
  }, [dispatch]);

  return (
    <SmoothHeight>
      <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
        <motion.div
          data-admin-reveal=""
          initial={
            reducedMotion ? false : { scale: 0.75, opacity: 0, rotate: -10 }
          }
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.5,
            delay: reducedMotion ? 0 : 0.15,
          }}
          style={{
            position: "relative",
            display: "grid",
            placeItems: "center",
            width: 64,
            height: 64,
          }}
          aria-hidden="true"
        >
          <span
            className="auth-logo-halo"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 22,
              opacity: 0.45,
            }}
          />
          <Box
            sx={{
              position: "relative",
              display: "grid",
              placeItems: "center",
              width: 64,
              height: 64,
              borderRadius: "18px",
              bgcolor: "rgba(255,255,255,0.95)",
              color: "#2694ab",
              boxShadow: "0 8px 24px -12px rgba(38,148,171,0.4)",
            }}
          >
            <AdminPanelSettingsIcon sx={{ fontSize: 34 }} />
          </Box>
        </motion.div>
      </Box>

      <AnimatedHeading
        text="Admin Login"
        subtext="A secure space to manage your community."
      />
      <form
        onSubmit={submitHandler}
        aria-busy={status === "loading"}
        style={{ width: "100%", marginTop: "1rem" }}
      >
        <AnimatedField
          required
          label="Secret key"
          icon={<KeyIcon />}
          type={showSecretKey ? "text" : "password"}
          autoComplete="current-password"
          value={secretKey.value}
          disabled={busy}
          error={Boolean(error)}
          inputProps={{
            "aria-describedby": error ? "admin-login-error" : undefined,
          }}
          onChange={(event) => {
            secretKey.changeHandler(event);
            if (error) {
              setError("");
              setStatus("idle");
            }
          }}
          InputProps={{
            endAdornment: (
              <RevealPasswordToggle
                visible={showSecretKey}
                onToggle={() => setShowSecretKey((visible) => !visible)}
                disabled={busy}
              />
            ),
          }}
        />

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              key="login-error"
              initial={reducedMotion ? false : { opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.2 }}
            >
              <Alert
                id="admin-login-error"
                severity="error"
                sx={{ mt: 1, borderRadius: 2 }}
              >
                {error}
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <MorphSubmitButton
          fullWidth
          variant="contained"
          type="submit"
          status={status}
          idleLabel="Login"
          loadingLabel="Checking access…"
          successLabel="Access granted"
          errorLabel="Try again"
          disabled={!secretKey.value.trim()}
          sx={{ mt: 2 }}
        />
      </form>
      <Box sx={{ mt: 2, textAlign: "center" }}>
        <Button
          component={Link}
          href="/login"
          className="auth-link"
          startIcon={<ArrowBackIcon />}
          sx={{ textTransform: "none", color: "text.secondary" }}
        >
          Back to user login
        </Button>
      </Box>
    </SmoothHeight>
  );
}

export default function AdminLogin() {
  return (
    <AuthShell maxTilt={4} className="admin-motion-root">
      <AdminLoginContent />
    </AuthShell>
  );
}
