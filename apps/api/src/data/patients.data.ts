import { prisma } from "../libs/prisma";
import type { Prisma } from "../generated/prisma/client";

export const findPatientByPhone = async (phone: string) => {
  return prisma.patient.findUnique({
    where: { phone },
  });
};

export const findPatientById = async (id: string) => {
  return prisma.patient.findUnique({
    where: { id },
    include: {
      appointments: {
        include: { doctor: true },
        orderBy: { startTime: "desc" },
      },
      calls: {
        orderBy: { startedAt: "desc" },
      },
    },
  });
};

export const createPatient = async (data: Prisma.PatientCreateInput) => {
  return prisma.patient.create({ data });
};

export const findOrCreatePatient = async (data: {
  fullName: string;
  phone: string;
  email?: string | null;
}) => {
  const existing = await findPatientByPhone(data.phone);
  if (existing) {
    if (data.email && !existing.email) {
      return prisma.patient.update({
        where: { id: existing.id },
        data: { email: data.email },
      });
    }
    return existing;
  }
  return prisma.patient.create({
    data: {
      fullName: data.fullName,
      phone: data.phone,
      ...(data.email ? { email: data.email } : {}),
    },
  });
};

export const findPatients = async (args: Prisma.PatientFindManyArgs) => {
  return prisma.patient.findMany(args);
};

export const countPatients = async (where?: Prisma.PatientWhereInput) => {
  return where ? prisma.patient.count({ where }) : prisma.patient.count();
};
