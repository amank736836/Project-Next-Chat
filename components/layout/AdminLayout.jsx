"use client";

import {
  Close as CloseIcon,
  ExitToApp as ExitToAppIcon,
  Menu as MenuIcon,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Stack,
  styled,
  Typography,
} from "@mui/material";
import { LayoutGroup, motion } from "framer-motion";
import { useId, useState } from "react";
import { useDispatch } from "react-redux";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Brand from "../shared/Brand";
import { adminTabs } from "../../constants/adminTabs";
import { adminLogout } from "../../redux/thunks/admin.thunk.js";
import {
  EASE_OUT_EXPO,
  SPRING_SOFT,
  staggerContainer,
} from "../animations/motionConfig";
import useReducedMotionSafe from "../animations/useReducedMotionSafe";

const LinkComponent = styled(Link)({
  position: "relative",
  display: "block",
  textDecoration: "none",
  borderRadius: "1rem",
  padding: "1rem 1.25rem",
  color: "var(--champ-muted)",
  transition: "color 0.2s ease, background-color 0.2s ease",
  "&:hover": { backgroundColor: "var(--champ-soft)" },
  "&:focus-visible": { outline: "3px solid var(--champ-primary)", outlineOffset: "3px" },
});

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: EASE_OUT_EXPO },
  },
};

function Sidebar({ onNavigate }) {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const router = useRouter();
  const reducedMotion = useReducedMotionSafe();
  // Desktop and drawer highlights must never animate into one another.
  const layoutId = useId();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logoutHandler = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await dispatch(adminLogout()).unwrap();
      onNavigate?.();
      router.replace("/admin/login");
    } catch {
      // The auth reducer already shows the server's error toast.
      setIsLoggingOut(false);
    }
  };

  return (
    <Stack sx={{ p: 3, minHeight: "100dvh", position: "sticky", top: 0, bgcolor: "var(--champ-canvas)", color: "var(--champ-ink)" }}>
      <Stack
        direction="row"
        spacing={1.5}
        alignItems="center"
        sx={{ mb: 5, mt: 1 }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Brand />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, letterSpacing: ".12em" }}>ADMIN PORTAL</Typography>
        </Box>
        {onNavigate && (
          <IconButton
            sx={{ color: "var(--champ-muted)" }}
            aria-label="Close admin navigation"
            onClick={onNavigate}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Stack>

      <LayoutGroup id={layoutId}>
        <motion.nav
          aria-label="Admin navigation"
          variants={reducedMotion ? undefined : staggerContainer(0.06, 0.08)}
          initial={reducedMotion ? false : "hidden"}
          animate="show"
        >
          <Stack spacing={1}>
            {adminTabs.map((tab) => {
              const active = pathname === tab.path;
              return (
                <motion.div
                  key={tab.path}
                  data-admin-reveal=""
                  variants={reducedMotion ? undefined : navItemVariants}
                  whileHover={reducedMotion ? undefined : { x: 3 }}
                  whileTap={reducedMotion ? undefined : { scale: 0.98 }}
                  transition={reducedMotion ? { duration: 0 } : SPRING_SOFT}
                >
                  <LinkComponent
                    href={tab.path}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    sx={
                      active
                        ? {
                            color: "white",
                            "&:hover": { backgroundColor: "transparent" },
                          }
                        : {}
                    }
                  >
                    {active && (
                      <motion.span
                        aria-hidden="true"
                        layoutId={
                          reducedMotion ? undefined : "active-admin-tab"
                        }
                        transition={
                          reducedMotion ? { duration: 0 } : SPRING_SOFT
                        }
                        style={{
                          position: "absolute",
                          inset: 0,
                          borderRadius: "1rem",
                          background: "var(--champ-primary)",
                          boxShadow: "0 8px 20px -10px rgba(28, 28, 28, 0.55)",
                        }}
                      />
                    )}
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.5}
                      sx={{ position: "relative", zIndex: 1 }}
                    >
                      {tab.icon}
                      <Typography fontSize="1rem" fontWeight={600}>
                        {tab.name}
                      </Typography>
                    </Stack>
                  </LinkComponent>
                </motion.div>
              );
            })}
          </Stack>
        </motion.nav>
      </LayoutGroup>

      <Box sx={{ flex: 1, minHeight: 48 }} />
      <Box sx={{ border: "1px solid var(--champ-border)", borderRadius: 3, p: 2, mb: 2 }}>
        <Typography fontSize={13} fontWeight={650}>A connected community.</Typography>
        <Typography variant="caption" sx={{ display: "block", mt: .5, color: "var(--champ-muted)", lineHeight: 1.7 }}>A clear view of the people and conversations that bring it to life.</Typography>
      </Box>
      <Button
        onClick={logoutHandler}
        disabled={isLoggingOut}
        aria-busy={isLoggingOut}
        startIcon={<ExitToAppIcon />}
        sx={{
          justifyContent: "flex-start",
          px: 2.5,
          py: 1.5,
          borderRadius: "1rem",
          color: "var(--champ-muted)",
          textTransform: "none",
          fontWeight: 600,
          "&:focus-visible": { outline: "3px solid var(--champ-primary)", outlineOffset: 3 },
        }}
      >
        {isLoggingOut ? "Logging out…" : "Logout"}
      </Button>
    </Stack>
  );
}

