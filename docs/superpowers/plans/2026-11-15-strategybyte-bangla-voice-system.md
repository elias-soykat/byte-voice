# StrategyByte ByteVoice: Bangla AI Voice Receptionist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade Bangla AI Voice Receptionist system for StrategyByte's ByteVoice tailored for Bangladeshi dental clinics and hospitals (Dhaka Dental Care demo), fully integrating a responsive bilingual landing page with a 3D Hero element, browser-based voice caller with code-switching and digit-by-digit readback, and an admin data portal with post-call LLM extraction and structured schema.

**Architecture:** 
- **Voice Pipeline**: Browser (WebRTC/Socket.io) ↔ Express backend ↔ Deepgram STT (Bangla `bn` language model) ↔ LangGraph.js v1 StateGraph multi-agent brain (GPT-4o / GPT-4o-mini with Dhaka Dental Care tools and Bangla digit readback) ↔ ElevenLabs TTS (Multilingual model with natural Bengali voice) ↔ Browser audio playback with bilingual caption overlay.
- **Post-Call Structured Extraction**: Non-blocking extraction worker on call hangup using `gpt-4o-mini` with structured JSON output, validating Bangladeshi phone formats, normalizing Bangla numerals (`০-৯` → `0-9`), categorizing outcome (`BOOKED`, `ENQUIRY`, `FOLLOW_UP_NEEDED`, `INCOMPLETE`, `FAILED`), and storing relational records in PostgreSQL via Prisma.
- **Frontend & Portal**: Next.js 16 App Router with Tailwind CSS v4, Framer Motion, Three.js 3D hero visualization, bilingual toggle (EN/BN), Better Auth credentials authentication, and enriched call analytics portal.

**Tech Stack:** Next.js 16, React 19, Express 5, Prisma 7, PostgreSQL (Neon/Supabase), LangGraph.js, Deepgram SDK, ElevenLabs JS, Three.js, Better Auth, Tailwind CSS v4, TypeScript strict mode.

