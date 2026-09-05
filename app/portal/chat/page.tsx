import { requirePortal } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { getDictionary } from "@/lib/i18n";
import ChatWindow from "./ChatWindow";

export const dynamic = "force-dynamic";

export default async function PortalChatPage() {
  const session = await requirePortal();
  const { t } = await getDictionary();

  const history = await prisma.chatMessage.findMany({
    where: { channel: "PORTAL", customerId: session.sub },
    orderBy: { createdAt: "asc" },
    take: 40,
  });

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight">{t.portal.chatTitle}</h1>
      <p className="mb-4 text-sm text-zinc-500">{t.portal.chatSubtitle}</p>
      <ChatWindow
        initialMessages={history.map((m) => ({
          role: m.role as "USER" | "ASSISTANT",
          content: m.content,
        }))}
        t={{
          placeholder: t.portal.chatPlaceholder,
          send: t.portal.chatSend,
          empty: t.portal.chatEmpty,
        }}
      />
    </div>
  );
}
