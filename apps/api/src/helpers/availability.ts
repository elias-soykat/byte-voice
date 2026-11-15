import {
  DayOfWeek,
  ScheduleExceptionType,
  AppointmentStatus,
} from "../generated/prisma/enums";
import type { Doctor, DoctorSchedule, ScheduleException } from "../generated/prisma/client";
import * as doctorsData from "../data/doctors.data";
import * as exceptionsData from "../data/exceptions.data";
import * as appointmentsData from "../data/appointments.data";

export const DHAKA_TIMEZONE = "Asia/Dhaka";

export const DAY_OF_WEEK_BN: Record<DayOfWeek, string> = {
  [DayOfWeek.SUNDAY]: "রবিবার",
  [DayOfWeek.MONDAY]: "সোমবার",
  [DayOfWeek.TUESDAY]: "মঙ্গলবার",
  [DayOfWeek.WEDNESDAY]: "বুধবার",
  [DayOfWeek.THURSDAY]: "বৃহস্পতিবার",
  [DayOfWeek.FRIDAY]: "শুক্রবার",
  [DayOfWeek.SATURDAY]: "শনিবার",
};

export interface SimplifiedAppointment {
  id: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
}

export interface DoctorWithSchedules {
  id: string;
  name: string;
  speciality: string;
  department: string;
  isActive: boolean;
  schedules: DoctorSchedule[];
  createdAt?: Date | undefined;
  updatedAt?: Date | undefined;
}

export interface AvailabilityDataProvider {
  getDoctor: (id: string) => Promise<DoctorWithSchedules | null>;
  getException: (doctorId: string, date: Date) => Promise<ScheduleException | null>;
  getAppointmentsForRange: (
    doctorId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string | undefined,
  ) => Promise<SimplifiedAppointment[]>;
  getBookedAppointmentsForDay: (
    doctorId: string,
    dayStart: Date,
    dayEnd: Date,
  ) => Promise<SimplifiedAppointment[]>;
}

export const defaultAvailabilityProvider: AvailabilityDataProvider = {
  getDoctor: async (id) => (await doctorsData.findDoctorById(id)) as DoctorWithSchedules | null,
  getException: async (doctorId, date) => exceptionsData.findExceptionByDoctorAndDate(doctorId, date),
  getAppointmentsForRange: async (doctorId, startTime, endTime, excludeAppointmentId) =>
    appointmentsData.findOverlappingAppointments({
      doctorId,
      startTime,
      endTime,
      ...(excludeAppointmentId ? { excludeAppointmentId } : {}),
    }),
  getBookedAppointmentsForDay: async (doctorId, dayStart, dayEnd) =>
    appointmentsData.findBookedAppointmentsForDay({
      doctorId,
      dayStart,
      dayEnd,
    }),
};

/**
 * Extracts Asia/Dhaka local date (YYYY-MM-DD), 24-hr time (HH:mm), and DayOfWeek enum
 */
export function getDhakaDateTimeComponents(date: Date) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DHAKA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    weekday: "long",
  });

  const parts = dtf.formatToParts(date);
  const partMap: Record<string, string> = {};
  for (const p of parts) {
    partMap[p.type] = p.value;
  }

  const year = partMap.year ?? "1970";
  const month = partMap.month ?? "01";
  const day = partMap.day ?? "01";
  const hour = partMap.hour ?? "00";
  const minute = partMap.minute ?? "00";

  const dateStr = `${year}-${month}-${day}`;
  const timeStr = `${hour}:${minute}`;
  const weekday = (partMap.weekday ?? "Sunday").toUpperCase();
  const dayOfWeek = (DayOfWeek[weekday as keyof typeof DayOfWeek] ?? DayOfWeek.SUNDAY) as DayOfWeek;

  return { dateStr, timeStr, dayOfWeek, year, month, day };
}

/**
 * Parses an ISO string or Date, treating bare strings without offset as Dhaka time (+06:00)
 */
