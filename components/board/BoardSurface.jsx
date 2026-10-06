"use client";

import { Box, Paper, Stack, Typography } from "@mui/material";

export const boardSurfaceSx = {
  border: "1px solid var(--champ-border)",
  borderRadius: "20px",
  boxShadow: "0 5px 24px color-mix(in srgb, var(--champ-ink) 1.18%, transparent)",
};

export function BoardSection({
  title,
  description,
  action,
  children,
  ...props
}) {
  return (
    <Paper
      elevation={0}
      sx={{ ...boardSurfaceSx, p: { xs: 2.5, sm: 3 } }}
      {...props}
    >
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        gap={2}
        sx={{ mb: 2.5 }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h6">
            {title}
          </Typography>
          {description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5, lineHeight: 1.7 }}
            >
              {description}
            </Typography>
          )}
        </Box>
        {action}
      </Stack>
      {children}
    </Paper>
  );
}

export function BoardEmpty({ icon: Icon, title, description }) {
  return (
    <Stack
      alignItems="center"
      spacing={1.25}
      sx={{
        textAlign: "center",
        py: 4,
        px: 2,
        bgcolor: "var(--champ-field)",
        border: "1px dashed var(--champ-border)",
        borderRadius: 3,
      }}
    >
      {Icon && (
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 44,
            height: 44,
            mb: 0.5,
            borderRadius: 3,
            bgcolor: "var(--champ-soft)",
            color: "primary.main",
          }}
        >
          <Icon aria-hidden="true" />
        </Box>
      )}
      <Typography fontSize={14} fontWeight={650}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 360 }}>
        {description}
      </Typography>
    </Stack>
  );
}
