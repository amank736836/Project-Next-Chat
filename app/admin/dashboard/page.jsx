"use client";

import {
  Group as GroupIcon,
  Message as MessageIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { Box, Button, Container, Paper, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { ArrowForwardRounded, RefreshRounded } from "@mui/icons-material";
import moment from "moment";
import { useEffect, useState } from "react";
import {
  AdminReveal,
  AnimatedCounter,
} from "../../../components/animations/AdminMotion";

import AdminAsyncContent from "../../../components/layout/AdminAsyncContent";
import { useErrors } from "../../../hooks/useHooks";
import { useGetDashboardStatsQuery } from "../../../redux/api/api";
import { DoughnutChart, LineChart } from "../../../specific/Charts";

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

function Widget({ title, value, Icon, delay, accent, href }) {
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
            background: `color-mix(in srgb, ${accent} 9%, transparent)`,
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
            fontWeight={600}
          >
            <AnimatedCounter value={value} />
          </Typography>
        </Box>
      </Stack>
      <Button component={Link} href={href} endIcon={<ArrowForwardRounded fontSize="small" />} size="small" sx={{ mt: 2, px: 0, color: accent }}>View details</Button>
    </AdminReveal>
  );
}

export default function Dashboard() {
  const { data, isLoading, isFetching, isError, error, refetch } =
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
            fontWeight={600}
            letterSpacing="-0.03em"
          >
            Dashboard
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Your community at a glance.
          </Typography>
        </AdminReveal>

        <AdminReveal component={Paper} elevation={0} delay={0.05}
          sx={{ ...surfaceSx, p: { xs: 3, md: 4 }, mb: 3, background: "linear-gradient(110deg, var(--champ-surface), var(--champ-soft))", color: "var(--champ-ink)", overflow: "hidden", position: "relative" }}>
          <Box aria-hidden="true" sx={{ position: "absolute", right: -35, top: -65, width: 240, height: 240, borderRadius: "50%", border: "35px solid var(--champ-mint)" }} />
          <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} gap={3} sx={{ position: "relative" }}>
            <Box><Typography variant="overline" sx={{ letterSpacing: ".15em", color: "var(--champ-muted)" }}>COMMUNITY OVERVIEW</Typography><Typography variant="h5" sx={{ mt: .5 }}>Small conversations. Big connections.</Typography><Typography variant="body2" sx={{ mt: 1, color: "var(--champ-muted)" }}>Keep a pulse on your community, all from one place.</Typography></Box>
            <Button variant="outlined" onClick={refetch} disabled={isFetching} startIcon={<RefreshRounded />} sx={{ color: "var(--champ-ink)", borderColor: "var(--champ-border)", flexShrink: 0, "&.Mui-disabled": { color: "var(--champ-muted)" } }}>{isFetching ? "Refreshing…" : "Refresh overview"}</Button>
          </Stack>
          <Typography variant="caption" sx={{ display: "block", mt: 3, color: "var(--champ-muted)", fontVariantNumeric: "tabular-nums" }}><Clock /></Typography>
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
            href="/admin/users"
            title="Total Users"
            value={stats?.totalUsers || 0}
            Icon={PersonIcon}
            accent="var(--champ-primary)"
            delay={0.1}
          />
          <Widget
            href="/admin/chats"
            title="Total Chats"
            value={stats?.totalChats || 0}
            Icon={GroupIcon}
            accent="var(--champ-sage)"
            delay={0.16}
          />
          <Widget
            href="/admin/messages"
            title="Total Messages"
            value={stats?.totalMessages || 0}
            Icon={MessageIcon}
            accent="var(--champ-warm)"
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
              Message activity
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: -2, mb: 3 }}>Conversations over the last 7 days</Typography>
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