export function parseDhakaDate(input: string | Date): Date {
  if (input instanceof Date) return input;
  const str = input.trim();
  if (!/(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(str)) {
    return new Date(`${str}+06:00`);
  }
  return new Date(str);
}

export const toBanglaDigits = (str: string | number): string => {
  const bnDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(str).replace(/\d/g, (d) => bnDigits[parseInt(d, 10)] ?? d);
};

/**
 * Formats a 24-hour "HH:mm" time string into courteous Bengali spoken format
 */
export function formatTimeBn(timeStr: string): string {
  const [hStr, mStr] = timeStr.split(":");
  const hour = parseInt(hStr ?? "0", 10);
  const min = parseInt(mStr ?? "0", 10);
  const minText = min === 0 ? ":০০" : `:${min < 10 ? "0" + min : min}`;

  let period = "সকাল";
  let displayHour = hour;
  if (hour >= 12 && hour < 15) {
    period = "দুপুর";
    displayHour = hour === 12 ? 12 : hour - 12;
  } else if (hour >= 15 && hour < 18) {
    period = "বিকাল";
    displayHour = hour - 12;
  } else if (hour >= 18 && hour < 20) {
    period = "সন্ধ্যা";
    displayHour = hour - 12;
  } else if (hour >= 20) {
    period = "রাত";
    displayHour = hour - 12;
  } else if (hour === 0) {
    period = "রাত";
    displayHour = 12;
  }

  const bnHour = toBanglaDigits(displayHour);
  const bnMin = toBanglaDigits(minText);

  return `${period} ${bnHour}${bnMin} টা`;
}

export type SlotValidationCode =
  | "DOCTOR_INACTIVE"
  | "ON_LEAVE"
  | "NOT_WORKING_DAY"
  | "OUTSIDE_HOURS"
  | "SLOT_BOOKED";

export interface SlotValidationResult {
  isValid: boolean;
  code?: SlotValidationCode;
  messageBn: string;
  messageEn: string;
  suggestedSlots?: string[];
  workingHours?: { start: string; end: string };
  doctorName?: string;
}

/**
 * Validates whether a requested doctor slot is available for booking/rescheduling.
 */
export async function validateDoctorSlot(
  doctorId: string,
  startTimeInput: Date | string,
  durationMinutes: number = 30,
  excludeAppointmentId?: string,
  provider: AvailabilityDataProvider = defaultAvailabilityProvider,
): Promise<SlotValidationResult> {
  const startTime = parseDhakaDate(startTimeInput);
  if (Number.isNaN(startTime.getTime())) {
    return {
      isValid: false,
      code: "OUTSIDE_HOURS",
      messageBn: "প্রদত্ত তারিখ ও সময়টি সঠিক নয়।",
      messageEn: "Invalid date-time provided.",
    };
  }

  const endTime = new Date(startTime.getTime() + durationMinutes * 60_000);

  // 1. Doctor status check
  const doctor = await provider.getDoctor(doctorId);
  if (!doctor || !doctor.isActive) {
    return {
      isValid: false,
      code: "DOCTOR_INACTIVE",
      messageBn: "দুঃখিত, এই ডাক্তার বর্তমানে সক্রিয় নন বা ক্লিনিকে উপলব্ধ নেই।",
      messageEn: "Doctor is inactive or not found.",
    };
  }

  const { dateStr, timeStr: reqStart, dayOfWeek } = getDhakaDateTimeComponents(startTime);
  const { timeStr: reqEnd } = getDhakaDateTimeComponents(endTime);

  // 2. Schedule Exception Check (Leave or Custom shift)
  const targetDateOnly = new Date(`${dateStr}T00:00:00.000Z`);
  const exception = await provider.getException(doctorId, targetDateOnly);

  let effectiveStart: string | null = null;
  let effectiveEnd: string | null = null;

  if (exception) {
    if (exception.type === ScheduleExceptionType.OFF) {
      const reasonBn = exception.reason ? ` (${exception.reason})` : "";
      return {
        isValid: false,
        code: "ON_LEAVE",
        doctorName: doctor.name,
        messageBn: `দুঃখিত, ডাঃ ${doctor.name} ওই তারিখে (${dateStr}) ছুটিতে আছেন${reasonBn}। আপনি কি অন্য কোনো দিন দেখাতে চান?`,
        messageEn: `Dr. ${doctor.name} is on leave on ${dateStr}${exception.reason ? ` (${exception.reason})` : ""}.`,
      };
    } else if (exception.type === ScheduleExceptionType.CUSTOM) {
      if (exception.startTime && exception.endTime) {
        effectiveStart = exception.startTime;
        effectiveEnd = exception.endTime;
      }
    }
  }

  // 3. Regular Weekly Working Schedule (if no custom shift exception)
  if (!effectiveStart || !effectiveEnd) {
    const regularSchedule = doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!regularSchedule) {
      const workingDaysBn = doctor.schedules
        .map((s) => DAY_OF_WEEK_BN[s.dayOfWeek] || s.dayOfWeek)
        .join(", ");
      return {
        isValid: false,
        code: "NOT_WORKING_DAY",
        doctorName: doctor.name,
        messageBn: `ডাঃ ${doctor.name} ${DAY_OF_WEEK_BN[dayOfWeek] || dayOfWeek} বারে রোগী দেখেন না। তিনি চেম্বারে বসেন: ${workingDaysBn}।`,
        messageEn: `Dr. ${doctor.name} does not work on ${dayOfWeek}. Working days: ${workingDaysBn}.`,
      };
    }
    effectiveStart = regularSchedule.startTime;
    effectiveEnd = regularSchedule.endTime;
  }

  // 4. Shift boundary check (HH:mm)
  if (reqStart < effectiveStart || reqEnd > effectiveEnd) {
    return {
      isValid: false,
      code: "OUTSIDE_HOURS",
      doctorName: doctor.name,
      messageBn: `সময়টি ডাঃ ${doctor.name}-এর চেম্বার সময়ের বাইরে। তার উপস্থিতির সময়: ${formatTimeBn(effectiveStart)} (${effectiveStart}) থেকে ${formatTimeBn(effectiveEnd)} (${effectiveEnd}) পর্যন্ত।`,
      messageEn: `Requested time is outside working hours (${effectiveStart} - ${effectiveEnd}).`,
      workingHours: { start: effectiveStart, end: effectiveEnd },
    };
  }

  // 5. Existing Appointment Conflict / Overlap Check
  const clashes = await provider.getAppointmentsForRange(
    doctorId,
    startTime,
    endTime,
    excludeAppointmentId,
  );

  const activeClash = clashes.find(
    (a) =>
      a.status === AppointmentStatus.BOOKED ||
      a.status === AppointmentStatus.RESCHEDULED,
  );

  if (activeClash) {
    // Generate actual available slots on that day to suggest to the caller
    const suggestions = await getAvailableSlotsForDay(
      doctorId,
      dateStr,
      durationMinutes,
      provider,
    );
    const topSuggestions = suggestions.slice(0, 3);

    return {
      isValid: false,
      code: "SLOT_BOOKED",
      doctorName: doctor.name,
      messageBn: `দুঃখিত, ওই সময়ে ডাঃ ${doctor.name}-এর আরেকটি অ্যাপয়েন্টমেন্ট রয়েছে। ${
        topSuggestions.length > 0
          ? `আপনি কি ${topSuggestions.join(" বা ")} সময়ে নিতে চান?`
          : "দয়া করে অন্য কোনো সময় বা দিন বলুন।"
      }`,
      messageEn: `Dr. ${doctor.name} already has an appointment booked at that time.`,
      suggestedSlots: topSuggestions,
    };
  }

  return {
    isValid: true,
    doctorName: doctor.name,
    messageBn: "সময়টি অ্যাপয়েন্টমেন্টের জন্য উপলব্ধ রয়েছে।",
    messageEn: "Slot is available.",
  };
}

