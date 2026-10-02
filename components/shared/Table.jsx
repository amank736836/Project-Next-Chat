"use client";

import { useEffect, useState } from "react";
import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { motion } from "framer-motion";
import { AdminReveal, AnimatedCounter } from "../animations/AdminMotion";
import { EASE_OUT_EXPO } from "../animations/motionConfig";
import useReducedMotionSafe from "../animations/useReducedMotionSafe";

const rowDelays = Object.fromEntries(
  Array.from({ length: 8 }, (_, index) => [
    `&.admin-table-entering .admin-row-${index}`,
    { animationDelay: `${index * 30}ms` },
  ]),
);

export default function Table({ rows, columns, headings, rowHeight = 52 }) {
  const reducedMotion = useReducedMotionSafe();
  const [rowEntranceKey, setRowEntranceKey] = useState(0);
  const [rowsEntering, setRowsEntering] = useState(true);
  const replayRowEntrance = () => setRowEntranceKey((key) => key + 1);

  useEffect(() => {
    setRowsEntering(!reducedMotion);
    if (reducedMotion) return;

    // Only animate during page/sort/filter changes, not every recycled row as
    // the virtualised grid scrolls. Opacity leaves DataGrid transforms intact.
    const timeout = setTimeout(() => setRowsEntering(false), 650);
    return () => clearTimeout(timeout);
  }, [reducedMotion, rowEntranceKey, rows]);

  return (
    <Container
      sx={{
        height: { xs: "calc(100dvh - 4.5rem)", md: "100dvh" },
        minHeight: 480,
        py: { xs: 2, md: 4 },
      }}
    >
      <AdminReveal
        component={Paper}
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3, lg: 4 },
          borderRadius: "1.25rem",
          border: "1px solid rgba(15, 23, 42, 0.06)",
          boxShadow: "0 12px 32px -18px rgba(15, 23, 42, 0.2)",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 3, gap: 2 }}
        >
          <Box>
            <Typography
              component="h1"
              variant="h4"
              fontWeight={800}
              sx={{
                letterSpacing: "-0.03em",
                fontSize: { xs: "1.65rem", sm: "2rem" },
              }}
            >
              {headings}
            </Typography>
            <motion.div
              aria-hidden="true"
              initial={reducedMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.5,
                delay: reducedMotion ? 0 : 0.15,
                ease: EASE_OUT_EXPO,
              }}
              style={{
                height: 3,
                width: 56,
                marginTop: 10,
                borderRadius: 4,
                transformOrigin: "left",
                background: "linear-gradient(90deg, #4facfe, #00c6ff, #ff7e5f)",
              }}
            />
          </Box>
          <Typography
            component="div"
            variant="body2"
            color="text.secondary"
            sx={{
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              bgcolor: "#f7f7f7",
              whiteSpace: "nowrap",
            }}
          >
            <AnimatedCounter value={rows.length} />{" "}
            {rows.length === 1 ? "record" : "records"}
          </Typography>
        </Stack>

        <DataGrid
          className={rowsEntering ? "admin-table-entering" : undefined}
          aria-label={headings}
          rows={rows}
          columns={columns}
          rowHeight={rowHeight}
          getRowClassName={(params) =>
            `admin-table-row admin-row-${Math.min(params.indexRelativeToCurrentPage, 7)}`
          }
          onPaginationModelChange={replayRowEntrance}
          onSortModelChange={replayRowEntrance}
          onFilterModelChange={replayRowEntrance}
          sx={{
            flex: 1,
            minHeight: 0,
            border: "none",
            ".table-header": { bgcolor: "#f7f7f7", color: "black" },
            "& .MuiDataGrid-row": { transition: "background-color 0.18s ease" },
            "& .MuiAvatar-root": { transition: "transform 0.2s ease" },
            "& .MuiDataGrid-row:hover .MuiAvatar-root": {
              transform: "scale(1.06)",
            },
            "&.admin-table-entering .admin-table-row": {
              animation: "adminRowReveal 0.35s ease-out both",
            },
            ...rowDelays,
            "@media (prefers-reduced-motion: reduce)": {
              "& .admin-table-row": { animation: "none" },
              "& .MuiDataGrid-row:hover .MuiAvatar-root": { transform: "none" },
            },
          }}
        />
      </AdminReveal>
    </Container>
  );
}
