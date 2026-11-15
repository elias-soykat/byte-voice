/**
 * The Socket.io event contract — the single source of truth shared by the web
 * client and the API server. Events are named `domain:action` (coding-standards
 * §4). A mismatch between the two ends is a type error, not a silent failure.
 */

export const SocketEvent = {
  // client -> server
  CallStart: "call:start",
  AudioChunk: "audio:chunk",
  UserTurnEnd: "user:turn-end",
  UserInterrupt: "user:interrupt",
  CallEnd: "call:end",

  // server -> client
  CallReady: "call:ready",
  TranscriptFinal: "transcript:final",
  AgentResponse: "agent:response",
  TtsAudio: "tts:audio",
  AgentSpeakingStart: "agent:speaking:start",
  AgentSpeakingStop: "agent:speaking:stop",
  CallSummary: "call:summary",
  CallError: "call:error",
} as const;

export type SocketEventName = (typeof SocketEvent)[keyof typeof SocketEvent];

/** Audio capture settings shared by both ends. */
export const AUDIO_TIMESLICE_MS = 250;
export const AUDIO_MIME = "audio/webm;codecs=opus";

/** Caller details sent with `call:start` (optional). */
export type CallStartPayload = { patientName?: string; email?: string };
export type CallReadyPayload = { callId: string; initialTurnId?: number };
export type CallErrorPayload = { message: string };
export type TranscriptFinalPayload = { text: string; turnId?: number };
export type AgentResponsePayload = {
  text: string;
  route: string | null;
  turnId?: number;
};
export type UserTurnEndPayload = { turnId?: number };
export type UserInterruptPayload = { turnId?: number; agentPlaybackMs?: number };
export type TtsAudioMeta = { turnId?: number };

export type CallSummaryPayload = {
  callId: string;
  durationSec: number;
  patientName?: string | null | undefined;
  phone?: string | null | undefined;
  reasonForVisit?: string | null | undefined;
  preferredDateTime?: string | null | undefined;
  outcome: "BOOKED" | "ENQUIRY" | "FOLLOW_UP_NEEDED" | "INCOMPLETE" | "FAILED";
  appointment?: {
    id?: string | undefined;
    doctorName?: string | null | undefined;
    doctorSpeciality?: string | null | undefined;
    startTime?: string | null | undefined;
  } | null | undefined;
  nextActions: {
    appointmentRecorded: boolean;
    patientDetailsSaved: boolean;
    transcriptAvailable: boolean;
  };
  notes?: string | null | undefined;
  status: "success" | "partial" | "error";
  errorMessage?: string | undefined;
};

/** Events the server emits to the client. */
export interface ServerToClientEvents {
  "call:ready": (payload: CallReadyPayload) => void;
  /** The user's transcribed utterance (caption). */
  "transcript:final": (payload: TranscriptFinalPayload) => void;
  /** The agent's reply text (caption). */
  "agent:response": (payload: AgentResponsePayload) => void;
  /** The agent's spoken reply as mp3 audio with optional turn metadata. */
  "tts:audio": (audio: ArrayBuffer, meta?: TtsAudioMeta) => void;
  "agent:speaking:start": () => void;
  "agent:speaking:stop": () => void;
  /** Finalized post-call clinical summary and outcome. */
  "call:summary": (payload: CallSummaryPayload) => void;
  "call:error": (payload: CallErrorPayload) => void;
}

/** Events the client emits to the server. */
export interface ClientToServerEvents {
  /** Starts the call; carries optional caller details. */
  "call:start": (payload: CallStartPayload) => void;
  /** Binary mic audio (webm/opus). Arrives as a Buffer on the server. */
  "audio:chunk": (chunk: ArrayBuffer) => void;
  /** User finished an utterance turn. */
  "user:turn-end": (payload?: UserTurnEndPayload) => void;
  /** User interrupted the agent's response/playback. */
  "user:interrupt": (payload?: UserInterruptPayload) => void;
  /** Caller hangs up. */
  "call:end": () => void;
}
