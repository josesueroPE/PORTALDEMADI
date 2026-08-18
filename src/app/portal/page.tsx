import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";
import PortalClient from "./PortalClient";

export default async function PortalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-4 text-ink">
        Sesión no encontrada.
      </main>
    );
  }

  const { data: interprete } = await supabase
    .from("interpretes")
    .select("id, nombre, pais, genera_recibo_propio, ultimo_recibo, metodo_pago, datos_pago")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!interprete) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg px-4 text-center text-ink">
        <p className="text-sm text-ink-soft">
          Tu cuenta no está vinculada a ningún file de intérprete todavía. Avisa a Madi para que la conecten.
        </p>
        <form action={logout}>
          <button className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink">
            Cerrar sesión
          </button>
        </form>
      </main>
    );
  }

  const { data: ultimoPeriodo } = await supabase
    .from("minutos_periodo")
    .select("periodo")
    .eq("interprete_id", interprete.id)
    .order("periodo", { ascending: false })
    .limit(1)
    .maybeSingle();

  const periodo = ultimoPeriodo?.periodo ?? null;

  const { data: minutos } = periodo
    ? await supabase
        .from("minutos_periodo")
        .select("plataforma, minutos, tarifa")
        .eq("interprete_id", interprete.id)
        .eq("periodo", periodo)
    : { data: [] };

  const { data: historial } = await supabase
    .from("recibos")
    .select("id, numero, periodo, total, fecha")
    .eq("interprete_id", interprete.id)
    .order("numero", { ascending: false });

  const yaGenerado = (historial ?? []).some((h) => h.periodo === periodo);
  const reciboDelPeriodo = (historial ?? []).find((h) => h.periodo === periodo);

  return (
    <PortalClient
      interprete={interprete}
      periodo={periodo}
      lineas={(minutos ?? []).map((l) => ({ ...l, tarifa: Number(l.tarifa) }))}
      historial={(historial ?? []).map((h) => ({ ...h, total: Number(h.total) }))}
      yaGenerado={yaGenerado}
      reciboIdDelPeriodo={reciboDelPeriodo?.id ?? null}
    />
  );
}
