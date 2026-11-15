# Real Database-Driven Call Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded or missing voice call statistics with live, real-time database calculations from Prisma for the Dhaka Dental Care staff portal, fulfilling Part D (Portal Requirements) of the StrategyByte Technical Brief.

**Architecture:**
- **Data Access Layer (`apps/api/src/data/analytics.data.ts`)**: Add Prisma count, groupBy, aggregate, and time-range queries on `prisma.call`.
- **Pure Domain & Helpers Layer (`apps/api/src/helpers/analytics.ts`)**: Compute outcome breakdown, single-deduplicated failed calls, conversion rates (`(BOOKED / totalCalls) * 100`), average call duration, and daily/monthly call volume series. Handle empty databases, 0 calls, and null durations safely without NaN or division by zero.
- **Controller Layer (`apps/api/src/controllers/analytics.controller.ts`)**: Integrate `callMetrics` into `getDashboardStats` and `getAnalytics` responses with consistent envelope format via `sendSuccess`.
- **Frontend Types & Services (`apps/web/src/types/analytics.ts`, `apps/web/src/services/analytics.ts`)**: Define `CallMetrics`, `CallOutcomeCount`, and `CallDayPoint` contracts matching the backend payload.
- **Frontend UI Components (`apps/web/src/app/(app)/dashboard`, `analytics`, `calls`)**:
  - Create `CallOutcomeChart` (interactive Recharts donut chart with outcome metadata).
  - Create `WeeklyCallsChart` (Area chart for daily call volume).
  - Add Voice Reception Analytics KPI strip and charts to `DashboardPage`.
  - Add Voice Reception & Outcome Intelligence section to `AnalyticsPage`.
  - Add Quick Metrics bar to `CallsPage`.

**Tech Stack:** Next.js 16 (App Router), React 19, Express 5, Prisma 7, PostgreSQL, Recharts, Tailwind CSS, Lucide icons, TanStack React Query, TypeScript strict.

**Spec:** `StrategyByte_AI_Engineer_Task_Requirements.md` (Part D: Data portal & evaluation criteria).

## Global Constraints
- Must follow `docs/coding-standards.md` (§2: `routes → controllers → helpers → data`, flat Express, no service layer).
- Prisma client is queried ONLY in `apps/api/src/data/`.
- No new external runtime dependencies or service abstractions.
- All division by zero and null database values must default safely (0, 0%, 0s).
- Avoid double-counting failed calls: use single query with `{ OR: [{ status: "FAILED" }, { outcome: "FAILED" }] }`.

## Review Focus
1. **Zero calls in database**: Response must return `totalCalls: 0`, `bookingConversionRate: 0`, `averageDurationSec: 0`, and empty chart series without throwing errors or showing `NaN%`.
2. **Double-counting prevention**: A call with `status: "FAILED"` and `outcome: "FAILED"` must only count as 1 failed call.
3. **Outcome coverage**: All `CallOutcome` enum values (`BOOKED`, `ENQUIRY`, `FOLLOW_UP_NEEDED`, `INCOMPLETE`, `FAILED`) must be represented even if count is 0.
4. **Existing stats regression**: Doctor and Appointment stats (trends, status, weekly appointments) must continue to function unchanged.
5. **UI responsiveness and dark/light contrast**: KPI cards and chart legends must match existing theme tokens and render cleanly on mobile and desktop.

---

## Tasks

### Task 1: Backend Data Access Layer (`analytics.data.ts`)
**Files:**
- Modify: `apps/api/src/data/analytics.data.ts`
- Test: `apps/api/test/callAnalytics.test.ts`

**Interfaces:**
- Produces:
  - `countTotalCalls(): Promise<number>`
  - `groupCallsByOutcome(): Promise<{ outcome: string; _count: number }[]>`
  - `countFailedCalls(): Promise<number>`
  - `aggregateCallDurations(): Promise<{ _avg: { durationSec: number | null }; _sum: { durationSec: number | null } }>`
  - `findCallTimesSince(since: Date): Promise<{ startedAt: Date; outcome: string; durationSec: number }[]>`

- [x] **Step 1: Write test in `apps/api/test/callAnalytics.test.ts`**
  - Verify `countTotalCalls`, `groupCallsByOutcome`, `countFailedCalls`, `aggregateCallDurations`, and `findCallTimesSince`.
