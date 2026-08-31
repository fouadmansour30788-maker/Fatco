import { Noto_Sans_Arabic } from "next/font/google";

// Loaded once, applied only on the RTL wrapper of public pages when the
// visitor's locale is Arabic — see lib/i18n.ts.
export const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-arabic",
  subsets: ["arabic"],
});
