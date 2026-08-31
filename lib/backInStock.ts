import { prisma } from "./prisma";
import { getMessagingProvider } from "./messaging";

// Notifies everyone who asked to be told when `itemId` is back in stock, via
// whichever messaging provider is active (see lib/messaging.ts — same one
// lib/reminders.ts#sendReminder already uses). Called from
// app/(app)/items/actions.ts#adjustStock when stock crosses 0 -> positive.
export async function notifyBackInStock(itemId: string): Promise<void> {
  const alerts = await prisma.backInStockAlert.findMany({
    where: { itemId, status: "PENDING" },
    include: { customer: true, item: true },
  });
  if (alerts.length === 0) return;

  const provider = getMessagingProvider();

  for (const alert of alerts) {
    if (!alert.customer.phone) continue;
    const message = `Hi ${alert.customer.name.split(" ")[0]}, good news — ${alert.item.name} is back in stock at FATCO. Order it here: ${storeUrl(alert.itemId)}`;
    const result = await provider.send(alert.customer.phone, message);
    if (result.ok) {
      await prisma.backInStockAlert.update({
        where: { id: alert.id },
        data: { status: "NOTIFIED", notifiedAt: new Date() },
      });
    }
  }
}

function storeUrl(itemId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return `${base}/shop/${itemId}`;
}
