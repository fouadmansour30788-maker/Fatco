// Messaging provider abstraction. The reminders engine talks to this interface,
// so the WhatsApp integration is a drop-in: set the env vars and sends go live
// with no code changes. Until then a console provider is used (works today).

export type SendResult = { ok: boolean; id?: string; error?: string };

export interface MessagingProvider {
  readonly name: string;
  readonly configured: boolean;
  send(to: string, message: string): Promise<SendResult>;
}

// Default provider for development: logs the message instead of sending.
class ConsoleProvider implements MessagingProvider {
  readonly name = "console";
  readonly configured = true;
  async send(to: string, message: string): Promise<SendResult> {
    console.log(`[messaging:console] → ${to}: ${message}`);
    return { ok: true, id: `console-${Date.now()}` };
  }
}

// Meta WhatsApp Cloud API. Active only when WHATSAPP_TOKEN + WHATSAPP_PHONE_ID
// are set. The call is real — it just isn't reached until configured.
class WhatsAppCloudProvider implements MessagingProvider {
  readonly name = "whatsapp";
  readonly configured = Boolean(
    process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID
  );

  async send(to: string, message: string): Promise<SendResult> {
    if (!this.configured) return { ok: false, error: "WhatsApp not configured" };
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: to.replace(/\D/g, ""),
            type: "text",
            text: { body: message },
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { ok: false, error: data?.error?.message ?? `HTTP ${res.status}` };
      }
      return { ok: true, id: data?.messages?.[0]?.id };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "send failed" };
    }
  }
}

export function getMessagingProvider(): MessagingProvider {
  const whatsapp = new WhatsAppCloudProvider();
  if (whatsapp.configured) return whatsapp;
  return new ConsoleProvider();
}
