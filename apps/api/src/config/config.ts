import "dotenv/config";

export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5500;

export const WEB_ORIGIN = process.env.WEB_ORIGIN ?? "http://localhost:3000";

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";

export const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";

export const RESEND_FROM = process.env.RESEND_FROM ?? "onboarding@resend.dev";

export const EMERGENCY_EMAIL = process.env.EMERGENCY_EMAIL ?? "";

// Clinic display name used to brand outgoing emails (booking confirmations).
export const CLINIC_NAME = process.env.CLINIC_NAME ?? "Dhaka Dental Care";

export const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY ?? "";

export const SARVAM_API_KEY = process.env.SARVAM_API_KEY ?? "";
export const SARVAM_SPEAKER = process.env.SARVAM_SPEAKER ?? "roopa_bn_conversational";

export const AWS_REGION = process.env.AWS_REGION ?? "";

export const AWS_S3_BUCKET =
  process.env.S3_BUCKET ?? process.env.AWS_S3_BUCKET ?? "";

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID ?? "";

export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY ?? "";
