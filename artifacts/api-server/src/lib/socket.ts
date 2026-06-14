import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer): SocketServer {
  io = new SocketServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/api/socket.io",
  });

  io.on("connection", (socket) => {
    logger.info({ socketId: socket.id }, "Socket connected");

    // Client sends their userId to join their personal room
    socket.on("join", (userId: number) => {
      socket.join(`user:${userId}`);
      logger.info({ socketId: socket.id, userId }, "User joined personal room");
    });

    // Join a ride room for live tracking
    socket.on("joinRide", (rideId: number) => {
      socket.join(`ride:${rideId}`);
    });

    // Join public tracking room (no auth needed)
    socket.on("trackTrip", (token: string) => {
      socket.join(`track:${token}`);
    });

    socket.on("disconnect", () => {
      logger.info({ socketId: socket.id }, "Socket disconnected");
    });
  });

  return io;
}

export function getIo(): SocketServer {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}
