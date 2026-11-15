# Live Call Appointment Linkage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish rock-solid relational data integrity linking every appointment created during an AI conversation to the originating voice call in PostgreSQL via Prisma, LangGraph agent tool execution, and the staff portal.

**Architecture:**
- **Database Layer**: Update Prisma schema so `Appointment.callId` is an indexed non-unique foreign key referencing `Call.id`, establishing a 1-to-many relationship (`Call.appointments Appointment[]`).
- **Call Session Lifecycle**: Create the database `Call` record at `call:start` (status: `"IN_PROGRESS"`) and store its database CUID (`callDbId`) in the active `CallSession`. On `call:end`, update the existing `Call` record (idempotent, preventing duplicates). Fail fast if `Call` record creation fails.
- **Trusted Tool Context**: Pass `callDbId` through the Socket.IO voice turn handler, `runAgent()`, LangGraph `AgentState`, and `appointmentNode` to `makeBookAppointmentTool` via trusted server context (not LLM parameters).
- **Duplicate Prevention & Idempotency**: Detect duplicate booking attempts for the same call and time slot to avoid duplicate appointments during LLM retries or multi-step turns.
- **Deterministic Extraction**: In `callExtractor.ts`, query appointments directly by `callId: callDbId` (no heuristic matching), link patient IDs, and set call outcome to `BOOKED`.
- **Portal & API**: Enrich API responses so calls include `appointments` and appointments include `call`. Update staff portal UI in `calls` and `appointments` to display linked data and allow cross-navigation.

**Tech Stack:** Next.js 16 (App Router), React 19, Express 5, Prisma 7, PostgreSQL (Supabase), LangGraph.js v1, Socket.IO, TypeScript strict.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `apps/api/prisma/schema.prisma` | Modify | Change `Appointment.callId` to non-unique with `@@index([callId])`; update `Call.appointments Appointment[]` |
| `apps/api/src/sockets/session.ts` | Modify | Add `callDbId?: string` to `CallSession` |
| `apps/api/src/sockets/gateway.ts` | Modify | Pre-create `Call` in DB on `call:start`, fail fast on error, set `session.callDbId` |
| `apps/api/src/sockets/handlers/voice-turn.ts` | Modify | Pass `callId: session.callDbId` into `runAgent()` |
| `apps/api/src/agents/state.ts` | Modify | Add `callId: z.string().optional()` to `AgentState` |
| `apps/api/src/agents/index.ts` | Modify | Add `callId?: string` to `RunAgentInput`, pass into graph invocation |
| `apps/api/src/agents/appointment.node.ts` | Modify | Pass `state.callId` to `makeBookAppointmentTool` |
| `apps/api/src/agents/tools/appointment.tools.ts` | Modify | Support `ctx.callId`, store in `Appointment`, prevent duplicate booking on retry |
| `apps/api/src/schemas/appointment.schema.ts` | Modify | Add `callId` and `patientPhone` to appointment schema |
| `apps/api/src/helpers/callRecording.ts` | Modify | Update existing `Call` by `session.callDbId` on `finalizeCall` instead of duplicating |
| `apps/api/src/helpers/callExtractor.ts` | Modify | Relational lookup by `callId: callDbId`, update `patientId` on linked appointments |
| `apps/api/src/data/calls.data.ts` | Modify | Include `appointments` in `callListInclude` and `findCallById` |
| `apps/api/src/data/appointments.data.ts` | Modify | Include `call` relation in `doctorInclude` |
| `apps/web/src/types/call.ts` | Modify | Update `CallSummary` and `CallDetail` with `appointments?: AppointmentSummary[]` |
| `apps/web/src/types/appointment.ts` | Modify | Add `callId?: string \| null` and `call?: CallBrief \| null` to `Appointment` |
| `apps/web/src/app/(app)/calls/_components/call-detail-dialog.tsx` | Modify | Render all linked appointments for the call with details and navigation |
| `apps/web/src/app/(app)/calls/_components/calls-table.tsx` | Modify | Display appointment status badge and count |
| `apps/web/src/app/(app)/appointments/_components/appointments-table.tsx` | Modify | Display linked call badge with duration, date, and link to call detail |
| `apps/api/test/appointmentLinkage.test.ts` | Create | Verification tests for end-to-end relational linkage and deduplication |

---

## Tasks

### Task 1: Prisma Schema & Database Index Migration
- [ ] **Step 1: Update `apps/api/prisma/schema.prisma`**
  - Change `callId String? @unique` to `callId String?` on `model Appointment`.
  - Add `@@index([callId])` to `model Appointment`.
  - Change `appointment Appointment?` to `appointments Appointment[]` on `model Call`.
- [ ] **Step 2: Update Supabase Postgres Database Indices via MCP tool**
  - Drop unique index `Appointment_callId_key`.
  - Create index `Appointment_callId_idx` on `"Appointment"("callId")`.
- [ ] **Step 3: Run `prisma generate` in `apps/api`**
  - Execute `pnpm exec prisma generate` to refresh the Prisma Client models.
- [ ] **Step 4: Update `apps/api/src/schemas/appointment.schema.ts`**
  - Add `callId: z.string().optional()` and `patientPhone: z.string().optional()` to `appointmentBaseSchema`.

### Task 2: Call Lifecycle & Session State (`session.ts`, `gateway.ts`, `callRecording.ts`)
- [ ] **Step 1: Update `CallSession` in `apps/api/src/sockets/session.ts`**
  - Add `callDbId?: string;` property to `CallSession` type.
  - In `createSession()`, initialize `callDbId: undefined`.
