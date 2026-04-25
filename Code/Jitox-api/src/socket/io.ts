import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { Role } from "../constants/roles";

let io: Server | null = null;

export function initSocketIO(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket: Socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string);
      if (!token || !process.env.JWT_SECRET_KEY) {
        return next(new Error("Unauthorized"));
      }
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET_KEY
      ) as jwt.JwtPayload & { id?: string; role?: string };
      const id = decoded?.id ? String(decoded.id) : "";
      if (!id) return next(new Error("Unauthorized"));
      (socket.data as { userId: string; role: string }).userId = id;
      (socket.data as { userId: string; role: string }).role =
        String(decoded.role || "");
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId } = socket.data as { userId: string };
    socket.join(`user:${userId}`);
    socket.on("disconnect", () => {
      socket.leave(`user:${userId}`);
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitToUser(
  userId: string,
  event: string,
  payload: unknown
): void {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

export function emitToAdmins(event: string, payload: unknown): void {
  if (!io) return;
  io.sockets.sockets.forEach((sock) => {
    const role = (sock.data as { role?: string })?.role;
    if (role === Role.admin) {
      sock.emit(event, payload);
    }
  });
}
