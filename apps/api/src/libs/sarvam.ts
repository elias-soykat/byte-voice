import { SARVAM_API_KEY, SARVAM_SPEAKER } from "../config/config";

const SARVAM_TTS_URL = "https://api.sarvam.ai/text-to-speech";

export interface SarvamTtsOptions {
  speaker?: string;
  pace?: number;
  sampleRate?: number;
  signal?: AbortSignal;
}

// Synthesizes speech for the agent's reply in natural Bengali using Sarvam AI Bulbul.
// Returns mp3 audio as a Buffer. Supports AbortSignal for user interruption.
export const synthesizeSpeechSarvam = async (
  text: string,
  options?: SarvamTtsOptions,
): Promise<Buffer> => {
  if (options?.signal?.aborted) return Buffer.alloc(0);

  if (!SARVAM_API_KEY) {
    console.warn("[sarvam] SARVAM_API_KEY is not configured");
    return Buffer.alloc(0);
  }

  const cleanText = text.trim();
  if (!cleanText) return Buffer.alloc(0);

  try {
    const response = await fetch(SARVAM_TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": SARVAM_API_KEY,
      },
      ...(options?.signal ? { signal: options.signal } : {}),
      body: JSON.stringify({
        inputs: [cleanText],
        target_language_code: "bn-IN",
        speaker: options?.speaker ?? SARVAM_SPEAKER ?? "roopa_bn_conversational",
        model: "bulbul:v4-flash",
        pace: options?.pace ?? 1.0,
        speech_sample_rate: options?.sampleRate ?? 24000,
        output_audio_codec: "mp3",
      }),
    });

    if (options?.signal?.aborted) return Buffer.alloc(0);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `[sarvam] TTS failed with HTTP ${response.status}: ${errorBody}`,
      );
    }

    const data = (await response.json()) as { audios?: string[] };
    if (!data.audios || data.audios.length === 0 || !data.audios[0]) {
      throw new Error("[sarvam] API returned empty audio array");
    }

    return Buffer.from(data.audios[0], "base64");
  } catch (err: unknown) {
    if (options?.signal?.aborted || (err as { name?: string })?.name === "AbortError") {
      return Buffer.alloc(0);
    }
    throw err;
  }
};
