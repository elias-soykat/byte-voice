import { z } from "zod";
import { routerModel } from "../libs/chatModel";
import { CallOutcome } from "../generated/prisma/client";
import { prisma } from "../libs/prisma";
import * as callsData from "../data/calls.data";
import * as patientsData from "../data/patients.data";

// Bengali to English numeral mapping
const BN_TO_EN_DIGITS: Record<string, string> = {
  "০": "0",
  "১": "1",
  "২": "2",
  "৩": "3",
  "৪": "4",
  "৫": "5",
  "৬": "6",
  "৭": "7",
  "৮": "8",
  "৯": "9",
};

/**
 * Normalizes any Bangladeshi phone number string (with Bengali numerals,
 * spaces, words, or country codes) into a canonical 11-digit `01XXXXXXXXX` format.
 */
export const normalizeBanglaPhone = (
  raw?: string | null,
): { phone: string | null; isValid: boolean } => {
  if (!raw) return { phone: null, isValid: false };

  // Convert Bengali numerals to Western ASCII digits
  let converted = raw.replace(/[০-৯]/g, (ch) => BN_TO_EN_DIGITS[ch] ?? ch);

  // Remove non-digit characters except leading '+'
  converted = converted.replace(/[^\d+]/g, "");

  // If starts with +880, strip +88
  if (converted.startsWith("+880")) {
    converted = converted.slice(3);
  } else if (converted.startsWith("880")) {
    converted = converted.slice(2);
  }

  // Ensure leading 0
  if (!converted.startsWith("0") && converted.length === 10) {
    converted = `0${converted}`;
  }

  // Standard Bangladeshi mobile numbers: 01[3-9] followed by 8 digits (11 digits total)
  const isValid = /^01[3-9]\d{8}$/.test(converted);

  return {
    phone: isValid ? converted : converted.length >= 7 ? converted : null,
    isValid,
  };
};

// Zod schema for structured extraction output from the LLM
const callExtractionSchema = z.object({
  patientName: z
    .string()
    .nullable()
    .describe("Name of the caller or patient as mentioned in the conversation, in English or Bengali."),
  phone: z
    .string()
    .nullable()
    .describe("Phone number given by the patient, including digits spoken in words or Bengali numerals."),
  reasonForVisit: z
    .string()
    .nullable()
    .describe("Primary reason for calling (e.g. toothache, cleaning/scaling, braces, consultation, root canal, pricing)."),
  preferredDateTime: z
    .string()
    .nullable()
    .describe("Preferred date or time requested by the patient (e.g. next Sunday 3pm, tomorrow evening)."),
  intent: z
    .string()
    .describe("Primary intent: BOOK_APPOINTMENT, CLINIC_ENQUIRY, MEDICAL_ADVICE_CALLBACK, RESCHEDULE, CANCEL, or OTHER."),
  outcome: z
    .enum(["BOOKED", "ENQUIRY", "FOLLOW_UP_NEEDED", "INCOMPLETE", "FAILED"])
    .describe(
      "Call outcome: BOOKED if an appointment was booked and confirmed; ENQUIRY if asking for hours/fees/info; FOLLOW_UP_NEEDED if requesting a human doctor/receptionist callback or medical triage refusal; INCOMPLETE if dropped prematurely or unresolved; FAILED if technical breakdown.",
    ),
  notes: z
    .string()
    .describe("Brief English summary of what happened on the call and any action required by reception staff."),
});

export type ExtractedCallData = z.infer<typeof callExtractionSchema>;

export interface TranscriptTurn {
  role: "user" | "agent";
  text: string;
  at?: number;
}

export interface ProcessedCallSummary {
  extracted: ExtractedCallData;
  patientId?: string | undefined;
  patientName?: string | undefined;
  normalizedPhone?: string | null | undefined;
  isPhoneValid: boolean;
  appointment?: {
    id: string;
    doctorName: string;
    doctorSpeciality: string;
    startTime: string;
  } | null | undefined;
  patientDetailsSaved: boolean;
  appointmentRecorded: boolean;
  transcriptAvailable: boolean;
}

const EXTRACTION_SYSTEM_PROMPT = `You are a clinical data extraction specialist for Dhaka Dental Care (StrategyByte ByteVoice).
Analyze the phone conversation transcript between the patient and the AI receptionist.
Extract structured details according to the schema:
- Extract patient's name, phone number, reason for visit, and preferred date/time.
- Determine the overall call outcome:
  * "BOOKED": If an appointment was booked and confirmed.
  * "ENQUIRY": If the caller asked about opening hours, scaling fees, clinic location, doctor availability, etc., and no booking was made.
  * "FOLLOW_UP_NEEDED": If the caller asked for medical advice/prescription (which AI receptionist declined), requested a human callback, or had an urgent issue requiring staff intervention.
  * "INCOMPLETE": If the call was disconnected prematurely, silent, or no clear conclusion was reached.
  * "FAILED": If there were system/communication failures.
Provide a concise, professional summary note for the clinic staff.`;

/**
 * Extracts structured patient details and outcomes from a completed call transcript,
 * validates Bangladeshi phone numbers, upserts the Patient entity, verifies linked appointment in DB,
 * and saves the CallExtraction. Returns structured verification data for post-call summary.
 */
