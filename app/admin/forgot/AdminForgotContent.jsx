"use client";

import { useInputValidation, useStrongPassword } from "6pp";
import { Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { server } from "../../../constants/config";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";

export default function AdminForgotContent() {
  const [isForgotPassword, setIsForgotPassword] = useState(true);
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("identifier");
  const verifyCodeParam = searchParams.get("verifyCode");

  const toggleVerify = () => setIsForgotPassword((prev) => !prev);

  useEffect(() => {
    if (usernameParam || verifyCodeParam) {
      setIsForgotPassword(false);
    }
  }, [usernameParam]);

  const identifier = useInputValidation(usernameParam || "", usernameValidator);
  const password = useStrongPassword("");
  const confirmPassword = useStrongPassword("");
  const [verifyCode, setVerifyCode] = useState(verifyCodeParam || "");

  const [isLoading, setIsLoading] = useState(false);

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
        `${server}/user/forgotPassword`,
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
        `${server}/user/updatePassword`,
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

            <Button
              fullWidth
              variant="contained"
              color="primary"
              type="submit"
              sx={{ mt: 2 }}
              disabled={
                password.value !== confirmPassword.value ||
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
            sx={{ mt: 2 }}
            disabled={isLoading}
          >
            Forgot Password
          </Button>
        </>
      )}
    </>
  );
}
