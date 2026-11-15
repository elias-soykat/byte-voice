import dotenv from "dotenv";
dotenv.config({ path: [".env.local", ".env"] });

import { prisma } from "../src/libs/prisma";
import * as callsData from "../src/data/calls.data";
import * as appointmentsData from "../src/data/appointments.data";
import * as doctorsData from "../src/data/doctors.data";
import { makeBookAppointmentTool } from "../src/agents/tools/appointment.tools";
import { processCallExtraction } from "../src/helpers/callExtractor";
import { AppointmentStatus, CallOutcome } from "../src/generated/prisma/enums";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("🧪 Starting Live Call Appointment Linkage Test Suite...");

  // 1. Fetch or ensure an active doctor exists for booking
  const doctors = await doctorsData.findDoctors({ skip: 0, take: 1, where: { isActive: true } });
  assert(doctors.length > 0 && !!doctors[0], "An active doctor must exist for tests");
  const doctor = doctors[0]!;
  console.log(`✓ Using active doctor: ${doctor.name} (${doctor.id})`);

  const testSessionUUID = `test-call-${Date.now()}`;
  let createdCallId = "";
  const createdAppointmentIds: string[] = [];

  try {
    // 2. Test Step 1: Pre-creation of Call record at call start
    console.log("Testing Step 1: Pre-create Call record when voice call starts...");
    const callRecord = await callsData.createCall({
      callId: testSessionUUID,
      startedAt: new Date(),
      endedAt: new Date(),
      durationSec: 0,
      userTurns: 0,
      transcript: [],
      status: "IN_PROGRESS",
      outcome: CallOutcome.INCOMPLETE,
      patientName: "পরীক্ষামূলক রোগী",
    });

    assert(!!callRecord.id, "Call record must be created with a valid DB id");
    assert(callRecord.status === "IN_PROGRESS", "Initial call status must be IN_PROGRESS");
    assert(callRecord.callId === testSessionUUID, "Call record must store the session UUID");
    createdCallId = callRecord.id;
    console.log(`✓ Call record pre-created successfully with id: ${createdCallId}`);

    // 3. Test Step 2: Book appointment via tool with trusted server-side callId
    console.log("Testing Step 2: Book appointment via makeBookAppointmentTool with ctx.callId...");
    const bookTool = makeBookAppointmentTool({
      patientName: "পরীক্ষামূলক রোগী",
      patientEmail: "test-patient@example.com",
      patientPhone: "01712345678",
      callId: createdCallId, // Trusted server-side DB id
    });

    const testSlot1 = new Date(Date.now() + 7 * 24 * 3600 * 1000); // 7 days from now
    testSlot1.setHours(10, 0, 0, 0);

    const bookResult = await bookTool.invoke({
      doctorId: doctor.id,
      startTimeISO: testSlot1.toISOString(),
      reason: "দাঁতের ব্যথার জন্য চেকআপ",
    });

    assert(typeof bookResult === "string", "Tool must return string response");
    assert(bookResult.includes("সফলভাবে অ্যাপয়েন্টমেন্ট বুক করা হয়েছে"), "Tool must confirm booking");

    // Extract appointment ID from result
    const idMatch = bookResult.match(/Appointment ID:\s*([^\s)]+)/);
    assert(!!idMatch && !!idMatch[1], "Appointment ID must be returned in confirmation");
    const apptId1 = idMatch![1]!;
    createdAppointmentIds.push(apptId1);

    // Verify in database: Appointment must store callId matching callRecord.id
    const dbAppt1 = await prisma.appointment.findUnique({
      where: { id: apptId1 },
      include: { call: true, doctor: true },
    });
    assert(!!dbAppt1, "Appointment must exist in DB");
    assert(dbAppt1!.callId === createdCallId, `Appointment.callId (${dbAppt1!.callId}) must match Call.id (${createdCallId})`);
    assert(dbAppt1!.call?.callId === testSessionUUID, "Appointment relation must resolve to Call");
    console.log(`✓ Appointment ${apptId1} successfully created with callId: ${dbAppt1!.callId}`);

    // 4. Test Step 3: Prevent duplicate appointments during retries (Idempotency)
    console.log("Testing Step 3: Duplicate booking prevention on tool retry...");
    const retryResult = await bookTool.invoke({
      doctorId: doctor.id,
      startTimeISO: testSlot1.toISOString(),
      reason: "দাঁতের ব্যথার জন্য চেকআপ (Retry)",
    });

    assert(retryResult.includes(apptId1), "Retry with identical slot must return existing appointment ID");
    const countSlots = await prisma.appointment.count({
      where: {
        callId: createdCallId,
        doctorId: doctor.id,
        startTime: testSlot1,
      },
    });
    assert(countSlots === 1, "Duplicate booking must not create a second appointment record");
    console.log("✓ Duplicate prevention confirmed: exactly 1 appointment exists for slot");

    // 5. Test Step 4: Support multiple appointments per call (1-to-many relationship)
    console.log("Testing Step 4: Support one call having multiple appointments...");
    const testSlot2 = new Date(Date.now() + 8 * 24 * 3600 * 1000); // 8 days from now
    testSlot2.setHours(14, 0, 0, 0);

    const bookResult2 = await bookTool.invoke({
      doctorId: doctor.id,
      startTimeISO: testSlot2.toISOString(),
      reason: "ফলো-আপ ভিজিট",
    });

    const idMatch2 = bookResult2.match(/Appointment ID:\s*([^\s)]+)/);
    assert(!!idMatch2 && !!idMatch2[1], "Second appointment ID must be returned");
    const apptId2 = idMatch2![1]!;
    createdAppointmentIds.push(apptId2);
    assert(apptId1 !== apptId2, "Second appointment must be a distinct appointment record");

    const callAppointments = await prisma.appointment.findMany({
      where: { callId: createdCallId },
    });
    assert(callAppointments.length === 2, `Expected 2 appointments for call, found ${callAppointments.length}`);
    console.log("✓ One call with multiple appointments confirmed (count = 2)");

    // 6. Test Step 5: Update Call record on finalizeCall (no duplicate Call record)
    console.log("Testing Step 5: Updating existing Call record on conversation end...");
    await callsData.updateCall(createdCallId, {
      endedAt: new Date(),
      durationSec: 125,
      userTurns: 4,
      transcript: [
        { role: "agent", text: "ঢাকা ডেন্টাল কেয়ারে স্বাগতম।" },
        { role: "user", text: "আমি একটা অ্যাপয়েন্টমেন্ট নিতে চাই।" },
      ],
      status: "COMPLETED",
    });

    const updatedCall = await callsData.findCallById(createdCallId);
    assert(!!updatedCall, "Updated call must exist");
    assert(updatedCall!.status === "COMPLETED", "Call status must be updated to COMPLETED");
    assert(updatedCall!.durationSec === 125, "Call duration must be updated");
    assert(updatedCall!.appointments.length === 2, "Call must include both appointments");
    console.log("✓ Existing Call record successfully updated without duplicates");

    // 7. Test Step 6: Post-call extraction preserves linkage and patient association
    console.log("Testing Step 6: Extraction preserves callId and verifies DB backing...");
    const extractionResult = await processCallExtraction({
      callDbId: createdCallId,
      callSessionId: testSessionUUID,
      transcript: [
        { role: "agent", text: "ঢাকা ডেন্টাল কেয়ারে স্বাগতম।" },
        { role: "user", text: "আমার নাম রফিকুল ইসলাম, ফোন ০১৭১২৩৪৫৬৭৮। আমি দাঁত পরিষ্কার করাতে চাই।" },
        { role: "agent", text: "আপনার অ্যাপয়েন্টমেন্ট বুক করা হয়েছে।" },
      ],
      fallbackPatientName: "রফিকুল ইসলাম",
      fallbackEmail: "rafiq@example.com",
    });

    assert(!!extractionResult, "processCallExtraction must succeed");
    assert(extractionResult!.appointmentRecorded === true, "appointmentRecorded must be true");
    assert(extractionResult!.extracted.outcome === CallOutcome.BOOKED, "Final outcome must be BOOKED");

    // Verify patient was linked to both Call and Appointments
    const finalCall = await callsData.findCallById(createdCallId);
    assert(finalCall!.outcome === CallOutcome.BOOKED, "Call outcome in DB must be BOOKED");
    assert(!!finalCall!.patientId, "Call must be associated with patientId");

    const finalAppts = await prisma.appointment.findMany({
      where: { callId: createdCallId },
    });
    for (const appt of finalAppts) {
      assert(appt.callId === createdCallId, "Appointment must preserve callId");
      assert(appt.patientId === finalCall!.patientId, "Appointment must be updated with patientId");
    }
    console.log("✓ Relational integrity preserved: Call and Appointments linked to Patient");

    // 8. Test Step 7: Queries retrieve related records
    console.log("Testing Step 7: API queries retrieve related Call and Appointments...");
    const callsList = await callsData.findCalls({
      skip: 0,
      take: 5,
      where: { id: createdCallId },
    });
    assert(callsList.length === 1, "findCalls must return created call");
    assert(callsList[0]!.appointments.length === 2, "findCalls item must include appointments");

    const apptsList = await appointmentsData.findAppointments({
      skip: 0,
      take: 5,
      where: { callId: createdCallId },
    });
    assert(apptsList.length === 2, "findAppointments with callId must return 2 appointments");
    assert(apptsList[0]!.call?.id === createdCallId, "findAppointments must include related Call");
    console.log("✓ API queries verified: bidirectional navigation between Call and Appointments functional");

    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! Live Call Appointment Linkage is 100% verified.");
  } finally {
    // Cleanup test records
    console.log("Cleaning up test data...");
    if (createdAppointmentIds.length > 0) {
      await prisma.appointment.deleteMany({
        where: { id: { in: createdAppointmentIds } },
      });
    }
    if (createdCallId) {
      await prisma.callExtraction.deleteMany({ where: { callId: createdCallId } });
      await prisma.call.delete({ where: { id: createdCallId } }).catch(() => {});
    }
    console.log("✓ Test data cleaned up.");
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
