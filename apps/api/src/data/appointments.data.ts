import { Prisma } from "../generated/prisma/client";
import { AppointmentStatus } from "../generated/prisma/enums";
import { prisma } from "../libs/prisma";
import { AppError } from "../errors/AppError";
import {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "../schemas/appointment.schema";

export const createAppointment = (data: CreateAppointmentInput) =>
  prisma.appointment.create({
    data: data as Prisma.AppointmentUncheckedCreateInput,
  });

const doctorInclude = {
  doctor: { select: { id: true, name: true, speciality: true } },
  call: {
    select: {
      id: true,
      callId: true,
      startedAt: true,
      durationSec: true,
      status: true,
      outcome: true,
    },
  },
} satisfies Prisma.AppointmentInclude;

export const findAppointments = (args: {
  skip: number;
  take: number;
  where: Prisma.AppointmentWhereInput;
}) =>
  prisma.appointment.findMany({
    where: args.where,
    skip: args.skip,
    take: args.take,
    orderBy: { startTime: "desc" },
    include: doctorInclude,
  });

export const countAppointments = (where: Prisma.AppointmentWhereInput) =>
  prisma.appointment.count({ where });

export const findAppointmentById = (id: string) =>
  prisma.appointment.findUnique({ where: { id }, include: doctorInclude });

export const updateAppointment = (id: string, data: UpdateAppointmentInput) =>
  prisma.appointment.update({
    where: { id },
    data: data as Prisma.AppointmentUpdateInput,
  });

export const deleteAppointment = (id: string) =>
  prisma.appointment.delete({ where: { id } });

export const findOverlappingAppointments = (args: {
  doctorId: string;
  startTime: Date;
  endTime: Date;
  excludeAppointmentId?: string | undefined;
}) => {
  const where: Prisma.AppointmentWhereInput = {
    doctorId: args.doctorId,
    status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
    startTime: { lt: args.endTime },
    endTime: { gt: args.startTime },
  };
  if (args.excludeAppointmentId) {
    where.id = { not: args.excludeAppointmentId };
  }
  return prisma.appointment.findMany({
    where,
    select: { id: true, startTime: true, endTime: true, status: true },
  });
};

export const findBookedAppointmentsForDay = (args: {
  doctorId: string;
  dayStart: Date;
  dayEnd: Date;
}) =>
  prisma.appointment.findMany({
    where: {
      doctorId: args.doctorId,
      status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
      startTime: { gte: args.dayStart, lte: args.dayEnd },
    },
    select: { id: true, startTime: true, endTime: true, status: true },
  });

export const createAppointmentWithConflictCheck = async (
  data: CreateAppointmentInput,
) => {
  return prisma.$transaction(async (tx) => {
    // Acquire PostgreSQL transaction advisory lock on doctor to serialize concurrent bookings
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`doctor_booking_${data.doctorId}`}))`;

    const clash = await tx.appointment.findFirst({
      where: {
        doctorId: data.doctorId,
        status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
        startTime: { lt: data.endTime },
        endTime: { gt: data.startTime },
      },
    });

    if (clash) {
      throw new AppError(
        "SLOT_ALREADY_BOOKED",
        "The requested appointment slot was just booked by another patient.",
        409,
      );
    }

    return tx.appointment.create({
      data: data as Prisma.AppointmentUncheckedCreateInput,
      include: doctorInclude,
    });
  });
};

export const rescheduleAppointmentWithConflictCheck = async (
  id: string,
  data: UpdateAppointmentInput,
) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.appointment.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError("APPOINTMENT_NOT_FOUND", "Appointment not found", 404);
    }

    const doctorId = data.doctorId ?? existing.doctorId;
    const startTime = data.startTime ?? existing.startTime;
    const endTime = data.endTime ?? existing.endTime;

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`doctor_booking_${doctorId}`}))`;

    const clash = await tx.appointment.findFirst({
      where: {
        id: { not: id },
        doctorId,
        status: { in: [AppointmentStatus.BOOKED, AppointmentStatus.RESCHEDULED] },
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });

    if (clash) {
      throw new AppError(
        "SLOT_ALREADY_BOOKED",
        "The requested appointment slot is already booked.",
        409,
      );
    }

    return tx.appointment.update({
      where: { id },
      data: data as Prisma.AppointmentUpdateInput,
      include: doctorInclude,
    });
  });
};
