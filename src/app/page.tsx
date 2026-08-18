import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { error } = await supabase.auth.getUser();
  const conectado = !error || error.name === "AuthSessionMissingError";

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-10 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gold font-serif text-xl font-bold text-ink">
          M
        </div>
        <h1 className="font-serif text-xl font-bold text-ink">
          Portal Madi Consulting
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Base del sistema desplegada — listo para construir encima.
        </p>

        <div
          className={`mt-6 flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium ${
            conectado
              ? "border-accent bg-accent-light text-accent-text"
              : "border-danger bg-danger-light text-danger"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              conectado ? "bg-accent" : "bg-danger"
            }`}
          />
          {conectado ? "Conectado a Supabase" : "Sin conexión a Supabase"}
        </div>
      </div>
    </main>
  );
}
