import { cache } from "react";
import { prisma } from "./prisma";

const KEY = "chatbot_settings";

export type ChatbotSettings = {
  greeting: string;
  greetingAr: string;
  fallbackMessage: string;
  fallbackMessageAr: string;
};

const DEFAULTS: ChatbotSettings = {
  greeting:
    "Hi! I'm FATCO's assistant. I can check your loyalty points, order status, service history, or help you find a product. What can I help with?",
  greetingAr:
    "أهلاً! أنا مساعد فاتكو. يمكنني التحقق من نقاط الولاء، حالة الطلب، سجل الخدمات، أو مساعدتك في إيجاد منتج. كيف أقدر أساعدك؟",
  fallbackMessage:
    "Sorry, I couldn't find an answer to that. Please contact FATCO staff, or check the online store at /shop.",
  fallbackMessageAr:
    "عذرًا، لم أجد إجابة على ذلك. يرجى التواصل مع فريق فاتكو، أو زيارة المتجر الإلكتروني.",
};

// Same Setting-JSON pattern as lib/permissions-server.ts / lib/storeContent.ts.
export const getChatbotSettings = cache(async (): Promise<ChatbotSettings> => {
  try {
    const row = await prisma.setting.findUnique({ where: { key: KEY } });
    if (!row) return { ...DEFAULTS };
    const v = JSON.parse(row.value);
    return { ...DEFAULTS, ...v };
  } catch {
    return { ...DEFAULTS };
  }
});

export async function setChatbotSettings(data: ChatbotSettings): Promise<void> {
  await prisma.setting.upsert({
    where: { key: KEY },
    update: { value: JSON.stringify(data) },
    create: { key: KEY, value: JSON.stringify(data) },
  });
}
