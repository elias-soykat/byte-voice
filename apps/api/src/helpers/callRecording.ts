import type { CallSummaryPayload } from "@repo/shared";
import type { Prisma } from "../generated/prisma/client";
import type { CallSession } from "../sockets/session";
import { mergeSegmentsToMp3 } from "../libs/audioMerge";
import { uploadCallRecording } from "../libs/s3";
import * as callsData from "../data/calls.data";
import { processCallExtraction } from "./callExtractor";

const CallStatus = {
  Completed: "COMPLETED",
  NoAudio: "NO_AUDIO",
  Failed: "FAILED",
} as const;

// Persist a finished call: merge recorded audio segments into MP3, upload to S3,
// save transcript + metadata to the DB, run the post-call LLM extraction, and return
// verified clinical summary data for emission via socket.
export const finalizeCall = async (
  session: CallSession,
): Promise<CallSummaryPayload> => {
  const endedAt = Date.now();
  const durationSec = Math.max(0, Math.round((endedAt - session.startedAt) / 1000));

  // If caller never spoke and transcript is empty, return early summary without DB writes
  if (session.userTurns === 0 && session.transcript.length === 0) {
    return {
      callId: session.callId,
      durationSec,
      patientName: session.patientName ?? null,
      phone: null,
      reasonForVisit: null,
      preferredDateTime: null,
      outcome: "INCOMPLETE",
      appointment: null,
      nextActions: {
        appointmentRecorded: false,
        patientDetailsSaved: false,
        transcriptAvailable: false,
      },
      notes: "Call ended without audio or conversation turns.",
      status: "partial",
    };
  }

  const transcript = session.transcript as unknown as Prisma.InputJsonValue;
  const initialStatus = session.segments.length > 0 ? CallStatus.Completed : CallStatus.NoAudio;

  try {
    let callDbId = session.callDbId;
    if (callDbId) {
      await callsData.updateCall(callDbId, {
        endedAt: new Date(endedAt),
        durationSec,
        userTurns: session.userTurns,
        transcript,
        status: initialStatus,
        ...(session.patientName ? { patientName: session.patientName } : {}),
      });
      console.log(
        `[call] updated call ${session.callId} (dbId ${callDbId})`,
      );
    } else {
      const created = await callsData.createCall({
        callId: session.callId,
        startedAt: new Date(session.startedAt),
        endedAt: new Date(endedAt),
        durationSec,
        userTurns: session.userTurns,
        transcript,
        status: initialStatus,
        ...(session.patientName ? { patientName: session.patientName } : {}),
      });
      callDbId = created.id;
      console.log(`[call] saved ${session.callId}`);
    }

    // Process audio segments merge and S3 upload asynchronously in the background.
    // This decouples heavy multi-segment ffmpeg transcoding from post-call summary delivery.
    if (session.segments.length > 0) {
      void (async () => {
        try {
          const mp3 = await mergeSegmentsToMp3(session.segments);
          const audioKey = await uploadCallRecording(session.callId, mp3);
          const finalAudioStatus = audioKey ? CallStatus.Completed : CallStatus.NoAudio;
          await callsData.updateCall(callDbId, {
            ...(audioKey ? { audioKey } : {}),
            status: finalAudioStatus,
          });
          console.log(`[call] audio merged and saved for ${session.callId}`);
        } catch (audioErr) {
          console.error(`[call] recording failed for ${session.callId}`, audioErr);
          await callsData.updateCall(callDbId, { status: CallStatus.Failed });
        }
      })();
    }

    // Await clinical extraction immediately on the transcript (finishes in ~1.5s)
    let extractionResult = null;
    try {
      extractionResult = await processCallExtraction({
        callDbId,
        callSessionId: session.callId,
        transcript: session.transcript,
        ...(session.patientName ? { fallbackPatientName: session.patientName } : {}),
        ...(session.email ? { fallbackEmail: session.email } : {}),
      });
    } catch (extractErr) {
      console.error(`[call] extraction failed for ${session.callId}:`, extractErr);
    }

    if (extractionResult) {
      return {
        callId: session.callId,
        durationSec,
        patientName: extractionResult.patientName ?? session.patientName ?? null,
        phone: extractionResult.normalizedPhone ?? null,
        reasonForVisit: extractionResult.extracted.reasonForVisit ?? null,
        preferredDateTime: extractionResult.extracted.preferredDateTime ?? null,
        outcome: extractionResult.extracted.outcome,
        appointment: extractionResult.appointment ?? null,
        nextActions: {
          appointmentRecorded: extractionResult.appointmentRecorded,
          patientDetailsSaved: extractionResult.patientDetailsSaved,
          transcriptAvailable: session.transcript.length > 0,
        },
        notes: extractionResult.extracted.notes ?? null,
        status: "success",
      };
    }

    return {
      callId: session.callId,
      durationSec,
      patientName: session.patientName ?? null,
      phone: null,
      reasonForVisit: null,
      preferredDateTime: null,
      outcome: "INCOMPLETE",
      appointment: null,
      nextActions: {
        appointmentRecorded: false,
        patientDetailsSaved: false,
        transcriptAvailable: session.transcript.length > 0,
      },
      notes: "Call ended. Details stored in database.",
      status: "partial",
      errorMessage: "Structured clinical extraction could not be completed.",
    };
  } catch (error) {
    console.error(`[call] persist failed for ${session.callId}`, error);
    return {
      callId: session.callId,
      durationSec,
      patientName: session.patientName ?? null,
      phone: null,
      reasonForVisit: null,
      preferredDateTime: null,
      outcome: "FAILED",
      appointment: null,
      nextActions: {
        appointmentRecorded: false,
        patientDetailsSaved: false,
        transcriptAvailable: false,
      },
      notes: "Failed to persist call record.",
      status: "error",
      errorMessage: "Database persistence failed.",
    };
  }
};
