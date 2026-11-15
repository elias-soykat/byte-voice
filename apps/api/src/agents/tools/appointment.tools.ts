import { tool } from "@langchain/core/tools";
import { z } from "zod/v4";

import { Prisma } from "../../generated/prisma/client";
import { AppointmentStatus } from "../../generated/prisma/enums";
import * as appointmentsData from "../../data/appointments.data";
import * as doctorsData from "../../data/doctors.data";
import { DEFAULT_APPOINTMENT_MINUTES } from "../../config/agents";
import { sendAppointmentConfirmation } from "../../libs/mailer";

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

export type BookAppointmentContext = {
  patientName?: string;
  patientEmail?: string;
  patientPhone?: string;
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

      const start = new Date(startTimeISO);
      if (Number.isNaN(start.getTime())) {
        return "startTimeISO is not a valid date-time.";
      }
      const minutes = durationMinutes ?? DEFAULT_APPOINTMENT_MINUTES;
      const end = new Date(start.getTime() + minutes * 60_000);

      // Overlap check
      const clash = await appointmentsData.findAppointments({
        skip: 0,
        take: 1,
        where: {
          doctorId: resolvedId,
          status: AppointmentStatus.BOOKED,
          startTime: { lt: end },
          endTime: { gt: start },
        },
      });
      if (clash.length > 0) {
        return `Dr. ${doctorName} already has an appointment overlapping that time. Please suggest another time slot.`;
      }

      const appointment = await appointmentsData.createAppointment({
        doctorId: resolvedId,
        patientName: finalName,
        startTime: start,
        endTime: end,
        status: AppointmentStatus.BOOKED,
        ...(ctx.patientEmail ? { patientEmail: ctx.patientEmail } : {}),
        ...(finalPhone ? { patientPhone: finalPhone } : {}),
        ...(reason ? { reason } : {}),
      });

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
