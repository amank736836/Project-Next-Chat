"use client";

import { useFileHandler, useInputValidation, useStrongPassword } from "6pp";
import { CameraAlt as CameraAltIcon, Cancel as CancelIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import CircularProgress from "@mui/material/CircularProgress";
import {
  Avatar,
  Button,
  IconButton,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { VisuallyHiddenInput } from "../../../components/styles/StyledComponents";
import PasswordStrengthBar, { isPasswordStrong } from "../../../components/shared/PasswordStrengthBar";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";

const AUTH_API_BASE = "/api/v1/user";
const hydrationSafeInputSlotProps = {
  htmlInput: {
    suppressHydrationWarning: true,
  },
};

export default function LoginContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailAvailable, setEmailAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const identifierParam = searchParams.get("identifier");

  const timerRef = useRef(null);
  const emailTimerRef = useRef(null);
  const usernameParam = useRef('');
  const emailParam = useRef('');

  useEffect(() => {
    if (identifierParam) {
      if (identifierParam.includes("@")) {
        emailParam.current = identifierParam;
      } else {
        usernameParam.current = identifierParam;
      }
    }
  }, [identifierParam]);

  const toggleLogin = () => setIsLogin((prev) => !prev);

  const name = useInputValidation("");
  const email = useInputValidation(emailParam.current || "");
  const username = useInputValidation(usernameParam.current || "", usernameValidator);
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
            `${AUTH_API_BASE}/check-username?username=${username.value}`
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
            `${AUTH_API_BASE}/check-email?email=${email.value}`
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

    const config = {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
    };

    const toastId = toast.loading("Logging in...");

    try {
      const res = await axios.post(
        `${AUTH_API_BASE}/login`,
        {
          identifier: usernameParam.current || username.value,
          password: password.value,
        },
        config
      );

      dispatch(userExists(res.data.user));

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
        toggleLogin();
        return;
      }
      if (error?.response?.data?.message === "Invalid password") {
        toast.error("Invalid password", {
          duration: 1000,
          id: toastId,
        });
        router.push(`/forgot?identifier=${usernameParam.current || username.value}`);
        return;
      }

      toast.error(error?.response?.data?.message || "Login failed", {
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
          router.push(`/verify?identifier=${usernameParam.current || username.value}`);
        });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!isStrongPassword) {
      toast.error("Password is too weak. Please use a stronger password.", {
        duration: 2000,
      });
      setIsLoading(false);
      return;
    }
    
    // Check email availability
    if (!emailAvailable) {
      toast.error("Email already exists. Please use a different email.", {
        duration: 2000,
      });
      setIsLoading(false);
      return;
    }

    // Check password match
    if (password.value !== confirmPassword.value) {
      toast.error("Passwords do not match", {
        duration: 2000,
      });
      setIsLoading(false);
      return;
    }

    // Check username availability
    if (!usernameAvailable) {
      toast.error("Username already exists. Please use a different username.", {
        duration: 2000,
      });
      setIsLoading(false);
      return;
    }

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

      const { data } = await axios.post(`${AUTH_API_BASE}/new`, formDate, config);

      dispatch(userExists(data.user));

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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLogin ? (
        <>
          <Typography variant="h5" fontWeight={600} color="primary">
            Login
          </Typography>
          <form
            style={{ width: "100%", marginTop: "1rem" }}
            onSubmit={handleLogin}
            suppressHydrationWarning
          >
            <TextField
              required
              fullWidth
              label="Username or Email"
              margin="normal"
              variant="outlined"
              type="text"
              autoComplete="username email"
              autoFocus
              value={username.value}
              onChange={username.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
            />
            <TextField
              required
              fullWidth
              label="Password"
              margin="normal"
              variant="outlined"
              type="password"
              autoComplete="current-password"
              value={password.value}
              onChange={password.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={isLoading}
              suppressHydrationWarning
            >
              Login
            </Button>
            <Typography textAlign="center" mt={2}>
              Don't have an account?{" "}
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={toggleLogin}
              sx={{ mt: 2 }}
              disabled={isLoading}
              suppressHydrationWarning
            >
              Sign Up
            </Button>
          </form>
          <Typography textAlign={"center"} m={"0.5rem"}>
            Forgot your password?{" "}
            <Button
              variant="text"
              color="primary"
              onClick={() =>
                router.push(`/forgot?identifier=${usernameParam.current || username.value}`)
              }
              sx={{ textTransform: "none" }}
              suppressHydrationWarning
            >
              Reset it
            </Button>
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h5" fontWeight={600} color="primary">
            Sign Up
          </Typography>
          <form
            style={{ width: "100%", marginTop: "1rem" }}
            onSubmit={handleSignUp}
            suppressHydrationWarning
          >
            <Stack position="relative" width="8rem" margin="auto">
              <Avatar
                sx={{ width: "8rem", height: "8rem" }}
                src={avatar.preview}
                alt="Avatar"
              />
              <IconButton
                sx={{
                  position: "absolute",
                  bottom: 0,
                  right: 0,
                  bgcolor: "primary.main",
                  color: "white",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
                component="label"
              >
                <CameraAltIcon />
                <VisuallyHiddenInput
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={avatar.changeHandler}
                />
              </IconButton>
            </Stack>
            <TextField
              required
              fullWidth
              label="Name"
              margin="normal"
              variant="outlined"
              type="text"
              value={name.value}
              onChange={name.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
            />
            <TextField
              required
              fullWidth
              label="Username"
              margin="normal"
              variant="outlined"
              type="text"
              value={username.value}
              onChange={username.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor:
                      username.value && username.value.length >= 3
                        ? (usernameAvailable === null ? 'inherit' : (usernameAvailable ? 'green' : 'red'))
                        : 'inherit',
                  },
                },
              }}
              InputProps={{
                endAdornment: checkingUsername ? (
                  <CircularProgress size={20} />
                ) : usernameAvailable !== null && username.value.length >= 3 ? (
                  usernameAvailable ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )
                ) : null,
              }}
            />
            <TextField
              required
              fullWidth
              label="Email"
              margin="normal"
              variant="outlined"
              type="email"
              value={email.value}
              onChange={email.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor:
                      email.value && email.value.includes("@")
                        ? (emailAvailable === null ? 'inherit' : (emailAvailable ? 'green' : 'red'))
                        : 'inherit',
                  },
                },
              }}
              InputProps={{
                endAdornment: checkingEmail ? (
                  <CircularProgress size={20} />
                ) : emailAvailable !== null && email.value.includes("@") ? (
                  emailAvailable ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="error" />
                  )
                ) : null,
              }}
              helperText={
                email.value && !emailAvailable && email.value.includes("@")
                  ? "Email already exists"
                  : ""
              }
            />
            <TextField
              required
              fullWidth
              label="Password"
              margin="normal"
              variant="outlined"
              type="password"
              value={password.value}
              onChange={password.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
            />
            <TextField
              required
              fullWidth
              label="Confirm Password"
              margin="normal"
              variant="outlined"
              type="password"
              value={confirmPassword.value}
              onChange={confirmPassword.changeHandler}
              slotProps={hydrationSafeInputSlotProps}
              suppressHydrationWarning
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: confirmPassword.value && password.value ?
                      (password.value === confirmPassword.value ? 'green' : 'red') : 'inherit',
                  },
                },
              }}
              error={confirmPassword.value && password.value !== confirmPassword.value}
              helperText={
                confirmPassword.value && password.value !== confirmPassword.value
                  ? "Passwords do not match"
                  : confirmPassword.value && password.value === confirmPassword.value
                  ? "Passwords match ✓"
                  : ""
              }
            />
            <PasswordStrengthBar password={password.value} />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={
                password.value !== confirmPassword.value || 
                !isStrongPassword ||
                isLoading || 
                !usernameAvailable || 
                !emailAvailable
              }
              suppressHydrationWarning
            >
              Sign Up
            </Button>
          </form>
          <Typography textAlign="center" mt={2}>
            Already have an account?{" "}
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={toggleLogin}
            sx={{ mt: 2 }}
            disabled={isLoading}
            suppressHydrationWarning
          >
            Login
          </Button>
          <Typography textAlign={"center"} m={"0.5rem"}>
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
        </>
      )}
    </>
  );
}
