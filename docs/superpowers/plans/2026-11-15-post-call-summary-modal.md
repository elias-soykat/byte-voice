# Post-Call Summary Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a production-ready Post-Call Summary Modal for ByteCare AI that displays real extracted patient information, appointment details, call duration, outcome, and next actions when a call ends, fully integrated with the existing backend extraction and database persistence pipeline.

**Architecture:** 
- **Shared Contract:** Expand `@repo/shared` socket contract with `SocketEvent.CallSummary` (`call:summary`) and `CallSummaryPayload`.
- **Backend Flow:** In `apps/api`, on `call:end`, `gateway.ts` triggers and awaits `finalizeCall()` which persists the call, executes `callExtractor.ts` (`routerModel().withStructuredOutput()`), verifies database persistence of `Patient`, `CallExtraction`, and any linked `Appointment`, and emits `call:summary` before tearing down the socket.
- **Frontend Flow:** In `apps/web`, `call-provider.tsx` stops mic recording and audio playback immediately on hangup, transitions to a `"finalizing"` state, receives `call:summary`, and opens `PostCallSummaryModal` with full responsive styling, badges, and portal navigation.

**Tech Stack:** Next.js 16 (App Router), React 19, Express 5, Socket.IO, Prisma 7, PostgreSQL, Tailwind CSS, Framer Motion, Lucide icons, TypeScript strict mode.

