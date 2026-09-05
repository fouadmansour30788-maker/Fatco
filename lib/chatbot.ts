import { prisma } from "./prisma";
import { getStoreContent } from "./storeContent";
import { getChatbotSettings } from "./chatbotSettings";
import type { ChatChannel } from "./constants";

// Rule-based support chatbot — no LLM involved. Every reply comes from
// either a direct database lookup (loyalty/orders/service history/vehicles/
// products) matched by keyword, or a staff-edited KnowledgeBaseEntry found
// by keyword overlap, or the configured fallback message. See
// lib/chatbotSettings.ts for the editable greeting/fallback text and the
// /knowledge-base admin page for the FAQ entries.

type Lang = "en" | "ar";

function detectLang(text: string): Lang {
  return /[؀-ۿ]/.test(text) ? "ar" : "en";
}

// Strip punctuation, collapse whitespace, lowercase (Latin only — Arabic has
// no case) so keyword regexes and word-overlap scoring are consistent.
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "do", "does", "i", "my", "me", "you", "your",
  "what", "how", "can", "could", "please", "for", "of", "to", "in", "on",
  "and", "or", "at", "it", "this", "that",
  "هل", "من", "في", "على", "عن", "الى", "إلى", "أنا", "انا", "لي", "ما", "هذا",
]);

function meaningfulWords(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

// ---------- Intent keyword rules ----------
type Intent = "GREETING" | "LOYALTY" | "SERVICE_HISTORY" | "VEHICLES" | "ORDER_STATUS" | "PRODUCT";

const INTENT_PATTERNS: { intent: Intent; pattern: RegExp }[] = [
  { intent: "GREETING", pattern: /\b(hi|hello|hey)\b|مرحبا|مرحباً|السلام عليكم|أهلا|اهلا/i },
  { intent: "LOYALTY", pattern: /\b(point|points|loyalty|reward|rewards)\b|نقاط|نقطة|مكاف/i },
  { intent: "ORDER_STATUS", pattern: /\border(s)?\b|tracking|track\b|طلب|طلبي|طلباتي/i },
  {
    intent: "SERVICE_HISTORY",
    pattern: /\bservice(s)?\b|history|visit(s)?|سجل|خدمة|خدمات|صيانة|زيارة/i,
  },
  { intent: "VEHICLES", pattern: /\b(car|cars|vehicle|vehicles)\b|سيارة|سياراتي|عربيتي/i },
  { intent: "PRODUCT", pattern: /oil|tyre|tire|filter|battery|price|cost|زيت|إطار|اطار|فلتر|بطارية|سعر/i },
];

const CONTACT_PATTERN = /\b(contact|phone|address|location|hours|email)\b|تواصل|هاتف|عنوان|موقع|بريد/i;

const CATEGORY_TERMS: { pattern: RegExp; category: string }[] = [
  { pattern: /oil|زيت/i, category: "OIL" },
  { pattern: /tyre|tire|إطار|اطار/i, category: "TYRE" },
  { pattern: /filter|فلتر/i, category: "FILTER" },
  { pattern: /battery|بطارية/i, category: "BATTERY" },
];

function detectIntent(text: string): Intent | "CONTACT" | null {
  if (CONTACT_PATTERN.test(text)) return "CONTACT";
  for (const { intent, pattern } of INTENT_PATTERNS) {
    if (pattern.test(text)) return intent;
  }
  return null;
}

// ---------- Database-backed replies ----------

async function replyLoyalty(customerId: string, lang: Lang): Promise<string> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    include: { rewards: { where: { status: "AVAILABLE" } } },
  });
  if (!customer) {
    return lang === "ar" ? "لم أجد حسابك." : "I couldn't find your account.";
  }
  if (lang === "ar") {
    let reply = `لديك ${customer.pointsBalance} نقطة ولاء.`;
    reply +=
      customer.rewards.length > 0
        ? ` كما لديك مكافآت متاحة: ${customer.rewards.map((r) => r.description).join("، ")}.`
        : " لا توجد مكافآت متاحة للاستبدال حاليًا.";
    return reply;
  }
  let reply = `You have ${customer.pointsBalance} loyalty point${customer.pointsBalance === 1 ? "" : "s"}.`;
  reply +=
    customer.rewards.length > 0
      ? ` You also have rewards available: ${customer.rewards.map((r) => r.description).join(", ")}.`
      : " No rewards available to redeem right now.";
  return reply;
}

