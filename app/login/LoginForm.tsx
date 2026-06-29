"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initial: LoginState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(login, initial);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="label">Email</label>
        <input
          name="email"
          type="email"
          required
          autoFocus
          className="input"
          placeholder="admin@fatco.com"
        />
      </div>
      <div>
        <label className="label">Password</label>
        <input name="password" type="password" required className="input" />
      </div>

      {state.error && (
        <p className="rounded-lg bg-brand/10 px-3 py-2 text-sm text-brand">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-brand w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
