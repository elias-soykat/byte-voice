import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  DayOfWeek,
  ScheduleExceptionType,
  AppointmentStatus,
} from "../generated/prisma/enums";
import {
  validateDoctorSlot,
  getAvailableSlotsForDay,
  getDhakaDateTimeComponents,
  parseDhakaDate,
  formatTimeBn,
  type AvailabilityDataProvider,
  type SimplifiedAppointment,
} from "./availability";

// Mock doctor: Dr. Tanvir Ahmed works Sunday - Thursday 09:00 - 17:00
const mockDoctor = {
  id: "doc_tanvir",
  name: "Dr. Tanvir Ahmed",
  speciality: "Orthodontics",
  department: "Dental Surgery",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  schedules: [
    { id: "s1", doctorId: "doc_tanvir", dayOfWeek: DayOfWeek.SUNDAY, startTime: "09:00", endTime: "17:00", createdAt: new Date(), updatedAt: new Date() },
    { id: "s2", doctorId: "doc_tanvir", dayOfWeek: DayOfWeek.MONDAY, startTime: "09:00", endTime: "17:00", createdAt: new Date(), updatedAt: new Date() },
    { id: "s3", doctorId: "doc_tanvir", dayOfWeek: DayOfWeek.TUESDAY, startTime: "09:00", endTime: "17:00", createdAt: new Date(), updatedAt: new Date() },
    { id: "s4", doctorId: "doc_tanvir", dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "09:00", endTime: "17:00", createdAt: new Date(), updatedAt: new Date() },
    { id: "s5", doctorId: "doc_tanvir", dayOfWeek: DayOfWeek.THURSDAY, startTime: "09:00", endTime: "17:00", createdAt: new Date(), updatedAt: new Date() },
  ],
};

function createMockProvider(overrides?: Partial<AvailabilityDataProvider>): AvailabilityDataProvider {
  return {
    getDoctor: async (id) => (id === mockDoctor.id ? mockDoctor : null),
    getException: async () => null,
    getAppointmentsForRange: async () => [],
    getBookedAppointmentsForDay: async () => [],
    ...overrides,
  };
}

describe("Dhaka Timezone & Helpers", () => {
  it("converts UTC time to Asia/Dhaka components correctly", () => {
    // 2026-11-15T09:00:00Z is 15:00 (3 PM) Sunday in Dhaka (UTC+6)
    const date = new Date("2026-11-15T09:00:00.000Z");
    const { dateStr, timeStr, dayOfWeek } = getDhakaDateTimeComponents(date);

    assert.equal(dateStr, "2026-11-15");
    assert.equal(timeStr, "15:00");
    assert.equal(dayOfWeek, DayOfWeek.SUNDAY);
  });

  it("parses local ISO string as Dhaka time when no offset is specified", () => {
    const date = parseDhakaDate("2026-11-15T15:00:00");
    const { timeStr, dayOfWeek } = getDhakaDateTimeComponents(date);

    assert.equal(timeStr, "15:00");
    assert.equal(dayOfWeek, DayOfWeek.SUNDAY);
  });

  it("formats Bengali time labels naturally", () => {
    assert.equal(formatTimeBn("09:00"), "সকাল ৯:০০ টা");
    assert.equal(formatTimeBn("12:00"), "দুপুর ১২:০০ টা");
    assert.equal(formatTimeBn("15:30"), "বিকাল ৩:৩০ টা");
    assert.equal(formatTimeBn("19:00"), "সন্ধ্যা ৭:০০ টা");
  });
});

