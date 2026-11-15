import { Prisma, CallOutcome } from "../generated/prisma/client";
import { prisma } from "../libs/prisma";

// List rows include summary extraction fields and relations
const callListInclude = {
  patient: {
    select: {
      id: true,
      fullName: true,
      phone: true,
    },
  },
  extraction: {
    select: {
      id: true,
      reasonForVisit: true,
      preferredDateTime: true,
      intent: true,
      outcome: true,
      validationStatus: true,
    },
  },
  appointments: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
      doctor: {
        select: {
          id: true,
          name: true,
          speciality: true,
        },
      },
    },
  },
} satisfies Prisma.CallInclude;

export const createCall = (data: {
  callId: string;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  patientName?: string;
  patientPhone?: string;
  patientId?: string;
  userTurns: number;
  transcript: Prisma.InputJsonValue;
  audioKey?: string | null;
  recordingUrl?: string | null;
  status: string;
  outcome?: CallOutcome;
}) => prisma.call.create({ data });

export const updateCall = (
  id: string,
  data: Prisma.CallUpdateInput,
) => prisma.call.update({ where: { id }, data });

export const updateCallByCallId = (
  callId: string,
  data: Prisma.CallUpdateInput,
) => prisma.call.update({ where: { callId }, data });

export const findCalls = (args: {
  skip: number;
  take: number;
  where: Prisma.CallWhereInput;
}) =>
  prisma.call.findMany({
    where: args.where,
    skip: args.skip,
    take: args.take,
    orderBy: { startedAt: "desc" },
    include: callListInclude,
  });

export const countCalls = (where: Prisma.CallWhereInput) =>
  prisma.call.count({ where });

export const findCallById = (id: string) =>
  prisma.call.findFirst({
    where: {
      OR: [{ id }, { callId: id }],
    },
    include: {
      patient: true,
      extraction: true,
      appointments: {
        include: { doctor: true },
      },
    },
  });

export const saveCallExtraction = (data: {
  callId: string;
  patientId?: string;
  patientName?: string;
  phone?: string;
  reasonForVisit?: string;
  preferredDateTime?: string;
  intent?: string;
  outcome: CallOutcome;
  notes?: string;
  validationStatus?: string;
}) =>
  prisma.callExtraction.upsert({
    where: { callId: data.callId },
    create: data,
    update: data,
  });
