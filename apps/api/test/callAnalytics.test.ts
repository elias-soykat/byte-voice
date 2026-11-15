import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

import * as analyticsData from "../src/data/analytics.data";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("🧪 Testing Call Analytics Data Access Layer...");

  const totalCalls = await analyticsData.countTotalCalls();
  assert(typeof totalCalls === "number" && totalCalls >= 0, "countTotalCalls must return a non-negative number");
  console.log(`✓ countTotalCalls(): ${totalCalls}`);

  const outcomeGroups = await analyticsData.groupCallsByOutcome();
  assert(Array.isArray(outcomeGroups), "groupCallsByOutcome must return an array");
  console.log(`✓ groupCallsByOutcome(): ${JSON.stringify(outcomeGroups)}`);

  const failedCalls = await analyticsData.countFailedCalls();
  assert(typeof failedCalls === "number" && failedCalls >= 0, "countFailedCalls must return a non-negative number");
  console.log(`✓ countFailedCalls(): ${failedCalls}`);

  const durationAgg = await analyticsData.aggregateCallDurations();
  assert(typeof durationAgg === "object" && durationAgg !== null, "aggregateCallDurations must return an object");
  console.log(`✓ aggregateCallDurations(): avg=${durationAgg._avg.durationSec}, sum=${durationAgg._sum.durationSec}`);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCalls = await analyticsData.findCallTimesSince(sevenDaysAgo);
  assert(Array.isArray(recentCalls), "findCallTimesSince must return an array");
  console.log(`✓ findCallTimesSince(): found ${recentCalls.length} calls in past 7 days`);

  console.log("✅ All Call Analytics Data Access tests passed!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
