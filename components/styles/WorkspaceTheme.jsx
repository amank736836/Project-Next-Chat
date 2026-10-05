"use client";

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { usePathname } from "next/navigation";

const workspaceTheme = createTheme({
  palette: {
    primary: { main: "#4361d8", dark: "#3049af", light: "#edf1ff" },
    secondary: { main: "#168575" },
    background: { default: "#f5f7fb", paper: "#ffffff" },
    text: { primary: "#202b45", secondary: "#66738a" },
    divider: "#e7ecf4",
  },
  shape: { borderRadius: 6 },
  typography: {
    fontFamily:
      "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    h4: { fontWeight: 750, letterSpacing: "-0.035em" },
    h5: { fontWeight: 700, letterSpacing: "-0.025em" },
    h6: { fontWeight: 700, letterSpacing: "-0.02em" },
    button: { textTransform: "none", fontWeight: 650 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "9px 18px",
          transition: "background-color 180ms, box-shadow 180ms",
          "&:focus-visible": { outline: "3px solid #96a9ff", outlineOffset: 3 },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&:focus-visible": { outline: "3px solid #96a9ff", outlineOffset: 2 },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#f8faff",
          "& fieldset": { borderColor: "#dfe5ef" },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 24,
          boxShadow: "0 24px 100px #182b4930",
          backgroundImage: "none",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { backgroundColor: "#202b45", borderRadius: 8 },
      },
    },
  },
});

/** Keep the existing auth/landing designs intact; dialogs inherit this theme. */
export default function WorkspaceTheme({ children }) {
  const pathname = usePathname() || "";
  const workspace =
    pathname === "/" ||
    /^\/(chat|groups|board|u)(\/|$)/.test(pathname) ||
    /^\/admin\/(dashboard|users|chats|messages)(\/|$)/.test(pathname);
  return workspace ? (
    <ThemeProvider theme={workspaceTheme}>{children}</ThemeProvider>
  ) : (
    children
  );
}
