export const nextBackend = "/api/v1";

export const socketServer =
	process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
	process.env.NEXT_PUBLIC_SERVER_URL ||
	"";

export const socketBackend = socketServer
	? `${socketServer.replace(/\/$/, "")}/api/v1`
	: "";

/**
 * Opt-in: authenticate (and read/write data) against the remote realtime
 * backend directly from the browser instead of the local Next API routes.
 *
 * Why this exists: auth cookies are domain-scoped. A session cookie set by this
 * app on its own origin is never sent to the socket server's origin, so the
 * socket handshake is rejected with "Please Login". Logging in against the
 * remote backend puts the cookie on *its* origin — which is exactly what the
 * socket connection and the socket-backed REST calls then send along.
 *
 * Off by default so existing deployments keep using the local API routes.
 * Enable with NEXT_PUBLIC_REMOTE_AUTH=true (requires NEXT_PUBLIC_SOCKET_SERVER_URL).
 */
export const remoteAuthEnabled =
	process.env.NEXT_PUBLIC_REMOTE_AUTH === "true" && Boolean(socketBackend);

/** Base URL for /user, /chat, ... calls: remote backend when opted in, else this app. */
export const apiBackend = remoteAuthEnabled ? socketBackend : nextBackend;

export const authApiBase = `${apiBackend}/user`;

// Backward-compat alias for old imports.
export const server = nextBackend;
