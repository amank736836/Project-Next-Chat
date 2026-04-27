"use client";

import { useInputValidation, useStrongPassword } from "6pp";
import { Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import PasswordStrengthBar, { isPasswordStrong } from "../../../components/shared/PasswordStrengthBar";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";

const AUTH_API_BASE = "/api/v1/user";

export default function ForgotContent() {
  const [isForgotPassword, setIsForgotPassword] = useState(true);
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("identifier");
  const verifyCodeParam = searchParams.get("verifyCode");

  const toggleVerify = () => setIsForgotPassword((prev) => !prev);

  useEffect(() => {
    if (usernameParam && verifyCodeParam) {
      setIsForgotPassword(false);
    }
  }, [usernameParam, verifyCodeParam]);

  const identifier = useInputValidation(usernameParam || "", usernameValidator);
  const password = useStrongPassword("");
  const confirmPassword = useStrongPassword("");
  const [verifyCode, setVerifyCode] = useState(verifyCodeParam || "");
  const [isVerifyCodeValid, setIsVerifyCodeValid] = useState(false);

  useEffect(() => {
    if (verifyCode.length === 6) {
      setIsVerifyCodeValid(true);
    }
  }, [verifyCode]);

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
        config
      );

      dispatch(userExists(res.data.user));

      toast.success("Forgot password email sent!", {
        duration: 1000,
        id: toastId,
      });

      setIsForgotPassword(false);
    } catch (error) {
      console.error(error);
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
        config
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
      console.error(error);
      toast.error(error?.response?.data?.message || "Update failed", {
        duration: 1000,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isForgotPassword ? (
        <>
          <Typography variant="h5" fontWeight={600} color="primary">
            Forgot Password
          </Typography>
          <form
            style={{ width: "100%", marginTop: "1rem" }}
            onSubmit={handleForgotPassword}
            suppressHydrationWarning
          >
            <TextField
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
            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              Send Verification Code
            </Button>
            <Typography textAlign="center" mt={2}>
              OR
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              color="secondary"
              onClick={toggleVerify}
              sx={{ mt: 2 }}
              disabled={isLoading}
            >
              Verify Forgot Password
            </Button>
          </form>
          <Typography textAlign={"center"} m={"0.5rem"}>
            Know your password?{" "}
            <Button
              variant="text"
              color="primary"
              onClick={() =>
                router.push(`/login?identifier=${identifier.value}`)
              }
              sx={{ textTransform: "none" }}
            >
              Login
            </Button>
          </Typography>
        </>
      ) : (
        <>
          <Typography variant="h5" fontWeight={600} color="primary">
            Verify Forgot Password
          </Typography>
          <form
            style={{ width: "100%", marginTop: "1rem" }}
            onSubmit={handleUpdatePassword}
            suppressHydrationWarning
          >
            <TextField
              required
              fullWidth
              label="Username"
              margin="normal"
              variant="outlined"
              type="text"
              value={identifier.value}
              onChange={identifier.changeHandler}
            />
            <TextField
              required
              fullWidth
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
            <TextField
              required
              fullWidth
              label="Password"
              margin="normal"
              variant="outlined"
              type="password"
              value={password.value}
              onChange={password.changeHandler}
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
                verifyCode.length !== 6 ||
                isLoading
              }
            >
              Update Password
            </Button>
          </form>
          <Typography textAlign="center" mt={2}>
            OR
          </Typography>
          <Button
            fullWidth
            variant="outlined"
            color="secondary"
            onClick={toggleVerify}
            disabled={isLoading}
          >
            Forgot Password
          </Button>
        </>
      )}
    </>
  );
}
