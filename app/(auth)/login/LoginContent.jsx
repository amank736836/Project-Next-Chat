"use client";

import {
  authApiBase as AUTH_API_BASE,
  remoteAuthEnabled,
} from "../../../constants/config";

import { useFileHandler, useInputValidation, useStrongPassword } from "6pp";
import {
  AlternateEmail as AlternateEmailIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  BadgeOutlined as BadgeOutlinedIcon,
  LockOutline as LockOutlineIcon,
  LockPersonOutlined as LockPersonOutlinedIcon,
  MailOutline as MailOutlineIcon,
  PersonOutline as PersonOutlineIcon,
} from "@mui/icons-material";
import { Box, Link as MuiLink, Typography } from "@mui/material";
import axios from "axios";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AnimatedAvatarUpload from "../../../components/animations/AnimatedAvatarUpload";
import AnimatedField, {
  RevealPasswordToggle,
  ValidityIcon,
} from "../../../components/animations/AnimatedField";
import AnimatedHeading from "../../../components/animations/AnimatedHeading";
import { ChampMark } from "../../../components/animations/WelcomeStage";
import AnimatedToggleButton from "../../../components/animations/AnimatedToggleButton";
import { useAuthShake } from "../../../components/animations/AuthShell";
import MorphSubmitButton from "../../../components/animations/MorphSubmitButton";
import SmoothHeight from "../../../components/animations/SmoothHeight";
import PasswordStrengthBar, {
  isPasswordStrong,
} from "../../../components/shared/PasswordStrengthBar";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";

const hydrationSafeInputSlotProps = {
  inputLabel: { shrink: true },
  htmlInput: {
    suppressHydrationWarning: true,
  },
};

/** How long the button stays in its red "error" state before resetting. */
const ERROR_FLASH_MS = 900;

