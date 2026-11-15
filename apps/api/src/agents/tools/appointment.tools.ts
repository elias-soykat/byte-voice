import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";

import { Prisma } from "../../generated/prisma/client";
import { AppointmentStatus } from "../../generated/prisma/enums";
import * as appointmentsData from "../../data/appointments.data";
import * as doctorsData from "../../data/doctors.data";
import { DEFAULT_APPOINTMENT_MINUTES } from "../../config/agents";
import { sendAppointmentConfirmation } from "../../libs/mailer";
import { AppError } from "../../errors/AppError";
import {
  validateDoctorSlot,
  getAvailableSlotsForDay,
  getDhakaDateTimeComponents,
  parseDhakaDate,
  formatTimeBn,
  DAY_OF_WEEK_BN,
} from "../../helpers/availability";

// Bengali dental term mapper to help query matching
const BENGALI_SPECIALITY_MAP: Record<string, string> = {
  "স্কেলিং": "Periodontics",
  "পলিশিং": "Periodontics",
  "দাঁত পরিষ্কার": "Periodontics",
  "রুট ক্যানেল": "Endodontics",
  "ব্রেসেস": "Orthodontics",
  "আঁকাবাঁকা": "Orthodontics",
  "দাঁত তোলা": "Surgery",
  "শিশু": "Pediatric",
  "বাচ্চা": "Pediatric",
  "তানভীর": "Tanvir",
  "ফারজানা": "Farzana",
  "শাকিল": "Shakil",
  "নুসরাত": "Nusrat",
};

const resolveDoctorSearch = (query: string): string => {
  for (const [bn, en] of Object.entries(BENGALI_SPECIALITY_MAP)) {
    if (query.includes(bn)) return en;
  }
  return query;
};

const doctorSearchWhere = (query: string): Prisma.DoctorWhereInput => {
  const resolved = resolveDoctorSearch(query);
  return {
    isActive: true,
    OR: [
      { name: { contains: resolved, mode: "insensitive" } },
      { speciality: { contains: resolved, mode: "insensitive" } },
      { department: { contains: resolved, mode: "insensitive" } },
      { name: { contains: query, mode: "insensitive" } },
    ],
  };
};

export const listDoctorsTool = tool(
  async ({ query }: { query?: string }) => {
    const where: Prisma.DoctorWhereInput = query
      ? doctorSearchWhere(query)
      : { isActive: true };
    const doctors = await doctorsData.findDoctors({ skip: 0, take: 10, where });
    if (doctors.length === 0) {
      const all = await doctorsData.findDoctors({
        skip: 0,
        take: 10,
        where: { isActive: true },
      });
      return `No exact match for "${query}". Available Dhaka Dental Care doctors:\n` +
        all.map((d) => `${d.id} | ${d.name} | ${d.speciality} (${d.department})`).join("\n");
    }
    return doctors
      .map((d) => `${d.id} | ${d.name} | ${d.speciality} | ${d.department}`)
      .join("\n");
  },
  {
    name: "list_doctors",
    description:
      "Search active doctors at Dhaka Dental Care by name, dental speciality (Orthodontics, Periodontics & Scaling, Endodontics & Root Canal, General Dentistry), or Bengali keywords. Returns: id | name | speciality | department.",
    schema: z.object({
      query: z
        .string()
        .optional()
        .describe("doctor name or dental speciality in English or Bangla (e.g. 'স্কেলিং', 'Orthodontics')"),
    }),
  },
);

