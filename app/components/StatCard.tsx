export default function StatCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: "brand" | "green" | "amber" | "zinc";
}) {
  const accentClass =
    accent === "brand"
      ? "text-brand"
      : accent === "green"
      ? "text-emerald-600"
      : accent === "amber"
      ? "text-amber-600"
      : "text-zinc-900";
  return (
    <div className="card p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </div>
      <div className={`mt-2 text-2xl font-semibold ${accentClass}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-zinc-400">{hint}</div>}
    </div>
  );
}
