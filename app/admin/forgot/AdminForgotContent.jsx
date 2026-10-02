"use client";

import { useInputValidation, useStrongPassword } from "6pp";
import { Typography } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordStrengthBar, {
  isPasswordStrong,
} from "../../../components/shared/PasswordStrengthBar";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";
import AnimatedField from "../../../components/animations/AnimatedField";
import AnimatedHeading from "../../../components/animations/AnimatedHeading";
import AnimatedToggleButton from "../../../components/animations/AnimatedToggleButton";
import { useAuthShake } from "../../../components/animations/AuthShell";
import MorphSubmitButton from "../../../components/animations/MorphSubmitButton";
import SmoothHeight from "../../../components/animations/SmoothHeight";
import useReducedMotionSafe from "../../../components/animations/useReducedMotionSafe";

const AUTH_API_BASE = "/api/v1/user";

export default function AdminForgotContent() {
  const reducedMotion = useReducedMotionSafe();
  const shake = useAuthShake();
  const [isForgotPassword, setIsForgotPassword] = useState(true);
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("identifier");
  const verifyCodeParam = searchParams.get("verifyCode");

  const toggleVerify = () => setIsForgotPassword((prev) => !prev);

  useEffect(() => {
    if (usernameParam || verifyCodeParam) {
      setIsForgotPassword(false);
    }
  }, [usernameParam, verifyCodeParam]);

  const identifier = useInputValidation(usernameParam || "", usernameValidator);
  const password = useStrongPassword("");
  const confirmPassword = useStrongPassword("");
  const [verifyCode, setVerifyCode] = useState(verifyCodeParam || "");

  const [isLoading, setIsLoading] = useState(false);
  const isStrongPassword = isPasswordStrong(password.value);

  const dispatch = useDispatch();
  const router = useRouter();

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    const toastId = toast.loading("Sending verification code...");

    try {
      const res = await axios.post(
        `${AUTH_API_BASE}/forgotPassword`,
        {
          identifier: identifier.value,
        },
        config,
      );

      dispatch(userExists(res.data.user));

      toast.success("Forgot password email sent!", {
        duration: 1000,
        id: toastId,
      });

      setIsForgotPassword(false);
    } catch (error) {
      shake();
      toast.error(error?.response?.data?.message || "Failed to send code", {
        duration: 1000,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();

    if (!isStrongPassword) {
      toast.error("Password is too weak. Please use a stronger password.");
      return;
    }

    setIsLoading(true);

    const toastId = toast.loading("Updating password...");
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      };

      const { data } = await axios.post(
        `${AUTH_API_BASE}/updatePassword`,
        {
          identifier: identifier.value,
          password: password.value,
          verifyCode: verifyCode,
        },
        config,
      );

      dispatch(userExists(data.user));

      toast.success("Updated password successfully!", {
        duration: 1000,
        id: toastId,
      });
      toast
        .promise(new Promise((resolve) => resolve()), {
          loading: "Redirecting...",
          success: "Redirected!",
          error: "Redirect failed",
          id: toastId,
        })
        .then(() => {
          router.push("/");
        });
    } catch (error) {
      shake();
      toast.error(error?.response?.data?.message || "Update failed", {
        duration: 1000,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SmoothHeight>
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={isForgotPassword ? "request-code" : "verify-code"}
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0 : 0.2 }}
        >
          {isForgotPassword ? (
            <>
              <AnimatedHeading
                text="Forgot Password"
                subtext="Let's get you back into your account."
              />
              <form
                style={{ width: "100%", marginTop: "1rem" }}
                onSubmit={handleForgotPassword}
                suppressHydrationWarning
              >
                <AnimatedField
                  required
                  fullWidth
                  label="Username or Email"
                  margin="normal"
                  variant="outlined"
                  type="text"
                  autoComplete="identifier email"
                  autoFocus
                  value={identifier.value}
                  onChange={identifier.changeHandler}
                />
                <MorphSubmitButton
                  fullWidth
                  variant="contained"
                  type="submit"
                  status={isLoading ? "loading" : "idle"}
                  idleLabel="Send Verification Code"
                  loadingLabel="Sending code…"
                  sx={{ mt: 2 }}
                />
                <Typography textAlign="center" mt={2}>
                  OR
                </Typography>
                <AnimatedToggleButton
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={toggleVerify}
                  sx={{ mt: 2 }}
                  disabled={isLoading}
                >
                  Verify Forgot Password
                </AnimatedToggleButton>
              </form>
            </>
          ) : (
            <>
              <AnimatedHeading
                text="Verify Forgot Password"
                subtext="Enter your code and choose a new password."
              />
              <form
                style={{ width: "100%", marginTop: "1rem" }}
                onSubmit={handleUpdatePassword}
                suppressHydrationWarning
              >
                <AnimatedField
                  required
                  fullWidth
                  label="Username"
                  margin="normal"
                  variant="outlined"
                  type="text"
                  value={identifier.value}
                  onChange={identifier.changeHandler}
                />
                <AnimatedField
                  required
                  fullWidth
                  index={1}
                  label="Verification Code"
                  margin="normal"
                  variant="outlined"
                  type="text"
                  value={verifyCode}
                  onChange={(e) => {
                    if (
                      (RegExp(/^[0-9]+$/).test(e.target.value) ||
                        e.target.value === "") &&
                      (verifyCode.length < 6 || e.target.value.length < 6)
                    ) {
                      setVerifyCode(e.target.value);
                    }
                  }}
                />
                <AnimatedField
                  required
                  fullWidth
                  index={2}
                  label="Password"
                  margin="normal"
                  variant="outlined"
                  type="password"
                  value={password.value}
                  onChange={password.changeHandler}
                />
                <AnimatedField
                  required
                  fullWidth
                  index={3}
                  label="Confirm Password"
                  margin="normal"
                  variant="outlined"
                  type="password"
                  value={confirmPassword.value}
                  onChange={confirmPassword.changeHandler}
                />
                <PasswordStrengthBar password={password.value} />
                <MorphSubmitButton
                  fullWidth
                  variant="contained"
                  type="submit"
                  status={isLoading ? "loading" : "idle"}
                  idleLabel="Update Password"
                  loadingLabel="Updating password…"
                  sx={{ mt: 2 }}
                  disabled={
                    password.value !== confirmPassword.value ||
                    !isStrongPassword ||
                    verifyCode.length !== 6 ||
                    isLoading
                  }
                />
              </form>
              <Typography textAlign="center" mt={2}>
                OR
              </Typography>
              <AnimatedToggleButton
                fullWidth
                variant="outlined"
                color="secondary"
                onClick={toggleVerify}
                sx={{ mt: 2 }}
                disabled={isLoading}
              >
                Forgot Password
              </AnimatedToggleButton>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </SmoothHeight>
  );
}
