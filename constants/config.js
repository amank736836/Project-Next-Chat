export const nextBackend = "/api/v1";

export const socketServer =
	process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ||
	process.env.NEXT_PUBLIC_SERVER_URL ||
	"";

export const socketBackend = socketServer
	? `${socketServer.replace(/\/$/, "")}/api/v1`
	: "";

// Backward-compat alias for old imports.
export const server = nextBackend;
