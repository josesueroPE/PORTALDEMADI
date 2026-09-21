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
    .select(
      "id, nombre, pais, genera_recibo_propio, ultimo_recibo, metodo_pago, datos_pago, direccion, telefono, cedula"
    )
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

  const { data: todosPeriodos } = await supabase
    .from("minutos_periodo")
    .select("periodo")
    .eq("interprete_id", interprete.id)
    .order("periodo", { ascending: true });

  const { data: historial } = await supabase
    .from("recibos")
    .select("id, numero, periodo, total, fecha")
    .eq("interprete_id", interprete.id)
    .order("numero", { ascending: false });

  const periodosConMinutos = Array.from(new Set((todosPeriodos ?? []).map((p) => p.periodo)));
  const periodosFacturados = new Set((historial ?? []).map((h) => h.periodo));
  const periodosPendientes = periodosConMinutos.filter((p) => !periodosFacturados.has(p));

  // Siempre el mas antiguo pendiente primero, para que nadie se salte un mes
  // aunque su cuenta se haya creado despues de que ya cargamos un mes mas nuevo.
  const periodo = periodosPendientes[0] ?? null;
  const alDia = periodo === null && periodosConMinutos.length > 0;

  const { data: minutos } = periodo
    ? await supabase
        .from("minutos_periodo")
        .select("plataforma, minutos, tarifa")
        .eq("interprete_id", interprete.id)
        .eq("periodo", periodo)
    : { data: [] };

  return (
    <PortalClient
      interprete={interprete}
      periodo={periodo}
      alDia={alDia}
      lineas={(minutos ?? []).map((l) => ({ ...l, tarifa: Number(l.tarifa) }))}
      historial={(historial ?? []).map((h) => ({ ...h, total: Number(h.total) }))}
    />
  );
}