export const processCallExtraction = async (params: {
  callDbId: string;
  callSessionId: string;
  transcript: TranscriptTurn[];
  fallbackPatientName?: string;
  fallbackEmail?: string;
}): Promise<ProcessedCallSummary | null> => {
  const { callDbId, transcript, fallbackPatientName, fallbackEmail } = params;

  if (!transcript || transcript.length === 0) {
    return null;
  }

  try {
    const formattedTranscript = transcript
      .map((t) => `${t.role === "user" ? "Caller" : "Receptionist"}: ${t.text}`)
      .join("\n");

    const extractor = routerModel().withStructuredOutput(callExtractionSchema);

    const extracted = (await extractor.invoke([
      { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
      { role: "user", content: `Call Transcript:\n${formattedTranscript}` },
    ])) as ExtractedCallData;

    const patientName = extracted.patientName || fallbackPatientName || undefined;
    const { phone: normalizedPhone, isValid: isPhoneValid } = normalizeBanglaPhone(
      extracted.phone,
    );

    let patientId: string | undefined = undefined;
    let patientDetailsSaved = false;

    // If we have a validated or usable phone and a name, associate or create patient
    if (normalizedPhone && patientName) {
      try {
        const patient = await patientsData.findOrCreatePatient({
          fullName: patientName,
          phone: normalizedPhone,
          ...(fallbackEmail ? { email: fallbackEmail } : {}),
        });
        patientId = patient.id;
        patientDetailsSaved = true;
      } catch (err) {
        console.error("[callExtractor] Error upserting patient:", err);
      }
    }

    const validationStatus = isPhoneValid
      ? "VALID"
      : extracted.phone
        ? "INVALID_PHONE"
        : "NEEDS_REVIEW";

    // Verify appointments persisted in the DB with deterministic callId linkage
    let verifiedAppointment: {
      id: string;
      doctorName: string;
      doctorSpeciality: string;
      startTime: string;
    } | null = null;
    let appointmentRecorded = false;

    try {
      // 1. Direct relational lookup via foreign key callId (supporting 1-to-many appointments)
      let linkedAppointments = await prisma.appointment.findMany({
        where: { callId: callDbId },
        orderBy: { startTime: "asc" },
        include: { doctor: { select: { id: true, name: true, speciality: true } } },
      });

      // 2. Fallback only if no appointments were directly linked
      if (linkedAppointments.length === 0 && patientId) {
        const unlinked = await prisma.appointment.findFirst({
          where: {
            patientId,
            callId: null,
          },
          orderBy: { createdAt: "desc" },
          include: { doctor: { select: { id: true, name: true, speciality: true } } },
        });

        if (unlinked) {
          const updated = await prisma.appointment.update({
            where: { id: unlinked.id },
            data: { callId: callDbId },
            include: { doctor: { select: { id: true, name: true, speciality: true } } },
          });
          linkedAppointments = [updated];
        }
      }

      if (linkedAppointments.length > 0) {
        const primary = linkedAppointments[0]!;
        verifiedAppointment = {
          id: primary.id,
          doctorName: primary.doctor.name,
          doctorSpeciality: primary.doctor.speciality,
          startTime: primary.startTime.toISOString(),
        };
        appointmentRecorded = linkedAppointments.some(
          (a) => a.status === "BOOKED" || a.status === "RESCHEDULED",
        );

        // Maintain patient relationship integrity across all appointments linked to this call
        if (patientId) {
          await prisma.appointment.updateMany({
            where: { callId: callDbId, patientId: null },
            data: {
              patientId,
              ...(normalizedPhone ? { patientPhone: normalizedPhone } : {}),
            },
          });
        }
      }
    } catch (apptErr) {
      console.error("[callExtractor] Error verifying linked appointments:", apptErr);
    }

    // Truth-in-booking: Only claim BOOKED if an actual appointment record exists in DB
    let finalOutcome: CallOutcome = extracted.outcome as CallOutcome;
    if (finalOutcome === "BOOKED" && !appointmentRecorded) {
      finalOutcome = extracted.reasonForVisit ? CallOutcome.ENQUIRY : CallOutcome.INCOMPLETE;
    } else if (appointmentRecorded) {
      finalOutcome = CallOutcome.BOOKED;
    }

    // Save structured extraction
    await callsData.saveCallExtraction({
      callId: callDbId,
      ...(patientId ? { patientId } : {}),
      ...(patientName ? { patientName } : {}),
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      ...(extracted.reasonForVisit ? { reasonForVisit: extracted.reasonForVisit } : {}),
      ...(extracted.preferredDateTime ? { preferredDateTime: extracted.preferredDateTime } : {}),
      intent: extracted.intent,
      outcome: finalOutcome,
      notes: extracted.notes,
      validationStatus,
    });

    // Update Call record with outcome and patient reference
    await callsData.updateCall(callDbId, {
      outcome: finalOutcome,
      ...(patientName ? { patientName } : {}),
      ...(normalizedPhone ? { patientPhone: normalizedPhone } : {}),
      ...(patientId ? { patient: { connect: { id: patientId } } } : {}),
    });

    console.log(
      `[callExtractor] Successfully processed call ${callDbId}: outcome=${finalOutcome}, phone=${normalizedPhone}, apptRecorded=${appointmentRecorded}`,
    );

    return {
      extracted: {
        ...extracted,
        outcome: finalOutcome,
      },
      patientId,
      patientName,
      normalizedPhone,
      isPhoneValid,
      appointment: verifiedAppointment,
      patientDetailsSaved,
      appointmentRecorded,
      transcriptAvailable: transcript.length > 0,
    };
  } catch (error) {
    console.error(`[callExtractor] Failed extracting call data for ${callDbId}:`, error);
    return null;
  }
};
