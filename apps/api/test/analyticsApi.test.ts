import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

import type { Request, Response } from "express";
import { getDashboardStats, getAnalytics } from "../src/controllers/analytics.controller";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function mockResponse() {
  const res: Partial<Response> & { _status?: number; _json?: any } = {
    status(code: number) {
      this._status = code;
      return this as Response;
    },
    json(body: any) {
      this._json = body;
      return this as Response;
    },
  };
  return res as Response & { _status?: number; _json?: any };
}

async function runTests() {
  console.log("🧪 Testing Analytics Controller API Integration...");

  // 1. Test getDashboardStats
  const req1 = {} as Request;
  const res1 = mockResponse();
  await getDashboardStats(req1, res1);

  assert(res1._status === 200, `getDashboardStats should return 200, got ${res1._status}`);
  const dashData = res1._json?.data;
  assert(!!dashData, "Response data should exist");
  assert(typeof dashData.totalDoctors === "number", "totalDoctors must be number");
  assert(typeof dashData.totalPatients === "number", "totalPatients must be number");
  assert(!!dashData.callMetrics, "callMetrics must be present in getDashboardStats response");

  const cm = dashData.callMetrics;
  console.log(`✓ Dashboard callMetrics: totalCalls=${cm.totalCalls}, booked=${cm.successfulBookings}, convRate=${cm.bookingConversionRate}%, avgDuration=${cm.averageDurationSec}s`);
  assert(typeof cm.totalCalls === "number" && cm.totalCalls >= 0, "totalCalls must be >= 0");
  assert(typeof cm.successfulBookings === "number", "successfulBookings must be number");
  assert(typeof cm.bookingConversionRate === "number", "bookingConversionRate must be number");
  assert(typeof cm.failedCalls === "number", "failedCalls must be number");
  assert(Array.isArray(cm.callsByOutcome) && cm.callsByOutcome.length === 5, "callsByOutcome must have 5 entries");
  assert(Array.isArray(cm.weeklyCalls) && cm.weeklyCalls.length === 7, "weeklyCalls must have 7 daily points");

  // 2. Test getAnalytics
  const req2 = {} as Request;
  const res2 = mockResponse();
  await getAnalytics(req2, res2);

  assert(res2._status === 200, `getAnalytics should return 200, got ${res2._status}`);
  const analyticsDataPayload = res2._json?.data;
  assert(!!analyticsDataPayload, "Analytics response data should exist");
  assert(typeof analyticsDataPayload.totalAppointments === "number", "totalAppointments must be number");
  assert(!!analyticsDataPayload.callMetrics, "callMetrics must be present in getAnalytics response");
  console.log(`✓ Analytics payload includes callMetrics with ${analyticsDataPayload.callMetrics.totalCalls} total calls`);

  console.log("✅ Analytics Controller integration tests passed!");
}

runTests().catch((err) => {
  console.error("❌ Controller test failed:", err);
  process.exit(1);
});
