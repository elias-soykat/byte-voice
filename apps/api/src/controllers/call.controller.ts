import { Request, Response } from "express";

import { Prisma } from "../generated/prisma/client";
import * as callsData from "../data/calls.data";
import { AppError } from "../errors/AppError";
import { sendSuccess, sendError } from "../helpers/apiResponse";
import { getRecordingUrl } from "../libs/s3";
import {
  callIdParamSchema,
  listCallsQuerySchema,
} from "../schemas/call.schema";

// getCalls — paginated call history, searchable by patient name/phone and filterable by outcome
export const getCalls = async (req: Request, res: Response) => {
  try {
    const { page, limit, search, outcome } = listCallsQuerySchema.parse(req.query);

    const where: Prisma.CallWhereInput = {};
    if (outcome) {
      where.outcome = outcome;
    }
    if (search) {
      where.OR = [
        { patientName: { contains: search, mode: "insensitive" } },
        { patientPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      callsData.findCalls({ skip: (page - 1) * limit, take: limit, where }),
      callsData.countCalls(where),
    ]);

    return sendSuccess(res, 200, "Calls fetched successfully", {
      items,
      total,
      page,
      limit,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

// getCallById — full transcript + extraction + a presigned URL for recording playback
export const getCallById = async (
  req: Request<{ id: string }>,
  res: Response,
) => {
  try {
    const { id } = callIdParamSchema.parse(req.params);

    const call = await callsData.findCallById(id);
    if (!call) {
      throw new AppError("CALL_NOT_FOUND", "No such call", 404);
    }

    const audioUrl = call.recordingUrl
      ? call.recordingUrl
      : call.audioKey
        ? await getRecordingUrl(call.audioKey)
        : null;

    return sendSuccess(res, 200, "Call fetched successfully", {
      ...call,
      audioUrl,
    });
  } catch (error) {
    return sendError(res, error);
  }
};
