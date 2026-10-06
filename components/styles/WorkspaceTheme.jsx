"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { brand } from "../../constants/brand";

// One theme on every route, including login, recovery, board, and admin.
export const workspaceTheme = createTheme({
  palette: {
    primary: {
      main: brand.primary,
      dark: brand.primaryHover,
      light: brand.soft,
      contrastText: brand.surface,
    },
    secondary: { main: brand.sage, contrastText: brand.ink },
    background: { default: brand.canvas, paper: brand.surface },
    text: { primary: brand.ink, secondary: brand.muted },
    divider: brand.border,
    success: { main: brand.primary },
    info: { main: brand.primary },
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily: brand.font,
    h4: { fontWeight: 500, letterSpacing: "-0.035em" },
    h5: { fontWeight: 500, letterSpacing: "-0.03em" },
    h6: { fontWeight: 600, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 500 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundColor: brand.canvas, color: brand.ink },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: brand.controlRadius,
          padding: "9px 18px",
          transition: "background-color 180ms, box-shadow 180ms",
          "&:focus-visible": {
            outline: `3px solid ${brand.focus}`,
            outlineOffset: 3,
          },
        },
        outlined: {
          borderColor: brand.border,
          "&:hover": { backgroundColor: brand.soft, borderColor: brand.sage },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus-visible": {
            outline: `3px solid ${brand.focus}`,
            outlineOffset: 2,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: brand.controlRadius,
          backgroundColor: brand.field,
          "& fieldset": { borderColor: brand.border },
          "&.Mui-focused fieldset": { borderWidth: 1 },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: brand.cardRadius,
          border: `1px solid ${brand.border}`,
          boxShadow: "0 24px 70px #253d3520",
          backgroundImage: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: brand.ink, borderRadius: 7 },
      },
    },
  },
});

export default function WorkspaceTheme({ children }) {
  return <ThemeProvider theme={workspaceTheme}>{children}</ThemeProvider>;
}