/** Persistent admin shell, so navigation and its active indicator stay mounted. */
export default function AdminLayout({ children }) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotionSafe();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <Box
      className="admin-motion-root"
      sx={{ display: "flex", minHeight: "100dvh", bgcolor: "var(--champ-canvas)" }}
    >
      <a className="admin-skip-link" href="#admin-content">
        Skip to content
      </a>
      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          width: 260,
          flexShrink: 0,
          bgcolor: "var(--champ-canvas)",
          borderRight: "1px solid rgba(15, 23, 42, 0.06)",
          zIndex: 1,
        }}
      >
        <Sidebar />
      </Box>

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          position: "relative",
          isolation: "isolate",
        }}
      >
        <Box className="admin-ambient-glow" aria-hidden="true" />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            display: { xs: "flex", md: "none" },
            px: 3,
            py: 1.5,
            position: "sticky",
            top: 0,
            zIndex: 1100,
            bgcolor: "rgba(255, 255, 255, 0.96)",
            borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
          }}
        >
          <Typography fontWeight={800}>Admin portal</Typography>
          <IconButton
            aria-label={
              isDrawerOpen ? "Close admin navigation" : "Open admin navigation"
            }
            aria-expanded={isDrawerOpen}
            aria-controls={isDrawerOpen ? "admin-navigation-drawer" : undefined}
            onClick={() => setIsDrawerOpen((open) => !open)}
          >
            <motion.span
              key={isDrawerOpen ? "close" : "menu"}
              initial={reducedMotion ? false : { rotate: -45, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: reducedMotion ? 0 : 0.18 }}
              style={{ display: "inline-flex" }}
            >
              {isDrawerOpen ? <CloseIcon /> : <MenuIcon />}
            </motion.span>
          </IconButton>
        </Stack>

        <motion.main
          key={pathname}
          id="admin-content"
          tabIndex={-1}
          data-admin-reveal=""
          initial={reducedMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reducedMotion ? 0 : 0.3,
            ease: EASE_OUT_EXPO,
          }}
          style={{ position: "relative", outline: "none" }}
        >
          {children}
        </motion.main>
      </Box>

      <Drawer
        open={isDrawerOpen}
        onClose={closeDrawer}
        transitionDuration={reducedMotion ? 0 : { enter: 260, exit: 180 }}
        slotProps={{
          paper: {
            id: "admin-navigation-drawer",
            className: "admin-motion-root",
            sx: { width: "min(320px, calc(100vw - 32px))" },
          },
          backdrop: { transitionDuration: reducedMotion ? 0 : 180 },
        }}
      >
        <Sidebar onNavigate={closeDrawer} />
      </Drawer>
    </Box>
  );
}
