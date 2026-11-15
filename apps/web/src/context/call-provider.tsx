"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";

import {
  SocketEvent,
  type TtsAudioMeta,
  type AgentResponsePayload,
  type TranscriptFinalPayload,
  type CallReadyPayload,
  type CallSummaryPayload,
} from "@repo/shared";
import { createCallSocket, type CallSocket } from "@/lib/socket";
import {
  createLevelMeter,
  createUtteranceRecorder,
  requestMic,
  stopStream,
  type UtteranceRecorder,
} from "@/lib/audio";

export type CallStatus = "idle" | "connecting" | "live" | "finalizing";

export type Caption = { id: number; role: "user" | "agent"; text: string };

/** Caller details collected by the pre-call form (optional). */
export type CallerDetails = { name?: string; email?: string };

export type CallContextValue = {
  status: CallStatus;
  isOpen: boolean;
  formOpen: boolean;
  userSpeaking: boolean;
  agentSpeaking: boolean;
  processing: boolean;
  micLevel: number;
  muted: boolean;
  error: string | null;
  transcript: Caption[];
  summary: CallSummaryPayload | null;
  isSummaryOpen: boolean;
  callDuration: number;
  openForm: () => void;
  closeForm: () => void;
  startCall: (patient?: CallerDetails) => void;
  startDirectCall: () => void;
  endCall: () => void;
  closeSummary: () => void;
  toggleMute: () => void;
};

