export type CallStatus = "COMPLETED" | "NO_AUDIO" | "FAILED";

export type CallOutcome =
  | "BOOKED"
  | "ENQUIRY"
  | "FOLLOW_UP_NEEDED"
  | "INCOMPLETE"
  | "FAILED";

export type CallRole = "user" | "agent";

export type TranscriptEntry = {
  role: CallRole;
  text: string;
  at: number;
  text_bn?: string;
  text_en?: string;
};

export type CallExtractionData = {
  id: string;
  patientName?: string | null;
  phone?: string | null;
  reasonForVisit?: string | null;
  preferredDateTime?: string | null;
  intent?: string | null;
  outcome: CallOutcome;
  notes?: string | null;
  validationStatus?: string;
};

export type PatientSummary = {
  id: string;
  fullName: string;
  phone: string;
  email?: string | null;
};

export type AppointmentSummary = {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  doctor?: {
    id: string;
    name: string;
    speciality: string;
  };
};

export type CallSummary = {
  id: string;
  callId: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  patientName: string | null;
  patientPhone: string | null;
  userTurns: number;
  status: CallStatus;
  outcome: CallOutcome;
  audioKey: string | null;
  recordingUrl?: string | null;
  createdAt: string;
  patient?: PatientSummary | null;
  extraction?: CallExtractionData | null;
};

export type CallDetail = CallSummary & {
  transcript: TranscriptEntry[];
  audioUrl: string | null;
  appointment?: AppointmentSummary | null;
};

export type CallsPage = {
  items: CallSummary[];
  total: number;
  page: number;
  limit: number;
};

export type ListCallsParams = {
  page?: number;
  limit?: number;
  search?: string;
  outcome?: CallOutcome;
};
