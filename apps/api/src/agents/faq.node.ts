import { AIMessage } from "@langchain/core/messages";
import { PromptTemplate } from "@langchain/core/prompts";

import { FAQ_PROMPT, FAQ_TOP_K } from "../config/agents";
import { chatModel } from "../libs/chatModel";
import { getVectorStore } from "../libs/vectorStore";
import { messageText, type AgentStateType } from "./state";

// FAQ agent — answers strictly in Bangla from the clinic knowledge base (with resilient fallback).
export const faqNode = async (
  state: AgentStateType,
): Promise<Partial<AgentStateType>> => {
  let context = "(Dhaka Dental Care clinic knowledge)";
  try {
    const docs = await getVectorStore().similaritySearch(state.input, FAQ_TOP_K);
    if (docs.length > 0) {
      context = docs.map((d) => d.pageContent).join("\n\n---\n\n");
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.log(`[faqNode] Vector search skipped (${message}); using built-in clinic knowledge.`);
  }

  const prompt = await PromptTemplate.fromTemplate(FAQ_PROMPT).format({
    context,
    question: state.input,
  });

  const response = await chatModel().invoke(prompt);
  const reply = messageText(response.content);

  return { reply, messages: [new AIMessage(reply)] };
};