**Spec:** [StrategyByte_AI_Engineer_Task_Requirements.md](file:///c:/Users/Elias/elias/interview-tasks/byte-care/StrategyByte_AI_Engineer_Task_Requirements.md)

---

## Global Constraints

- **Strict TypeScript & Monorepo**: Workspace dependencies (`@repo/shared`) must be rebuilt before frontend/backend consumption.
- **Design System Consistency**: Match existing ByteCare AI dark frosted glass and emerald/teal clinical aesthetic (`slate-950/98`, `teal-500`, `border-white/10`).
- **No Mock or Fake Data**: The modal must display actual extracted and persisted database values.
- **Truth in Booking**: An appointment must only be marked as recorded if an actual `Appointment` record is verified in the database.
- **Resilience**: Extraction failures, network timeouts, or immediate disconnects must not lose call records or crash the UI.

---

## Review Focus

1. **No Data Loss on Disconnect**: Caller hanging up abruptly vs clicking the red "End Call" button must both result in database persistence of call record and transcript.
2. **True Booking Verification**: If the caller discusses an appointment but none was booked or saved to Prisma, `appointmentRecorded` must be `false` and the outcome must reflect reality.
3. **Bengali Phone Number Normalization**: Phone numbers spoken in Bengali numerals (`০১৭...`) or English digits must be normalized and formatted clearly.
4. **Clean Mic/Audio Teardown**: Microphone tracks and agent audio elements must stop instantly when hanging up, before waiting for the summary.
5. **Zero Lint & Build Regressions**: Turbo build, type checks, and linting must pass with 0 errors and 0 warnings.

---

## Task Decomposition

### Task 1: Update Shared Socket Contract (`@repo/shared`)
**Files:**
- Modify: `packages/shared/src/socket.ts`

**Interfaces:**
- Consumes: None.
- Produces: `SocketEvent.CallSummary`, `CallSummaryPayload`, and `ServerToClientEvents["call:summary"]`.

- [ ] **Step 1: Add `CallSummary` event and payload to `packages/shared/src/socket.ts`**
  Add `CallSummary: "call:summary"` to `SocketEvent`.
  Define `CallSummaryPayload`:
  ```typescript
  export type CallSummaryPayload = {
    callId: string;
    durationSec: number;
    patientName?: string | null;
    phone?: string | null;
    reasonForVisit?: string | null;
    preferredDateTime?: string | null;
    outcome: "BOOKED" | "ENQUIRY" | "FOLLOW_UP_NEEDED" | "INCOMPLETE" | "FAILED";
    appointment?: {
      id?: string;
      doctorName?: string | null;
      doctorSpeciality?: string | null;
      startTime?: string | null;
    } | null;
    nextActions: {
      appointmentRecorded: boolean;
      patientDetailsSaved: boolean;
      transcriptAvailable: boolean;
    };
    notes?: string | null;
    status: "success" | "partial" | "error";
    errorMessage?: string;
  };
  ```
  Add `"call:summary": (payload: CallSummaryPayload) => void;` to `ServerToClientEvents`.

- [ ] **Step 2: Build `@repo/shared`**
  Run: `pnpm -F @repo/shared build`
  Verify: Clean build and updated `.d.ts` output.

---

### Task 2: Backend Finalization and Verified Summary Emission (`apps/api`)
**Files:**
- Modify: `apps/api/src/helpers/callExtractor.ts`
- Modify: `apps/api/src/helpers/callRecording.ts`
- Modify: `apps/api/src/sockets/gateway.ts`

**Interfaces:**
- Consumes: `CallSession`, `ExtractedCallData`, Prisma client (`apps/api/src/libs/prisma.ts`).
- Produces: `finalizeCall(session: CallSession): Promise<CallSummaryPayload | null>`.

- [ ] **Step 1: Update `callExtractor.ts` to return verified extraction and appointment details**
  Make `processCallExtraction` return:
  ```typescript
  Promise<{
    extracted: ExtractedCallData;
    patientId?: string;
    patientName?: string;
    normalizedPhone?: string | null;
    isPhoneValid: boolean;
    linkedAppointment?: {
      id: string;
      doctorName: string;
      doctorSpeciality: string;
      startTime: string;
    } | null;
  } | null>
  ```
  Check the database for any `Appointment` created during this session (`callId === callDbId` or created for this patient during the call window). If found and unlinked, link it to `callDbId`.

- [ ] **Step 2: Update `callRecording.ts` to return `CallSummaryPayload`**
  Make `finalizeCall` return a Promise resolving to `CallSummaryPayload | null`.
  Ensure `durationSec` is calculated and DB write operations for `Call`, `Patient`, and `CallExtraction` complete before resolving.

- [ ] **Step 3: Update `gateway.ts` to await `finalizeCall` and emit `call:summary`**
  On `SocketEvent.CallEnd`:
  Mark session as `ended` to prevent duplicate execution.
  Await `finalizeCall(session)`.
  If summary payload is produced, emit `socket.emit(SocketEvent.CallSummary, summary)`.
  Cleanly disconnect the socket.
  On ungraceful `disconnect`: run `finalizeCall(session)` in background safely.

---

### Task 3: Frontend Call State Management (`apps/web`)
**Files:**
- Modify: `apps/web/src/context/call-provider.tsx`
- Modify: `apps/web/src/hooks/useCall.ts`

**Interfaces:**
- Consumes: `CallSummaryPayload` from `@repo/shared`.
- Produces: Updated `CallContextValue` exposing `summary`, `isSummaryOpen`, `closeSummary`, `finalizing` status.

- [ ] **Step 1: Update `CallStatus` and state variables in `call-provider.tsx`**
  Add status `"finalizing"`.
  Add state: `summary: CallSummaryPayload | null` and `isSummaryOpen: boolean`.
  Add `closeSummary: () => void`.

- [ ] **Step 2: Update `endCall` flow in `call-provider.tsx`**
  When caller clicks `endCall`:
  1. Stop mic recorder and stop audio tracks immediately (`stopStream`).
  2. Stop and clear any playing agent audio (`stopAndClearAgentPlayback`).
  3. Emit `SocketEvent.CallEnd`.
  4. Set `status = "finalizing"`. Keep transcript and call duration intact.
  5. Add a 10s fallback timer: if no summary arrives within 10s, construct a graceful fallback summary from local state and open the modal.

- [ ] **Step 3: Listen for `SocketEvent.CallSummary` in `call-provider.tsx`**
  On `SocketEvent.CallSummary`:
  Clear fallback timer.
  Set `summary = payload`.
  Set `isSummaryOpen = true`.
  Set `status = "idle"`.
  Disconnect socket.

- [ ] **Step 4: Implement `closeSummary`**
  Reset `isSummaryOpen = false`, `summary = null`, clear transcript, reset duration.

---

### Task 4: Post-Call Summary Modal Component (`apps/web`)
**Files:**
- Create: `apps/web/src/components/call/post-call-summary-modal.tsx`
- Modify: `apps/web/src/components/call/call-overlay.tsx`

**Interfaces:**
- Consumes: `summary: CallSummaryPayload | null`, `isOpen: boolean`, `onClose: () => void`, `durationSec: number`.
- Produces: Rendered modal matching ByteCare design system with full accessibility and responsive layout.

- [ ] **Step 1: Create `PostCallSummaryModal` component**
  Include:
  - Header with clinic branding, "Call completed / Ended" badge, and call duration formatted `MM:SS`.
  - Structured Patient Information table:
    - Name (value or "Not captured")
    - Phone (formatted value with icon, or "Not captured")
    - Reason (value or "General Dental Enquiry")
    - Appointment (Doctor name, speciality, and date/time if recorded, or "No appointment requested / Not booked")
    - Outcome badge (`<CallOutcomeBadge outcome={summary.outcome} />`)
  - Next Actions card:
    - Appointment recorded (green checkmark if true, neutral minus if false)
    - Patient details saved (green checkmark if true)
    - Call transcript available in portal (green checkmark if true)
  - Modal Footer Actions:
    - "Close summary" button
    - "View in Portal" button linking to `/calls`
  - Loading / Finalizing state:
    - Animated spinner with "Analyzing conversation & verifying patient records with Dhaka Dental Care..."
  - Error / Fallback message banner if summary status is "error" or "partial".

- [ ] **Step 2: Integrate `PostCallSummaryModal` and Finalizing state in `call-overlay.tsx`**
  When `status === "finalizing"`, show a sleek frosted card explaining that the call has ended and records are being processed.
  Render `<PostCallSummaryModal />` controlled by `isSummaryOpen`.

---

### Task 5: End-to-End Verification and Lint/Type Checks
**Files:**
- All modified files.

- [ ] **Step 1: Type check monorepo**
  Run: `pnpm check-types`
  Verify: 0 errors across `@repo/shared`, `apps/api`, and `apps/web`.

- [ ] **Step 2: Lint monorepo**
  Run: `pnpm lint`
  Verify: 0 errors and 0 warnings (under zero-warning policy).

- [ ] **Step 3: Test production build**
  Run: `pnpm build`
  Verify: Turbo build completes successfully for all apps and packages.
