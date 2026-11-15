import {
  calculateCallMetrics,
  bucketCallsByDay,
} from "../src/helpers/analytics";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

function runTests() {
  console.log("🧪 Testing Call Analytics Helper Math & Bucketing...");

  // 1. Edge Case: Empty Database (0 calls, null duration)
  const emptyMetrics = calculateCallMetrics(0, [], 0, null, []);
  assert(emptyMetrics.totalCalls === 0, "totalCalls must be 0");
  assert(emptyMetrics.successfulBookings === 0, "successfulBookings must be 0");
  assert(emptyMetrics.bookingConversionRate === 0, "bookingConversionRate must be 0, not NaN");
  assert(emptyMetrics.averageDurationSec === 0, "averageDurationSec must be 0");
  assert(emptyMetrics.callsByOutcome.length === 5, "callsByOutcome must include all 5 outcome enum variants");
  for (const item of emptyMetrics.callsByOutcome) {
    assert(item.count === 0, `Outcome ${item.outcome} count should be 0`);
    assert(item.percentage === 0, `Outcome ${item.outcome} percentage should be 0`);
  }
  console.log("✓ Empty database edge case safely handled");

  // 2. Normal Calculation with real-style numbers
  const mockGroups = [
    { outcome: "BOOKED", _count: 7 },
    { outcome: "ENQUIRY", _count: 4 },
    { outcome: "FOLLOW_UP_NEEDED", _count: 12 },
    { outcome: "INCOMPLETE", _count: 12 },
    { outcome: "FAILED", _count: 1 },
  ];
  const metrics = calculateCallMetrics(36, mockGroups, 1, 111.22, []);
  assert(metrics.totalCalls === 36, "totalCalls must be 36");
  assert(metrics.successfulBookings === 7, "successfulBookings must be 7");
  assert(metrics.enquiries === 4, "enquiries must be 4");
  assert(metrics.followUpsNeeded === 12, "followUpsNeeded must be 12");
  assert(metrics.incompleteCalls === 12, "incompleteCalls must be 12");
  assert(metrics.failedCalls === 1, "failedCalls must be 1");
  // Conversion rate: 7 / 36 = 19.444...% -> 19.4%
  assert(metrics.bookingConversionRate === 19.4, `bookingConversionRate should be 19.4%, got ${metrics.bookingConversionRate}`);
  assert(metrics.averageDurationSec === 111, `averageDurationSec should be 111, got ${metrics.averageDurationSec}`);

  const bookedItem = metrics.callsByOutcome.find((o) => o.outcome === "BOOKED");
  assert(bookedItem?.count === 7, "BOOKED count should be 7");
  assert(bookedItem?.percentage === 19.4, `BOOKED percentage should be 19.4, got ${bookedItem?.percentage}`);
  console.log("✓ Call metrics calculation verified");

  // 3. Double-counting protection: when failedCount > group count or group count > failedCount
  const doubleCountCheck = calculateCallMetrics(10, [{ outcome: "FAILED", _count: 2 }], 2, 60, []);
  assert(doubleCountCheck.failedCalls === 2, "Failed calls must not be doubled (expected 2, got " + doubleCountCheck.failedCalls + ")");

  const doubleCountCheck2 = calculateCallMetrics(10, [{ outcome: "FAILED", _count: 1 }], 3, 60, []);
  assert(doubleCountCheck2.failedCalls === 3, "Failed calls should take max of status/outcome fails without sum duplication");
  console.log("✓ Double-counting protection verified");

  // 4. Daily Call Bucketing
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const bucketed = bucketCallsByDay([
    { startedAt: today },
    { startedAt: today },
    { startedAt: yesterday },
  ], 7);

  assert(bucketed.length === 7, "bucketCallsByDay should return 7 days");
  const todayCalls = bucketed[bucketed.length - 1]?.calls;
  const yesterdayCalls = bucketed[bucketed.length - 2]?.calls;
  assert(todayCalls === 2, `Today calls should be 2, got ${todayCalls}`);
  assert(yesterdayCalls === 1, `Yesterday calls should be 1, got ${yesterdayCalls}`);
  console.log("✓ bucketCallsByDay verified across calendar days");

  console.log("✅ All Call Analytics Helper tests passed!");
}

runTests();
