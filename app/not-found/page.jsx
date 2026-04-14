"use client";

import { Error as ErrorIcon } from "@mui/icons-material";
import { Button, Container, Stack, Typography } from "@mui/material";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Container
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        textAlign: "center",
      }}
    >
      <Stack direction={"row"} alignItems={"center"} spacing={1}>
        <ErrorIcon sx={{ fontSize: "5rem", color: "#ff4c4c" }} />
        <Typography
          variant="h1"
          sx={{ fontSize: "6rem", fontWeight: "bold", color: "#ff4c4c" }}
        >
          404
        </Typography>
      </Stack>
      <Typography variant="h5" color="textSecondary" gutterBottom>
        Oops! The page you are looking for does not exist.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        href="/"
        sx={{ mt: 2 }}
      >
        Go Home
      </Button>
    </Container>
  );
}