export const checkDoctorAvailabilityTool = tool(
  async ({
    doctorQuery,
    doctorId,
    date,
  }: {
    doctorQuery?: string;
    doctorId?: string;
    date?: string;
  }) => {
    let resolvedId = doctorId;
    let doctor = null;

    if (resolvedId) {
      doctor = await doctorsData.findDoctorById(resolvedId);
    } else if (doctorQuery) {
      const matches = await doctorsData.findDoctors({
        skip: 0,
        take: 1,
        where: doctorSearchWhere(doctorQuery),
      });
      doctor = matches[0] ?? null;
      if (doctor) {
        doctor = await doctorsData.findDoctorById(doctor.id);
      }
    }

    if (!doctor) {
      const all = await doctorsData.findDoctors({
        skip: 0,
        take: 10,
        where: { isActive: true },
      });
      const list = all.map((d) => `${d.name} (${d.speciality})`).join(", ");
      return `কোনো ডাক্তার খুঁজে পাওয়া যায়নি। আমাদের ক্লিনিকে উপলব্ধ ডাক্তারগণ: ${list}।`;
    }

    if (!doctor.isActive) {
      return `দুঃখিত, ডাঃ ${doctor.name} বর্তমানে সক্রিয় নন।`;
    }

    // If a specific date is queried
    if (date) {
      const parsedDate = parseDhakaDate(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return "প্রদত্ত তারিখটি সঠিক নয়। অনুগ্রহ করে YYYY-MM-DD ফরম্যাটে বা স্পষ্ট করে বলুন।";
      }

      const { dateStr, dayOfWeek } = getDhakaDateTimeComponents(parsedDate);
      const dayBn = DAY_OF_WEEK_BN[dayOfWeek] || dayOfWeek;

      // Check validation for day start to see if doctor is on leave or not working day
      const validation = await validateDoctorSlot(doctor.id, parsedDate, 30);

      if (validation.code === "ON_LEAVE" || validation.code === "NOT_WORKING_DAY") {
        return validation.messageBn;
      }

      const availableSlots = await getAvailableSlotsForDay(doctor.id, dateStr, 30);
      if (availableSlots.length === 0) {
        return `ডাঃ ${doctor.name} ${dateStr} (${dayBn}) তারিখে সব অ্যাপয়েন্টমেন্ট বুকড রয়েছে। আপনি কি অন্য কোনো দিন দেখাতে চান?`;
      }

      return `ডাঃ ${doctor.name} (${doctor.speciality}) ${dateStr} (${dayBn}) তারিখে চেম্বারে উপলব্ধ। ফাঁকা সময়সমূহ: ${availableSlots.slice(0, 8).join(", ")}।`;
    }

    // If no specific date, return weekly schedule summary
    const schedules = doctor.schedules;
    if (!schedules || schedules.length === 0) {
      return `ডাঃ ${doctor.name}-এর কোনো সাপ্তাহিক সময়সূচী পাওয়া যায়নি।`;
    }

    const scheduleList = schedules
      .map(
        (s) =>
          `${DAY_OF_WEEK_BN[s.dayOfWeek] || s.dayOfWeek}: ${formatTimeBn(s.startTime)} (${s.startTime}) - ${formatTimeBn(s.endTime)} (${s.endTime})`,
      )
      .join(";\n");

    return `ডাঃ ${doctor.name} (${doctor.speciality}) এর সাপ্তাহিক চেম্বার সময়সূচী:\n${scheduleList}\n\nআপনি কোন দিন দেখাতে চান বলুন, আমি সেই দিনের ফাঁকা স্লট জানিয়ে দিচ্ছি।`;
  },
  {
    name: "check_doctor_availability",
    description:
      "Check a doctor's weekly working days, operating hours, leave status, and available booking slots at Dhaka Dental Care. Use when caller asks when a doctor sits or if they are free on a certain day/time.",
    schema: z.object({
      doctorQuery: z
        .string()
        .optional()
        .describe("doctor name or speciality (e.g. 'Dr. Tanvir', 'রুট ক্যানেল', 'Orthodontics')"),
      doctorId: z.string().optional().describe("doctor ID if already known"),
      date: z
        .string()
        .optional()
        .describe("specific date to check, e.g. '2026-11-15' or ISO string"),
    }),
  },
);

export type BookAppointmentContext = {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
  callId?: string; // Originating database Call.id
};

