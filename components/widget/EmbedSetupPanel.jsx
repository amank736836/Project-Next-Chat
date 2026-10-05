"use client";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  Skeleton,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import {
  CodeRounded,
  LanguageRounded,
  PaletteOutlined,
} from "@mui/icons-material";
import { boardSurfaceSx } from "../board/BoardSurface";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [origin, setOrigin] = useState("");
  const [siteInput, setSiteInput] = useState("");
  const [primarySite, setPrimarySite] = useState("");

  const addSite = useCallback(() => {
    const cleaned = siteInput.trim().toLowerCase();
    if (!cleaned) return;
    setSettings((prev) => {
      const next = sanitizeWidgetSettings({
        ...prev,
        sites: [...(prev.sites || []), cleaned],
      });
      if (next.sites.length > (prev.sites || []).length) {
        setPrimarySite(
          (current) => current || next.sites[next.sites.length - 1],
        );
      } else {
        toast.error("That doesn't look like a valid hostname");
      }
      return next;
    });
    setSiteInput("");
  }, [siteInput]);

  const removeSite = useCallback((site) => {
    setSettings((prev) =>
      sanitizeWidgetSettings({
        ...prev,
        sites: (prev.sites || []).filter((s) => s !== site),
      }),
    );
    setPrimarySite((current) => (current === site ? "" : current));
  }, []);

  useEffect(() => {
    if (!primarySite && settings.sites.length > 0) {
      setPrimarySite(settings.sites[0]);
    }
    if (primarySite && !settings.sites.includes(primarySite)) {
      setPrimarySite(settings.sites[0] || "");
    }
  }, [settings.sites, primarySite]);

  useEffect(() => {
    setOrigin(window.location.origin);
    if (!username) return;
    let mounted = true;
    setLoading(true);
    setLoadError(false);
    (async () => {
      try {
        const { data } = await axios.get("/api/v1/widget/settings", {
          params: { username },
        });
        if (mounted && data?.success) {
          setSettings(sanitizeWidgetSettings(data.settings));
        } else if (mounted) {
          setLoadError(true);
        }
      } catch {
        if (mounted) setLoadError(true);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [username, reloadKey]);

  const set = (key) => (e) => {
    const value =
      e?.target?.type === "checkbox" ? e.target.checked : e.target.value;
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
    [origin, username, settings],
  );
  const iframeSnippet = useMemo(
    () => buildIframeSnippet({ origin: origin || "", username, settings }),
    [origin, username, settings],
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
      <Stack spacing={2} role="status" aria-label="Loading embed settings">
        <Skeleton variant="rounded" height={80} />
        <Skeleton variant="rounded" height={300} />
      </Stack>
    );
  }

  if (loadError)
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            onClick={() => setReloadKey((key) => key + 1)}
          >
            Retry
          </Button>
        }
      >
        Couldn't load your widget settings. Try again before making changes.
      </Alert>
    );

  return (
    <Paper
      elevation={0}
      sx={{ ...boardSurfaceSx, p: { xs: 2.5, sm: 3 }, minWidth: 0 }}
    >
      <Stack direction="row" gap={1.5} alignItems="center" sx={{ mb: 1 }}>
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            p: 1,
            bgcolor: "#edf1ff",
            color: "primary.main",
            borderRadius: 2,
          }}
        >
          <CodeRounded />
        </Box>
        <Typography component="h2" variant="h6" fontWeight={700}>
          Take your board with you
        </Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        First tell us which website(s) you will paste the snippet on — responses
        get tagged per site. One snippet works on all of them.
      </Typography>

      <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 3, mb: 2 }}>
        <LanguageRounded fontSize="small" color="primary" />
        <Typography component="h3" fontWeight={650} fontSize={14}>
          01 · Connect your websites
        </Typography>
      </Stack>
      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
        <TextField
          size="small"
          label="Website hostname (e.g. myblog.com)"
          value={siteInput}
          onChange={(e) => setSiteInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSite();
            }
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <Button
          variant="contained"
          onClick={addSite}
          disabled={!siteInput.trim()}
        >
          Add site
        </Button>
      </Box>
      {settings.sites.length > 0 ? (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
          {settings.sites.map((site) => (
            <Chip
              key={site}
              label={site}
              sx={{ maxWidth: "100%" }}
              color={primarySite === site ? "primary" : "default"}
              onClick={() => setPrimarySite(site)}
              onDelete={() => removeSite(site)}
            />
          ))}
        </Box>
      ) : (
        <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
          Add at least one website above to unlock your embed snippets.
        </Typography>
      )}

      <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 4, mb: 2 }}>
        <PaletteOutlined fontSize="small" color="primary" />
        <Typography component="h3" fontWeight={650} fontSize={14}>
          02 · Make it feel like you
        </Typography>
      </Stack>
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
                    variant={
                      settings.position === pos ? "contained" : "outlined"
                    }
                    onClick={() =>
                      setSettings((p) => ({ ...p, position: pos }))
                    }
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
                <Box
                  key={key}
                  sx={{ display: "flex", alignItems: "center", gap: 1 }}
                >
                  <input
                    type="color"
                    value={
                      /^#[0-9a-fA-F]{6}$/.test(settings[key])
                        ? settings[key]
                        : "#4facfe"
                    }
                    onChange={(e) =>
                      setSettings((p) => ({ ...p, [key]: e.target.value }))
                    }
                    style={{
                      width: 36,
                      height: 28,
                      border: 0,
                      padding: 0,
                      background: "none",
                    }}
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

            <TextField
              size="small"
              fullWidth
              label="Dialog title"
              value={settings.title}
              onChange={set("title")}
            />
            <TextField
              size="small"
              fullWidth
              label="Subtitle"
              value={settings.subtitle}
              onChange={set("subtitle")}
            />
            <TextField
              size="small"
              fullWidth
              label="Input placeholder"
              value={settings.placeholder}
              onChange={set("placeholder")}
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                size="small"
                fullWidth
                label="Send button text"
                value={settings.buttonText}
                onChange={set("buttonText")}
              />
              <TextField
                size="small"
                label="Bubble icon"
                value={settings.bubbleLabel}
                onChange={set("bubbleLabel")}
                sx={{ width: 130 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
              <TextField
                size="small"
                select
                label="Bubble shape"
                value={settings.shape}
                onChange={set("shape")}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value="round">Round</MenuItem>
                <MenuItem value="square">Square</MenuItem>
                <MenuItem value="pill">Pill</MenuItem>
              </TextField>
              <TextField
                size="small"
                select
                label="Size"
                value={settings.size}
                onChange={set("size")}
                sx={{ minWidth: 120 }}
              >
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
                control={
                  <Switch
                    checked={settings.showSuggestions}
                    onChange={set("showSuggestions")}
                  />
                }
                label="Show suggestions"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enabled}
                    onChange={set("enabled")}
                  />
                }
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
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "#f5f7fb",
              overflow: "hidden",
            }}
          >
            <Box sx={{ position: "absolute", inset: 0, p: 2 }}>
              <Typography variant="caption" color="text.secondary">
                your-website.com
              </Typography>
              <Box
                sx={{
                  mt: 1,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "grey.200",
                  width: "70%",
                }}
              />
              <Box
                sx={{
                  mt: 1,
                  height: 10,
                  borderRadius: 5,
                  bgcolor: "grey.200",
                  width: "50%",
                }}
              />
            </Box>
            <Box
              sx={{
                position: "absolute",
                width:
                  settings.size === "lg"
                    ? 64
                    : settings.size === "sm"
                      ? 48
                      : 56,
                height:
                  settings.size === "lg"
                    ? 64
                    : settings.size === "sm"
                      ? 48
                      : 56,
                borderRadius:
                  settings.shape === "pill"
                    ? 999
                    : settings.shape === "square"
                      ? 3
                      : "50%",
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
              <Typography
                variant="caption"
                sx={{ opacity: 0.65, display: "block", mb: 1 }}
              >
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

          {settings.sites.length === 0 ? (
            <Paper
              variant="outlined"
              sx={{ p: 2, mt: 2, borderRadius: 2, bgcolor: "#fafafa" }}
            >
              <Typography variant="body2" color="text.secondary">
                Your snippets will appear here once you add your first website
                above. Save settings to keep the site list.
              </Typography>
            </Paper>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                03 · Install your widget — Floating dialog
                {primarySite ? ` · for ${primarySite}` : ""}
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  bgcolor: "#202b45",
                  color: "#c7e8df",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0 }}
                >
                  {scriptSnippet}
                </Typography>
              </Paper>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => copyText(scriptSnippet, "Script snippet")}
                >
                  Copy script
                </Button>
                <Button
                  size="small"
                  variant="text"
                  href={`/embed/${(username || "").toLowerCase()}`}
                  target="_blank"
                >
                  Open demo page
                </Button>
              </Box>

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Option 2 — Inline iframe
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  bgcolor: "#202b45",
                  color: "#d5dfff",
                  borderRadius: 2,
                }}
              >
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ whiteSpace: "pre-wrap", wordBreak: "break-all", m: 0 }}
                >
                  {iframeSnippet}
                </Typography>
              </Paper>
              <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => copyText(iframeSnippet, "Iframe snippet")}
                >
                  Copy iframe
                </Button>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 1 }}
              >
                Responses appear on your board in Priority Questions + chat,
                same as direct /u/{username} messages.
                {primarySite
                  ? ` This snippet auto-tags responses from ${primarySite} — the same snippet works on your other sites too.`
                  : ""}
              </Typography>
              <Button
                size="small"
                variant="text"
                href={`/showcase/${(username || "").toLowerCase()}${primarySite ? `?host=${encodeURIComponent(primarySite)}` : ""}`}
                target="_blank"
                sx={{ mt: 1 }}
              >
                Open public showcase
                {primarySite
                  ? ` for ${primarySite}`
                  : " (filterable per website)"}
              </Button>
            </>
          )}
        </Grid>
      </Grid>
    </Paper>
  );
}
