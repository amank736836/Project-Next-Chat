"use client";

import {
  AdminPanelSettings as AdminPanelSettingsIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Notifications as NotificationsIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { motion } from "framer-motion";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  AdminReveal,
  AnimatedCounter,
} from "../../../components/animations/AdminMotion";
import useReducedMotionSafe from "../../../components/animations/useReducedMotionSafe";
import AdminAsyncContent from "../../../components/layout/AdminAsyncContent";
import {
  CurveButton,
  SearchField,
} from "../../../components/styles/StyledComponents";
import { useErrors } from "../../../hooks/useHooks";
import { useGetDashboardStatsQuery } from "../../../redux/api/api";
import { DoughnutChart, LineChart } from "../../../specific/Charts";

const MotionCurveButton = motion.create(CurveButton);
const surfaceSx = {
  borderRadius: "1.25rem",
  border: "1px solid rgba(15, 23, 42, 0.06)",
  boxShadow: "0 12px 32px -18px rgba(15, 23, 42, 0.2)",
};

function Clock() {
  // Match the server's first render instead of hydrating a different second.
  const [time, setTime] = useState(null);

  useEffect(() => {
    setTime(moment());
    const interval = setInterval(() => setTime(moment()), 1000);
    return () => clearInterval(interval);
  }, []);

  return time
    ? time.format("dddd · Do MMMM YYYY · h:mm:ss a")
    : "Updating clock…";
}

function Widget({ title, value, Icon, delay, accent }) {
  return (
    <AdminReveal
      component={Paper}
      elevation={0}
      delay={delay}
      lift
      sx={{ ...surfaceSx, p: { xs: 2.5, lg: 3 }, minWidth: 0 }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: "1rem",
            display: "grid",
            placeItems: "center",
            background: `${accent}14`,
            color: accent,
          }}
        >
          <Icon aria-hidden="true" />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
            {title}
          </Typography>
          <Typography
            component="div"
            fontSize={{ xs: "1.6rem", lg: "1.9rem" }}
            fontWeight={800}
          >
            <AnimatedCounter value={value} />
          </Typography>
        </Box>
      </Stack>
    </AdminReveal>
  );
}

export default function Dashboard() {
  const reducedMotion = useReducedMotionSafe();
  const { data, isLoading, isError, error, refetch } =
    useGetDashboardStatsQuery();
  const stats = data?.stats;

  useErrors([{ isError, error }]);

  return (
    <AdminAsyncContent
      isLoading={isLoading}
      error={isError ? error : null}
      loadingLabel="Loading dashboard stats…"
      variant="dashboard"
      onRetry={refetch}
    >
      <Container sx={{ py: { xs: 3, md: 4 } }}>
        <AdminReveal sx={{ mb: 3 }}>
          <Typography
            variant="h4"
            component="h1"
            fontWeight={800}
            letterSpacing="-0.03em"
          >
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Your community at a glance.
          </Typography>
        </AdminReveal>

        <AdminReveal
          component={Paper}
          elevation={0}
          delay={0.05}
          sx={{ ...surfaceSx, p: { xs: 2, md: 3 }, mb: 3 }}
        >
          <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
            <AdminPanelSettingsIcon
              sx={{ fontSize: { xs: "2rem", sm: "2.5rem" } }}
              aria-hidden="true"
            />
            <SearchField
              placeholder="Search…"
              aria-label="Search admin portal"
              sx={{
                width: "100%",
                minWidth: 0,
                px: { xs: 2, sm: 3 },
                transition: "box-shadow 0.2s ease",
                "&:focus-visible": {
                  boxShadow: "0 0 0 3px rgba(79, 172, 254, 0.4)",
                },
              }}
            />
            <MotionCurveButton
              whileHover={reducedMotion ? undefined : { scale: 1.03 }}
              whileTap={reducedMotion ? undefined : { scale: 0.96 }}
              sx={{
                px: { xs: 2, sm: 3 },
                "&:focus-visible": {
                  outline: "3px solid #4facfe",
                  outlineOffset: 3,
                },
              }}
            >
              Search
            </MotionCurveButton>
            <motion.span
              whileHover={
                reducedMotion ? undefined : { rotate: [0, -12, 12, -6, 0] }
              }
              transition={{ duration: 0.4 }}
              style={{ display: "inline-flex" }}
              aria-hidden="true"
            >
              <NotificationsIcon />
            </motion.span>
          </Stack>
          <Typography
            variant="body2"
            color="text.secondary"
            textAlign="center"
            sx={{ mt: 2, fontVariantNumeric: "tabular-nums" }}
          >
            <Clock />
          </Typography>
        </AdminReveal>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            gap: 2,
            mb: 3,
          }}
        >
          <Widget
            title="Total Users"
            value={stats?.totalUsers || 0}
            Icon={PersonIcon}
            accent="#2694ab"
            delay={0.1}
          />
          <Widget
            title="Total Chats"
            value={stats?.totalChats || 0}
            Icon={GroupIcon}
            accent="#4b0cc0"
            delay={0.16}
          />
          <Widget
            title="Total Messages"
            value={stats?.totalMessages || 0}
            Icon={MessageIcon}
            accent="#df755b"
            delay={0.22}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: "minmax(0, 1.6fr) minmax(0, 1fr)",
            },
            gap: 3,
            alignItems: "stretch",
          }}
        >
          <AdminReveal
            component={Paper}
            elevation={0}
            delay={0.28}
            lift
            sx={{ ...surfaceSx, p: { xs: 2, sm: 3 }, minWidth: 0 }}
          >
            <Typography
              variant="h6"
              component="h2"
              fontWeight={700}
              sx={{ mb: 3 }}
            >
              Last Messages
            </Typography>
            <LineChart value={stats?.last7DaysMessages || []} />
          </AdminReveal>
          <AdminReveal
            component={Paper}
            elevation={0}
            delay={0.34}
            lift
            sx={{ ...surfaceSx, p: 3, minWidth: 0 }}
          >
            <Typography
              variant="h6"
              component="h2"
              fontWeight={700}
              sx={{ mb: 2 }}
            >
              Chat Overview
            </Typography>
            <Box sx={{ position: "relative", maxWidth: "20rem", mx: "auto" }}>
              <DoughnutChart
                labels={["Single Chats", "Group Chats"]}
                value={[
                  stats?.singleChatCount || 0,
                  stats?.groupChatCount || 0,
                ]}
              />
              <Stack
                direction="row"
                justifyContent="center"
                alignItems="center"
                spacing={0.5}
                sx={{ position: "absolute", inset: 0, pointerEvents: "none" }}
                aria-hidden="true"
              >
                <GroupIcon />
                <Typography>Vs</Typography>
                <PersonIcon />
              </Stack>
            </Box>
          </AdminReveal>
        </Box>
      </Container>
    </AdminAsyncContent>
  );
}