// Factory: builds the book_appointment tool for one conversation, closing over the
// caller's name and phone number. Rebuilt per invocation in appointment.node.
export const makeBookAppointmentTool = (ctx: BookAppointmentContext = {}) =>
  tool(
    async ({
      doctorId,
      doctorQuery,
      patientName,
      patientPhone,
      startTimeISO,
      durationMinutes,
      reason,
    }: {
      doctorId?: string;
      doctorQuery?: string;
      patientName?: string;
      patientPhone?: string;
      startTimeISO: string;
      durationMinutes?: number;
      reason?: string;
    }) => {
      const finalName = ctx.patientName ?? patientName;
      if (!finalName) return "I still need the patient's name to book.";

      const finalPhone = ctx.patientPhone ?? patientPhone;

      // Resolve doctor
      let resolvedId = doctorId;
      let doctorName = "";
      let doctorSpeciality = "";
      if (resolvedId) {
        const doctor = await doctorsData.findDoctorById(resolvedId);
        if (!doctor) return `No doctor found with id ${resolvedId}.`;
        doctorName = doctor.name;
        doctorSpeciality = doctor.speciality;
      } else {
        if (!doctorQuery)
          return "Please provide a doctor name or speciality (e.g. Orthodontics, Scaling, Root Canal).";
        const matches = await doctorsData.findDoctors({
          skip: 0,
          take: 1,
          where: doctorSearchWhere(doctorQuery),
        });
        const first = matches[0];
        if (!first) {
          const all = await doctorsData.findDoctors({
            skip: 0,
            take: 10,
            where: { isActive: true },
          });
          const list = all.map((d) => `${d.name} (${d.speciality})`).join(", ");
          return `No active doctor matches "${doctorQuery}". Available doctors at Dhaka Dental Care: ${list}.`;
        }
        resolvedId = first.id;
        doctorName = first.name;
        doctorSpeciality = first.speciality;
      }

      const start = parseDhakaDate(startTimeISO);
      if (Number.isNaN(start.getTime())) {
        return "startTimeISO is not a valid date-time.";
      }
      const minutes = durationMinutes ?? DEFAULT_APPOINTMENT_MINUTES;
      const end = new Date(start.getTime() + minutes * 60_000);

      // Idempotency: Prevent duplicate appointments during retries within the same call
      if (ctx.callId) {
        const existingForCall = await appointmentsData.findAppointments({
          skip: 0,
          take: 1,
          where: {
            callId: ctx.callId,
            doctorId: resolvedId,
            startTime: start,
            status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
          },
        });
        if (existingForCall.length > 0 && existingForCall[0]) {
          const existing = existingForCall[0];
          return `সফলভাবে অ্যাপয়েন্টমেন্ট বুক করা হয়েছে! ডাক্তার: ${doctorName}, রোগী: ${finalName}, শুরু: ${start.toLocaleString("bn-BD")}. (Appointment ID: ${existing.id})`;
        }
      }

      // 5-layer availability check: doctor active, leave exceptions, weekly hours, appointment clashes
      const validation = await validateDoctorSlot(resolvedId, start, minutes);
      if (!validation.isValid) {
        return validation.messageBn;
      }

      let appointment;
      try {
        appointment = await appointmentsData.createAppointmentWithConflictCheck({
          doctorId: resolvedId,
          patientName: finalName,
          startTime: start,
          endTime: end,
          status: AppointmentStatus.BOOKED,
          ...(ctx.callId ? { callId: ctx.callId } : {}),
          ...(ctx.patientEmail ? { patientEmail: ctx.patientEmail } : {}),
          ...(finalPhone ? { patientPhone: finalPhone } : {}),
          ...(reason ? { reason } : {}),
        });
      } catch (err: unknown) {
        if (err instanceof AppError && err.code === "SLOT_ALREADY_BOOKED") {
          return `দুঃখিত, ওই সময়ে ডাঃ ${doctorName}-এর আরেকটি অ্যাপয়েন্টমেন্ট সবেমাত্র বুক হয়ে গেছে। অনুগ্রহ করে অন্য কোনো সময় বলুন।`;
        }
        throw err;
      }

      if (ctx.patientEmail) {
        await sendAppointmentConfirmation({
          to: ctx.patientEmail,
          patientName: finalName,
          doctorName,
          ...(doctorSpeciality ? { speciality: doctorSpeciality } : {}),
          startTime: start,
          endTime: end,
          durationMinutes: minutes,
          ...(reason ? { reason } : {}),
        });
      }

      return `সফলভাবে অ্যাপয়েন্টমেন্ট বুক করা হয়েছে! ডাক্তার: ${doctorName}, রোগী: ${finalName}, শুরু: ${start.toLocaleString("bn-BD")}. (Appointment ID: ${appointment.id})`;
    },
    {
      name: "book_appointment",
      description:
        "Book an appointment at Dhaka Dental Care. Requires startTimeISO, plus doctorId or doctorQuery (name/speciality). Capture patient name and phone number before booking.",
      schema: z.object({
        doctorId: z.string().optional(),
        doctorQuery: z
          .string()
          .optional()
          .describe("doctor name or dental speciality (e.g. Scaling, Root Canal, Orthodontics, Dr. Tanvir)"),
        patientName: z
          .string()
          .optional()
          .describe("patient's full name"),
        patientPhone: z
          .string()
          .optional()
          .describe("patient's phone number"),
        startTimeISO: z
          .string()
          .describe("absolute ISO 8601 date-time, e.g. 2026-11-16T15:00:00"),
        durationMinutes: z.number().optional(),
        reason: z.string().optional(),
      }),
    },
  );

