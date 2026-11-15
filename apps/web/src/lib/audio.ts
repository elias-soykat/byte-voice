import { AUDIO_MIME } from "@repo/shared";

// Browser mic helpers for the voice call. Kept framework-free so the call
// provider just wires them to socket events + UI state.

export async function requestMic(): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  if (MediaRecorder.isTypeSupported(AUDIO_MIME)) return AUDIO_MIME;
  if (MediaRecorder.isTypeSupported("audio/webm")) return "audio/webm";
  return undefined;
}

export type UtteranceRecorder = {
  start: () => void;
  stop: () => Promise<ArrayBuffer | null>;
  cancel: () => void;
  isRecording: () => boolean;
};

// Records ONE utterance at a time. A fresh MediaRecorder per turn guarantees a
// complete, self-contained WebM blob (a continuous recorder only produces valid
// WebM from its first chunk, which breaks per-turn transcription).
export function createUtteranceRecorder(stream: MediaStream): UtteranceRecorder {
  const mimeType = pickMimeType();
  let recorder: MediaRecorder | null = null;
  let chunks: BlobPart[] = [];

  const start = () => {
    if (recorder && recorder.state !== "inactive") return;
    chunks = [];
    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.start();
  };

  const stop = (): Promise<ArrayBuffer | null> =>
    new Promise((resolve) => {
      const active = recorder;
      if (!active || active.state === "inactive") {
        resolve(null);
        return;
      }
      active.onstop = () => {
        if (chunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(chunks, { type: mimeType ?? "audio/webm" });
        chunks = [];
        void blob.arrayBuffer().then(resolve);
      };
      active.stop();
    });

  const cancel = () => {
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.ondataavailable = null;
      recorder.stop();
    }
    chunks = [];
    recorder = null;
  };

  return {
    start,
    stop,
    cancel,
    isRecording: () => recorder?.state === "recording",
  };
}

// Tuned for natural Bengali dialogue:
// - SPEAK_THRESHOLD (0.08 RMS): Sensitive enough for soft speech, high enough to filter baseline room noise.
// - SILENCE_MS (700ms): Down from 1200ms. Leaves room for natural intra-sentence pauses without sluggish latency.
// - INTERRUPT_DEBOUNCE_MS (140ms): Requires sustained user vocalization before triggering barge-in,
//   preventing mic taps or quick coughs from killing agent playback.
const SPEAK_THRESHOLD = 0.08;
const SILENCE_MS = 700;
const INTERRUPT_DEBOUNCE_MS = 140;

type LevelMeterCallbacks = {
  onLevel: (level: number) => void;
  onSpeakingChange: (speaking: boolean) => void;
  onTurnEnd: () => void;
  onInterruption?: () => void;
};

// Drives the user-speaking animation (mic level), detects genuine voice barge-in,
// and detects end-of-turn (silence after the user has spoken).
export function createLevelMeter(
  stream: MediaStream,
  callbacks: LevelMeterCallbacks,
): () => void {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioContext = new AudioCtx();
  const source = audioContext.createMediaStreamSource(stream);
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 1024;
  source.connect(analyser);

  const data = new Uint8Array(analyser.fftSize);
  let raf = 0;
  let speaking = false;
  let spokeThisTurn = false;
  let silenceStart = 0;
  let speechStart = 0;
  let interruptionFired = false;

  const tick = () => {
    analyser.getByteTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i += 1) {
      const v = (data[i]! - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const level = Math.min(1, rms * 3); // scale for nicer visuals
    callbacks.onLevel(level);

    const now = performance.now();
    if (rms > SPEAK_THRESHOLD) {
      if (!speaking) {
        speaking = true;
        spokeThisTurn = true;
        speechStart = now;
        interruptionFired = false;
        callbacks.onSpeakingChange(true);
      } else if (
        !interruptionFired &&
        now - speechStart >= INTERRUPT_DEBOUNCE_MS
      ) {
        // Sustained speech confirmed — trigger barge-in cutoff
        interruptionFired = true;
        callbacks.onInterruption?.();
      }
      silenceStart = now;
    } else if (speaking) {
      speaking = false;
      callbacks.onSpeakingChange(false);
      silenceStart = now;
    } else if (spokeThisTurn && now - silenceStart > SILENCE_MS) {
      spokeThisTurn = false;
      interruptionFired = false;
      callbacks.onTurnEnd();
    }

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    source.disconnect();
    analyser.disconnect();
    audioContext.close().catch(() => undefined);
  };
}

export function stopStream(stream: MediaStream): void {
  stream.getTracks().forEach((track) => track.stop());
}
