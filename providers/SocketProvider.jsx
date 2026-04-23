"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { socketServer } from "../constants/config";
import { useSelector } from "react-redux";

const SocketContext = createContext();
let sharedSocket = null;
let sharedSocketUserId = null;

export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user?._id) {
      if (sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedSocketUserId = null;
      }
      setSocket(null);
      return;
    }

    if (!socketServer) {
      console.warn("Socket server URL is not configured.");
      return;
    }

    if (sharedSocket && sharedSocketUserId === user._id) {
      setSocket(sharedSocket);
      return;
    }

    if (sharedSocket && sharedSocketUserId !== user._id) {
      sharedSocket.disconnect();
      sharedSocket = null;
      sharedSocketUserId = null;
    }

    const socketInstance = io(socketServer, {
      withCredentials: true,
    });

    socketInstance.on("connect", () => {
      console.log(`Connected to socket server with id: ${socketInstance.id}`);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from socket server");
    });

    socketInstance.on("connect_error", (err) => {
      if (err?.message?.includes("Please Login")) return;
      console.error("Socket connection error:", err);
    });

    socketInstance.on("connect_timeout", (err) => {
      console.error("Socket connection timeout:", err);
    });

    socketInstance.on("error", (err) => {
      console.error("Socket error:", err);
    });

    sharedSocket = socketInstance;
    sharedSocketUserId = user._id;
    setSocket(socketInstance);

    return () => {
      if (sharedSocket && sharedSocketUserId === user._id) {
        sharedSocket.disconnect();
        sharedSocket = null;
        sharedSocketUserId = null;
      }
    };
  }, [user?._id, socketServer]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}
