import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";
import { runChatTurn } from "@/lib/chatbot";
import { getMessagingProvider } from "@/lib/messaging";

// Meta's webhook verification handshake — set this same URL + a chosen
// WHATSAPP_VERIFY_TOKEN in the Meta App dashboard once a WhatsApp Business
// app exists (see .env.example for the full setup note).
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (
    mode === "subscribe" &&
    challenge &&
    token &&
    process.env.WHATSAPP_VERIFY_TOKEN &&
    token === process.env.WHATSAPP_VERIFY_TOKEN
  ) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  if (!verifySignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }

  const incoming = extractMessage(payload);
  if (!incoming) {
    // Delivery/status callbacks or non-text messages — ack so Meta stops retrying.
    return new NextResponse("OK", { status: 200 });
  }

  const phone = normalizePhone(incoming.from);
  const candidates = await prisma.customer.findMany({
    where: { phone: { not: null } },
    select: { id: true, phone: true },
  });
  const match = candidates.find((c) => c.phone && normalizePhone(c.phone) === phone);

  const reply = await runChatTurn({
    customerId: match?.id ?? null,
    channel: "WHATSAPP",
    key: phone,
    userMessage: incoming.text,
  });

  await getMessagingProvider().send(incoming.from, reply);

  return new NextResponse("OK", { status: 200 });
}

function verifySignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  const expectedBuf = Buffer.from(expected, "hex");
  const providedBuf = Buffer.from(provided, "hex");
  if (expectedBuf.length !== providedBuf.length) return false;
  return timingSafeEqual(expectedBuf, providedBuf);
}

type IncomingMessage = { from: string; text: string };

type WhatsAppWebhookPayload = {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          from?: string;
          type?: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
};

function extractMessage(payload: unknown): IncomingMessage | null {
  const msg = (payload as WhatsAppWebhookPayload)?.entry?.[0]?.changes?.[0]?.value
    ?.messages?.[0];
  if (!msg || msg.type !== "text" || !msg.from) return null;
  return { from: msg.from, text: msg.text?.body ?? "" };
}
