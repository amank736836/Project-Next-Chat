"use client";

import { Box, LinearProgress, Typography } from "@mui/material";
import { useMemo } from "react";

const getStrengthMeta = (password) => {
  const value = (password || "").trim();

  if (!value) {
    return {
      score: 0,
      label: "Enter a password",
      color: "#bdbdbd",
      helper: "Use 8+ chars with upper/lowercase, number, and symbol.",
    };
  }

  let score = 0;

  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;

  if (score <= 1) {
    return {
      score,
      label: "Weak",
      color: "#d32f2f",
      helper: "Add more length and character variety.",
    };
  }

  if (score <= 3) {
    return {
      score,
      label: "Medium",
      color: "#ed6c02",
      helper: "Good start. Add symbols and mixed case for stronger security.",
    };
  }

  return {
    score,
    label: "Strong",
    color: "#2e7d32",
    helper: "Great password strength.",
  };
};

export default function PasswordStrengthBar({ password }) {
  const strength = useMemo(() => getStrengthMeta(password), [password]);
  const progressValue = (Math.min(strength.score, 5) / 5) * 100;

  return (
    <Box sx={{ mt: 0.5, mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="caption" color="text.secondary">
          Password strength
        </Typography>
        <Typography variant="caption" sx={{ color: strength.color, fontWeight: 700 }}>
          {strength.label}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progressValue}
        sx={{
          height: 8,
          borderRadius: 999,
          backgroundColor: "#e0e0e0",
          "& .MuiLinearProgress-bar": {
            backgroundColor: strength.color,
            borderRadius: 999,
          },
        }}
      />

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
        {strength.helper}
      </Typography>
    </Box>
  );
}
