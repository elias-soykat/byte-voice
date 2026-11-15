import { DeepgramClient } from "@deepgram/sdk";

import { DEEPGRAM_API_KEY } from "../config/config";
import { DEEPGRAM_MODEL, DEEPGRAM_LANGUAGE } from "../config/voice";

const deepgram = new DeepgramClient({ apiKey: DEEPGRAM_API_KEY || "dummy_key" });

// Transcribes a complete utterance (webm/opus buffer) with Deepgram's
// prerecorded API in Bangla with punctuation and smart formatting.
export const transcribeAudio = async (audio: Buffer): Promise<string> => {
  if (!DEEPGRAM_API_KEY) {
    console.warn("[deepgram] DEEPGRAM_API_KEY is not set, skipping STT");
    return "";
  }

  try {
    const response = await deepgram.listen.v1.media.transcribeFile(audio, {
      model: DEEPGRAM_MODEL,
      language: DEEPGRAM_LANGUAGE,
      smart_format: true,
      punctuate: true,
    });

    if ("results" in response) {
      const transcript =
        response.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
      if (transcript.trim()) return transcript.trim();
    }
  } catch (err: unknown) {
    const errorMsg = (err as { body?: { err_msg?: string }; message?: string })?.body?.err_msg || (err as Error)?.message;
    console.warn(`[deepgram] Model "${DEEPGRAM_MODEL}" failed (${errorMsg}), retrying with "general" model...`);

    try {
      const fallbackResponse = await deepgram.listen.v1.media.transcribeFile(audio, {
        model: "general",
        language: DEEPGRAM_LANGUAGE,
        smart_format: true,
        punctuate: true,
      });

      if ("results" in fallbackResponse) {
        const transcript =
          fallbackResponse.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
        return transcript.trim();
      }
    } catch (fallbackErr: unknown) {
      const fallbackMsg = (fallbackErr as { body?: { err_msg?: string }; message?: string })?.body?.err_msg || (fallbackErr as Error)?.message;
      console.error("[deepgram] Fallback STT also failed:", fallbackMsg);
      throw fallbackErr;
    }
  }

  return "";
};
