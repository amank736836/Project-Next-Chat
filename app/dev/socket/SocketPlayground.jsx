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
import {
  remoteAuthEnabled,
  socketBackend,
  socketServer,
} from "../../../constants/config";

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
 *
 * The "backend session" block logs in against the remote API from the browser,
 * which is what puts the session cookie on the backend's own origin — without
 * it the socket handshake is rejected with "Please Login".
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

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [session, setSession] = useState(null);

  const addLog = useCallback((level, message) => {
    logIdRef.current += 1;
    const entry = { id: logIdRef.current, at: stamp(), level, message };
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

    const options = { withCredentials, reconnectionAttempts: 3, timeout: 15000 };
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
          "Handshake rejected: the backend could not verify a session. Log in on the backend first (below) so its cookie is on its own origin."
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
      setMeta((previous) => ({ ...previous, heartbeats: previous.heartbeats + 1 }));
    });
    engine?.on?.("upgrade", (transport) => {
      setMeta((previous) => ({ ...previous, transport: transport?.name }));
      addLog("success", `Transport upgraded to ${transport?.name}`);
    });
    engine?.on?.("close", (reason) => {
      addLog("warn", `Engine closed: ${reason}`);
    });
  }, [addLog, disconnect, token, transportMode, withCredentials]);

  /**
   * Logs in against the remote backend from the browser, then verifies the
   * session with /user/me and opens the socket.
   */
  const loginOnBackend = useCallback(async () => {
    if (!socketBackend) {
      addLog("error", "No backend URL configured (NEXT_PUBLIC_SOCKET_SERVER_URL)");
      return;
    }
    const who = identifier.trim();
    if (!who || !password) {
      addLog("warn", "Enter both a username/email and a password");
      return;
    }

    setAuthBusy(true);
    addLog("info", `POST ${socketBackend}/user/login as "${who}"`);

    try {
      const response = await fetch(`${socketBackend}/user/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        // identifier for this repo's route, username/email for the MERN backend
        body: JSON.stringify({
          identifier: who,
          password,
          ...(who.includes("@") ? { email: who } : { username: who }),
        }),
      });

      const text = await response.text();
      let data = null;
      try {
        data = JSON.parse(text);
      } catch {
        /* non-JSON body, logged raw below */
      }

      addLog(
        response.ok ? "success" : "error",
        `login -> HTTP ${response.status} ${
          data?.message ? `· ${data.message}` : text ? `· ${text.slice(0, 160)}` : ""
        }`
      );

      if (!response.ok || !data) {
        setSession({ ok: false, status: response.status });
        return;
      }

      setSession({ ok: true, status: response.status, user: data.user || null });
      if (data.user?.name || data.user?.username) {
        addLog("success", `Session established for ${data.user.name || data.user.username}`);
      }

      // Confirm the cookie actually rides along on a follow-up request.
      try {
        const me = await fetch(`${socketBackend}/user/me`, { credentials: "include" });
        addLog(
          me.ok ? "success" : "warn",
          `GET /user/me -> HTTP ${me.ok ? 200 : me.status} ${
            me.ok ? "(cookie accepted by backend)" : "(cookie not accepted)"
          }`
        );
      } catch {
        addLog("warn", "GET /user/me blocked — see the CORS note above");
      }

      connect();
    } catch (error) {
      // fetch throws TypeError when the browser blocks the request (CORS/network)
      addLog("error", `login request failed: ${error?.message || error}`);
      addLog(
        "warn",
        `The browser blocked the call to ${socketServer}. The backend must allow this origin (${
          typeof window !== "undefined" ? window.location.origin : "the app origin"
        }) in its CORS config with credentials:true, and set its cookie SameSite=None; Secure.`
      );
      setSession({ ok: false, blocked: true });
    } finally {
      setAuthBusy(false);
    }
  }, [addLog, connect, identifier, password]);

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
            Dev-only test bench for the realtime connection (blocked in
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
              <Chip
                size="small"
                variant="outlined"
                color={remoteAuthEnabled ? "success" : "default"}
                label={remoteAuthEnabled ? "app auth → remote backend" : "app auth → local Next routes"}
              />
            </Stack>

            {!socketServer ? (
              <Alert severity="error">
                <code>NEXT_PUBLIC_SOCKET_SERVER_URL</code> is empty. Set it in{" "}
                <code>.env.local</code> and restart the dev server.
              </Alert>
            ) : null}

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>
              1 · Backend session
            </Typography>
            <Typography variant="caption" color="text.secondary">
              The socket server verifies the handshake against a cookie on its
              own origin, so log in there first. Nothing is stored — the request
              goes straight from this browser to the backend.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                label="Username or email"
                size="small"
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                autoComplete="username"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Password"
                size="small"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                sx={{ flex: 1 }}
              />
              <Button
                variant="contained"
                onClick={loginOnBackend}
                disabled={authBusy || !socketBackend}
                sx={{ minWidth: 170 }}
              >
                {authBusy ? "Working…" : "Log in & connect"}
              </Button>
            </Stack>
            {session ? (
              <Alert severity={session.ok ? "success" : "error"}>
                {session.ok
                  ? `Logged in (HTTP ${session.status})${
                      session.user?.username ? ` as ${session.user.username}` : ""
                    } — socket handshake should now be accepted.`
                  : session.blocked
                    ? "Request blocked by the browser (CORS or network)."
                    : `Backend rejected the login (HTTP ${session.status}).`}
              </Alert>
            ) : null}

            <Divider />

            <Typography variant="subtitle2" fontWeight={700}>
              2 · Connection options
            </Typography>
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
                onClick={() => setWithCredentials((value) => !value)}
              >
                credentials: {withCredentials ? "on" : "off"}
              </Button>
              <Button variant="text" color="inherit" onClick={() => setLogs([])} sx={{ ml: "auto" }}>
                Clear log
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
              <Box sx={{ opacity: 0.6 }}>Waiting for events — log in or press Connect.</Box>
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
            <strong>Why login comes first:</strong> a cookie set by this app on
            its own origin is never sent to the backend&apos;s origin, so the
            socket handshake fails with <code>Please Login</code>. Logging in
            against the backend (step 1) puts the session cookie where the
            socket can see it. Set <code>NEXT_PUBLIC_REMOTE_AUTH=true</code> to
            make the whole app authenticate that way.
          </Typography>
        </Alert>
      </Stack>
    </Box>
  );
}
