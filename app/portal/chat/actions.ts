"use server";

import { requirePortal } from "@/lib/session";
import { runChatTurn } from "@/lib/chatbot";

export async function sendChatMessage(message: string): Promise<{ reply: string }> {
  const session = await requirePortal();
  const text = message.trim();
  if (!text) throw new Error("Message is empty");

  const reply = await runChatTurn({
    customerId: session.sub,
    channel: "PORTAL",
    key: session.sub,
    userMessage: text,
  });
  return { reply };
}
