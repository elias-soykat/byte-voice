import {
  createSession,
  getSession,
  appendAudio,
  appendSegment,
  appendTranscript,
  interruptSession,
  renewTurnAbortSignal,
  endSession,
} from "../src/sockets/session";
import { runAgent } from "../src/agents";
import { synthesizeSpeechSarvam } from "../src/libs/sarvam";
import { transcribeAudio } from "../src/libs/deepgram";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

async function runTests() {
  console.log("🧪 Running Voice Barge-In & Interruption Unit Tests...\n");

  const socketId = "mock-socket-123";

  // Test 1: Session lifecycle and turn initialization
  console.log("1. Testing Session Creation & Initial State...");
  const session = createSession(socketId, { patientName: "রহিম করিম" });
  assert(session.currentTurnId === 1, `Expected currentTurnId 1, got ${session.currentTurnId}`);
  assert(session.abortController instanceof AbortController, "Expected abortController instance");
  assert(session.abortController.signal.aborted === false, "Expected fresh abortController to not be aborted");
  assert(session.patientName === "রহিম করিম", "Expected patientName to match");
  console.log("  ✅ Session created correctly with turnId 1 and active AbortController.");

  // Test 2: Audio buffering and segment tracking
  console.log("\n2. Testing Audio Buffering & Segment Appending...");
  appendAudio(socketId, Buffer.from("chunk-1"));
  appendAudio(socketId, Buffer.from("chunk-2"));
  assert(session.audioChunks.length === 2, "Expected 2 audio chunks");

  const agentAudio = Buffer.from("mock-agent-mp3-bytes");
  appendSegment(socketId, {
    role: "agent",
    audio: agentAudio,
    format: "mp3",
    at: Date.now(),
    turnId: 1,
  });
  appendTranscript(socketId, {
    role: "agent",
    text: "ঢাকা ডেন্টাল কেয়ারে আপনাকে স্বাগতম।",
    at: Date.now(),
    turnId: 1,
  });
  assert(session.segments.length === 1, "Expected 1 segment");
  assert(session.transcript.length === 1, "Expected 1 transcript entry");
  console.log("  ✅ Audio buffering and segment appending verified.");

  // Test 3: Barge-in interruption with playback truncation
  console.log("\n3. Testing Barge-In Interruption with Truncation...");
  const originalController = session.abortController;

  // Simulate user interrupting 1500ms into playback
  interruptSession(socketId, 1, 1500);

  assert(originalController.signal.aborted === true, "Expected previous abortController to be aborted");
  assert(session.abortController.signal.aborted === false, "Expected fresh new abortController ready for next turn");
  assert(session.audioChunks.length === 0, "Expected buffered audio chunks to be cleared on interrupt");
  assert(session.currentTurnId === 2, `Expected turnId to advance to 2, got ${session.currentTurnId}`);

  const seg = session.segments[0];
  assert(seg !== undefined, "Expected segment to exist");
  assert(seg.interrupted === true, "Expected segment to be marked interrupted");
  assert(seg.durationMs === 1500, `Expected durationMs 1500, got ${seg.durationMs}`);

  const tx = session.transcript[0];
  assert(tx !== undefined && tx.interrupted === true, "Expected transcript to be marked interrupted");
  console.log("  ✅ Barge-in interruption correctly aborted active controllers, trimmed segment, and updated turn counter.");

  // Test 4: Immediate cutoff (<250ms) segment excision
  console.log("\n4. Testing Immediate Barge-In (<250ms) Segment Excision...");
  appendSegment(socketId, {
    role: "agent",
    audio: Buffer.from("mock-agent-mp3-bytes-2"),
    format: "mp3",
    at: Date.now(),
    turnId: 2,
  });
  assert(session.segments.length === 2, "Expected 2 segments before interrupt");

  // User cuts in almost immediately (100ms in)
  interruptSession(socketId, 2, 100);

  // The 100ms segment should be removed completely from final call recording
  assert(session.segments.length === 1, `Expected 1 segment remaining after early excision, got ${session.segments.length}`);
  console.log("  ✅ Rapid barge-in (<250ms) correctly excised unheard segment from final recording array.");

  // Test 5: Outdated / stale interruption rejection
  console.log("\n5. Testing Stale Interruption Rejection...");
  const currentTurn = session.currentTurnId;
  // Send interrupt for an older turn (turn 1 when current is >= 3)
  interruptSession(socketId, 1, 500);
  assert(session.currentTurnId === currentTurn, "Expected stale interrupt to be rejected without advancing turn");
  console.log("  ✅ Stale interruption with older turnId was properly rejected.");

  // Test 6: renewTurnAbortSignal helper
  console.log("\n6. Testing renewTurnAbortSignal...");
  const signal = renewTurnAbortSignal(socketId, 5);
  assert(signal !== undefined, "Expected signal to be defined");
  assert(signal.aborted === false, "Expected signal to be active");
  assert(session.currentTurnId === 5, `Expected currentTurnId 5, got ${session.currentTurnId}`);
  console.log("  ✅ renewTurnAbortSignal successfully advanced turn and returned clean signal.");

  // Test 7: Provider Cancellation with AbortController
  console.log("\n7. Testing Provider Cancellation Handling...");
  const testController = new AbortController();
  testController.abort(); // already aborted

  // Test runAgent with aborted signal
  const agentRes = await runAgent({
    sessionId: session.callId,
    message: "আমার দাঁতে ব্যথা",
    signal: testController.signal,
  });
  assert(agentRes.aborted === true, "Expected runAgent to return aborted: true when signal is aborted");
  assert(agentRes.reply === "", "Expected empty reply on aborted agent run");

  // Test Sarvam TTS with aborted signal
  const ttsAudio = await synthesizeSpeechSarvam("টেস্ট বার্তা", { signal: testController.signal });
  assert(ttsAudio.byteLength === 0, "Expected synthesizeSpeechSarvam to return empty Buffer on abort");

  // Test Deepgram STT with aborted signal
  const sttText = await transcribeAudio(Buffer.from("dummy"), testController.signal);
  assert(sttText === "", "Expected transcribeAudio to return empty string on abort");

  console.log("  ✅ All providers (LangGraph, Sarvam, Deepgram) gracefully handled AbortSignal.");

  // Clean up
  endSession(socketId);
  assert(getSession(socketId) === undefined, "Expected session to be cleaned up");

  console.log("\n🎉 ALL BARGE-IN & INTERRUPTION TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