// Factory: builds the reschedule_appointment tool for one conversation
export const makeRescheduleAppointmentTool = (ctx: BookAppointmentContext = {}) =>
  tool(
    async ({
      appointmentId,
      patientPhone,
      patientName,
      newStartTimeISO,
      durationMinutes,
    }: {
      appointmentId?: string;
      patientPhone?: string;
      patientName?: string;
      newStartTimeISO: string;
      durationMinutes?: number;
    }) => {
      const finalPhone = ctx.patientPhone ?? patientPhone;
      const finalName = ctx.patientName ?? patientName;

      let targetAppointment = null;
      if (appointmentId) {
        targetAppointment = await appointmentsData.findAppointmentById(appointmentId);
      } else {
        const whereConditions: Prisma.AppointmentWhereInput[] = [];
        if (finalPhone) {
          whereConditions.push({ patientPhone: { contains: finalPhone.slice(-8) } });
        }
        if (finalName) {
          whereConditions.push({ patientName: { contains: finalName, mode: "insensitive" } });
        }

        if (whereConditions.length > 0) {
          const found = await appointmentsData.findAppointments({
            skip: 0,
            take: 1,
            where: {
              status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
              OR: whereConditions,
            },
          });
          targetAppointment = found[0] ?? null;
        }
      }

      if (!targetAppointment) {
        return "আপনার কোনো সক্রিয় অ্যাপয়েন্টমেন্ট খুঁজে পাওয়া যায়নি। অনুগ্রহ করে আপনার নাম অথবা ফোন নম্বর নিশ্চিত করুন।";
      }

      const start = parseDhakaDate(newStartTimeISO);
      if (Number.isNaN(start.getTime())) {
        return "নতুন সময়টি সঠিক নয় (Invalid date-time format).";
      }

      const minutes = durationMinutes ?? DEFAULT_APPOINTMENT_MINUTES;
      const end = new Date(start.getTime() + minutes * 60_000);

      // Validate against doctor's schedule, exceptions, and clash (excluding target appointment)
      const validation = await validateDoctorSlot(
        targetAppointment.doctorId,
        start,
        minutes,
        targetAppointment.id,
      );
      if (!validation.isValid) {
        return validation.messageBn;
      }

      try {
        await appointmentsData.rescheduleAppointmentWithConflictCheck(targetAppointment.id, {
          startTime: start,
          endTime: end,
          status: AppointmentStatus.RESCHEDULED,
          ...(ctx.callId ? { callId: ctx.callId } : {}),
        });
      } catch (err: unknown) {
        if (err instanceof AppError && err.code === "SLOT_ALREADY_BOOKED") {
          return `দুঃখিত, ওই সময়ে ডাক্তারের অন্য একটি অ্যাপয়েন্টমেন্ট সবেমাত্র বুক হয়ে গেছে। দয়া করে অন্য কোনো সময় বা দিন বলুন।`;
        }
        throw err;
      }

      const doctorName = targetAppointment.doctor?.name ?? "ডাক্তার";
      return `আপনার অ্যাপয়েন্টমেন্টটি সফলভাবে পুনর্নির্ধারণ করা হয়েছে! ডাক্তার: ${doctorName}, নতুন সময়: ${start.toLocaleString("bn-BD")}.`;
    },
    {
      name: "reschedule_appointment",
      description:
        "Reschedule an existing dental appointment at Dhaka Dental Care to a new date and time. Provide newStartTimeISO and patient phone or name.",
      schema: z.object({
        appointmentId: z.string().optional(),
        patientPhone: z.string().optional().describe("patient's phone number"),
        patientName: z.string().optional().describe("patient's name"),
        newStartTimeISO: z.string().describe("new ISO 8601 date-time, e.g. 2026-11-18T16:00:00"),
        durationMinutes: z.number().optional(),
      }),
    },
  );

