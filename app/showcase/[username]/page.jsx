"use client";

import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import axios from "axios";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { gradientBg } from "../../../constants/color";

const esc = (v = '') => String(v ?? '');

function ShowcaseContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const username = (params.username || "").toLowerCase();

  const [hostFilter, setHostFilter] = useState(searchParams.get("host") || "");
  const [answered, setAnswered] = useState([]);
  const [availableHosts, setAvailableHosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchShowcase = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const { data } = await axios.get("/api/v1/chat/questions", {
        params: {
          username,
          ...(hostFilter ? { host: hostFilter } : {}),
        },
      });
      if (data?.success) {
        setAnswered(data.answered || []);
        if (Array.isArray(data.availableHosts)) {
          setAvailableHosts((prev) => [...new Set([...prev, ...data.availableHosts])]);
        }
      }
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, [username, hostFilter]);

  useEffect(() => {
    fetchShowcase();
  }, [fetchShowcase]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: gradientBg,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: { xs: "0.75rem", sm: "2rem" },
      }}
    >
      <Box sx={{ width: "100%", maxWidth: 720 }}>
        <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", mb: 2 }}>
          <Typography variant="h5" align="center" fontWeight={700}>
            @{esc(username)} — Answer Showcase
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 0.5 }}>
            Answered questions{hostFilter ? ` from ${esc(hostFilter)}` : " from every website"}
          </Typography>
          {availableHosts.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center", mt: 2 }}>
              <Chip
                label="All websites"
                clickable
                color={hostFilter === "" ? "primary" : "default"}
                onClick={() => setHostFilter("")}
              />
              {availableHosts.map((host) => (
                <Chip
                  key={host}
                  label={esc(host)}
                  clickable
                  color={hostFilter === host ? "primary" : "default"}
                  onClick={() => setHostFilter(host)}
                />
              ))}
            </Box>
          )}
        </Paper>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : answered.length > 0 ? (
          <Stack spacing={1.5}>
            {answered.map((item) => (
              <Paper key={item.id} elevation={3} sx={{ p: 2, borderRadius: "16px" }}>
                <Typography variant="caption" color="text.secondary">
                  Question{item.hosts?.length > 0 ? ` · ${item.hosts.map(esc).join(", ")}` : ""}
                </Typography>
                <Typography fontWeight={600}>{esc(item.question)}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  Answer
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {esc(item.answer)}
                </Typography>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Paper elevation={2} sx={{ p: 3, borderRadius: "16px", textAlign: "center" }}>
            <Typography color="text.secondary">No answered questions yet</Typography>
            <Button href={`/u/${username}`} variant="outlined" sx={{ mt: 2 }}>
              Ask @{esc(username)} a question
            </Button>
          </Paper>
        )}
      </Box>
    </Box>
  );
}

export default function ShowcasePage() {
  return (
    <Suspense>
      <ShowcaseContent />
    </Suspense>
  );
}
