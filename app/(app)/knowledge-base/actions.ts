"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { setChatbotSettings, type ChatbotSettings } from "@/lib/chatbotSettings";

const MANAGE: ("OWNER" | "MANAGER")[] = ["OWNER", "MANAGER"];

export async function createEntry(formData: FormData) {
  await requireRole(MANAGE);
  const data = parseEntry(formData);
  await prisma.knowledgeBaseEntry.create({ data });
  revalidatePath("/knowledge-base");
  redirect("/knowledge-base");
}

export async function updateEntry(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  if (!id) throw new Error("Missing entry id");
  const data = parseEntry(formData);
  await prisma.knowledgeBaseEntry.update({
    where: { id },
    data: { ...data, active: formData.get("active") === "on" },
  });
  revalidatePath("/knowledge-base");
  redirect("/knowledge-base");
}

export async function toggleEntry(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  const active = formData.get("active") === "true";
  if (!id) return;
  await prisma.knowledgeBaseEntry.update({ where: { id }, data: { active: !active } });
  revalidatePath("/knowledge-base");
}

export async function deleteEntry(formData: FormData) {
  await requireRole(MANAGE);
  const id = String(formData.get("id") || "");
  if (!id) return;
  await prisma.knowledgeBaseEntry.delete({ where: { id } });
  revalidatePath("/knowledge-base");
}

export async function saveChatbotSettingsAction(formData: FormData) {
  await requireRole(MANAGE);
  const data: ChatbotSettings = {
    greeting: str(formData.get("greeting")) ?? "",
    greetingAr: str(formData.get("greetingAr")) ?? "",
    fallbackMessage: str(formData.get("fallbackMessage")) ?? "",
    fallbackMessageAr: str(formData.get("fallbackMessageAr")) ?? "",
  };
  await setChatbotSettings(data);
  revalidatePath("/knowledge-base");
}

function parseEntry(formData: FormData) {
  const question = String(formData.get("question") || "").trim();
  const answer = String(formData.get("answer") || "").trim();
  if (!question || !answer) throw new Error("Question and answer are required");
  return {
    question,
    questionAr: str(formData.get("questionAr")),
    answer,
    answerAr: str(formData.get("answerAr")),
    keywords: str(formData.get("keywords")),
  };
}

function str(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v).trim();
  return s === "" ? undefined : s;
}
