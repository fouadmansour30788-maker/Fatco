import { CURRENCY } from "./constants";

const moneyFmt = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
});

export function formatMoney(value: number | null | undefined): string {
  return moneyFmt.format(value ?? 0);
}

const numberFmt = new Intl.NumberFormat("en-US");
export function formatNumber(value: number | null | undefined): string {
  return numberFmt.format(value ?? 0);
}

export function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