async function replyServiceHistory(customerId: string, lang: Lang): Promise<string> {
  const transactions = await prisma.transaction.findMany({
    where: { customerId, status: "COMPLETED" },
    orderBy: { date: "desc" },
    take: 3,
    include: { lines: true },
  });
  if (transactions.length === 0) {
    return lang === "ar" ? "لا توجد زيارات مسجّلة بعد." : "No visits recorded yet.";
  }
  const lines = transactions.map((t) => {
    const date = t.date.toISOString().slice(0, 10);
    const items = t.lines.map((l) => l.description).join(", ");
    return lang === "ar" ? `${date}: ${items} ($${t.total})` : `${date}: ${items} ($${t.total})`;
  });
  const header = lang === "ar" ? "آخر زياراتك:" : "Your most recent visits:";
  return `${header}\n${lines.join("\n")}`;
}

async function replyVehicles(customerId: string, lang: Lang): Promise<string> {
  const vehicles = await prisma.vehicle.findMany({ where: { customerId } });
  if (vehicles.length === 0) {
    return lang === "ar" ? "لا توجد سيارات مسجّلة على حسابك." : "No vehicles on file for your account.";
  }
  const list = vehicles
    .map((v) => [v.make, v.model, v.year].filter(Boolean).join(" ") + (v.plate ? ` (${v.plate})` : ""))
    .join(lang === "ar" ? "، " : ", ");
  return (lang === "ar" ? "سياراتك المسجّلة: " : "Your vehicles on file: ") + list;
}

async function replyOrderStatus(customerId: string, lang: Lang): Promise<string> {
  const orders = await prisma.transaction.findMany({
    where: { customerId, channel: "ONLINE" },
    orderBy: { date: "desc" },
    take: 3,
  });
  if (orders.length === 0) {
    return lang === "ar" ? "لا توجد طلبات عبر المتجر الإلكتروني." : "No online store orders found.";
  }
  const lines = orders.map(
    (o) => `#${o.number} — ${o.fulfillmentStatus ?? "PENDING"} — $${o.total}`
  );
  const header = lang === "ar" ? "طلباتك الأخيرة:" : "Your recent orders:";
  return `${header}\n${lines.join("\n")}`;
}

async function replyProducts(userMessage: string, lang: Lang): Promise<string> {
  const matchedCategories = CATEGORY_TERMS.filter((c) => c.pattern.test(userMessage)).map(
    (c) => c.category
  );
  const items = await prisma.item.findMany({
    where: {
      storefrontVisible: true,
      active: true,
      ...(matchedCategories.length ? { category: { in: matchedCategories } } : {}),
    },
    take: 5,
    orderBy: { name: "asc" },
  });
  if (items.length === 0) {
    return lang === "ar"
      ? "لم أجد منتجات مطابقة. تصفّح المتجر الإلكتروني لرؤية كل المنتجات."
      : "I couldn't find a matching product — browse the full catalog at /shop.";
  }
  const lines = items.map((i) => {
    const name = (lang === "ar" && i.nameAr) || i.name;
    const stock = i.trackStock && i.stockQty <= 0 ? (lang === "ar" ? " (غير متوفر)" : " (out of stock)") : "";
    return `${name} — $${i.salePrice}${stock}`;
  });
  const header = lang === "ar" ? "وجدت هذه المنتجات:" : "Here's what I found:";
  return `${header}\n${lines.join("\n")}`;
}

async function replyContact(lang: Lang): Promise<string> {
  const content = await getStoreContent();
  const parts: string[] = [];
  if (content.footerPhone) parts.push(content.footerPhone);
  if (content.footerEmail) parts.push(content.footerEmail);
  const address = (lang === "ar" && content.footerAddressAr) || content.footerAddress;
  if (address) parts.push(address);
  if (parts.length === 0) {
    return lang === "ar"
      ? "يرجى زيارة المتجر الإلكتروني للتواصل معنا."
      : "Please visit our online store for ways to reach us.";
  }
  return (lang === "ar" ? "يمكنك التواصل معنا عبر: " : "You can reach FATCO at: ") + parts.join(" · ");
}

