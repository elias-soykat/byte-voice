import { z } from "zod";
import { CallOutcome } from "../generated/prisma/client";

export const listCallsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  outcome: z.nativeEnum(CallOutcome).optional(),
});

export const callIdParamSchema = z.object({
  id: z.string().min(1),
});

export type ListCallsQuery = z.infer<typeof listCallsQuerySchema>;
