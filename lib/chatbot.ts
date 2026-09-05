import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "./prisma";
import { getStoreContent } from "./storeContent";
import type { ChatChannel } from "./constants";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are FATCO's customer support assistant. FATCO (Ahmad Fawzi Fathalla EST.) is an oil, tyres, and car-services business in Tripoli, Lebanon, serving individual and business customers.

You can look up a customer's loyalty points, available rewards, service history, vehicles on file, and online order status using the tools provided, and you can search FATCO's product catalog for prices and stock.

You CANNOT place orders, redeem rewards, change account details, or make any other changes — for those, direct the customer to the online store (/shop) or ask them to contact FATCO staff directly.

Keep answers short, warm, and to the point — this is a text/WhatsApp-style conversation, not a long-form document. If a tool returns no data, say so plainly rather than guessing. Reply in the same language the customer writes in (English or Arabic).`;

const GUEST_SYSTEM_SUFFIX = `

This sender's phone number does not match any FATCO customer account, so you do NOT have access to their loyalty/order/service tools — only product search and contact info. If they ask account-specific questions, explain you can't find an account for this number and suggest they contact FATCO staff to get set up with a customer portal PIN.`;

const ACCOUNT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_loyalty_status",
    description:
      "Get the customer's current loyalty points balance and any available (unredeemed) rewards.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_service_history",
    description:
      "Get the customer's recent completed services/purchases (in-store and online), most recent first.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_vehicles",
    description: "Get the vehicles on file for this customer.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_order_status",
    description:
      "Get the customer's online store orders and their fulfillment status (Pending/Confirmed/Completed/Cancelled).",
    input_schema: { type: "object", properties: {} },
  },
];

const PUBLIC_TOOLS: Anthropic.Tool[] = [
  {
    name: "search_products",
    description:
      "Search FATCO's online store catalog by name or category keyword. Returns matching products with price and stock status.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text, e.g. 'oil filter' or 'tyre'" },
      },
      required: ["query"],
    },
  },
  {
    name: "get_contact_info",
    description: "Get FATCO's contact phone, email, and address.",
    input_schema: { type: "object", properties: {} },
  },
];

async function executeTool(
  name: string,
  input: unknown,
  customerId: string | null
): Promise<string> {
  if (!customerId && name !== "search_products" && name !== "get_contact_info") {
    return "No matching customer account for this conversation.";
  }

  switch (name) {
    case "get_loyalty_status": {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId! },
        include: { rewards: { where: { status: "AVAILABLE" } } },
      });
      if (!customer) return "Account not found.";
      return JSON.stringify({
        pointsBalance: customer.pointsBalance,
        availableRewards: customer.rewards.map((r) => ({
          description: r.description,
          value: r.value,
        })),
      });
    }
    case "get_service_history": {
      const transactions = await prisma.transaction.findMany({
        where: { customerId: customerId!, status: "COMPLETED" },
        orderBy: { date: "desc" },
        take: 5,
        include: { lines: true, vehicle: true },
      });
      return JSON.stringify(
        transactions.map((t) => ({
          date: t.date.toISOString().slice(0, 10),
          total: t.total,
          vehicle: t.vehicle
            ? [t.vehicle.make, t.vehicle.model].filter(Boolean).join(" ")
            : null,
          items: t.lines.map((l) => l.description),
        }))
      );
    }
    case "get_vehicles": {
      const vehicles = await prisma.vehicle.findMany({ where: { customerId: customerId! } });
      return JSON.stringify(
        vehicles.map((v) => ({
          label: [v.make, v.model, v.year].filter(Boolean).join(" "),
          plate: v.plate,
          mileage: v.mileage,
        }))
      );
    }
    case "get_order_status": {
      const orders = await prisma.transaction.findMany({
        where: { customerId: customerId!, channel: "ONLINE" },
        orderBy: { date: "desc" },
        take: 5,
      });
      return JSON.stringify(
        orders.map((o) => ({
          orderNumber: o.number,
          date: o.date.toISOString().slice(0, 10),
          total: o.total,
          status: o.fulfillmentStatus ?? "PENDING",
        }))
      );
    }
    case "search_products": {
      const query =
        input && typeof input === "object" && "query" in input
          ? String((input as { query: unknown }).query ?? "")
          : "";
      const items = await prisma.item.findMany({
        where: {
          storefrontVisible: true,
          active: true,
          ...(query ? { name: { contains: query, mode: "insensitive" as const } } : {}),
        },
        take: 8,
      });
      return JSON.stringify(
        items.map((i) => ({
          name: i.name,
          category: i.category,
          price: i.salePrice,
          inStock: i.trackStock ? i.stockQty > 0 : true,
        }))
      );
    }
    case "get_contact_info": {
      const content = await getStoreContent();
      return JSON.stringify({
        phone: content.footerPhone || null,
        email: content.footerEmail || null,
        address: content.footerAddress || null,
        whatsapp: content.footerWhatsappUrl || null,
      });
    }
    default:
      return `Unknown tool: ${name}`;
  }
}

const MAX_TOOL_ITERATIONS = 6;
const FALLBACK_REPLY =
  "Sorry, I'm having trouble responding right now — please try again in a moment.";

// Runs one turn of the shared support chatbot (portal + WhatsApp). `key` is
// the conversation identity: customerId for PORTAL, normalized phone digits
// for WHATSAPP (customerId is additionally set there once matched, unlocking
// the account tools).
export async function runChatTurn(opts: {
  customerId: string | null;
  channel: ChatChannel;
  key: string;
  userMessage: string;
}): Promise<string> {
  const { customerId, channel, key, userMessage } = opts;

  const historyRows = await prisma.chatMessage.findMany({
    where:
      channel === "PORTAL"
        ? { channel, customerId: key }
        : { channel, phone: key },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  await prisma.chatMessage.create({
    data: {
      channel,
      customerId,
      phone: channel === "WHATSAPP" ? key : null,
      role: "USER",
      content: userMessage,
    },
  });

  const messages: Anthropic.MessageParam[] = [
    ...historyRows.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = customerId ? [...ACCOUNT_TOOLS, ...PUBLIC_TOOLS] : PUBLIC_TOOLS;
  const system = customerId ? SYSTEM_PROMPT : SYSTEM_PROMPT + GUEST_SYSTEM_SUFFIX;

  let finalText = FALLBACK_REPLY;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 1024,
      system,
      tools,
      messages,
      output_config: { effort: "low" },
    });

    const textBlocks = response.content.filter(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    const toolUses = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );

    if (response.stop_reason !== "tool_use" || toolUses.length === 0) {
      finalText = textBlocks.map((b) => b.text).join("\n").trim() || finalText;
      break;
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      const result = await executeTool(toolUse.name, toolUse.input, customerId).catch(
        (e) => `Error: ${e instanceof Error ? e.message : "tool failed"}`
      );
      toolResults.push({ type: "tool_result", tool_use_id: toolUse.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  await prisma.chatMessage.create({
    data: {
      channel,
      customerId,
      phone: channel === "WHATSAPP" ? key : null,
      role: "ASSISTANT",
      content: finalText,
    },
  });

  return finalText;
}
