"use client";

import { useActionState } from "react";
import { portalLogin, type PortalLoginState } from "../actions";

const initial: PortalLoginState = {};

type LoginFormText = {
  phoneNumber: string;
  pin: string;
  pinPlaceholder: string;
  checking: string;
  viewAccount: string;
};

export default function PortalLoginForm({
  next,
  t,
}: {
  next?: string;
  t: LoginFormText;
}) {
  const [state, formAction, pending] = useActionState(portalLogin, initial);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label">{t.phoneNumber}</label>
        <input
          name="phone"
          type="tel"
          required
          autoFocus
          className="input"
          placeholder="+961 70 000 000"
        />
      </div>
      <div>
        <label className="label">{t.pin}</label>
        <input
          name="pin"
          inputMode="numeric"
          required
          className="input tracking-widest"
          placeholder={t.pinPlaceholder}
        />
      </div>

      {state.error && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-brand w-full">
        {pending ? t.checking : t.viewAccount}
      </button>
    </form>
  );
}
