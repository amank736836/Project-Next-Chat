"use client";

import { useInputValidation } from "6pp";
import { Button, TextField, Typography } from "@mui/material";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { server } from "../../../constants/config";
import { usernameValidator } from "../../../lib/validators";
import { userExists } from "../../../redux/reducers/auth.reducer";

export default function VerifyContent() {
  const searchParams = useSearchParams();
  const usernameParam = searchParams.get("identifier");
  const verifyCodeParam = searchParams.get("verifyCode");

  const identifier = useInputValidation(usernameParam || "", usernameValidator);
  const [verifyCode, setVerifyCode] = useState(verifyCodeParam || "");
  const [isLoading, setIsLoading] = useState(false);

  const dispatch = useDispatch();
  const router = useRouter();

  const handleVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const toastId = toast.loading("Verifying account...");
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      };

      const { data } = await axios.post(
        `${server}/user/verify`,
        {
          identifier: identifier.value,
          verifyCode: verifyCode,
        },
        config
      );

      dispatch(userExists(data.user));

      toast.success("Account verified successfully", {
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
      toast.error(error?.response?.data?.message || "Verification failed", {
        duration: 1000,
        id: toastId,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h5" fontWeight={600} color="primary">
        Verify Account
      </Typography>
      <form
        style={{ width: "100%", marginTop: "1rem" }}
        onSubmit={handleVerify}
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
          suppressHydrationWarning
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
          suppressHydrationWarning
        />
        <Button
          fullWidth
          variant="contained"
          color="primary"
          type="submit"
          sx={{ mt: 2 }}
          disabled={verifyCode.length !== 6 || isLoading}
        >
          Verify Account
        </Button>
      </form>
    </>
  );
}
