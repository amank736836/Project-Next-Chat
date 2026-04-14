"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_SOCKET_SERVER_URL, {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log(`Connected to socket server with id: ${socketInstance.id}`);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    socketInstance.on("connect_error", (err) => {
      console.error("Socket connection error:", err);
    });

    socketInstance.on("connect_timeout", (err) => {
      console.error("Socket connection timeout:", err);
    });

    socketInstance.on("error", (err) => {
      console.error("Socket error:", err);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
