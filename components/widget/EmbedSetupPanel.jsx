"use client";

import {
  Box,
  Button,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  WIDGET_POSITIONS,
  WIDGET_DEFAULTS,
  buildScriptSnippet,
  buildIframeSnippet,
  sanitizeWidgetSettings,
} from "../../lib/widgetConfig";

const POSITION_LABELS = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
  "bottom-center": "Bottom center",
};

export default function EmbedSetupPanel({ username }) {
  const [settings, setSettings] = useState({ ...WIDGET_DEFAULTS });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!username) return;
    let mounted = true;
    (async () => {
      try {
        const { data } = await axios.get("/api/v1/widget/settings", {
          params: { username },
        });
        if (mounted && data?.success) {
          setSettings(sanitizeWidgetSettings(data.settings));
        }
      } catch {
        // keep defaults
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [username]);

  const set = (key) => (e) => {
    const value = e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
    setSettings((prev) => sanitizeWidgetSettings({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await axios.put("/api/v1/widget/settings", {
        username,
        settings,
      });
      if (data?.success) {
        setSettings(sanitizeWidgetSettings(data.settings));
        toast.success("Widget settings saved");
      } else {
        toast.error("Failed to save widget settings");
      }
    } catch {
      toast.error("Failed to save widget settings");
    } finally {
      setSaving(false);
    }
  };

  const scriptSnippet = useMemo(
    () => buildScriptSnippet({ origin: origin || "", username, settings }),
    [origin, username, settings]
  );
  const iframeSnippet = useMemo(
    () => buildIframeSnippet({ origin: origin || "", username, settings }),
    [origin, username, settings]
  );

  const copyText = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy failed — select the text manually");
    }
  };

  const previewBubblePos = useMemo(() => {
    switch (settings.position) {
      case "top-left":
        return { top: 12, left: 12 };
      case "top-right":
        return { top: 12, right: 12 };
      case "bottom-left":
        return { bottom: 12, left: 12 };
      case "bottom-center":
        return { bottom: 12, left: "50%", transform: "translateX(-50%)" };
      default:
        return { bottom: 12, right: 12 };
    }
  }, [settings.position]);

  if (loading) {
    return (
      <Paper elevation={3} sx={{ p: 2, borderRadius: "16px" }}>
        <Typography color="text.secondary">Loading embed settings…</Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={4} sx={{ p: { xs: 2, sm: 3 }, borderRadius: "16px", mt: 3 }}>
      <Typography variant="h6" fontWeight={700}>
        Embed on your website
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Add one small snippet to any site. Visitors get a floating feedback dialog — replies land on your board
        (@{username}) as priority questions.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Button position
              </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                {WIDGET_POSITIONS.map((pos) => (
                  <Button
                    key={pos}
                    size="small"
                    variant={settings.position === pos ? "contained" : "outlined"}
                    onClick={() => setSettings((p) => ({ ...p, position: pos }))}
                  >
                    {POSITION_LABELS[pos]}
                  </Button>
                ))}
              </Box>
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              {[
                { key: "themeColor", label: "Button color" },
                { key: "backgroundColor", label: "Dialog bg" },
                { key: "textColor", label: "Text color" },
              ].map(({ key, label }) => (
                <Box key={key} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(settings[key]) ? settings[key] : "#4facfe"}
                    onChange={(e) => setSettings((p) => ({ ...p, [key]: e.target.value }))}
                    style={{ width: 36, height: 28, border: 0, padding: 0, background: "none" }}
                    aria-label={label}
                  />
                  <TextField
                    size="small"
                    label={label}
                    value={settings[key]}
                    onChange={set(key)}
                    sx={{ width: 130 }}
                  />
                </Box>
              ))}
            </Box>

            <TextField size="small" fullWidth label="Dialog title" value={settings.title} onChange={set("title")} />
            <TextField size="small" fullWidth label="Subtitle" value={settings.subtitle} onChange={set("subtitle")} />
            <TextField
              size="small"
              fullWidth
              label="Input placeholder"
              value={settings.placeholder}
              onChange={set("placeholder")}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField size="small" fullWidth label="Send button text" value={settings.buttonText} onChange={set("buttonText")} />
              <TextField size="small" label="Bubble icon" value={settings.bubbleLabel} onChange={set("bubbleLabel")} sx={{ width: 130 }} />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField size="small" select label="Bubble shape" value={settings.shape} onChange={set("shape")} sx={{ minWidth: 140 }}>
                <MenuItem value="round">Round</MenuItem>
                <MenuItem value="square">Square</MenuItem>
                <MenuItem value="pill">Pill</MenuItem>
              </TextField>
              <TextField size="small" select label="Size" value={settings.size} onChange={set("size")} sx={{ minWidth: 120 }}>
                <MenuItem value="sm">Small</MenuItem>
                <MenuItem value="md">Medium</MenuItem>
                <MenuItem value="lg">Large</MenuItem>
              </TextField>
              <TextField
                size="small"
                type="number"
                label="Auto-open (sec, 0=off)"
                value={settings.autoOpenDelay}
                onChange={set("autoOpenDelay")}
                inputProps={{ min: 0, max: 120 }}
                sx={{ width: 170 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <FormControlLabel
                control={<Switch checked={settings.showSuggestions} onChange={set("showSuggestions")} />}
                label="Show suggestions"
              />
              <FormControlLabel
                control={<Switch checked={settings.enabled} onChange={set("enabled")} />}
                label="Widget enabled"
              />
            </Box>

            <Button variant="contained" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save widget settings"}
            </Button>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Live preview
          </Typography>
          <Box
            sx={{
              position: "relative",
              height: 300,
              borderRadius: 3,
              border: "1px dashed",
              borderColor: "divider",
              bgcolor: "#f6f6fb",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", inset: 0, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                your-website.com
              </Typography>
              <Box sx={{ mt: 1, height: 10, borderRadius: 5, bgcolor: "grey.200", width: "70%" }} />
              <Box sx={{ mt: 1, height: 10, borderRadius: 5, bgcolor: "grey.200", width: "50%" }} />
            </Box>
            <Box
              sx={{
                position: "absolute",
                width: settings.size === "lg" ? 64 : settings.size === "sm" ? 48 : 56,
                height: settings.size === "lg" ? 64 : settings.size === "sm" ? 48 : 56,
                borderRadius: settings.shape === "pill" ? 999 : settings.shape === "square" ? 3 : "50%",
                bgcolor: settings.themeColor,
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                boxShadow: 3,
                ...previewBubblePos,
              }}
            >
              {settings.bubbleLabel}
            </Box>
            <Box
              sx={{
                position: "absolute",
                left: "50%",
                transform: "translateX(-50%)",
                bottom: settings.position.startsWith("top") ? undefined : 70,
                top: settings.position.startsWith("top") ? 70 : undefined,
                width: "min(280px, 80%)",
                bgcolor: settings.backgroundColor,
                color: settings.textColor,
                borderRadius: 3,
                boxShadow: 4,
                p: 1.5,
              }}
            >
              <Typography variant="subtitle2" fontWeight={700}>
                {settings.title}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.65, display: "block", mb: 1 }}>
                {settings.subtitle}
              </Typography>
              <Box
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1,
                  mb: 1,
                  fontSize: 12,
                  opacity: 0.8,
                }}
              >
                {settings.placeholder}
              </Box>
              <Box
                sx={{
                  textAlign: "center",
                  borderRadius: settings.shape === "pill" ? 999 : 2,
                  bgcolor: settings.themeColor,
                  color: "#fff",
                  py: 0.75,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {settings.buttonText}
              </Box>
            </Box>
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Option 1 — Floating dialog (recommended)
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#0f0f1a", color: "#d7ff8b" }}>
            <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0 }}>
              {scriptSnippet}
            </Typography>
          </Paper>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button size="small" variant="outlined" onClick={() => copyText(scriptSnippet, "Script snippet")}>
              Copy script
            </Button>
            <Button size="small" variant="text" href={`/embed/${(username || "").toLowerCase()}`} target="_blank">
              Open demo page
            </Button>
          </Box>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
            Option 2 — Inline iframe
          </Typography>
          <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#0f0f1a", color: "#ffd88b" }}>
            <Typography variant="caption" component="pre" sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0 }}>
              {iframeSnippet}
            </Typography>
          </Paper>
          <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
            <Button size="small" variant="outlined" onClick={() => copyText(iframeSnippet, "Iframe snippet")}>
              Copy iframe
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
            Responses appear on your board in Priority Questions + chat, same as direct /u/{username} messages.
          </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
}