**Spec:** [StrategyByte_AI_Engineer_Task_Brief_14Nov.md](file:///c:/Users/Elias/elias/byte-care/StrategyByte_AI_Engineer_Task_Brief_14Nov.md)

---

## Global Constraints

- Company identity: StrategyByte (Australian AI company, `bytevoice.com.au`), product: ByteVoice, launch market: Bangladesh healthcare (demo client: Dhaka Dental Care).
- Voice agent persona: Polite, warm, competent receptionist speaking natural, everyday Bangla with smooth handling of Bangla/English code-switching ("appointment", "doctor", "scaling").
- Required clinical flow:
  1. Greeting: `"আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?"`
  2. Patient name confirmed back; phone number captured and read back digit by digit in Bangla.
  3. Reason for visit captured (e.g. toothache, cleaning/scaling, check-up, root canal).
  4. Preferred date & time captured with natural relative phrasing (e.g. "next Sunday evening" / "আগামী রবিবার সন্ধ্যায়").
  5. Dental enquiry/booking handling against real doctor schedules.
  6. Out-of-scope medical/prescription advice politely declined and routed for human staff callback.
  7. Ending summary of agreed details.
- Data schema entities: `calls`, `patients`, `call_extractions`, `transcript_turns`, `appointments`.
- Call outcomes: `BOOKED`, `ENQUIRY`, `FOLLOW_UP_NEEDED`, `INCOMPLETE`, `FAILED`.
- Hero requirements: Clear "Talk to our Bangla caller" CTA; 3D element in Hero (Bonus); Bilingual toggle [EN / BN] (Bonus); Responsive mobile & desktop.
- Monorepo consistency: pnpm workspaces, strict TypeScript, zero eslint warnings.

---

## Review Focus

1. **Bangla & English Digit Code-Switching**: Callers say phone numbers in mixed Bengali and English digits (e.g., "০১৭ double one 234"); the system must normalize all digits to standard E.164 / `01XXXXXXXXX` Bangladeshi format and read back clearly in Bangla.
2. **Medical Advice Guardrail**: Callers asking "Which medicine should I take for toothache?" must not receive invented medical advice; the agent must decline courteously and offer a human doctor callback.
3. **Turn Silence & Low Latency**: Caller pauses or background noise must not crash the turn; STT failures must gracefully ask the caller to repeat without dropping the call.
4. **Post-Call Extraction Robustness**: Post-call LLM extraction must be non-blocking to socket teardown; if audio merging or S3 fails, the structured extraction and transcript must still be preserved with status `NO_AUDIO` or `FAILED`.
5. **Direct Browser Calling**: The reviewer must be able to click "Talk to our Bangla caller" directly from the hero and speak without being blocked by an mandatory pre-call email modal.

---

## Task Decomposition

### Task 1: Database Schema Expansion & Relational Data Layer
**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/data/patients.data.ts`
- Modify: `apps/api/src/data/calls.data.ts`
- Modify: `apps/api/src/types/call.ts` (or schemas)
- Create: `apps/api/prisma/seed.ts`

**Interfaces:**
- Consumes: Prisma 7 Client singleton `apps/api/src/libs/prisma.ts`.
- Produces:
  - `Patient` model: `{ id, fullName, phone, email?, notes?, createdAt, updatedAt }`
  - `CallExtraction` model: `{ id, callId, patientName?, phone?, reasonForVisit?, preferredDateTime?, intent?, outcome, notes?, validationStatus }`
  - `CallOutcome` enum: `BOOKED`, `ENQUIRY`, `FOLLOW_UP_NEEDED`, `INCOMPLETE`, `FAILED`
  - `Appointment` relation to `patientId` and `callId`.
  - `seed.ts` to pre-populate Dhaka Dental Care doctors, services, and realistic test calls.

- [ ] **Step 1: Update Prisma Schema**
  Add `Patient` and `CallExtraction` models, update `Call` with `patientId`, `outcome`, and update `Appointment` with `patientId`, `callId`, and `phone`. Add `CallOutcome` enum.
- [ ] **Step 2: Generate Prisma Client & Run Migration**
  Run `pnpm exec prisma db push` or `prisma migrate dev --name add_bangla_voice_models` in `apps/api`.
- [ ] **Step 3: Implement `patients.data.ts` and update `calls.data.ts`**
  Implement `findOrCreatePatientByPhone`, `saveCallExtraction`, `findCallsWithExtractions`.
- [ ] **Step 4: Create Comprehensive Seed Script (`apps/api/prisma/seed.ts`)**
  Seed Dhaka Dental Care doctors (Dr. Tanvir Ahmed, Dr. Farzana Rahman, Dr. Shakil Hossain, Dr. Nusrat Jahan) with weekly schedules, dental clinic FAQ documents, and 4-5 pre-loaded realistic calls with Bengali transcripts and structured extractions.
- [ ] **Step 5: Run Seed & Verify DB Contents**
  Run `pnpm -F api seed` and verify rows are populated.

---

### Task 2: Post-Call LLM Structured Extraction Engine
**Files:**
- Create: `apps/api/src/helpers/callExtractor.ts`
- Modify: `apps/api/src/helpers/callRecording.ts`
- Create: `apps/api/test/callExtractor.test.ts` (or verification script)

**Interfaces:**
- Consumes: `CallSession` transcript array `{ role, text, at }[]`, `chatModel()` / `routerModel()`.
- Produces: `extractCallData(transcript: TranscriptEntry[], patientName?: string): Promise<ExtractedCallPayload>`.

- [ ] **Step 1: Define Extraction Zod Schema**
  Define Zod schema for structured output: `patientName`, `phone`, `reasonForVisit`, `preferredDateTime`, `intent`, `outcome` (`BOOKED | ENQUIRY | FOLLOW_UP_NEEDED | INCOMPLETE | FAILED`), and `notes`.
- [ ] **Step 2: Implement Phone Normalizer for Bangladesh**
  Build helper `normalizeBanglaPhone(raw: string): { phone: string; isValid: boolean }` converting Bengali numerals (`০১২৩৪৫৬৭৮৯` → `0123456789`), stripping non-digits, and validating 11-digit BD mobile format (`01[3-9]\d{8}`).
- [ ] **Step 3: Implement `extractCallData` in `callExtractor.ts`**
  Use OpenAI structured output (`withStructuredOutput`) to analyze the full call transcript and extract patient details, intent, and outcome.
- [ ] **Step 4: Integrate with `finalizeCall` in `callRecording.ts`**
  When a call ends, invoke `extractCallData()`, upsert `Patient`, create `CallExtraction`, and update the `Call` record with outcome and patient link. Ensure errors do not throw.
- [ ] **Step 5: Test Extraction Engine**
  Run verification test with a sample Bengali dental appointment transcript and verify extracted JSON.

---

### Task 3: Bangla Voice Pipeline & Dhaka Dental Care Brain
**Files:**
- Modify: `apps/api/src/config/voice.ts`
- Modify: `apps/api/src/libs/deepgram.ts`
- Modify: `apps/api/src/libs/elevenlabs.ts`
- Modify: `apps/api/src/config/agents.ts`
- Modify: `apps/api/src/agents/appointment.node.ts`
- Modify: `apps/api/src/agents/tools/appointment.tools.ts`
- Modify: `apps/api/src/agents/emergency.node.ts`
- Modify: `apps/api/src/agents/guardrail.node.ts`
- Modify: `apps/api/src/sockets/handlers/voice-turn.ts`

**Interfaces:**
- Consumes: Deepgram STT, ElevenLabs TTS, LangGraph v1 multi-agent supervisor.
- Produces: Real-time Bengali speech recognition, Dhaka Dental Care booking tools with Bangla digit readback, medical advice guardrail.

- [ ] **Step 1: Configure Deepgram for Bangla (`bn`)**
  Update `transcribeAudio` in `deepgram.ts` with `language: "bn"`, `model: "nova-2"` (or appropriate model), enabling punctuation and smart formatting.
- [ ] **Step 2: Configure ElevenLabs Multilingual & Bangla Receptionist Voice**
  Update `voice.ts` to use `eleven_multilingual_v2` / `eleven_turbo_v2_5` with an appropriate voice ID and the official greeting:
  `"আসসালামু আলাইকুম, ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম। আমি কীভাবে আপনাকে সাহায্য করতে পারি?"`
- [ ] **Step 3: Update Multi-Agent Prompts for Dhaka Dental Care**
  Update `GUARDRAIL_PROMPT`, `SUPERVISOR_PROMPT`, `APPOINTMENT_SYSTEM_PROMPT`, and `FAQ_PROMPT` in `agents.ts`:
  - Receptionist persona for Dhaka Dental Care (services: Scaling, Root Canal, Dental Implants, Teeth Whitening, Braces, Tooth Extraction).
  - Polite Bengali conversational tone, handling code-switching naturally.
  - Ask for caller name and Bangladeshi phone number; read back phone number digit by digit in Bangla (e.g., "শূন্য এক সাত...").
  - Relative date/time resolution (e.g. "আগামী রবিবার বিকেল ৫টা" → ISO datetime).
  - Out-of-scope medical advice: politely decline and offer human callback.
- [ ] **Step 4: Update Booking & Clinic Tools**
  Update `listDoctorsTool` and `bookAppointmentTool` to support Bengali search queries, phone number persistence, and Dhaka Dental Care doctors.
- [ ] **Step 5: Enhance Voice Turn Handler (`voice-turn.ts`)**
  Ensure turn handling logs Bangla transcripts clearly, handles speech interrupts/turn endings smoothly, and returns bilingual caption data.

---

### Task 4: Rebranding, Bilingual Toggle & 3D Hero Element
**Files:**
- Create: `apps/web/src/components/landing/hero-3d.tsx`
- Create: `apps/web/src/components/landing/language-context.tsx`
- Create: `apps/web/src/lib/translations.ts`
- Modify: `apps/web/src/components/landing/hero.tsx`
- Modify: `apps/web/src/components/landing/landing-nav.tsx`
- Modify: `apps/web/src/components/landing/features.tsx`
- Modify: `apps/web/src/components/landing/how-it-works.tsx`
- Modify: `apps/web/src/components/landing/cta.tsx`
- Modify: `apps/web/src/components/landing/footer.tsx`
- Modify: `apps/web/src/app/page.tsx`

**Interfaces:**
- Consumes: Three.js or lightweight 3D Canvas rendering, React context for language state (`bn` | `en`).
- Produces:
  - StrategyByte / ByteVoice Bangladesh healthcare branding.
  - Interactive 3D hero visualization (stylized 3D glowing dental tooth / soundwave orb).
  - Prominent "Talk to our Bangla caller" CTA button.
  - Language toggle [English / বাংলা] updating all landing sections seamlessly.

- [ ] **Step 1: Install & Set Up Three.js for 3D Hero**
  Add `three` and `@types/three` to `apps/web`. Implement `hero-3d.tsx` with an interactive, glowing 3D tooth/orb geometry with particle audio wave animation reacting to mouse movement.
- [ ] **Step 2: Implement Bilingual Translation Dictionary (`translations.ts`)**
  Create full English and Bengali dictionary covering:
  - StrategyByte ByteVoice introduction for Bangladesh healthcare.
  - Hero headline, subhead, CTA buttons ("Talk to our Bangla caller" / "আমাদের বাংলা কলারের সাথে কথা বলুন").
  - Features: 24/7 Bangla caller, Missed call recovery, Real-time appointment booking, Receptionist workload reduction.
  - Use cases: Dental clinics (Dhaka Dental Care), Diagnostic centres, Hospital outpatients.
  - How it works: Listen in Bangla → Understand & check schedule → Book & update portal.
- [ ] **Step 3: Create `LanguageContext` & Toggle Component**
  Implement `LanguageProvider` with language switcher pill (`EN | বাংলা`) in `landing-nav.tsx`.
- [ ] **Step 4: Update Hero & Landing Components**
  Integrate `Hero3D`, wire up translations across all landing page sections, and highlight StrategyByte ByteVoice credentials.
- [ ] **Step 5: Streamline Hero Voice Call Trigger**
  Update Hero CTA to directly open the voice call experience (`useCall().startCallDirect()` or quick prompt) so the user experiences the live Bangla receptionist immediately.

---

### Task 5: Browser Voice Experience & Bilingual Call Overlay
**Files:**
- Modify: `apps/web/src/context/call-provider.tsx`
- Modify: `apps/web/src/components/call/call-overlay.tsx`
- Modify: `apps/web/src/components/call/call-orb.tsx`
- Modify: `apps/web/src/components/call/pre-call-dialog.tsx`
- Modify: `packages/shared/src/socket.ts`

**Interfaces:**
- Consumes: Web Speech / MediaRecorder, Socket.io client.
- Produces: Smooth connecting, live, speaking, listening, and ended states with Bangla/English status indicators and microphone error handling.

- [ ] **Step 1: Allow Direct Call Connection Without Mandatory Pre-Call Modal**
  Update `call-provider.tsx` and `socket.ts` so `call:start` can be triggered directly with empty/optional details; the AI agent gathers caller details naturally during the spoken conversation.
- [ ] **Step 2: Bilingual Call Overlay Statuses**
  Update `call-overlay.tsx` with Bengali and English status texts:
  - Connecting: "সংযুক্ত হচ্ছে… / Connecting…"
  - Listening: "আপনার কথা শুনছি… / Listening…"
  - Thinking: "প্রসেসিং হচ্ছে… / Thinking…"
  - Speaking: "ঢাকা ডেন্টাল কেয়ার কথা বলছে… / Speaking…"
  - Ended: "কল শেষ হয়েছে / Call ended"
- [ ] **Step 3: Graceful Microphone & Connection Error Handling**
  Provide clear visual toasts/banners in Bangla and English if microphone permission is denied or server connection fails.
- [ ] **Step 4: Verify Full Spoken Turn Cycle**
  Test user audio capture → server STT → agent response → TTS playback → caption rendering.

---

### Task 6: Data Portal Upgrade & Enriched Calls View
**Files:**
- Modify: `apps/web/src/types/call.ts`
- Modify: `apps/web/src/services/calls.ts`
- Modify: `apps/web/src/app/(app)/calls/page.tsx`
- Modify: `apps/web/src/app/(app)/calls/_components/calls-table.tsx`
- Modify: `apps/web/src/app/(app)/calls/_components/call-detail-dialog.tsx`
- Modify: `apps/web/src/app/(app)/calls/_components/call-status-badge.tsx`
- Modify: `apps/api/src/controllers/call.controller.ts`

**Interfaces:**
- Consumes: Updated Prisma `Call` with `CallExtraction` and `Patient`.
- Produces: Portal table with outcome filters, detailed extraction card, speaker-labeled timestamps, and audio playback.

- [ ] **Step 1: Update Frontend Call Types & API Service**
  Add `outcome` (`BOOKED`, `ENQUIRY`, `FOLLOW_UP_NEEDED`, `INCOMPLETE`, `FAILED`), `patientPhone`, `extraction` (`reasonForVisit`, `preferredDateTime`, `intent`, `notes`), and formatted turns to `types/call.ts`.
- [ ] **Step 2: Update `call.controller.ts` on Backend**
  Include `extraction` and `patient` in `getCalls` and `getCallById` API endpoints, and support status filtering (`?outcome=BOOKED`).
- [ ] **Step 3: Update `CallsTable` with Outcome Badges & Details**
  Show Caller Name, Phone Number, Date & Time, Duration, Turns, and Outcome Badges with distinct colors (Green for `BOOKED`, Blue for `ENQUIRY`, Orange for `FOLLOW_UP_NEEDED`, Gray for `INCOMPLETE`).
- [ ] **Step 4: Redesign `CallDetailDialog`**
  Add a dedicated "Structured Extractions" panel:
  - Patient Name & Validated Phone Number
  - Reason for Visit
  - Preferred Date & Time
  - Call Outcome & Intent
  - Notes / Escalation status
  - Full transcript with timestamps and speaker tags (Agent vs Caller)
  - Audio recording player.
- [ ] **Step 5: Add Outcome Filter Tabs**
  Add filter pills to `calls/page.tsx` to easily filter by `All`, `Booked`, `Enquiries`, and `Follow-up Needed`.

---

### Task 7: Reviewer Auth, Seeds, Verification & Deliverables
**Files:**
- Create: `apps/web/src/scripts/seed-reviewer.ts`
- Modify: `apps/api/prisma/seed.ts`
- Modify: `README.md`
- Create: `docs/walkthrough-script.md`

**Interfaces:**
- Produces: Fully seeded reviewable database, deterministic admin credentials, comprehensive README, and 3-minute video recording guide.

- [ ] **Step 1: Create Reviewer Admin Account Seed**
  Seed admin login: `reviewer@strategybyte.com.au` / password `StrategyByte2026!` using Better Auth script.
- [ ] **Step 2: Pre-load Realistic Demo Calls**
  Run the seed to inject 5 realistic dental clinic calls (e.g. Toothache booking with Dr. Tanvir, Scaling price enquiry, Root canal scheduling, Out-of-scope medical advice escalation).
- [ ] **Step 3: Monorepo Verification & Type Checks**
  Run `pnpm check-types` and `pnpm lint` across the entire workspace to ensure zero errors and zero warnings.
- [ ] **Step 4: Update README.md**
  Document the StrategyByte case study, architecture, data model, local setup, deployment guide, reviewer login details, and API references.
- [ ] **Step 5: Write 3-Minute Video Walkthrough Script (`docs/walkthrough-script.md`)**
  Structure exact 3-minute demo script:
  - 0:00 - 0:45: Landing page, ByteVoice introduction, 3D Hero, bilingual toggle.
  - 0:45 - 2:00: Live Bangla voice call demonstrating booking in Bangla, code-switching, phone confirmation.
  - 2:00 - 3:00: Data portal showing the live call appear, transcript, extracted fields, and schema explanation.

---

## Self-Review Checklist

- **Spec coverage**:
  - Part A (Landing Page with 3+ sections, responsive, 3D hero, bilingual toggle): Covered in Task 4.
  - Part B (Talk to our Bangla caller hero CTA, live audio, mic handling): Covered in Task 4 & Task 5.
  - Part C (Bangla receptionist voice, Dhaka Dental Care, greeting, name/phone confirmation, digit readback, date/time resolution, out-of-scope triage): Covered in Task 3.
  - Part D (Data portal, relational schema, post-call extraction, call list filters, detailed extraction view, reviewer login): Covered in Task 1, Task 2, Task 6, and Task 7.
  - Deliverables (Pre-loaded data, README, video walkthrough script): Covered in Task 7.
- **Type consistency**: All shared contracts and types align across `apps/api`, `apps/web`, and `@repo/shared`.
- **Review Focus**: Bengali digits, medical advice refusal, turn recovery, and non-blocking extractions are explicitly tested in Tasks 2, 3, and 5.
