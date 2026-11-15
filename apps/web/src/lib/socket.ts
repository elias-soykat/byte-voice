import { io, type Socket } from "socket.io-client";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "@repo/shared";

export type CallSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function getSocketUrl(): string {
  if (typeof window !== "undefined") {
    const configured = process.env.NEXT_PUBLIC_SOCKET_URL;
    if (configured) {
      try {
        const parsed = new URL(configured);
        // If configured as localhost or 127.0.0.1, match the browser's current hostname
        if (
          (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") &&
          (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
        ) {
          parsed.hostname = window.location.hostname;
          return parsed.origin;
        }
      } catch {
        // Fall back to configured string
      }
      return configured;
    }
    return `${window.location.protocol}//${window.location.hostname}:5500`;
  }
  return process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:5500";
}

// One lazily-connected socket for the voice call. autoConnect:false so the
// connection (and mic) only opens when the user actually starts a call.
export function createCallSocket(): CallSocket {
  return io(getSocketUrl(), {
    autoConnect: false,
    transports: ["websocket", "polling"],
  });
}
