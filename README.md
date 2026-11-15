# StrategyByte ByteVoice — Bangla AI Voice Receptionist for Healthcare

> **AI Engineer Technical Submission** | **StrategyByte**, Parramatta NSW 2150  
> **Demo Implementation:** Dhaka Dental Care, Bangladesh  
> **Product Platform:** [ByteVoice](https://bytevoice.com.au) (`bytevoice.com.au`)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16_App_Router-black?logo=next.js)](https://nextjs.org/)
[![Express 5](https://img.shields.io/badge/Express-5.x-green?logo=express)](https://expressjs.com/)
[![Prisma 7](https://img.shields.io/badge/Prisma-7.x-2D3748?logo=prisma)](https://www.prisma.io/)
[![LangGraph.js](https://img.shields.io/badge/LangGraph.js-v1-orange)](https://langchain-ai.github.io/langgraphjs/)
[![Deepgram](https://img.shields.io/badge/Deepgram-Nova--3_STT_(bn)-13EF93)](https://deepgram.com/)
[![Sarvam AI](https://img.shields.io/badge/Sarvam_AI-Bulbul_TTS_(bn)-blueviolet)](https://www.sarvam.ai/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-Credentials-red)](https://better-auth.com/)

---

## 1. Case Study & Overview

StrategyByte is an Australian AI company specializing in conversational voice agents and healthcare workflow automation. Our flagship product, **ByteVoice**, answers and manages clinical front-desk telephone operations. 

Healthcare providers in **Bangladesh** depend heavily on phone calls as their primary patient touchpoint. Most patients communicate in **colloquial Bangla**, frequently code-switching with English clinical terms (*"doctor"*, *"appointment"*, *"scaling"*, *"root canal"*). Front desks routinely suffer from:
- **High Missed-Call Rates:** Staff occupied with walk-in patients miss valuable booking calls.
- **After-Hours Inquiries:** Zero automated coverage during evenings and weekends.
- **Manual Booking Friction:** Lost appointment details and double bookings in paper/spreadsheet registers.
- **Receptionist Overload:** Repetitive inquiries about opening hours, scaling fees, and doctor schedules consume clinic staff hours.
- **Unstructured Records:** Crucial clinical notes and patient intent spoken over the phone are lost.

### The Solution: Dhaka Dental Care Demo
This repository delivers an end-to-end production-grade implementation of **ByteVoice for Bangladesh Healthcare**, featuring:
1. **Bilingual Landing Page with 3D Hero:** Introduces the platform in English and natural Bangla, featuring an interactive 3D dental tooth visualization.
2. **Hero Voice Caller:** Direct 1-click in-browser spoken Bangla call with live animated orb visualizer, turn-taking, and digit-by-digit phone readback.
3. **Multi-Agent Conversational Brain:** LangGraph.js v1 `StateGraph` routing between appointment actions (booking, rescheduling, cancelling), clinic FAQ retrieval, and emergency triage.
4. **Clinical Data Portal:** Complete admin system with automated post-call LLM extraction, phone normalization, outcome filtering, audio playback, and PostgreSQL relational storage.

---

## 2. Reviewer Quick Access

| Item | Details |
| :--- | :--- |
| **Portal Sign-in URL** | `/sign-in` (or `http://localhost:3000/sign-in`) |
| **Reviewer Email** | `reviewer@strategybyte.com.au` |
| **Reviewer Password** | `StrategyByte2026!` |
| **Landing Page** | `/` (Interactive 3D Hero + 1-Click "Talk to our Bangla caller") |
| **Call Logs & Extractions** | `/calls` (Filtered by Booked, Enquiries, Follow-up Needed, Incomplete) |
| **Doctor Management** | `/doctors` & `/doctors/[id]` (Weekly schedules & exceptions) |
| **Appointment Calendar** | `/appointments` (Real-time bookings synced with voice agent) |

---

## 3. End-to-End Architecture

```
                          ┌──────────────────────────────────────────────┐
                          │         Browser Client (Next.js 16)          │
                          │   Bilingual UI • 3D Hero • WebM Recorder    │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                                 │ Socket.io (Utterance Chunks)
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │          Express 5 WebSocket Gateway         │
                          │        (apps/api/src/sockets/gateway.ts)     │
                          └───────┬───────────────────────────────┬──────┘
                                  │                               │
                        Speech-to-Text                     Text-to-Speech
                                  │                               │
                                  ▼                               ▼
                      ┌──────────────────────┐        ┌──────────────────────┐
                      │ Deepgram Nova-3 (bn) │        │   Sarvam AI Bulbul   │
                      │ Bangla Transcription │        │  Bengali TTS (roopa) │
                      └───────────┬──────────┘        └───────────▲──────────┘
                                  │                               │
                                  │ Spoken Bengali Text           │ Agent Audio
                                  ▼                               │
              ┌───────────────────────────────────────────────────────────────┐
              │            LangGraph.js v1 Multi-Agent Supervisor             │
              │                                                               │
              │   START ───▶ Guardrail (Dhaka Dental Care Scope Filter)       │
              │                 │                                             │
              │                 ▼                                             │
              │             Supervisor (Contextual Turn Router)               │
              │                 │                                             │
              │       ┌─────────┼───────────────────────────┐                 │
              │       ▼         ▼                           ▼                 │
              │     [FAQ]  [Appointment]               [Emergency]            │
              │    (Fees &  • list_doctors            (Urgent triage &        │
              │    Hours)   • book_appointment         Resend email)          │
              │             • reschedule_appointment                          │
              │             • cancel_appointment                              │
              │                 │                                             │
              │                 ▼                                             │
              │                END                                            │
              └─────────────────┬─────────────────────────────────────────────┘
                                │
                                │ Call Hangup (call:end / disconnect)
                                ▼
              ┌───────────────────────────────────────────────────────────────┐
              │           Post-Call LLM Extraction & Persistence Engine       │
              │                                                               │
              │  1. Audio Merge: ffmpeg concat (WebM + MP3) ──▶ AWS S3 Upload │
              │  2. Structured Extraction: gpt-4o-mini with Zod Schema        │
              │  3. Phone Normalizer: Bengali numerals (০-৯) ──▶ 01XXXXXXXXX  │
              │  4. Database Upsert: Patient, Call, CallExtraction in Postgres│
              └───────────────────────────────────────────────────────────────┘
```

---

## 4. Key Engineering Decisions & Trade-Offs

### 1. Voice Pipeline: Deepgram (`bn`) + Sarvam AI Bulbul
* **Why Deepgram:** Deepgram's `nova-3` model with `language: "bn"` delivers sub-400ms turnaround on prerecorded utterance chunks with smart formatting, punctuation, and robust recognition of mixed English loanwords (*"root canal"*, *"scaling"*). A fallback to `general` ensures zero call drops if custom models degrade.
* **Why Sarvam AI:** Generic multilingual TTS engines often mispronounce Bengali vowel shifts and sound unnatural. Sarvam AI's `bulbul:v4-flash` model (`roopa_bn_conversational` speaker) is native to South Asian languages, delivering warm, natural colloquial Dhaka Bengali prosody.

### 2. Multi-Agent Orchestration: LangGraph.js v1
* **Context Stickiness:** Instead of a single brittle monolithic prompt, a `StateGraph` separates concerns:
  - `guardrail.node.ts`: Filters malicious spam or non-clinical chatter.
  - `supervisor.node.ts`: Analyzes conversation history and previous route to prevent mid-booking turns (like a caller stating their phone number) from drifting into general FAQ.
  - `appointment.node.ts`: Autonomous tool-calling loop equipped with `list_doctors`, `book_appointment`, `reschedule_appointment`, and `cancel_appointment`.
* **Digit Readback Enforcement:** System prompts explicitly instruct the AI receptionist to confirm Bangladeshi mobile numbers **digit by digit in Bangla** (*"শূন্য এক সাত এক দুই..."*) before confirming a booking.

### 3. Post-Call Extraction & Bangladeshi Phone Normalization
* **Non-Blocking Execution:** Audio finalization (ffmpeg merging) and LLM structured extraction run asynchronously on socket teardown. The socket is freed instantly, ensuring zero browser hanging.
* **Bangla Digit Normalizer:** Callers frequently state numbers in Bengali digits (`০১৭১২৩৪৫৬৭৮`) or words. Our regex normalizer (`BN_TO_EN_DIGITS`) converts Bengali numerals to ASCII, strips international prefixes (`+880`), and validates 11-digit Bangladeshi mobile formats (`01[3-9]\d{8}`).

### 4. Data Portal & Schema Design
* **Relational PostgreSQL via Prisma 7:** Follows clean separation across `Call`, `Patient`, `CallExtraction`, `Appointment`, `Doctor`, and `DoctorSchedule`.
* **JSON Transcripts:** Transcripts are preserved as structured JSON arrays (`[{ role, text, at }]`), allowing instant UI rendering of conversational chat bubbles with millisecond timestamps and audio synchronization.

---

## 5. Database Schema & Data Model

| Model | Fields | Purpose |
| :--- | :--- | :--- |
| **`Call`** | `id`, `callId`, `startedAt`, `endedAt`, `durationSec`, `userTurns`, `transcript`, `audioKey`, `recordingUrl`, `status`, `outcome` | Master record for each phone interaction |
| **`Patient`** | `id`, `fullName`, `phone`, `email`, `notes`, `createdAt` | Patient entity linking calls, bookings, and extractions |
| **`CallExtraction`** | `id`, `callId`, `patientName`, `phone`, `reasonForVisit`, `preferredDateTime`, `intent`, `outcome`, `notes`, `validationStatus` | AI structured fields extracted post-call |
| **`Appointment`** | `id`, `doctorId`, `patientId`, `callId`, `patientName`, `patientPhone`, `startTime`, `endTime`, `status`, `reason` | Live dental clinic booking schedule |
| **`Doctor`** | `id`, `name`, `department`, `speciality`, `isActive` | Dhaka Dental Care specialists |
| **`DoctorSchedule`**| `id`, `doctorId`, `dayOfWeek`, `startTime`, `endTime` | Weekly recurring operating hours |
| **`ScheduleException`**| `id`, `doctorId`, `date`, `type` (`OFF`/`CUSTOM`), `startTime`, `endTime` | Holidays, emergency leave, or custom shift hours |

---

## 6. Monorepo Structure

```
byte-care/
├── apps/
│   ├── api/                       # Express 5 + Prisma 7 Backend & Voice Engine
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # PostgreSQL Prisma schema
│   │   │   └── seed.ts            # Seed script (doctors, schedules, realistic Bangla calls)
│   │   ├── src/
│   │   │   ├── agents/            # LangGraph.js v1 multi-agent StateGraph
│   │   │   │   ├── tools/         # list_doctors, book, reschedule, cancel tools
│   │   │   │   ├── appointment.node.ts
│   │   │   │   ├── emergency.node.ts
│   │   │   │   ├── faq.node.ts
│   │   │   │   ├── guardrail.node.ts
│   │   │   │   └── supervisor.node.ts
│   │   │   ├── config/            # voice.ts, agents.ts, config.ts
│   │   │   ├── helpers/           # callExtractor.ts (phone normalizer), callRecording.ts
│   │   │   ├── libs/              # deepgram.ts, sarvam.ts, prisma.ts, mailer.ts, s3.ts
│   │   │   └── sockets/           # Socket.io gateway & voice-turn.ts pipeline
│   │   └── test/                  # Automated unit tests (phone normalizer)
│   │
│   └── web/                       # Next.js 16 App Router Frontend & Portal
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx       # Landing page root
│       │   │   ├── (app)/         # Gated clinical dashboard routes
│       │   │   │   ├── dashboard/ # KPI summary & appointments overview
│       │   │   │   ├── calls/     # Structured call records & detail dialog
│       │   │   │   ├── doctors/   # Doctor & schedule management
│       │   │   │   ├── appointments/ # Calendar & booking management
│       │   │   │   └── analytics/ # Patient trends & clinic analytics
│       │   │   └── sign-in/       # Better Auth login screen
│       │   ├── components/
│       │   │   ├── landing/       # Hero, Hero3D, Features, UseCases, HowItWorks, Nav
│       │   │   └── call/          # Voice overlay, animated voice orb, captions
│       │   ├── context/           # call-provider.tsx, language-context.tsx
│       │   └── scripts/           # seed-admin.ts (deterministic reviewer seeding)
│
├── packages/
│   ├── shared/                    # Shared contracts (Socket.io events, payloads)
│   ├── eslint-config/             # Workspace linting configuration
│   └── typescript-config/         # Shared tsconfig bases
│
├── docs/
│   ├── product-overview.md        # Technical platform overview
│   ├── coding-standards.md        # Engineering guidelines & patterns
│   └── walkthrough-script.md      # Exact 3-minute video presentation script
│
├── package.json                   # Root scripts & pnpm workspace config
├── pnpm-workspace.yaml
└── README.md
```

---

## 7. Local Setup & Quick Start

### Prerequisites
- **Node.js** `>= 18.0.0`
- **pnpm** `>= 9.0.0`
- **PostgreSQL** instance (local, Supabase, or Neon)

### 1. Clone & Install Dependencies
```bash
git clone <repository-url>
cd byte-care
pnpm install
```

### 2. Environment Variables Configuration

**Backend (`apps/api/.env`):**
```ini
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/byte_care?sslmode=disable"
PORT=5500
WEB_ORIGIN="http://localhost:3000"

OPENAI_API_KEY="sk-..."
DEEPGRAM_API_KEY="..."
SARVAM_API_KEY="..."
SARVAM_SPEAKER="roopa_bn_conversational"

# Optional
CLINIC_NAME="Dhaka Dental Care"
RESEND_API_KEY="..."
EMERGENCY_EMAIL="owner@clinic.com"
```

**Frontend (`apps/web/.env`):**
```ini
NEXT_PUBLIC_API_URL="http://localhost:5500/api/v1"
NEXT_PUBLIC_SOCKET_URL="http://localhost:5500"

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/byte_care?sslmode=disable"
BETTER_AUTH_SECRET="f9b4c8d1e2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9"
BETTER_AUTH_URL="http://localhost:3000"

ADMIN_EMAIL="admin@strategybyte.com.au"
ADMIN_PASSWORD="StrategyByte2026!"
```

### 3. Database Migration & Pre-Seeding
Run Prisma migrations and seed realistic clinical demo data:
```bash
# Push schema and generate Prisma client
pnpm -F api exec prisma db push

# Seed Dhaka Dental Care doctors, schedules, and test calls with transcripts
pnpm -F api seed

# Seed the deterministic Reviewer admin account
pnpm -F web seed:admin
```

### 4. Start Development Servers
```bash
pnpm dev
```
- **Landing Page:** Open [http://localhost:3000](http://localhost:3000)
- **Data Portal:** Open [http://localhost:3000/sign-in](http://localhost:3000/sign-in) and log in with:
  - **Email:** `reviewer@strategybyte.com.au`
  - **Password:** `StrategyByte2026!`

---

## 8. Verification & Quality Gates

This repository maintains zero-warning compliance across strict TypeScript and ESLint:

```bash
# Type check across all 5 workspace projects
pnpm check-types

# Zero-warning lint check
pnpm lint

# Unit tests (Bangla phone normalizer)
pnpm -F api exec tsx test/phoneNormalizer.test.ts
```

---

## 9. Submission & Video Walkthrough Guide

The 3-minute video presentation should be recorded following the step-by-step instructions in [docs/walkthrough-script.md](file:///c:/Users/Elias/elias/interview-tasks/byte-care/docs/walkthrough-script.md):
- **0:00 – 0:50:** Landing page, ByteVoice introduction, interactive 3D hero tooth, bilingual toggle.
- **0:50 – 2:05:** Live spoken Bangla call from hero CTA, code-switching demo, digit-by-digit phone readback, appointment confirmation.
- **2:05 – 3:00:** Reviewer login, live call appearance on `/calls`, structured extraction card, validated BD phone number, and full transcript.

### Submission Links Checklist
- [ ] **Landing Page Live Link:** `https://your-bytevoice-app.vercel.app`
- [ ] **Data Portal Live Link:** `https://your-bytevoice-app.vercel.app/sign-in`
- [ ] **GitHub Repository Link:** `https://github.com/your-username/byte-care`
- [ ] **3-Minute Video Overview Link:** `https://loom.com/share/...` (or YouTube / Google Drive)

---

**Developed for StrategyByte AI Engineer Assessment** | *Parramatta, Sydney NSW & Dhaka, Bangladesh*