- [x] **Step 2: Run test with tsx to verify initial execution/failure**
- [x] **Step 3: Implement data queries in `apps/api/src/data/analytics.data.ts`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 2: Pure Domain Math & Bucketing Helpers (`helpers/analytics.ts`)
**Files:**
- Modify: `apps/api/src/helpers/analytics.ts`
- Test: `apps/api/test/callAnalyticsHelpers.test.ts`

**Interfaces:**
- Produces:
  - `type CallMetrics`
  - `calculateCallMetrics(totalCalls: number, outcomeGroups: { outcome: string; _count: number }[], failedCount: number, avgDurationSec: number | null): CallMetrics`
  - `bucketCallsByDay(rows: { startedAt: Date }[], days?: number): { day: string; calls: number }[]`

- [x] **Step 1: Write unit tests in `apps/api/test/callAnalyticsHelpers.test.ts`**
  - Test zero calls (0%, 0s, all outcomes present with 0).
  - Test conversion rate formula (`(BOOKED / totalCalls) * 100`).
  - Test failed call deduplication.
  - Test day bucketing across 7 days.
- [x] **Step 2: Run test to verify failure**
- [x] **Step 3: Implement `calculateCallMetrics` and `bucketCallsByDay` in `apps/api/src/helpers/analytics.ts`**
- [x] **Step 4: Run test to verify it passes**

---

### Task 3: Controller & API Route Integration (`analytics.controller.ts`)
**Files:**
- Modify: `apps/api/src/controllers/analytics.controller.ts`

**Interfaces:**
- Updates `getDashboardStats` payload to include `callMetrics`.
- Updates `getAnalytics` payload to include `callMetrics` and `weeklyCalls`.

- [x] **Step 1: Update `getDashboardStats` and `getAnalytics` in `apps/api/src/controllers/analytics.controller.ts`**
  - Concurrently fetch appointment and call queries in `Promise.all`.
  - Assemble `callMetrics` and attach to response data.
- [x] **Step 2: Run API type check (`pnpm -F api check-types`)**
- [x] **Step 3: Add integration test asserting API returns call metrics correctly**

---

### Task 4: Frontend Types & Contract Update (`apps/web`)
**Files:**
- Modify: `apps/web/src/types/analytics.ts`

**Interfaces:**
- Defines `CallMetrics`, `CallOutcomeCount`, `CallDayPoint`.
- Updates `DashboardStats` and `AnalyticsData` interfaces.

- [x] **Step 1: Update `apps/web/src/types/analytics.ts` with Call analytics types**
- [x] **Step 2: Verify existing services and hooks compile without errors**

---

### Task 5: UI Components for Voice Call Analytics (`apps/web`)
**Files:**
- Create: `apps/web/src/components/charts/call-outcome-chart.tsx`
- Create: `apps/web/src/components/charts/weekly-calls-chart.tsx`
- Modify: `apps/web/src/app/(app)/dashboard/page.tsx`
- Modify: `apps/web/src/app/(app)/analytics/page.tsx`
- Modify: `apps/web/src/app/(app)/calls/page.tsx`

- [x] **Step 1: Build `CallOutcomeChart`**
  - Donut chart displaying Booked, Enquiry, Follow-up Needed, Incomplete, Failed with Dhaka Dental Care theme colors.
- [x] **Step 2: Build `WeeklyCallsChart`**
  - Area chart displaying call volume by weekday.
- [x] **Step 3: Update `DashboardPage`**
  - Add Voice Reception Analytics KPI section (Total Calls, Bookings, Enquiries, Follow-up, Failed, Conversion Rate).
  - Include quick voice stats alongside appointment charts.
- [x] **Step 4: Update `AnalyticsPage`**
  - Add dedicated Voice Reception & Outcomes intelligence grid with charts and call efficiency metrics.
- [x] **Step 5: Update `CallsPage`**
  - Add summary KPI pills above the call log table.

---

### Task 6: Full Verification & Type Check
- [x] **Step 1: Run `pnpm check-types` across monorepo**
- [x] **Step 2: Run all backend tests (`pnpm -F api test` / `tsx apps/api/test/...`)**
- [x] **Step 3: Test with actual database data**
