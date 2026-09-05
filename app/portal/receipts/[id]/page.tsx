import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePortal } from "@/lib/session";
import { formatMoney, formatDateTime } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import PrintButton from "../PrintButton";

export const dynamic = "force-dynamic";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePortal();
  const { t } = await getDictionary();
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { lines: true, vehicle: true, customer: true },
  });
  if (!tx || tx.customerId !== session.sub) notFound();

  return (
    <div className="max-w-lg">
      <div className="no-print mb-4">
        <Link href="/portal" className="text-sm text-brand hover:underline">
          {t.portal.backToAccount}
        </Link>
      </div>

      <div className="card receipt-print space-y-5 p-6">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
              F
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight">FATCO</div>
              <div className="text-xs text-zinc-500">{t.common.brandTagline}</div>
            </div>
          </div>
          <div className="text-end text-sm">
            <div className="font-semibold">{t.portal.receiptTitle(tx.number)}</div>
            <div className="text-xs text-zinc-500">{formatDateTime(tx.date)}</div>
          </div>
        </div>

        <div className="text-sm">
          <div className="mb-1 font-semibold text-zinc-700">{t.portal.receiptCustomer}</div>
          <div className="text-zinc-600">{tx.customer?.name ?? "—"}</div>
          {tx.vehicle && (
            <div className="text-xs text-zinc-400">
              {[tx.vehicle.make, tx.vehicle.model].filter(Boolean).join(" ")}{" "}
              {tx.vehicle.plate}
            </div>
          )}
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 text-left text-xs text-zinc-500">
              <th className="pb-2 font-medium">{t.shop.breadcrumbHome}</th>
              <th className="pb-2 text-right font-medium">{t.portal.receiptQty}</th>
              <th className="pb-2 text-right font-medium">{t.shop.total}</th>
            </tr>
          </thead>
          <tbody>
            {tx.lines.map((l) => (
              <tr key={l.id} className="border-b border-zinc-50">
                <td className="py-1.5">{l.description}</td>
                <td className="py-1.5 text-right text-zinc-500">{l.qty}</td>
                <td className="py-1.5 text-right">{formatMoney(l.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="space-y-1 border-t border-zinc-100 pt-3 text-sm">
          <div className="flex justify-between text-zinc-500">
            <span>{t.shop.subtotal}</span>
            <span>{formatMoney(tx.subtotal)}</span>
          </div>
          {tx.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>{t.shop.discount}</span>
              <span>-{formatMoney(tx.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold">
            <span>{t.shop.total}</span>
            <span>{formatMoney(tx.total)}</span>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-3 text-sm text-zinc-600">
          <span className="font-semibold text-zinc-700">{t.shop.payment}: </span>
          {tx.paymentMethod ?? "—"}
        </div>

        <div className="no-print pt-2">
          <PrintButton label={t.portal.printReceipt} />
        </div>
      </div>
    </div>
  );
}
