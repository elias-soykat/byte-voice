import { AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod/v4";

import { GUARDRAIL_PROMPT } from "../config/agents";
import { routerModel } from "../libs/chatModel";
import type { AgentStateType } from "./state";

const GuardrailDecision = z.object({
  allowed: z
    .boolean()
    .describe("true if the message is an in-scope, safe clinic request"),
  reason: z.string().describe("a short reason for the decision"),
});

const REFUSAL =
  "আমি ঢাকা ডেন্টাল কেয়ারের এআই রিসেপশনিস্ট। আমি শুধুমাত্র ডেন্টাল চিকিৎসা সেবা, ডাক্তারের অ্যাপয়েন্টমেন্ট এবং ক্লিনিক সংক্রান্ত বিষয়ে সাহায্য করতে পারি। আমি কীভাবে আপনার চিকিৎসার কাজে সাহায্য করতে পারি?";

// Input guardrail — blocks out-of-scope/unsafe messages before any agent runs.
export const guardrailNode = async (
  state: AgentStateType,
): Promise<Partial<AgentStateType>> => {
  const prompt = await PromptTemplate.fromTemplate(GUARDRAIL_PROMPT).format({
    message: state.input,
  });

  const decision = await routerModel()
    .withStructuredOutput(GuardrailDecision)
    .invoke(prompt);

  if (!decision.allowed) {
    return { blocked: true, reply: REFUSAL, messages: [new AIMessage(REFUSAL)] };
  }
  return { blocked: false };
};
