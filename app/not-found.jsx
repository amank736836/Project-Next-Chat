"use client";

import { Error as ErrorIcon } from "@mui/icons-material";
import { Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";

// Not auto-redirecting on purpose: a timed redirect moves users away before they
// can read the page (WCAG 2.2.1 Timing Adjustable / 3.2.5) and hides the 404.
const ERROR_RED = "#c62828"; // 5.6:1 on the canvas, unlike the old #ff4c4c (2.8:1)

export default function NotFound() {
  return (
    <Container
      component="main"
      maxWidth="md"
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100dvh",
        py: 4,
        textAlign: "center",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: "center", justifyContent: "center", maxWidth: "100%" }}
      >
        <ErrorIcon
          aria-hidden="true"
          sx={{ fontSize: { xs: "3.5rem", sm: "5rem" }, color: ERROR_RED }}
        />
        <Typography
          component="h1"
          variant="h1"
          sx={{
            fontSize: { xs: "4rem", sm: "6rem" },
            fontWeight: "bold",
            color: ERROR_RED,
          }}
        >
          404
        </Typography>
      </Stack>
      <Typography
        variant="h5"
        component="p"
        gutterBottom
        sx={{ color: "text.secondary" }}
      >
        Oops! The page you are looking for does not exist.
      </Typography>

      <Button
        variant="contained"
        color="primary"
        size="large"
        component={Link}
        href="/"
        sx={{ mt: 2 }}
      >
        Go Home
      </Button>
    </Container>
  );
}