- [ ] **Step 2: Pre-create `Call` Record in `apps/api/src/sockets/gateway.ts`**
  - In `SocketEvent.CallStart` handler:
    - Call `callsData.createCall(...)` with status `"IN_PROGRESS"`, duration 0, and current timestamp.
    - If creation fails, do NOT silently ignore: emit `SocketEvent.CallError` to socket, log error, and abort call initialization.
    - Store `session.callDbId = callRecord.id`.
- [ ] **Step 3: Update `finalizeCall` in `apps/api/src/helpers/callRecording.ts`**
  - Check if `session.callDbId` exists:
    - If yes, use `callsData.updateCall(session.callDbId, { ... })` with endedAt, durationSec, userTurns, transcript, audioKey, status.
    - If no (edge case), create call via `callsData.createCall`.
  - Pass `callDbId: session.callDbId` to `processCallExtraction`.

### Task 3: Propagate `callDbId` & Implement Tool Linkage with Deduplication
- [ ] **Step 1: Update `voice-turn.ts` and `agents/index.ts`**
  - In `voice-turn.ts`: pass `callId: session.callDbId` to `runAgent()`.
  - In `agents/index.ts`: update `RunAgentInput` with `callId?: string`, pass into graph invocation.
- [ ] **Step 2: Update `AgentState` in `apps/api/src/agents/state.ts`**
  - Add `callId: z.string().optional()` to `AgentState`.
- [ ] **Step 3: Update `appointment.node.ts`**
  - Pass `callId: state.callId` into `makeBookAppointmentTool({ ... , callId: state.callId })`.
- [ ] **Step 4: Update `apps/api/src/agents/tools/appointment.tools.ts`**
  - Add `callId?: string` to `BookAppointmentContext`.
  - In `makeBookAppointmentTool`:
    - Only trust `ctx.callId` (server-side context); do not accept `callId` from LLM arguments.
    - Add duplicate prevention: check if an appointment already exists for `doctorId`, `startTime`, and `ctx.callId`.
    - If existing appointment found, return success message with existing appointment ID without duplicating.
    - Otherwise, create appointment with `callId: ctx.callId`.

### Task 4: Preserving Linkage in `callExtractor.ts`
- [ ] **Step 1: Update `processCallExtraction` in `apps/api/src/helpers/callExtractor.ts`**
  - Query appointments directly by `callId: callDbId`:
    `prisma.appointment.findMany({ where: { callId: callDbId }, include: { doctor: { select: { id: true, name: true, speciality: true } } } })`.
  - If linked appointments exist:
    - Mark `appointmentRecorded = true`.
    - Populate summary `appointment` object (first linked appointment) for client notification.
    - Update `patientId` on any linked appointments lacking it when `patientId` is resolved.
    - Update `call.patientId = patientId` and `call.outcome = CallOutcome.BOOKED`.
  - Keep fallback check for any unlinked appointments only if no appointment had `callId == callDbId`.

### Task 5: Backend Data Queries & Endpoints
- [ ] **Step 1: Update `apps/api/src/data/calls.data.ts`**
  - Update `callListInclude`: include `appointments: { select: { id: true, startTime: true, endTime: true, status: true, doctor: { select: { id: true, name: true, speciality: true } } } }`.
  - Update `findCallById`: include `appointments: { include: { doctor: true } }`.
- [ ] **Step 2: Update `apps/api/src/data/appointments.data.ts`**
  - Update `doctorInclude`: include `call: { select: { id: true, callId: true, durationSec: true, startedAt: true, status: true, outcome: true } }`.

### Task 6: Staff Portal Frontend Updates
- [ ] **Step 1: Update Web Types in `apps/web/src/types/call.ts` & `apps/web/src/types/appointment.ts`**
  - In `types/call.ts`: add `appointments?: AppointmentSummary[]` to `CallSummary` and `CallDetail`.
  - In `types/appointment.ts`: add `callId?: string \| null` and `call?: { id: string; callId: string; durationSec: number; startedAt: string; status: string; outcome: string } \| null` to `Appointment`.
- [ ] **Step 2: Update `apps/web/src/app/(app)/calls/_components/calls-table.tsx`**
  - Show appointment count badge or indicator when call has linked appointments.
- [ ] **Step 3: Update `apps/web/src/app/(app)/calls/_components/call-detail-dialog.tsx`**
  - Support displaying multiple linked appointments for the call with doctor name, speciality, date/time, and status.
  - Add "View in Appointments" button/navigation.
- [ ] **Step 4: Update `apps/web/src/app/(app)/appointments/_components/appointments-table.tsx`**
  - Display "Voice Call" badge when `appointment.callId` is present, showing call date/time and allowing opening or navigating to `/calls`.

### Task 7: Automated Tests & End-to-End Verification
- [ ] **Step 1: Write integration unit test `apps/api/test/appointmentLinkage.test.ts`**
  - Test pre-creation of Call record.
  - Test `makeBookAppointmentTool` stores `callDbId`.
  - Test duplicate booking retry returns existing appointment.
  - Test `callExtractor` links appointment and sets outcome `BOOKED`.
  - Test 1-to-many relationship (multiple appointments under one call).
- [ ] **Step 2: Run verification test**
  - Run `pnpm -F api tsx test/appointmentLinkage.test.ts`.
- [ ] **Step 3: Run full typecheck and lint across all workspaces**
  - Run `pnpm check-types` and `pnpm lint`.
- [ ] **Step 4: Report completed changes to user**