export const CallContext = createContext<CallContextValue | null>(null);

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<CallStatus>("idle");
  const [formOpen, setFormOpen] = useState(false);
  const [userSpeaking, setUserSpeaking] = useState(false);
  const [agentSpeaking, setAgentSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Caption[]>([]);

  // Post-call summary state
  const [summary, setSummary] = useState<CallSummaryPayload | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentCallIdRef = useRef<string | null>(null);
  const callerDetailsRef = useRef<CallerDetails | null>(null);

  const socketRef = useRef<CallSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<UtteranceRecorder | null>(null);
  const meterCleanupRef = useRef<(() => void) | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<{ url: string; turnId?: number }[]>([]);
  const playingRef = useRef(false);
  const mutedRef = useRef(false);
  const agentSpeakingRef = useRef(false);
  const userSpeakingRef = useRef(false);
  const captionId = useRef(0);

  // Turn management & barge-in tracking
  const turnIdRef = useRef(1);
  const interruptedTurnsRef = useRef<Set<number>>(new Set());

  // Track duration while call is live
  useEffect(() => {
    if (status === "live") {
      setCallDuration(0);
      durationTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      return () => {
        if (durationTimerRef.current) clearInterval(durationTimerRef.current);
      };
    }
    if (status === "idle" && !isSummaryOpen) {
      setCallDuration(0);
    }
  }, [status, isSummaryOpen]);

  const addCaption = useCallback((role: "user" | "agent", text: string) => {
    captionId.current += 1;
    setTranscript((prev) => [
      ...prev.slice(-8),
      { id: captionId.current, role, text },
    ]);
  }, []);

  // Stops any playing audio, flushes queued buffers, and revokes URLs immediately.
  const stopAndClearAgentPlayback = useCallback((): number => {
    let playbackDurationMs = 0;
    if (audioElRef.current) {
      playbackDurationMs = (audioElRef.current.currentTime || 0) * 1000;
      audioElRef.current.pause();
      audioElRef.current.currentTime = 0;
      audioElRef.current.src = "";
    }
    audioQueueRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    audioQueueRef.current = [];
    playingRef.current = false;
    agentSpeakingRef.current = false;
    setAgentSpeaking(false);
    setProcessing(false);
    return playbackDurationMs;
  }, []);

  // Explicit user interruption / barge-in handler
  const interruptAgent = useCallback(() => {
    const wasAgentActive = agentSpeakingRef.current || playingRef.current;
    const playedMs = stopAndClearAgentPlayback();

    const activeTurn = turnIdRef.current;
    interruptedTurnsRef.current.add(activeTurn);

    if (socketRef.current?.connected) {
      socketRef.current.emit(SocketEvent.UserInterrupt, {
        turnId: activeTurn,
        agentPlaybackMs: wasAgentActive ? playedMs : 0,
      });
    }
  }, [stopAndClearAgentPlayback]);

  const teardown = useCallback(() => {
    meterCleanupRef.current?.();
    meterCleanupRef.current = null;

    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }

    stopAndClearAgentPlayback();

    if (audioElRef.current) {
      audioElRef.current = null;
    }

    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    interruptedTurnsRef.current.clear();
  }, [stopAndClearAgentPlayback]);

  const endCall = useCallback(() => {
    if (status === "idle" || status === "finalizing") return;

    // Immediately stop mic input and level meter
    if (meterCleanupRef.current) {
      meterCleanupRef.current();
      meterCleanupRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    if (streamRef.current) {
      stopStream(streamRef.current);
      streamRef.current = null;
    }

    // Immediately stop agent audio playback and clear queue
    stopAndClearAgentPlayback();

    // Reset voice activity indicators
    setUserSpeaking(false);
    setAgentSpeaking(false);
    setProcessing(false);
    setMicLevel(0);
    mutedRef.current = false;
    userSpeakingRef.current = false;
    agentSpeakingRef.current = false;

    // Transition to finalizing
    setStatus("finalizing");

    if (socketRef.current?.connected) {
      socketRef.current.emit(SocketEvent.CallEnd);
    }

    // Fallback timer: if no summary arrives in 8 seconds, open fallback summary
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    fallbackTimerRef.current = setTimeout(() => {
      console.warn("[VoiceCall] Summary event timed out, using client fallback summary");
      setSummary((prev) => {
        if (prev) return prev;
        return {
          callId: currentCallIdRef.current || "call-session",
          durationSec: callDuration,
          patientName: callerDetailsRef.current?.name ?? null,
          phone: null,
          reasonForVisit: null,
          preferredDateTime: null,
          outcome: "INCOMPLETE",
          appointment: null,
          nextActions: {
            appointmentRecorded: false,
            patientDetailsSaved: false,
            transcriptAvailable: transcript.length > 0,
          },
          notes: "Call ended. Details stored in clinic database.",
          status: "partial",
        };
      });
      setIsSummaryOpen(true);
      setStatus("idle");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    }, 8000);
  }, [status, stopAndClearAgentPlayback, callDuration, transcript.length]);

  const closeSummary = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    teardown();
    setIsSummaryOpen(false);
    setSummary(null);
    setStatus("idle");
    setTranscript([]);
    setCallDuration(0);
    currentCallIdRef.current = null;
    callerDetailsRef.current = null;
  }, [teardown]);

  const playNext = useCallback(() => {
    if (playingRef.current) return;

    // Discard any queued chunks from interrupted turns
    while (
      audioQueueRef.current.length > 0 &&
      audioQueueRef.current[0]?.turnId !== undefined &&
      interruptedTurnsRef.current.has(audioQueueRef.current[0].turnId)
    ) {
      const stale = audioQueueRef.current.shift();
      if (stale) URL.revokeObjectURL(stale.url);
    }

    const nextItem = audioQueueRef.current.shift();
    const audio = audioElRef.current;
    if (!nextItem || !audio) {
      setAgentSpeaking(false);
      agentSpeakingRef.current = false;
      return;
    }

    // If user is currently speaking, do not start playing agent audio
    if (userSpeakingRef.current) {
      URL.revokeObjectURL(nextItem.url);
      setAgentSpeaking(false);
      agentSpeakingRef.current = false;
      return;
    }

    playingRef.current = true;
    setProcessing(false);
    setAgentSpeaking(true);
    agentSpeakingRef.current = true;
    audio.src = nextItem.url;

    audio.onended = () => {
      URL.revokeObjectURL(nextItem.url);
      playingRef.current = false;
      if (audioQueueRef.current.length === 0) {
        setAgentSpeaking(false);
        agentSpeakingRef.current = false;
      }
      playNext();
    };

    audio.play().catch(() => {
      URL.revokeObjectURL(nextItem.url);
      playingRef.current = false;
      playNext();
    });
  }, []);

  const enqueueAudio = useCallback(
    (buffer: ArrayBuffer, meta?: TtsAudioMeta) => {
      // Discard audio if caller is currently speaking or if turn was interrupted
      if (
        userSpeakingRef.current ||
        (meta?.turnId !== undefined &&
          (interruptedTurnsRef.current.has(meta.turnId) ||
            meta.turnId < turnIdRef.current))
      ) {
        return;
      }

      const url = URL.createObjectURL(
        new Blob([buffer], { type: "audio/mpeg" }),
      );
      audioQueueRef.current.push({ url, turnId: meta?.turnId });
      playNext();
    },
    [playNext],
  );

  const beginStreaming = useCallback(
    (socket: CallSocket, stream: MediaStream) => {
      const recorder = createUtteranceRecorder(stream);
      recorderRef.current = recorder;

      meterCleanupRef.current = createLevelMeter(stream, {
        onLevel: setMicLevel,
        onSpeakingChange: (speaking) => {
          const isMuted = mutedRef.current;
          const activeSpeaking = speaking && !isMuted;
          userSpeakingRef.current = activeSpeaking;
          setUserSpeaking(activeSpeaking);

          if (activeSpeaking) {
            // Start recording immediately so early consonants/vowels are captured.
            // Notice: no "!agentSpeakingRef" check here — user can speak at any time!
            if (!recorder.isRecording()) {
              recorder.start();
            }
          }
        },
        onInterruption: () => {
          // Debounce confirmed genuine user speech while agent is speaking or thinking
          if (mutedRef.current) return;
          if (
            agentSpeakingRef.current ||
            playingRef.current ||
            audioQueueRef.current.length > 0
          ) {
            interruptAgent();
          }
        },
        onTurnEnd: () => {
          if (!recorder.isRecording()) return;
          void recorder.stop().then((buffer) => {
            if (buffer && socket.connected && !mutedRef.current) {
              // Advance turn ID for the new user turn
              turnIdRef.current += 1;
              const currentTurn = turnIdRef.current;

              socket.emit(SocketEvent.AudioChunk, buffer);
              socket.emit(SocketEvent.UserTurnEnd, { turnId: currentTurn });
              setProcessing(true);
            }
          });
        },
      });
    },
    [interruptAgent],
  );

  const openForm = useCallback(() => {
    if (status !== "idle") return;
    setError(null);
    setFormOpen(true);
  }, [status]);

  const closeForm = useCallback(() => setFormOpen(false), []);

  const startCall = useCallback(
    async (patient?: CallerDetails) => {
      if (status !== "idle") return;
      callerDetailsRef.current = patient ?? null;
      setSummary(null);
      setIsSummaryOpen(false);
      setCallDuration(0);
      setFormOpen(false);
      setStatus("connecting");
      setError(null);
      setTranscript([]);
      interruptedTurnsRef.current.clear();
      turnIdRef.current = 1;

      let stream: MediaStream;
      try {
        stream = await requestMic();
      } catch {
        setError(
          "Microphone access is required to speak with our Bangla voice receptionist.",
        );
        toast.error("Microphone access is required to start the voice call.");
        setStatus("idle");
        return;
      }
      streamRef.current = stream;
      audioElRef.current = new Audio();

      const socket = createCallSocket();
      socketRef.current = socket;

      socket.on(
        SocketEvent.CallReady,
        ({ callId, initialTurnId }: CallReadyPayload) => {
          currentCallIdRef.current = callId;
          if (initialTurnId) turnIdRef.current = initialTurnId;
          setStatus("live");
          beginStreaming(socket, stream);
        },
      );

      socket.on(
        SocketEvent.TranscriptFinal,
        ({ text, turnId }: TranscriptFinalPayload) => {
          if (turnId && interruptedTurnsRef.current.has(turnId)) return;
          addCaption("user", text);
        },
      );

      socket.on(
        SocketEvent.AgentResponse,
        ({ text, turnId }: AgentResponsePayload) => {
          if (turnId && interruptedTurnsRef.current.has(turnId)) return;
          addCaption("agent", text);
        },
      );

      socket.on(
        SocketEvent.TtsAudio,
        (audio: ArrayBuffer, meta?: TtsAudioMeta) => {
          enqueueAudio(audio, meta);
        },
      );

      socket.on(SocketEvent.CallSummary, (payload: CallSummaryPayload) => {
        if (fallbackTimerRef.current) {
          clearTimeout(fallbackTimerRef.current);
          fallbackTimerRef.current = null;
        }
        if (payload.durationSec) {
          setCallDuration(payload.durationSec);
        }
        setSummary(payload);
        setIsSummaryOpen(true);
        setStatus("idle");
        if (socketRef.current) {
          socketRef.current.removeAllListeners();
          socketRef.current.disconnect();
          socketRef.current = null;
        }
      });

      socket.on(SocketEvent.CallError, ({ message }) => {
        setProcessing(false);
        toast.error(message);
      });

      socket.on("connect", () => {
        socket.emit(SocketEvent.CallStart, {
          ...(patient?.name ? { patientName: patient.name } : {}),
          ...(patient?.email ? { email: patient.email } : {}),
        });
      });

      socket.on("connect_error", (err) => {
        console.error("[VoiceCall] Socket connect error:", err);
        setError("Couldn't connect to the voice call server. Please try again.");
        toast.error("Couldn't connect to the voice server.");
        endCall();
      });

      socket.connect();
    },
    [status, beginStreaming, addCaption, enqueueAudio, endCall],
  );

  const startDirectCall = useCallback(() => {
    void startCall();
  }, [startCall]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      mutedRef.current = next;
      return next;
    });
  }, []);

  useEffect(() => () => teardown(), [teardown]);

  const value = useMemo<CallContextValue>(
    () => ({
      status,
      isOpen: status !== "idle" || isSummaryOpen,
      formOpen,
      userSpeaking,
      agentSpeaking,
      processing,
      micLevel,
      muted,
      error,
      transcript,
      summary,
      isSummaryOpen,
      callDuration,
      openForm,
      closeForm,
      startCall,
      startDirectCall,
      endCall,
      closeSummary,
      toggleMute,
    }),
    [
      status,
      isSummaryOpen,
      formOpen,
      userSpeaking,
      agentSpeaking,
      processing,
      micLevel,
      muted,
      error,
      transcript,
      summary,
      callDuration,
      openForm,
      closeForm,
      startCall,
      startDirectCall,
      endCall,
      closeSummary,
      toggleMute,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
}
