import { setLocaleAction } from "@/app/i18n-actions";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({
  locale,
  path,
  className = "text-zinc-500 hover:text-brand",
}: {
  locale: Locale;
  path: string;
  className?: string;
}) {
  const other: Locale = locale === "ar" ? "en" : "ar";
  return (
    <form action={setLocaleAction}>
      <input type="hidden" name="locale" value={other} />
      <input type="hidden" name="redirectTo" value={path} />
      <button type="submit" className={`text-sm font-medium ${className}`}>
        {other === "ar" ? "العربية" : "English"}
      </button>
    </form>
  );
}
