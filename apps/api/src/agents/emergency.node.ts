import { AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod/v4";

import { EMERGENCY_DETECT_PROMPT } from "../config/agents";
import { routerModel } from "../libs/chatModel";
import { sendEmergencyAlert } from "../libs/mailer";
import type { AgentStateType } from "./state";

const Triage = z.object({
  isEmergency: z.boolean(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string().describe("one-line summary of the situation"),
});

const URGENT =
  "আপনার লক্ষণটি জরুরি মনে হচ্ছে। অনুগ্রহ করে অবিলম্বে নিকটস্থ হাসপাতালের জরুরি বিভাগে যোগাযোগ করুন অথবা জাতীয় জরুরি সেবা ৯৯৯-এ কল করুন। আমি আমাদের ক্লিনিকে জরুরি সতর্কবার্তা পাঠিয়ে দিয়েছি যাতে ডাক্তার দ্রুত যোগাযোগ করতে পারেন।";

const NON_URGENT =
  "আপনার অসুস্থতার কথা শুনে খারাপ লাগছে। সুরক্ষার কারণে একজন এআই হিসেবে আমি কোনো ওষুধ বা চিকিৎসার পরামর্শ দিতে পারছি না, তবে আমাদের অন-কল ডাক্তারের কাছে আপনার জরুরি কলব্যাক রিকোয়েস্ট পাঠিয়ে দেওয়া হয়েছে। আপনি কি একটি ডেন্টাল অ্যাপয়েন্টমেন্ট বুক করতে চান?";

// Emergency agent — detection and triage in natural Bangla.
export const emergencyNode = async (
  state: AgentStateType,
): Promise<Partial<AgentStateType>> => {
  const prompt = await PromptTemplate.fromTemplate(
    EMERGENCY_DETECT_PROMPT,
  ).format({ message: state.input });

  const triage = await routerModel()
    .withStructuredOutput(Triage)
    .invoke(prompt);

  if (triage.isEmergency) {
    await sendEmergencyAlert({
      summary: triage.summary,
      message: state.input,
      ...(state.patientName ? { patientName: state.patientName } : {}),
    });
    return { reply: URGENT, messages: [new AIMessage(URGENT)] };
  }

  return { reply: NON_URGENT, messages: [new AIMessage(NON_URGENT)] };
};