describe("Doctor Availability Validation (validateDoctorSlot)", () => {
  it("rejects booking if doctor does not exist or is inactive", async () => {
    const provider = createMockProvider({
      getDoctor: async () => ({ ...mockDoctor, isActive: false }),
    });

    const date = parseDhakaDate("2026-11-15T10:00:00"); // Sunday
    const result = await validateDoctorSlot(mockDoctor.id, date, 30, undefined, provider);

    assert.equal(result.isValid, false);
    assert.equal(result.code, "DOCTOR_INACTIVE");
    assert.match(result.messageBn, /উপলব্ধ নেই|সক্রিয় নন/);
  });

  it("allows booking on a working Sunday within shift hours", async () => {
    const provider = createMockProvider();
    const date = parseDhakaDate("2026-11-15T10:00:00"); // Sunday 10:00 AM (shift: 09:00 - 17:00)
    const result = await validateDoctorSlot(mockDoctor.id, date, 30, undefined, provider);

    assert.equal(result.isValid, true);
    assert.equal(result.code, undefined);
  });

  it("rejects booking on a non-working day (e.g. Friday) and suggests working days", async () => {
    const provider = createMockProvider();
    const date = parseDhakaDate("2026-11-20T10:00:00"); // 2026-11-20 is Friday
    const result = await validateDoctorSlot(mockDoctor.id, date, 30, undefined, provider);

    assert.equal(result.isValid, false);
    assert.equal(result.code, "NOT_WORKING_DAY");
    assert.match(result.messageBn, /রোগী দেখেন না/);
    assert.match(result.messageBn, /SUNDAY|MONDAY|রবিবার/i);
  });

  it("rejects booking when doctor is on leave (ScheduleException OFF)", async () => {
    const provider = createMockProvider({
      getException: async () => ({
        id: "exc_1",
        doctorId: mockDoctor.id,
        date: new Date("2026-11-15"),
        type: ScheduleExceptionType.OFF,
        startTime: null,
        endTime: null,
        reason: "পারিবারিক ছুটি (Family Leave)",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const date = parseDhakaDate("2026-11-15T10:00:00"); // Sunday, but doctor is OFF
    const result = await validateDoctorSlot(mockDoctor.id, date, 30, undefined, provider);

    assert.equal(result.isValid, false);
    assert.equal(result.code, "ON_LEAVE");
    assert.match(result.messageBn, /ছুটিতে আছেন/);
    assert.match(result.messageBn, /পারিবারিক ছুটি/);
  });

  it("respects custom working hours (ScheduleException CUSTOM)", async () => {
    const provider = createMockProvider({
      getException: async () => ({
        id: "exc_2",
        doctorId: mockDoctor.id,
        date: new Date("2026-11-15"),
        type: ScheduleExceptionType.CUSTOM,
        startTime: "14:00",
        endTime: "18:00",
        reason: "বিশেষ বিকাল শিফট",
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    // 10:00 AM is within regular schedule (09-17) but OUTSIDE custom exception (14-18)
    const morningDate = parseDhakaDate("2026-11-15T10:00:00");
    const morningResult = await validateDoctorSlot(mockDoctor.id, morningDate, 30, undefined, provider);
    assert.equal(morningResult.isValid, false);
    assert.equal(morningResult.code, "OUTSIDE_HOURS");
    assert.match(morningResult.messageBn, /14:00/);

    // 15:00 PM is within custom exception (14-18)
    const afternoonDate = parseDhakaDate("2026-11-15T15:00:00");
    const afternoonResult = await validateDoctorSlot(mockDoctor.id, afternoonDate, 30, undefined, provider);
    assert.equal(afternoonResult.isValid, true);
  });

  it("rejects booking outside shift boundaries (e.g. before 09:00 or after 17:00)", async () => {
    const provider = createMockProvider();

    // 08:30 AM (shift starts 09:00)
    const early = parseDhakaDate("2026-11-15T08:30:00");
    const earlyResult = await validateDoctorSlot(mockDoctor.id, early, 30, undefined, provider);
    assert.equal(earlyResult.isValid, false);
    assert.equal(earlyResult.code, "OUTSIDE_HOURS");

    // 16:45 PM with 30 min duration (ends 17:15, after shift ends at 17:00)
    const late = parseDhakaDate("2026-11-15T16:45:00");
    const lateResult = await validateDoctorSlot(mockDoctor.id, late, 30, undefined, provider);
    assert.equal(lateResult.isValid, false);
    assert.equal(lateResult.code, "OUTSIDE_HOURS");
  });

  it("rejects booking if slot clashes with an existing active appointment and suggests free slots", async () => {
    const bookedStart = parseDhakaDate("2026-11-15T10:00:00");
    const bookedEnd = parseDhakaDate("2026-11-15T10:30:00");

    const provider = createMockProvider({
      getAppointmentsForRange: async () => [
        {
          id: "appt_1",
          doctorId: mockDoctor.id,
          startTime: bookedStart,
          endTime: bookedEnd,
          status: AppointmentStatus.BOOKED,
        },
      ],
      getBookedAppointmentsForDay: async () => [
        {
          id: "appt_1",
          startTime: bookedStart,
          endTime: bookedEnd,
          status: AppointmentStatus.BOOKED,
        },
      ],
    });

    // Attempt to book 10:00 - 10:30
    const reqDate = parseDhakaDate("2026-11-15T10:00:00");
    const result = await validateDoctorSlot(mockDoctor.id, reqDate, 30, undefined, provider);

    assert.equal(result.isValid, false);
    assert.equal(result.code, "SLOT_BOOKED");
    assert.match(result.messageBn, /আরেকটি অ্যাপয়েন্টমেন্ট/);
    assert.ok(result.suggestedSlots && result.suggestedSlots.length > 0);
    // 10:00 shouldn't be in suggested slots, but 09:00 or 10:30 should be
    assert.ok(!result.suggestedSlots.includes("10:00 AM"));
  });

  it("does not clash with CANCELLED appointments", async () => {
    const bookedStart = parseDhakaDate("2026-11-15T10:00:00");
    const bookedEnd = parseDhakaDate("2026-11-15T10:30:00");

    const provider = createMockProvider({
      getAppointmentsForRange: async () => [
        {
          id: "appt_cancelled",
          doctorId: mockDoctor.id,
          startTime: bookedStart,
          endTime: bookedEnd,
          status: AppointmentStatus.CANCELLED,
        },
      ],
    });

    const reqDate = parseDhakaDate("2026-11-15T10:00:00");
    const result = await validateDoctorSlot(mockDoctor.id, reqDate, 30, undefined, provider);

    assert.equal(result.isValid, true);
  });

  it("allows rescheduling into the same slot when excluding the appointment's own ID", async () => {
    const bookedStart = parseDhakaDate("2026-11-15T10:00:00");
    const bookedEnd = parseDhakaDate("2026-11-15T10:30:00");

    const provider = createMockProvider({
      getAppointmentsForRange: async (docId, s, e, excludeId) => {
        if (excludeId === "appt_self") return [];
        return [
          {
            id: "appt_self",
            doctorId: mockDoctor.id,
            startTime: bookedStart,
            endTime: bookedEnd,
            status: AppointmentStatus.BOOKED,
          },
        ];
      },
    });

    const reqDate = parseDhakaDate("2026-11-15T10:00:00");
    // Reschedule passing excludeAppointmentId = "appt_self"
    const result = await validateDoctorSlot(mockDoctor.id, reqDate, 30, "appt_self", provider);

    assert.equal(result.isValid, true);
  });
});

describe("Slot Generation (getAvailableSlotsForDay)", () => {
  it("returns available 30-min slots excluding booked appointments", async () => {
    const bookedStart = parseDhakaDate("2026-11-15T09:30:00");
    const bookedEnd = parseDhakaDate("2026-11-15T10:00:00");

    const provider = createMockProvider({
      getBookedAppointmentsForDay: async () => [
        {
          id: "appt_1",
          startTime: bookedStart,
          endTime: bookedEnd,
          status: AppointmentStatus.BOOKED,
        },
      ],
    });

    const slots = await getAvailableSlotsForDay(mockDoctor.id, "2026-11-15", 30, provider);

    assert.ok(slots.length > 0);
    // 09:00 should be available, 09:30 should NOT be available, 10:00 should be available
    assert.ok(slots.some((s) => s.includes("09:00") || s.includes("9:00")));
    assert.ok(!slots.some((s) => s.includes("09:30") || s.includes("9:30")));
    assert.ok(slots.some((s) => s.includes("10:00")));
  });

  it("returns empty slots if doctor is on leave", async () => {
    const provider = createMockProvider({
      getException: async () => ({
        id: "exc_1",
        doctorId: mockDoctor.id,
        date: new Date("2026-11-15"),
        type: ScheduleExceptionType.OFF,
        startTime: null,
        endTime: null,
        reason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    });

    const slots = await getAvailableSlotsForDay(mockDoctor.id, "2026-11-15", 30, provider);
    assert.equal(slots.length, 0);
  });
});

describe("Concurrency & Conflict Simulation", () => {
  it("prevents second concurrent request from validating/booking the same slot", async () => {
    const bookedAppointments: SimplifiedAppointment[] = [];

    const dynamicProvider: AvailabilityDataProvider = {
      getDoctor: async (id) => (id === mockDoctor.id ? mockDoctor : null),
      getException: async () => null,
      getAppointmentsForRange: async (docId, start, end) =>
        bookedAppointments.filter(
          (a) =>
            a.status === AppointmentStatus.BOOKED &&
            a.startTime < end &&
            a.endTime > start,
        ),
      getBookedAppointmentsForDay: async () => [...bookedAppointments],
    };

    const targetDate = parseDhakaDate("2026-11-15T10:00:00");

    // First request checks slot
    const check1 = await validateDoctorSlot(mockDoctor.id, targetDate, 30, undefined, dynamicProvider);
    assert.equal(check1.isValid, true);

    // First request simulates saving appointment to database
    bookedAppointments.push({
      id: "appt_concurrent_1",
      startTime: targetDate,
      endTime: new Date(targetDate.getTime() + 30 * 60_000),
      status: AppointmentStatus.BOOKED,
    });

    // Concurrent second request checks the exact same slot
    const check2 = await validateDoctorSlot(mockDoctor.id, targetDate, 30, undefined, dynamicProvider);
    assert.equal(check2.isValid, false);
    assert.equal(check2.code, "SLOT_BOOKED");
    assert.match(check2.messageBn, /আরেকটি অ্যাপয়েন্টমেন্ট/);
  });
});
