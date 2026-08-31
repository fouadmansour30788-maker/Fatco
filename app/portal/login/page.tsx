import PortalLoginForm from "./PortalLoginForm";
import { getDictionary } from "@/lib/i18n";

export const metadata = { title: "Sign in · FATCO Customer Portal" };

export default async function PortalLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const { t } = await getDictionary();

  return (
    <div className="mx-auto max-w-sm py-10">
      <div className="mb-6 text-center">
        <h1 className="text-lg font-semibold tracking-tight">{t.portal.welcomeBack}</h1>
        <p className="text-sm text-zinc-500">{t.portal.signInSubtitle}</p>
      </div>
      <div className="card p-6">
        <PortalLoginForm
          next={next}
          t={{
            phoneNumber: t.portal.phoneNumber,
            pin: t.portal.pin,
            pinPlaceholder: t.portal.pinPlaceholder,
            checking: t.portal.checking,
            viewAccount: t.portal.viewAccount,
          }}
        />
      </div>
      <p className="mt-4 text-center text-xs text-zinc-400">{t.portal.askStaff}</p>
    </div>
  );
}
