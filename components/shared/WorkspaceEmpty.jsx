"use client";

import { Box, Stack, Typography } from "@mui/material";

/** Lightweight illustration and entrance shared by chat and group empty states. */
export default function WorkspaceEmpty({
  eyebrow = "A LITTLE SPACE TO CONNECT",
  title,
  description,
  children,
}) {
  return (
    <Stack
      className="workspace-reveal"
      alignItems="center"
      spacing={2.5}
      sx={{
        textAlign: "center",
        p: { xs: 3, md: 5 },
        maxWidth: 580,
        m: "auto",
      }}
    >
      <Box className="workspace-conversation-art" aria-hidden="true">
        <svg width="180" height="154" viewBox="0 0 180 154" fill="none">
          <circle cx="90" cy="77" r="70" fill="#edf1ff" />
          <circle cx="153" cy="29" r="5" fill="#90d6c5" />
          <circle cx="23" cy="121" r="4" fill="#b6c4fb" />
          <g className="workspace-conversation-art-back">
            <path
              d="M70 67h72a14 14 0 0 1 14 14v34a14 14 0 0 1-14 14h-8v16l-21-16H70a14 14 0 0 1-14-14V81a14 14 0 0 1 14-14Z"
              fill="#d1eee6"
            />
            <path
              d="M80 91h50M80 105h34"
              stroke="#499986"
              strokeWidth="5"
              strokeLinecap="round"
            />
          </g>
          <g className="workspace-conversation-art-front">
            <path
              d="M35 27h77a16 16 0 0 1 16 16v38a16 16 0 0 1-16 16H65L42 113V97h-7a16 16 0 0 1-16-16V43a16 16 0 0 1 16-16Z"
              fill="#4361d8"
            />
            <circle cx="49" cy="62" r="5" fill="white" />
            <circle cx="74" cy="62" r="5" fill="white" />
            <circle cx="99" cy="62" r="5" fill="white" />
          </g>
        </svg>
      </Box>
      <Typography
        variant="overline"
        color="primary"
        sx={{ letterSpacing: ".16em", fontSize: 10, fontWeight: 750 }}
      >
        {eyebrow}
      </Typography>
      <Typography
        component="h1"
        variant="h4"
        sx={{ fontSize: { xs: 27, md: 34 }, lineHeight: 1.2 }}
      >
        {title}
      </Typography>
      <Typography
        color="text.secondary"
        sx={{ lineHeight: 1.8, maxWidth: 380 }}
      >
        {description}
      </Typography>
      {children && (
        <Stack
          direction="row"
          useFlexGap
          flexWrap="wrap"
          justifyContent="center"
          gap={1.5}
          sx={{ pt: 1 }}
        >
          {children}
        </Stack>
      )}
    </Stack>
  );
}
