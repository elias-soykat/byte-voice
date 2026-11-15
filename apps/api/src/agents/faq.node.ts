import { AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

import { FAQ_PROMPT } from "../config/agents";
import { chatModel } from "../libs/chatModel";
import { messageText, type AgentStateType } from "./state";

// FAQ agent — answers strictly in Bangla from built-in clinic information.
export const faqNode = async (
  state: AgentStateType,
): Promise<Partial<AgentStateType>> => {
  const prompt = await PromptTemplate.fromTemplate(FAQ_PROMPT).format({
    context: "(Dhaka Dental Care clinic info)",
    question: state.input,
  });

  const response = await chatModel().invoke(prompt);
  const reply = messageText(response.content);

  return { reply, messages: [new AIMessage(reply)] };
};
