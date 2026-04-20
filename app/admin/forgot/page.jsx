"use client";

import { Suspense } from "react";
import { CircularProgress, Container, Paper } from "@mui/material";
import { authBg } from "../../../constants/color";
import AdminForgotContent from "./AdminForgotContent";

export default function AdminForgot() {
  return (
    <div
      style={{
        backgroundImage: authBg,
        backgroundSize: "cover",
        backgroundPosition: "center",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={6}
          sx={{
            padding: "2rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            borderRadius: "12px",
            background: "rgba(255, 255, 255, 0.9)",
          }}
        >
          <Suspense
            fallback={
              <CircularProgress color="primary" />
            }
          >
            <AdminForgotContent />
          </Suspense>
        </Paper>
      </Container>
    </div>
  );
}
