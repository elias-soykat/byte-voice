import { prisma } from "../libs/prisma";

export const countTotalDoctors = () => prisma.doctor.count();

export const countActiveDoctors = () =>
  prisma.doctor.count({ where: { isActive: true } });

export const countTotalAppointments = () => prisma.appointment.count();

export const countAppointmentsBetween = (start: Date, end: Date) =>
  prisma.appointment.count({
    where: { startTime: { gte: start, lt: end } },
  });

export const countUpcomingAppointments = (from: Date) =>
  prisma.appointment.count({ where: { startTime: { gte: from } } });

export const groupAppointmentsByStatus = () =>
  prisma.appointment.groupBy({ by: ["status"], _count: true });

export const countDistinctPatients = async () => {
  const rows = await prisma.appointment.findMany({
    distinct: ["patientName"],
    select: { patientName: true },
  });
  return rows.length;
};

export const findRecentAppointments = (take: number) =>
  prisma.appointment.findMany({
    orderBy: { createdAt: "desc" },
    take,
    include: { doctor: { select: { id: true, name: true, speciality: true } } },
  });

export const findLatestDoctors = (take: number) =>
  prisma.doctor.findMany({ orderBy: { createdAt: "desc" }, take });

export const findAppointmentTimesSince = (since: Date) =>
  prisma.appointment.findMany({
    where: { startTime: { gte: since } },
    select: { startTime: true, endTime: true },
  });

export const findAllAppointmentTimes = () =>
  prisma.appointment.findMany({ select: { startTime: true, endTime: true } });

// --- Call analytics queries ---

export const countTotalCalls = () => prisma.call.count();

export const countCallsBetween = (start: Date, end: Date) =>
  prisma.call.count({
    where: { startedAt: { gte: start, lt: end } },
  });

export const groupCallsByOutcome = () =>
  prisma.call.groupBy({
    by: ["outcome"],
    _count: true,
  });

export const countFailedCalls = () =>
  prisma.call.count({
    where: {
      OR: [
        { status: "FAILED" },
        { outcome: "FAILED" },
      ],
    },
  });

export const aggregateCallDurations = () =>
  prisma.call.aggregate({
    _avg: { durationSec: true },
    _sum: { durationSec: true },
  });

export const findCallTimesSince = (since: Date) =>
  prisma.call.findMany({
    where: { startedAt: { gte: since } },
    select: { startedAt: true, outcome: true, durationSec: true },
    orderBy: { startedAt: "asc" },
  });

