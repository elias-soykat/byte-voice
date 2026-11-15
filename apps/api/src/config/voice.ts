// Voice-pipeline constants for StrategyByte ByteVoice (Dhaka Dental Care demo)

export const DEEPGRAM_MODEL = process.env.DEEPGRAM_MODEL || "nova-3";
export const DEEPGRAM_LANGUAGE = "bn";
export const STT_MIMETYPE = "audio/webm";

export const TTS_OUTPUT_FORMAT = "mp3";

const GREETING_BODY =
  "ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?";

// Anonymous fallback greeting (as specified in Task Brief §5)
export const GREETING = `আসসালামু আলাইকুম, ${GREETING_BODY}`;

// The caller's first name only, for a natural spoken greeting.
const firstName = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

// Personalized greeting when a name is already known.
export const greetingFor = (name?: string): string =>
  name && name.trim()
    ? `আসসালামু আলাইকুম ${firstName(name)}, ${GREETING_BODY}`
    : GREETING;
