import { HumanMessage } from "@langchain/core/messages";

import type { AgentRouteValue } from "../config/agents";
import { agentGraph } from "./graph";

export type RunAgentInput = {
  sessionId: string;
  callId?: string;
  message: string;
  patientName?: string;
  email?: string;
  signal?: AbortSignal;
};

export type RunAgentResult = {
  reply: string;
  route: AgentRouteValue | null;
  aborted?: boolean;
};

// Single entry the REST controller and voice pipeline call. The
// MemorySaver checkpointer keys conversation history by thread_id = sessionId.
// Supports AbortSignal for user interruption.
export const runAgent = async (
  input: RunAgentInput,
): Promise<RunAgentResult> => {
  if (input.signal?.aborted) {
    return { reply: "", route: null, aborted: true };
  }

  try {
    const result = await agentGraph.invoke(
      {
        input: input.message,
        messages: [new HumanMessage(input.message)],
        sessionId: input.sessionId,
        ...(input.callId ? { callId: input.callId } : {}),
        ...(input.patientName ? { patientName: input.patientName } : {}),
        ...(input.email ? { email: input.email } : {}),
      },
      {
        configurable: { thread_id: input.sessionId },
        ...(input.signal ? { signal: input.signal } : {}),
      },
    );

    if (input.signal?.aborted) {
      return { reply: "", route: null, aborted: true };
    }

    return {
      reply: result.reply ?? "Sorry, I couldn't process that request.",
      route: (result.route as AgentRouteValue | undefined) ?? null,
    };
  } catch (err: unknown) {
    if (
      input.signal?.aborted ||
      (err as { name?: string })?.name === "AbortError"
    ) {
      return { reply: "", route: null, aborted: true };
    }
    throw err;
  }
};