/**
 * Computes all genuinely open 30-min intervals for a doctor on a given day (YYYY-MM-DD).
 */
export async function getAvailableSlotsForDay(
  doctorId: string,
  dateStr: string,
  slotDurationMinutes: number = 30,
  provider: AvailabilityDataProvider = defaultAvailabilityProvider,
): Promise<string[]> {
  const doctor = await provider.getDoctor(doctorId);
  if (!doctor || !doctor.isActive) return [];

  const targetDateOnly = new Date(`${dateStr}T00:00:00.000Z`);
  const exception = await provider.getException(doctorId, targetDateOnly);

  if (exception?.type === ScheduleExceptionType.OFF) return [];

  const dhakaDate = new Date(`${dateStr}T12:00:00+06:00`);
  const { dayOfWeek } = getDhakaDateTimeComponents(dhakaDate);

  let startStr = exception?.startTime;
  let endStr = exception?.endTime;

  if (!startStr || !endStr) {
    const regular = doctor.schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!regular) return [];
    startStr = regular.startTime;
    endStr = regular.endTime;
  }

  const dayStart = new Date(`${dateStr}T00:00:00+06:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59+06:00`);

  const booked = await provider.getBookedAppointmentsForDay(doctorId, dayStart, dayEnd);
  const activeBookings = booked.filter(
    (b) =>
      b.status === AppointmentStatus.BOOKED ||
      b.status === AppointmentStatus.RESCHEDULED,
  );

  const [startHour, startMin] = startStr.split(":").map(Number);
  const [endHour, endMin] = endStr.split(":").map(Number);

  if (startHour === undefined || startMin === undefined || endHour === undefined || endMin === undefined) {
    return [];
  }

  let current = new Date(
    `${dateStr}T${String(startHour).padStart(2, "0")}:${String(startMin).padStart(2, "0")}:00+06:00`,
  );
  const boundary = new Date(
    `${dateStr}T${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}:00+06:00`,
  );

  const freeSlots: string[] = [];

  while (current.getTime() + slotDurationMinutes * 60_000 <= boundary.getTime()) {
    const slotEnd = new Date(current.getTime() + slotDurationMinutes * 60_000);
    const hasOverlap = activeBookings.some((b) => b.startTime < slotEnd && b.endTime > current);

    if (!hasOverlap) {
      const timeLabel = current.toLocaleTimeString("en-US", {
        timeZone: DHAKA_TIMEZONE,
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      freeSlots.push(timeLabel);
    }
    current = slotEnd;
  }

  return freeSlots;
}
