import type { Server, Socket } from "socket.io";
import {
  SocketEvent,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@repo/shared";

import {
  appendAudio,
  createSession,
  endSession,
  getSession,
  interruptSession,
} from "./session";
import { runVoiceTurn, sendGreeting } from "./handlers/voice-turn";
import { finalizeCall } from "../helpers/callRecording";

type CallServer = Server<ClientToServerEvents, ServerToClientEvents>;
type CallSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Socket.io gateway — wiring only (coding-standards §4). Validates/loads the
// session and delegates the work; the STT -> agent -> TTS pipeline lives in
// handlers/voice-turn.
export const registerSocketHandlers = (io: CallServer): void => {
  io.on("connection", (socket: CallSocket) => {
    console.log(
      `[socket] Client connected: ${socket.id} (transport: ${socket.conn.transport.name})`,
    );

    socket.on(SocketEvent.CallStart, (payload) => {
      // Payload is defensively optional so a client that omits it still works.
      const session = createSession(socket.id, {
        ...(payload?.patientName ? { patientName: payload.patientName } : {}),
        ...(payload?.email ? { email: payload.email } : {}),
      });
      console.log(`[call] start ${session.callId} (socket ${socket.id})`);
      socket.emit(SocketEvent.CallReady, {
        callId: session.callId,
        initialTurnId: session.currentTurnId,
      });
      // Agent greets first (spoken), by name when we have it.
      void sendGreeting(socket, session.patientName);
    });

    socket.on(SocketEvent.AudioChunk, (chunk) => {
      const buffer = Buffer.isBuffer(chunk)
        ? chunk
        : Buffer.from(chunk as ArrayBuffer);
      appendAudio(socket.id, buffer);
    });

    socket.on(SocketEvent.UserTurnEnd, (payload) => {
      const session = getSession(socket.id);
      if (!session) return;
      console.log(
        `[call] user turn end ${session.callId} (turn ${payload?.turnId ?? session.currentTurnId}, ${session.bytesReceived} bytes received)`,
      );
      void runVoiceTurn(socket, payload?.turnId);
    });

    socket.on(SocketEvent.UserInterrupt, (payload) => {
      const session = getSession(socket.id);
      if (!session) return;
      console.log(
        `[call] user interrupt on ${session.callId} (turn ${payload?.turnId ?? session.currentTurnId}, playbackMs: ${payload?.agentPlaybackMs ?? "unknown"})`,
      );
      interruptSession(socket.id, payload?.turnId, payload?.agentPlaybackMs);
    });

    const handleCallEnd = async () => {
      // endSession deletes from the Map and returns the session, ensuring
      // this is idempotent across call:end + subsequent disconnect.
      const session = endSession(socket.id);
      if (!session) return;

      const seconds = Math.round((Date.now() - session.startedAt) / 1000);
      console.log(
        `[call] end ${session.callId} (call:end, ${seconds}s, ${session.bytesReceived} bytes)`,
      );

      try {
        const summary = await finalizeCall(session);
        if (socket.connected) {
          socket.emit(SocketEvent.CallSummary, summary);
        }
      } catch (err) {
        console.error(`[call] error finalizing call ${session.callId}:`, err);
        if (socket.connected) {
          socket.emit(SocketEvent.CallSummary, {
            callId: session.callId,
            durationSec: seconds,
            patientName: session.patientName ?? null,
            phone: null,
            reasonForVisit: null,
            preferredDateTime: null,
            outcome: "INCOMPLETE",
            appointment: null,
            nextActions: {
              appointmentRecorded: false,
              patientDetailsSaved: false,
              transcriptAvailable: session.transcript.length > 0,
            },
            notes: "Call ended. Details stored in database.",
            status: "partial",
            errorMessage: "Call saved, but summary processing failed.",
          });
        }
      }
    };

    const handleDisconnect = () => {
      // If already ended via call:end, endSession returns null and this is a no-op.
      const session = endSession(socket.id);
      if (session) {
        const seconds = Math.round((Date.now() - session.startedAt) / 1000);
        console.log(
          `[call] disconnect ${session.callId} (${seconds}s, ${session.bytesReceived} bytes)`,
        );
        void finalizeCall(session);
      }
    };

    socket.on(SocketEvent.CallEnd, () => {
      void handleCallEnd();
    });
    socket.on("disconnect", handleDisconnect);
  });
};
