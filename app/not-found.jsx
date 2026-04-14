"use client";

import { Error as ErrorIcon } from "@mui/icons-material";
import { Button, Container, Typography } from "@mui/material";
import Link from "next/link";
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
      <Typography
        variant="h1"
        sx={{ fontSize: "6rem", fontWeight: "bold", color: "#ff4c4c" }}
      >
        <ErrorIcon
          sx={{ fontSize: "5rem", color: "#ff4c4c", marginRight: 1 }}
        />
        404
      </Typography>
      <Typography variant="h5" color="textSecondary" gutterBottom>
        Oops! The page you are looking for does not exist.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        component={Link}
        href="/"
      >
        Go Home
      </Button>
    </Container>
  );
}
