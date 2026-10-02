"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { io } from "socket.io-client";
import { socketBackend, socketServer } from "../../../constants/config";

const STATUS_META = {
  idle: { label: "Idle", color: "default" },
  connecting: { label: "Connecting…", color: "warning" },
  connected: { label: "Connected", color: "success" },
  error: { label: "Failed", color: "error" },
  disconnected: { label: "Disconnected", color: "default" },
};

const TRANSPORT_OPTIONS = [
  { value: "default", label: "Auto (polling → websocket)" },
  { value: "websocket", label: "WebSocket only" },
  { value: "polling", label: "HTTP long-polling only" },
];

const stamp = () =>
  new Date().toLocaleTimeString(undefined, {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

/**
 * Live socket.io test bench: connects to the configured backend, streams every
 * engine/socket event into a log and reports handshake metadata (transport,
 * sid, time-to-connect, heartbeats).
 */
export default function SocketPlayground() {
  const socketRef = useRef(null);
  const startedAtRef = useRef(0);
  const logIdRef = useRef(0);

  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [meta, setMeta] = useState({
    connectMs: null,
    transport: null,
    socketId: null,
    engineSid: null,
    heartbeats: 0,
    pingInterval: null,
  });

  const [token, setToken] = useState("");
  const [transportMode, setTransportMode] = useState("default");
  const [withCredentials, setWithCredentials] = useState(true);

  const addLog = useCallback((level, message) => {
    logIdRef.current += 1;
    const entry = {
      id: logIdRef.current,
      at: stamp(),
      level,
      message,
    };
    setLogs((previous) => [...previous.slice(-199), entry]);
  }, []);

  const disconnect = useCallback(() => {
    const instance = socketRef.current;
    socketRef.current = null;
    if (instance) {
      instance.removeAllListeners();
      instance.io?.removeAllListeners?.();
      instance.io?.engine?.removeAllListeners?.();
      instance.disconnect();
      addLog("info", "Socket disconnected by user");
    }
    setStatus((current) => (current === "error" ? current : "disconnected"));
  }, [addLog]);

  const connect = useCallback(() => {
    if (!socketServer) {
      addLog("error", "NEXT_PUBLIC_SOCKET_SERVER_URL is not set");
      setStatus("error");
      return;
    }

    disconnect();

    const options = {
      withCredentials,
      reconnectionAttempts: 3,
      timeout: 15000,
    };
    if (transportMode !== "default") options.transports = [transportMode];

    const trimmedToken = token.trim();
    if (trimmedToken) {
      // Cover both handshake shapes backends tend to accept.
      options.auth = { token: trimmedToken };
      options.query = { token: trimmedToken };
    }

    setStatus("connecting");
    setMeta({
      connectMs: null,
      transport: null,
      socketId: null,
      engineSid: null,
      heartbeats: 0,
      pingInterval: null,
    });
    startedAtRef.current = performance.now();
    addLog(
      "info",
      `Connecting to ${socketServer} · transport=${transportMode} · credentials=${withCredentials}${
        trimmedToken ? " · token=provided" : ""
      }`
    );

    const instance = io(socketServer, options);
    socketRef.current = instance;

    instance.on("connect", () => {
      const elapsed = Math.round(performance.now() - startedAtRef.current);
      setStatus("connected");
      setMeta((previous) => ({
        ...previous,
        connectMs: elapsed,
        socketId: instance.id,
        engineSid: instance.io?.engine?.id ?? null,
        transport: instance.io?.engine?.transport?.name ?? null,
        pingInterval: instance.io?.engine?.opts?.pingInterval ?? null,
      }));
      addLog("success", `Connected as ${instance.id} in ${elapsed}ms`);
    });

    instance.on("connect_error", (error) => {
      setStatus("error");
      addLog("error", `connect_error: ${error?.message || error}`);
      if (String(error?.message || "").includes("Please Login")) {
        addLog(
          "warn",
          "Backend rejected the handshake (auth). It expects a session cookie/token it can verify — see the notes below."
        );
      }
    });

    instance.on("disconnect", (reason) => {
      setStatus("disconnected");
      addLog("warn", `Disconnected: ${reason}`);
    });

    instance.io?.on?.("reconnect_attempt", (attempt) => {
      addLog("warn", `Reconnection attempt ${attempt}`);
    });

    instance.io?.on?.("reconnect_failed", () => {
      setStatus("error");
      addLog("error", "Reconnection failed after all attempts");
    });

    const engine = instance.io?.engine;
    engine?.on?.("heartbeat", () => {
      setMeta((previous) => ({
        ...previous,
        heartbeats: previous.heartbeats + 1,
      }));
    });
    engine?.on?.("upgrade", (transport) => {
      setMeta((previous) => ({ ...previous, transport: transport?.name }));
      addLog("success", `Transport upgraded to ${transport?.name}`);
    });
    engine?.on?.("close", (reason) => {
      addLog("warn", `Engine closed: ${reason}`);
    });
  }, [addLog, disconnect, token, transportMode, withCredentials]);

  // Never leak a socket out of the page.
  useEffect(() => () => disconnect(), [disconnect]);

  const statusMeta = STATUS_META[status] || STATUS_META.idle;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f6f7fb", py: 4, px: 2 }}>
      <Stack spacing={2.5} sx={{ maxWidth: 860, mx: "auto" }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>
            Socket diagnostics
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Dev-only test bench for the realtime connection (this route 404s in
            production builds).
          </Typography>
        </Box>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
              <Typography variant="body2" sx={{ fontFamily: "monospace" }}>
                {socketServer || "⚠ no socket server configured"}
              </Typography>
            </Stack>

            {!socketServer ? (
              <Alert severity="error">
                <code>NEXT_PUBLIC_SOCKET_SERVER_URL</code> is empty. Set it in{" "}
                <code>.env.local</code> and restart the dev server.
              </Alert>
            ) : null}

            <Divider />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                label="Transport"
                size="small"
                value={transportMode}
                onChange={(event) => setTransportMode(event.target.value)}
                sx={{ minWidth: 240 }}
              >
                {TRANSPORT_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="JWT token (optional)"
                size="small"
                type="password"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                helperText="Sent as auth.token + query token for backends that accept it"
                sx={{ flex: 1 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Button variant="contained" onClick={connect} disabled={status === "connecting"}>
                Connect
              </Button>
              <Button variant="outlined" onClick={disconnect} color="inherit">
                Disconnect
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={() => setLogs([])}
                sx={{ ml: "auto" }}
              >
                Clear log
              </Button>
              <Button
                variant="text"
                color="inherit"
                onClick={() => setWithCredentials((value) => !value)}
              >
                credentials: {withCredentials ? "on" : "off"}
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Handshake
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip size="small" variant="outlined" label={`time to connect: ${meta.connectMs ?? "—"} ms`} />
            <Chip size="small" variant="outlined" label={`transport: ${meta.transport ?? "—"}`} />
            <Chip size="small" variant="outlined" label={`socket id: ${meta.socketId ?? "—"}`} />
            <Chip size="small" variant="outlined" label={`engine sid: ${meta.engineSid ?? "—"}`} />
            <Chip size="small" variant="outlined" label={`heartbeats: ${meta.heartbeats}`} />
            <Chip size="small" variant="outlined" label={`ping interval: ${meta.pingInterval ?? "—"} ms`} />
            <Chip size="small" variant="outlined" label={`REST base: ${socketBackend || "—"}`} />
          </Stack>
        </Paper>

        <Paper sx={{ p: 2.5, borderRadius: 3 }} elevation={0}>
          <Typography variant="subtitle2" fontWeight={700} gutterBottom>
            Event log
          </Typography>
          <Box
            sx={{
              maxHeight: 320,
              overflowY: "auto",
              bgcolor: "#10131a",
              color: "#e6e8ee",
              borderRadius: 2,
              p: 1.5,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 12.5,
              lineHeight: 1.7,
            }}
          >
            {logs.length === 0 ? (
              <Box sx={{ opacity: 0.6 }}>
                Waiting for events — press Connect.
              </Box>
            ) : (
              logs.map((entry) => (
                <Box key={entry.id} sx={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  <Box component="span" sx={{ opacity: 0.55 }}>
                    {entry.at}{" "}
                  </Box>
                  <Box
                    component="span"
                    sx={{
                      color:
                        entry.level === "error"
                          ? "#ff8f8f"
                          : entry.level === "warn"
                            ? "#ffd479"
                            : entry.level === "success"
                              ? "#7ee787"
                              : "#9ecbff",
                    }}
                  >
                    {entry.message}
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Paper>

        <Alert severity="info">
          <Typography variant="body2">
            <strong>What “Please Login” means:</strong> the backend verifies the
            handshake against its own session cookie. A cookie set by this Next
            app lives on the app&apos;s origin, so the browser will not send it
            to a different backend origin — paste a JWT the backend can verify
            into the token field above to test an authenticated connection.
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
}
