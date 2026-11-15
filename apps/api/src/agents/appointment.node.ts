import {
  SystemMessage,
  ToolMessage,
  isAIMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";
import type { StructuredToolInterface } from "@langchain/core/tools";

import {
  APPOINTMENT_SYSTEM_PROMPT,
  APPOINTMENT_TOOL_MAX_ITERATIONS,
} from "../config/agents";
import { chatModel } from "../libs/chatModel";
import {
  listDoctorsTool,
  checkDoctorAvailabilityTool,
  makeBookAppointmentTool,
  makeCancelAppointmentTool,
  makeRescheduleAppointmentTool,
} from "./tools/appointment.tools";
import { messageText, type AgentStateType } from "./state";

const FALLBACK =
  "আমি আপনাকে ঢাকা ডেন্টাল কেয়ারে অ্যাপয়েন্টমেন্ট বুকিং, পরিবর্তন বা বাতিলে সাহায্য করতে পারি — অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং কোন দিন ও সময়ে দেখাতে চান তা বলুন।";

// Appointment agent — explicit tool-calling loop in natural Bangla.
export const appointmentNode = async (
  state: AgentStateType,
): Promise<Partial<AgentStateType>> => {
  const system = await PromptTemplate.fromTemplate(
    APPOINTMENT_SYSTEM_PROMPT,
  ).format({ now: new Date().toISOString() });

  const bookAppointmentTool = makeBookAppointmentTool({
    ...(state.callId ? { callId: state.callId } : {}),
    ...(state.patientName ? { patientName: state.patientName } : {}),
    ...(state.email ? { patientEmail: state.email } : {}),
  });
  const rescheduleAppointmentTool = makeRescheduleAppointmentTool({
    ...(state.callId ? { callId: state.callId } : {}),
    ...(state.patientName ? { patientName: state.patientName } : {}),
    ...(state.email ? { patientEmail: state.email } : {}),
  });
  const cancelAppointmentTool = makeCancelAppointmentTool({
    ...(state.patientName ? { patientName: state.patientName } : {}),
  });

  const tools = [
    listDoctorsTool,
    checkDoctorAvailabilityTool,
    bookAppointmentTool,
    rescheduleAppointmentTool,
    cancelAppointmentTool,
  ];
  const toolsByName: Record<string, StructuredToolInterface> = {
    list_doctors: listDoctorsTool,
    check_doctor_availability: checkDoctorAvailabilityTool,
    book_appointment: bookAppointmentTool,
    reschedule_appointment: rescheduleAppointmentTool,
    cancel_appointment: cancelAppointmentTool,
  };

  const llm = chatModel().bindTools(tools);

  // Seed with prior conversation (already includes the latest user message).
  const working: BaseMessage[] = [
    new SystemMessage(
      state.patientName
        ? `${system}\nCaller patient name: ${state.patientName}`
        : system,
    ),
    ...state.messages,
  ];
  const produced: BaseMessage[] = [];
  let reply = FALLBACK;

  for (let i = 0; i < APPOINTMENT_TOOL_MAX_ITERATIONS; i += 1) {
    const ai = await llm.invoke(working);
    working.push(ai);
    produced.push(ai);

    const toolCalls = isAIMessage(ai) ? (ai.tool_calls ?? []) : [];
    if (toolCalls.length === 0) {
      reply = messageText(ai.content) || FALLBACK;
      break;
    }

    for (const call of toolCalls) {
      const selected = toolsByName[call.name];
      const result: BaseMessage = selected
        ? ((await selected.invoke(call)) as BaseMessage)
        : new ToolMessage({
            content: `Unknown tool: ${call.name}`,
            tool_call_id: call.id ?? "",
          });
      working.push(result);
      produced.push(result);
    }
  }

  return { reply, messages: produced };
};