export default function LoginContent({ isLogin, setIsLogin }) {
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [revealPassword, setRevealPassword] = useState(false);
  const [revealConfirmPassword, setRevealConfirmPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifierParam = searchParams.get("identifier");
  const shakeCard = useAuthShake();
  const reducedMotion = useReducedMotion();

  const timerRef = useRef(null);
  const emailTimerRef = useRef(null);
  const errorTimerRef = useRef(null);
  const usernameParam = useRef("");
  const emailParam = useRef("");

  useEffect(() => {
    if (identifierParam) {
      if (identifierParam.includes("@")) {
        emailParam.current = identifierParam;
      } else {
        usernameParam.current = identifierParam;
      }
    }
  }, [identifierParam]);

  useEffect(() => () => clearTimeout(errorTimerRef.current), []);

  const toggleLogin = () => {
    setIsLogin((prev) => !prev);
    setSubmitStatus("idle");
  };

  /** Red flash on the CTA + a "nope" shake of the whole card. */
  const flashError = () => {
    setSubmitStatus("error");
    shakeCard();
    clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => {
      setSubmitStatus((current) => (current === "error" ? "idle" : current));
    }, ERROR_FLASH_MS);
  };

  const name = useInputValidation("");
  const email = useInputValidation(emailParam.current || "");
  const username = useInputValidation(identifierParam || "", usernameValidator);
  const password = useStrongPassword("");
  const confirmPassword = useStrongPassword("");
  const avatar = useFileHandler("single", 2);
  const [isLoading, setIsLoading] = useState(false);
  const isStrongPassword = isPasswordStrong(password.value);

  useEffect(() => {
    if (isLogin) {
      setUsernameAvailable(null);
      setCheckingUsername(false);
      return;
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!username.value || username.value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    timerRef.current = setTimeout(() => {
      const checkUsername = async () => {
        try {
          const response = await axios.get(
            `${AUTH_API_BASE}/check-username?username=${username.value}`,
          );
          setUsernameAvailable(response.data.available);
        } catch (error) {
          console.error("Failed to check username:", error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      };
      checkUsername();
    }, 500);

    return () => {
      clearTimeout(timerRef.current);
    };
  }, [isLogin, username.value]);

  useEffect(() => {
    if (isLogin) {
      setEmailAvailable(null);
      setCheckingEmail(false);
      return;
    }

    if (emailTimerRef.current) {
      clearTimeout(emailTimerRef.current);
    }

    if (!email.value || !email.value.includes("@")) {
      setEmailAvailable(null);
      return;
    }

    setCheckingEmail(true);
    emailTimerRef.current = setTimeout(() => {
      const checkEmail = async () => {
        try {
          const response = await axios.get(
            `${AUTH_API_BASE}/check-email?email=${email.value}`,
          );
          setEmailAvailable(response.data.available);
        } catch (error) {
          console.error("Failed to check email:", error);
          setEmailAvailable(null);
        } finally {
          setCheckingEmail(false);
        }
      };
      checkEmail();
    }, 500);

    return () => {
      clearTimeout(emailTimerRef.current);
    };
  }, [isLogin, email.value]);

  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearTimeout(errorTimerRef.current);
    setSubmitStatus("loading");

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    const toastId = toast.loading("Logging in...");

    // The local Next route reads `identifier`; the deployed MERN backend keys
    // off `username`/`email`. Send the right alias(es) for whichever is active.
    const identifier = username.value;
    const credentials = remoteAuthEnabled
      ? {
          identifier,
          password: password.value,
          ...(identifier.includes("@")
            ? { email: identifier }
            : { username: identifier }),
        }
      : { identifier, password: password.value };

    try {
      const res = await axios.post(
        `${AUTH_API_BASE}/login`,
        credentials,
        config,
      );

      dispatch(userExists(res.data.user));
      setSubmitStatus("success");

      toast.success("Login successful!", {
        duration: 1000,
        id: toastId,
      });

      toast
        .promise(new Promise((resolve) => resolve()), {
          loading: "Redirecting...",
          success: "Redirected!",
          error: "Redirect failed",
          id: toastId,
          duration: 1000,
        })
        .then(() => {
          router.push("/");
        });
    } catch (error) {
      console.error(error);
      if (error?.response?.data?.message === "User not found") {
        toast.error("User not found", {
          duration: 1000,
          id: toastId,
        });
        setSubmitStatus("idle");
        shakeCard();
        toggleLogin();
        return;
      }
      if (error?.response?.data?.message === "Invalid password") {
        toast.error("Invalid password", {
          duration: 1000,
          id: toastId,
        });
        flashError();
        router.push(
          `/forgot?identifier=${usernameParam.current || username.value}`,
        );
        return;
      }

      toast.error(error?.response?.data?.message || "Login failed", {
        duration: 1000,
        id: toastId,
      });
      flashError();
      if (error?.response?.data?.message?.toLowerCase().includes("verify")) {
        router.push(`/verify?identifier=${encodeURIComponent(username.value)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    clearTimeout(errorTimerRef.current);

    if (!isStrongPassword) {
      toast.error("Password is too weak. Please use a stronger password.", {
        duration: 2000,
      });
      flashError();
      setIsLoading(false);
      return;
    }

    // Check email availability
    if (!emailAvailable) {
      toast.error("Email already exists. Please use a different email.", {
        duration: 2000,
      });
      flashError();
      setIsLoading(false);
      return;
    }

    // Check password match
    if (password.value !== confirmPassword.value) {
      toast.error("Passwords do not match", {
        duration: 2000,
      });
      flashError();
      setIsLoading(false);
      return;
    }

    // Check username availability
    if (!usernameAvailable) {
      toast.error("Username already exists. Please use a different username.", {
        duration: 2000,
      });
      flashError();
      setIsLoading(false);
      return;
    }

    setSubmitStatus("loading");

    const formDate = new FormData();
    formDate.append("avatar", avatar.file);
    formDate.append("name", name.value);
    formDate.append("username", username.value);
    formDate.append("email", email.value);
    formDate.append("password", password.value);

    const toastId = toast.loading("Signing up...");
    try {
      const config = {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      };

      const { data } = await axios.post(
        `${AUTH_API_BASE}/new`,
        formDate,
        config,
      );

      dispatch(userExists(data.user));
      setSubmitStatus("success");

      toast.success("Sign up successful!", {
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
          router.push("/verify?identifier=" + username.value);
        });
    } catch (error) {
      console.error(error);
      const errorMsg = error?.response?.data?.message || "Sign up failed";

      // Handle email already exists error
      if (errorMsg.toLowerCase().includes("email")) {
        toast.error("Email already exists. Please use a different email.", {
          duration: 2000,
          id: toastId,
        });
      } else {
        toast.error(errorMsg, {
          duration: 2000,
          id: toastId,
        });
      }
      flashError();
    } finally {
      setIsLoading(false);
    }
  };

  // Login always lives on the left, Sign Up on the right — like a pager.
  const panelOffset = isLogin ? -30 : 30;
  const panelTransition = reducedMotion
    ? { duration: 0.15 }
    : { duration: 0.38, ease: [0.16, 1, 0.3, 1] };

  const usernameStateColor =
    username.value && username.value.length >= 3
      ? usernameAvailable === null
        ? undefined
        : usernameAvailable
          ? "green"
          : "red"
      : undefined;

  const emailStateColor =
    email.value && email.value.includes("@")
      ? emailAvailable === null
        ? undefined
        : emailAvailable
          ? "green"
          : "red"
      : undefined;

  const passwordsMatch = Boolean(confirmPassword.value && password.value);
  const confirmPasswordStateColor = !passwordsMatch
    ? undefined
    : password.value === confirmPassword.value
      ? "green"
      : "red";

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="account-tabs" role="tablist" aria-label="Account access">
        <button
          role="tab"
          id="login-tab"
          aria-controls="account-panel"
          aria-selected={isLogin}
          tabIndex={isLogin ? 0 : -1}
          disabled={isLoading}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") {
              setIsLogin(false);
              document.getElementById("signup-tab")?.focus();
            }
          }}
          onClick={() => {
            setIsLogin(true);
            setSubmitStatus("idle");
          }}
        >
          Log in
        </button>
        <button
          role="tab"
          id="signup-tab"
          aria-controls="account-panel"
          aria-selected={!isLogin}
          tabIndex={isLogin ? -1 : 0}
          disabled={isLoading}
          onKeyDown={(event) => {
            if (event.key === "ArrowLeft") {
              setIsLogin(true);
              document.getElementById("login-tab")?.focus();
            }
          }}
          onClick={() => {
            setIsLogin(false);
            setSubmitStatus("idle");
          }}
        >
          Sign up
        </button>
      </div>
      <div className="form-welcome-icon">
        <ChampMark />
        <span>✦</span>
      </div>

      <SmoothHeight>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            id="account-panel"
            role="tabpanel"
            aria-labelledby={isLogin ? "login-tab" : "signup-tab"}
            key={isLogin ? "login-panel" : "signup-panel"}
            initial={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: panelOffset, filter: "blur(6px)" }
            }
            animate={
              reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, x: 0, filter: "blur(0px)" }
            }
            exit={
              reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: panelOffset, filter: "blur(6px)" }
            }
            transition={panelTransition}
            style={{ width: "100%" }}
          >
            <AnimatedHeading
              component="h2"
              text={isLogin ? "Welcome back." : "Find your people."}
              subtext={
                isLogin
                  ? "Good to see you. Let’s get you back in the loop."
                  : "A new connection starts with a little hello."
              }
            />

            {isLogin ? (
              <form
                style={{ width: "100%", marginTop: "0.75rem" }}
                onSubmit={handleLogin}
                suppressHydrationWarning
              >
                <AnimatedField
                  index={0}
                  required
                  label="Username or email"
                  placeholder="Enter your username or email"
                  className="welcome-input"
                  type="text"
                  autoComplete="username"
                  icon={<PersonOutlineIcon fontSize="small" />}
                  value={username.value}
                  onChange={username.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                />
                <AnimatedField
                  index={1}
                  required
                  label="Password"
                  placeholder="Enter your password"
                  className="welcome-input"
                  type={revealPassword ? "text" : "password"}
                  autoComplete="current-password"
                  icon={<LockOutlineIcon fontSize="small" />}
                  value={password.value}
                  onChange={password.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                  InputProps={{
                    endAdornment: (
                      <RevealPasswordToggle
                        visible={revealPassword}
                        onToggle={() => setRevealPassword((prev) => !prev)}
                      />
                    ),
                  }}
                />

                <div className="login-form-options">
                  <span>
                    <LockOutlineIcon /> Just you. Just your account.
                  </span>
                  <Link
                    href={`/forgot?identifier=${encodeURIComponent(username.value)}`}
                  >
                    Forgot password?
                  </Link>
                </div>
                <MorphSubmitButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  status={submitStatus}
                  idleLabel={
                    <>
                      Let’s talk <ArrowForwardIcon fontSize="small" />
                    </>
                  }
                  loadingLabel="Logging in…"
                  successLabel="Welcome back!"
                  errorLabel="Login failed"
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                  suppressHydrationWarning
                />

                <div className="signup-divider">
                  <span /> A good conversation starts here <span />
                </div>
                <p className="signup-prompt">
                  New to Chat Champ?{" "}
                  <button
                    type="button"
                    onClick={toggleLogin}
                    disabled={isLoading}
                  >
                    Create an account <ArrowForwardIcon />
                  </button>
                </p>
                <p className="form-legal">
                  By continuing, you agree to our{" "}
                  <Link href="/terms">Terms of Service</Link>
                  <br /> and <Link href="/privacy">Privacy Policy</Link>. Let’s
                  keep it kind.
                </p>
              </form>
            ) : (
              <form
                style={{ width: "100%", marginTop: "0.75rem" }}
                onSubmit={handleSignUp}
                suppressHydrationWarning
              >
                <AnimatedAvatarUpload
                  size="5rem"
                  accent="105, 144, 110"
                  disabled={isLoading}
                  preview={avatar.preview}
                  onChange={avatar.changeHandler}
                />

                <AnimatedField
                  index={1}
                  required
                  label="Name"
                  type="text"
                  icon={<BadgeOutlinedIcon fontSize="small" />}
                  value={name.value}
                  onChange={name.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                />
                <AnimatedField
                  index={2}
                  required
                  label="Username"
                  type="text"
                  icon={<AlternateEmailIcon fontSize="small" />}
                  value={username.value}
                  onChange={username.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                  validColor={usernameStateColor}
                  InputProps={{
                    endAdornment: (
                      <ValidityIcon
                        state={
                          username.value.length >= 3 ? usernameAvailable : null
                        }
                        checking={checkingUsername}
                      />
                    ),
                  }}
                />
                <AnimatedField
                  index={3}
                  required
                  label="Email"
                  type="email"
                  icon={<MailOutlineIcon fontSize="small" />}
                  value={email.value}
                  onChange={email.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                  validColor={emailStateColor}
                  InputProps={{
                    endAdornment: (
                      <ValidityIcon
                        state={
                          email.value.includes("@") ? emailAvailable : null
                        }
                        checking={checkingEmail}
                      />
                    ),
                  }}
                  helperText={
                    email.value && !emailAvailable && email.value.includes("@")
                      ? "Email already exists"
                      : ""
                  }
                />
                <AnimatedField
                  index={4}
                  required
                  label="Password"
                  type={revealPassword ? "text" : "password"}
                  icon={<LockOutlineIcon fontSize="small" />}
                  value={password.value}
                  onChange={password.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                  InputProps={{
                    endAdornment: (
                      <RevealPasswordToggle
                        visible={revealPassword}
                        onToggle={() => setRevealPassword((prev) => !prev)}
                      />
                    ),
                  }}
                />

                <motion.div
                  initial={reducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.45,
                    delay: reducedMotion ? 0 : 0.22,
                  }}
                >
                  <PasswordStrengthBar password={password.value} />
                </motion.div>

                <AnimatedField
                  index={6}
                  required
                  label="Confirm Password"
                  type={revealConfirmPassword ? "text" : "password"}
                  icon={<LockPersonOutlinedIcon fontSize="small" />}
                  value={confirmPassword.value}
                  onChange={confirmPassword.changeHandler}
                  slotProps={hydrationSafeInputSlotProps}
                  suppressHydrationWarning
                  validColor={confirmPasswordStateColor}
                  error={
                    passwordsMatch && password.value !== confirmPassword.value
                  }
                  InputProps={{
                    endAdornment: (
                      <RevealPasswordToggle
                        visible={revealConfirmPassword}
                        onToggle={() =>
                          setRevealConfirmPassword((prev) => !prev)
                        }
                      />
                    ),
                  }}
                  helperText={
                    confirmPassword.value &&
                    password.value !== confirmPassword.value
                      ? "Passwords do not match"
                      : confirmPassword.value &&
                          password.value === confirmPassword.value
                        ? "Passwords match ✓"
                        : ""
                  }
                />

                <MorphSubmitButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  status={submitStatus}
                  idleLabel="Sign Up"
                  loadingLabel="Creating account…"
                  successLabel="Account created!"
                  errorLabel="Fix the fields above"
                  disabled={
                    password.value !== confirmPassword.value ||
                    !isStrongPassword ||
                    isLoading ||
                    !usernameAvailable ||
                    !emailAvailable
                  }
                  sx={{ mt: 1.5 }}
                  suppressHydrationWarning
                />
              </form>
            )}

            {!isLogin ? (
              <Box sx={{ width: "100%" }}>
                <Typography
                  textAlign="center"
                  mt={2}
                  variant="body2"
                  color="text.secondary"
                >
                  Already have an account?
                </Typography>
                <AnimatedToggleButton
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  onClick={toggleLogin}
                  disabled={isLoading}
                  sx={{ mt: 1 }}
                  icon={<ArrowBackIcon fontSize="small" />}
                  suppressHydrationWarning
                >
                  Login
                </AnimatedToggleButton>
                <Typography
                  textAlign={"center"}
                  m={"0.5rem"}
                  variant="caption"
                  color="text.secondary"
                >
                  By signing up, you agree to our{" "}
                  <MuiLink component={Link} href="/terms" underline="hover">
                    Terms of Service
                  </MuiLink>{" "}
                  and{" "}
                  <MuiLink component={Link} href="/privacy" underline="hover">
                    Privacy Policy
                  </MuiLink>
                  .
                </Typography>
              </Box>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </SmoothHeight>
    </Box>
  );
}
