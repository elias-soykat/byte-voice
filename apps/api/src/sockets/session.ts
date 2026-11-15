import { randomUUID } from "crypto";

// Per-call state, keyed by socket id (coding-standards §4 — session is the one
// source of truth; handlers stay stateless). In-memory Map for now; swap for
// Redis if we scale to multiple instances.

export type CallRole = "user" | "agent";

export type AudioSegment = {
  role: CallRole;
  audio: Buffer;
  format: "webm" | "mp3";
  at: number;
  turnId?: number;
  interrupted?: boolean;
  durationMs?: number;
};

export type TranscriptEntry = {
  role: CallRole;
  text: string;
  at: number;
  turnId?: number;
  interrupted?: boolean;
};

export type CallSession = {
  callId: string;
  callDbId?: string; // Database cuid (Call.id)
  socketId: string;
  startedAt: number;
  bytesReceived: number;
  agentSpeaking: boolean;
  audioChunks: Buffer[];
  // Full-call recording buffers, kept in chronological order for finalization.
  segments: AudioSegment[];
  transcript: TranscriptEntry[];
  userTurns: number;
  currentTurnId: number;
  abortController: AbortController;
  // Caller details from the pre-call form (optional — old clients may omit them).
  patientName?: string;
  email?: string;
};

const sessions = new Map<string, CallSession>();

export const createSession = (
  socketId: string,
  meta?: { patientName?: string; email?: string },
): CallSession => {
  const session: CallSession = {
    callId: randomUUID(),
    socketId,
    startedAt: Date.now(),
    bytesReceived: 0,
    agentSpeaking: false,
    audioChunks: [],
    segments: [],
    transcript: [],
    userTurns: 0,
    currentTurnId: 1,
    abortController: new AbortController(),
    ...(meta?.patientName ? { patientName: meta.patientName } : {}),
    ...(meta?.email ? { email: meta.email } : {}),
  };
  sessions.set(socketId, session);
  return session;
};

export const getSession = (socketId: string): CallSession | undefined =>
  sessions.get(socketId);

// Buffer one turn's audio; drain returns + clears it as a single Buffer.
export const appendAudio = (socketId: string, chunk: Buffer): void => {
  const session = sessions.get(socketId);
  if (!session) return;
  session.audioChunks.push(chunk);
  session.bytesReceived += chunk.byteLength;
};

export const drainAudio = (socketId: string): Buffer => {
  const session = sessions.get(socketId);
  if (!session || session.audioChunks.length === 0) return Buffer.alloc(0);
  const audio = Buffer.concat(session.audioChunks);
  session.audioChunks = [];
  return audio;
};

// Append a recorded audio segment (a user utterance or an agent reply) in order.
export const appendSegment = (socketId: string, segment: AudioSegment): void => {
  const session = sessions.get(socketId);
  if (!session) return;
  session.segments.push(segment);
  if (segment.role === "user") session.userTurns += 1;
};

// Append a transcript line (the spoken text) for the saved conversation.
export const appendTranscript = (
  socketId: string,
  entry: TranscriptEntry,
): void => {
  const session = sessions.get(socketId);
  if (!session) return;
  session.transcript.push(entry);
};

/**
 * Handle an explicit user barge-in / interruption:
 * 1. Abort any in-flight LLM/STT/TTS generation for this session.
 * 2. Reset agentSpeaking flag.
 * 3. Reconcile recorded audio segments with real playback duration.
 * 4. Discard audio buffered prior to the interrupt.
 * 5. Advance the turn counter so pending responses from older turns are rejected.
 */
export const interruptSession = (
  socketId: string,
  turnId?: number,
  agentPlaybackMs?: number,
): void => {
  const session = sessions.get(socketId);
  if (!session) return;

  // Stale interrupt check (if turnId is provided and strictly older than current turn)
  if (typeof turnId === "number" && turnId < session.currentTurnId) {
    return;
  }

  // Cancel any active provider calls (Deepgram, OpenAI, Sarvam)
  session.abortController.abort();
  session.abortController = new AbortController();

  session.agentSpeaking = false;

  // Clear stale buffered audio chunks recorded during the interrupted turn
  session.audioChunks = [];

  // Reconcile the last agent audio segment and transcript entry if interrupted
  if (session.segments.length > 0) {
    const lastAgentSeg = [...session.segments]
      .reverse()
      .find((s) => s.role === "agent");

    if (lastAgentSeg) {
      lastAgentSeg.interrupted = true;
      if (typeof agentPlaybackMs === "number") {
        if (agentPlaybackMs < 250) {
          // If interrupted almost immediately, remove segment from the final merged recording
          const idx = session.segments.indexOf(lastAgentSeg);
          if (idx !== -1) {
            session.segments.splice(idx, 1);
          }
        } else {
          lastAgentSeg.durationMs = Math.round(agentPlaybackMs);
        }
      }
    }
  }

  if (session.transcript.length > 0) {
    const lastAgentTx = [...session.transcript]
      .reverse()
      .find((t) => t.role === "agent");
    if (lastAgentTx) {
      lastAgentTx.interrupted = true;
    }
  }

  // Advance turn ID to invalidate any stale late-arriving async responses
  session.currentTurnId += 1;
};

/**
 * Reset / renew the session's AbortController before starting a fresh turn.
 */
export const renewTurnAbortSignal = (
  socketId: string,
  turnId?: number,
): AbortSignal | undefined => {
  const session = sessions.get(socketId);
  if (!session) return undefined;

  if (typeof turnId === "number") {
    session.currentTurnId = Math.max(session.currentTurnId, turnId);
  }

  // Abort any existing in-flight work before beginning a new turn
  if (!session.abortController.signal.aborted) {
    session.abortController.abort();
  }
  session.abortController = new AbortController();
  return session.abortController.signal;
};

export const endSession = (socketId: string): CallSession | undefined => {
  const session = sessions.get(socketId);
  if (session) {
    session.abortController.abort();
  }
  sessions.delete(socketId);
  return session;
};
