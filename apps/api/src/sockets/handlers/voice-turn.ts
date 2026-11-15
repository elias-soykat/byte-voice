import type { Socket } from "socket.io";
import {
  SocketEvent,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@repo/shared";

import { runAgent } from "../../agents";
import { transcribeAudio } from "../../libs/deepgram";
import { synthesizeSpeechSarvam } from "../../libs/sarvam";
import { greetingFor } from "../../config/voice";
import {
  appendSegment,
  appendTranscript,
  drainAudio,
  getSession,
  renewTurnAbortSignal,
} from "../session";

type CallSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Speaks a piece of agent text: emit the caption + speaking flag + the audio.
// Validates turnId and AbortSignal so an interrupted turn never plays or records.
const speak = async (
  socket: CallSocket,
  text: string,
  route: string | null,
  turnId: number,
  signal: AbortSignal,
): Promise<void> => {
  const session = getSession(socket.id);
  if (!session || signal.aborted || session.currentTurnId !== turnId) return;

  session.agentSpeaking = true;

  socket.emit(SocketEvent.AgentSpeakingStart);

  let audio: Buffer;
  try {
    audio = await synthesizeSpeechSarvam(text, { signal });
  } catch (ttsErr: unknown) {
    if (signal.aborted || session.currentTurnId !== turnId) {
      if (session) session.agentSpeaking = false;
      return;
    }
    console.error("[voice] Sarvam TTS failed", ttsErr);
    audio = Buffer.alloc(0);
  }

  // Double check interruption before emitting or appending
  if (signal.aborted || session.currentTurnId !== turnId) {
    if (session) session.agentSpeaking = false;
    return;
  }

  // Emit agent response caption tagged with the turnId
  socket.emit(SocketEvent.AgentResponse, { text, route, turnId });

  if (audio.byteLength > 0) {
    // Record the agent's side of the conversation for the saved call.
    appendTranscript(socket.id, {
      role: "agent",
      text,
      at: Date.now(),
      turnId,
    });
    appendSegment(socket.id, {
      role: "agent",
      audio,
      format: "mp3",
      at: Date.now(),
      turnId,
    });

    // Socket.io sends Buffers as binary; the browser receives an ArrayBuffer.
    // Attach turnId metadata so the client can drop stale audio chunks.
    socket.emit(
      SocketEvent.TtsAudio,
      audio.buffer.slice(
        audio.byteOffset,
        audio.byteOffset + audio.byteLength,
      ) as ArrayBuffer,
      { turnId },
    );
  } else {
    console.warn("[voice] synthesized audio is empty for text:", text);
  }

  socket.emit(SocketEvent.AgentSpeakingStop);
  if (session) session.agentSpeaking = false;
};

// The agent greets the caller as soon as the call connects — by name if known.
export const sendGreeting = async (
  socket: CallSocket,
  patientName?: string,
): Promise<void> => {
  const session = getSession(socket.id);
  if (!session) return;
  const turnId = session.currentTurnId;
  const signal = session.abortController.signal;

  try {
    await speak(socket, greetingFor(patientName), null, turnId, signal);
  } catch (error: unknown) {
    if (signal.aborted || (error as { name?: string })?.name === "AbortError") {
      console.log(`[voice] greeting interrupted on call ${session.callId}`);
      return;
    }
    console.error("[voice] greeting failed", error);
  }
};

// One turn: STT -> agent -> TTS. Supports user barge-in and abort signals.
export const runVoiceTurn = async (
  socket: CallSocket,
  turnId?: number,
): Promise<void> => {
  const session = getSession(socket.id);
  if (!session) return;

  const signal = renewTurnAbortSignal(socket.id, turnId);
  if (!signal) return;

  const currentTurn = session.currentTurnId;

  try {
    const audio = drainAudio(socket.id);
    if (audio.byteLength === 0) return;

    if (signal.aborted || session.currentTurnId !== currentTurn) return;

    const transcript = await transcribeAudio(audio, signal);
    if (!transcript) return; // nothing intelligible — wait for the next turn

    if (signal.aborted || session.currentTurnId !== currentTurn) return;

    // Record the caller's side (the drained buffer is a complete WebM utterance).
    appendTranscript(socket.id, {
      role: "user",
      text: transcript,
      at: Date.now(),
      turnId: currentTurn,
    });
    appendSegment(socket.id, {
      role: "user",
      audio,
      format: "webm",
      at: Date.now(),
      turnId: currentTurn,
    });

    socket.emit(SocketEvent.TranscriptFinal, {
      text: transcript,
      turnId: currentTurn,
    });

    const agentResult = await runAgent({
      sessionId: session.callId,
      ...(session.callDbId ? { callId: session.callDbId } : {}),
      message: transcript,
      ...(session.patientName ? { patientName: session.patientName } : {}),
      ...(session.email ? { email: session.email } : {}),
      signal,
    });

    if (
      agentResult.aborted ||
      signal.aborted ||
      session.currentTurnId !== currentTurn
    ) {
      console.log(`[voice] turn ${currentTurn} cancelled by user interruption`);
      return;
    }

    await speak(
      socket,
      agentResult.reply,
      agentResult.route,
      currentTurn,
      signal,
    );
  } catch (error: unknown) {
    if (signal.aborted || (error as { name?: string })?.name === "AbortError") {
      console.log(`[voice] turn ${currentTurn} aborted cleanly`);
      return;
    }

    console.error("[voice] turn failed", error);
    socket.emit(SocketEvent.CallError, {
      message:
        "দুঃখিত, আমি কথাটি ঠিকমতো বুঝতে পারিনি। দয়া করে আর একবার বলবেন কি?",
    });
    const current = getSession(socket.id);
    if (current) current.agentSpeaking = false;
  }
};