// Factory: builds the cancel_appointment tool for one conversation
export const makeCancelAppointmentTool = (ctx: BookAppointmentContext = {}) =>
  tool(
    async ({
      appointmentId,
      patientPhone,
      patientName,
      reason,
    }: {
      appointmentId?: string;
      patientPhone?: string;
      patientName?: string;
      reason?: string;
    }) => {
      const finalPhone = ctx.patientPhone ?? patientPhone;
      const finalName = ctx.patientName ?? patientName;

      let targetAppointment = null;
      if (appointmentId) {
        targetAppointment = await appointmentsData.findAppointmentById(appointmentId);
      } else {
        const whereConditions: Prisma.AppointmentWhereInput[] = [];
        if (finalPhone) {
          whereConditions.push({ patientPhone: { contains: finalPhone.slice(-8) } });
        }
        if (finalName) {
          whereConditions.push({ patientName: { contains: finalName, mode: "insensitive" } });
        }

        if (whereConditions.length > 0) {
          const found = await appointmentsData.findAppointments({
            skip: 0,
            take: 1,
            where: {
              status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
              OR: whereConditions,
            },
          });
          targetAppointment = found[0] ?? null;
        }
      }

      if (!targetAppointment) {
        return "বাতিল করার জন্য কোনো সক্রিয় অ্যাপয়েন্টমেন্ট খুঁজে পাওয়া যায়নি। আপনার নাম অথবা মোবাইল নম্বর বলুন।";
      }

      await appointmentsData.updateAppointment(targetAppointment.id, {
        status: AppointmentStatus.CANCELLED,
        ...(reason ? { reason: `Cancelled: ${reason}` } : {}),
      });

      const doctorName = targetAppointment.doctor?.name ?? "ডাক্তার";
      return `আপনার অ্যাপয়েন্টমেন্টটি সফলভাবে বাতিল করা হয়েছে। ডাক্তার: ${doctorName}। আপনার কোনো প্রয়োজন হলে পুনরায় আমাদের সাথে যোগাযোগ করুন। ধন্যবাদ।`;
    },
    {
      name: "cancel_appointment",
      description:
        "Cancel an existing dental appointment at Dhaka Dental Care. Requires patient phone number or name to find the booking.",
      schema: z.object({
        appointmentId: z.string().optional(),
        patientPhone: z.string().optional().describe("patient's phone number"),
        patientName: z.string().optional().describe("patient's name"),
        reason: z.string().optional().describe("optional reason for cancellation"),
      }),
    },
  );
