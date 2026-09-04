import Link from "next/link";
import type { StoreContent } from "@/lib/storeContent";
import type { Locale } from "@/lib/i18n";

export default function Hero({
  content,
  locale,
}: {
  content: StoreContent;
  locale: Locale;
}) {
  if (!content.heroImageUrl) return null;

  const headline = (locale === "ar" && content.heroHeadlineAr) || content.heroHeadline;
  const subtitle = (locale === "ar" && content.heroSubtitleAr) || content.heroSubtitle;
  const ctaHref = content.heroCtaHref || "/shop";

  return (
    <div
      className="relative mb-8 flex min-h-[220px] items-center overflow-hidden rounded-2xl bg-zinc-900 bg-cover bg-center p-8 text-white sm:min-h-[280px] sm:p-12"
      style={{ backgroundImage: `url(${content.heroImageUrl})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      <div className="relative max-w-md">
        {headline && <h2 className="text-2xl font-bold sm:text-3xl">{headline}</h2>}
        {subtitle && (
          <p className="mt-2 text-sm text-zinc-200 sm:text-base">{subtitle}</p>
        )}
        {content.heroCtaLabel && (
          <Link href={ctaHref} className="btn-brand mt-5 inline-flex">
            {content.heroCtaLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
