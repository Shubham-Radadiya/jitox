import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { io } from "socket.io-client";

const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

function getToken() {
  return localStorage.getItem("token") || localStorage.getItem("access_token");
}

/**
 * Subscribes to task/notification socket events and refreshes React Query caches.
 */
export default function TaskSocketProvider({ children }) {
  const qc = useQueryClient();

  useEffect(() => {
    const token = getToken();
    if (!token) return undefined;

    const socket = io(base, {
      auth: { token },
      transports: ["websocket", "polling"],
    });

    const bump = () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", "analytics"] });
    };

    socket.on("notification:new", () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    });
    socket.on("task:created", bump);
    socket.on("task:updated", bump);
    socket.on("task:deleted", bump);

    return () => {
      socket.disconnect();
    };
  }, [qc]);

  return children;
}
