"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-10 shadow-sm">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold font-serif text-xl font-bold text-ink">
          M
        </div>
        <h1 className="font-serif text-xl font-bold text-ink">Portal del intérprete</h1>
        <p className="mt-1 mb-7 text-sm text-ink-soft">Madi Consulting LS SAC</p>

        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-[11.5px] font-semibold text-ink-soft">
              Correo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@correo.com"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-[11.5px] font-semibold text-ink-soft">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-danger bg-danger-light px-3 py-2 text-[13px] text-danger">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {pending ? "Ingresando…" : "Ingresar"}
          </button>
        </form>
      </div>
    </main>
  );
}