// ---------- Knowledge base search (keyword overlap, no LLM) ----------

async function searchKnowledgeBase(userMessage: string, lang: Lang): Promise<string | null> {
  const entries = await prisma.knowledgeBaseEntry.findMany({ where: { active: true } });
  if (entries.length === 0) return null;

  const queryWords = new Set(meaningfulWords(userMessage));
  if (queryWords.size === 0) return null;

  let best: { entry: (typeof entries)[number]; score: number } | null = null;
  for (const entry of entries) {
    const haystack = [entry.question, entry.questionAr ?? "", entry.keywords ?? ""].join(" ");
    const entryWords = meaningfulWords(haystack);
    const score = entryWords.filter((w) => queryWords.has(w)).length;
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }
  if (!best) return null;
  return (lang === "ar" && best.entry.answerAr) || best.entry.answer;
}

const MAX_HISTORY = 20;

// Runs one turn of the shared support chatbot (portal + WhatsApp). `key` is
// the conversation identity: customerId for PORTAL, normalized phone digits
// for WHATSAPP (customerId is additionally set there once matched, unlocking
// the account-specific replies).
export async function runChatTurn(opts: {
  customerId: string | null;
  channel: ChatChannel;
  key: string;
  userMessage: string;
}): Promise<string> {
  const { customerId, channel, key, userMessage } = opts;
  const lang = detectLang(userMessage);

  await prisma.chatMessage.create({
    data: {
      channel,
      customerId,
      phone: channel === "WHATSAPP" ? key : null,
      role: "USER",
      content: userMessage,
    },
  });

  const reply = await buildReply(userMessage, customerId, lang);

  await prisma.chatMessage.create({
    data: {
      channel,
      customerId,
      phone: channel === "WHATSAPP" ? key : null,
      role: "ASSISTANT",
      content: reply,
    },
  });

  // Keep the conversation log bounded — trim anything beyond the most
  // recent MAX_HISTORY messages for this conversation.
  const where =
    channel === "PORTAL" ? { channel, customerId: key } : { channel, phone: key };
  const total = await prisma.chatMessage.count({ where });
  if (total > MAX_HISTORY) {
    const stale = await prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: "asc" },
      take: total - MAX_HISTORY,
      select: { id: true },
    });
    await prisma.chatMessage.deleteMany({ where: { id: { in: stale.map((m) => m.id) } } });
  }

  return reply;
}

async function buildReply(
  userMessage: string,
  customerId: string | null,
  lang: Lang
): Promise<string> {
  const settings = await getChatbotSettings();
  const intent = detectIntent(userMessage);
  const noAccount = () =>
    lang === "ar"
      ? "لم أجد حسابًا مرتبطًا بهذه المحادثة. يرجى التواصل مع فريق فاتكو للحصول على رمز بوابة العملاء."
      : "I couldn't find an account for this conversation — please contact FATCO staff to get set up with a portal PIN.";

  switch (intent) {
    case "GREETING":
      return lang === "ar" ? settings.greetingAr : settings.greeting;
    case "CONTACT":
      return replyContact(lang);
    case "PRODUCT":
      return replyProducts(userMessage, lang);
    case "LOYALTY":
      return customerId ? replyLoyalty(customerId, lang) : noAccount();
    case "SERVICE_HISTORY":
      return customerId ? replyServiceHistory(customerId, lang) : noAccount();
    case "VEHICLES":
      return customerId ? replyVehicles(customerId, lang) : noAccount();
    case "ORDER_STATUS":
      return customerId ? replyOrderStatus(customerId, lang) : noAccount();
    default: {
      const kbAnswer = await searchKnowledgeBase(userMessage, lang);
      if (kbAnswer) return kbAnswer;
      return lang === "ar" ? settings.fallbackMessageAr : settings.fallbackMessage;
    }
  }
}
