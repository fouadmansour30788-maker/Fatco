import Link from "next/link";
import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import type { StoreContent } from "@/lib/storeContent";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export default function Footer({
  content,
  locale,
  t,
}: {
  content: StoreContent;
  locale: Locale;
  t: Dictionary["shop"] & Dictionary["common"] & Dictionary["landing"];
}) {
  const address = (locale === "ar" && content.footerAddressAr) || content.footerAddress;
  const hasContact = content.footerPhone || content.footerEmail || address;
  const hasSocial =
    content.footerFacebookUrl || content.footerInstagramUrl || content.footerWhatsappUrl;

  return (
    <footer className="border-t border-zinc-200 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">
                F
              </div>
              <span className="text-sm font-bold tracking-tight">FATCO</span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">{t.brandTagline}</p>
          </div>

          {hasContact && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t.contact}
              </h3>
              <ul className="space-y-1.5 text-sm text-zinc-600">
                {content.footerPhone && (
                  <li className="flex items-center gap-2">
                    <Phone size={14} className="text-zinc-400" />
                    <a
                      href={`tel:${content.footerPhone}`}
                      dir="ltr"
                      className="hover:text-brand"
                    >
                      {content.footerPhone}
                    </a>
                  </li>
                )}
                {content.footerEmail && (
                  <li className="flex items-center gap-2">
                    <Mail size={14} className="text-zinc-400" />
                    <a
                      href={`mailto:${content.footerEmail}`}
                      dir="ltr"
                      className="hover:text-brand"
                    >
                      {content.footerEmail}
                    </a>
                  </li>
                )}
                {address && (
                  <li className="flex items-center gap-2">
                    <MapPin size={14} className="shrink-0 text-zinc-400" />
                    <span>{address}</span>
                  </li>
                )}
              </ul>
            </div>
          )}

          {hasSocial && (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                {t.followUs}
              </h3>
              <div className="flex flex-wrap gap-2">
                {content.footerFacebookUrl && (
                  <Link
                    href={content.footerFacebookUrl}
                    target="_blank"
                    className="badge bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  >
                    Facebook
                  </Link>
                )}
                {content.footerInstagramUrl && (
                  <Link
                    href={content.footerInstagramUrl}
                    target="_blank"
                    className="badge bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  >
                    Instagram
                  </Link>
                )}
                {content.footerWhatsappUrl && (
                  <Link
                    href={content.footerWhatsappUrl}
                    target="_blank"
                    className="badge flex items-center gap-1 bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        <p className="mt-8 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-400">
          {t.footer(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  );
}
