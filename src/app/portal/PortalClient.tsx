"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generarRecibo, logout } from "./actions";
import { PLAT_LABEL, periodoLabel, money } from "@/lib/recibo-utils";
import DatosPagoForm from "./DatosPagoForm";
import DatosPersonalesForm from "./DatosPersonalesForm";

type Linea = { plataforma: string; minutos: number; tarifa: number };
type ReciboHist = { id: string; numero: number; periodo: string; total: number; fecha: string };

export default function PortalClient({
  interprete,
  periodo,
  lineas,
  historial,
  yaGenerado,
  reciboIdDelPeriodo,
}: {
  interprete: {
    id: string;
    nombre: string;
    pais: string | null;
    genera_recibo_propio: boolean;
    ultimo_recibo: number;
    metodo_pago: string | null;
    datos_pago: string | null;
    direccion: string | null;
    telefono: string | null;
  };
  periodo: string | null;
  lineas: Linea[];
  historial: ReciboHist[];
  yaGenerado: boolean;
  reciboIdDelPeriodo: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = lineas.reduce((s, l) => s + l.minutos * l.tarifa, 0);

  function onGenerar() {
    if (!periodo) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const id = await generarRecibo(periodo);
        router.push(`/portal/recibo/${id}`);
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : "Error al generar el recibo");
      }
    });
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-border px-7 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold font-serif text-sm font-bold text-ink">
              M
            </div>
            <div>
              <p className="font-serif text-sm font-bold text-ink">Portal del intérprete</p>
              <p className="text-[11.5px] text-ink-soft">{interprete.nombre}</p>
            </div>
          </div>
          <form action={logout}>
            <button className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink">
              Cerrar sesión
            </button>
          </form>
        </div>

        <div className="px-7 py-6">
          {!periodo ? (
            <p className="text-sm text-ink-soft">Todavía no hay minutos publicados para ti.</p>
          ) : (
            <>
              <div className="mb-6 flex items-start gap-2.5 rounded-lg border border-accent bg-accent-light px-4 py-3.5">
                <span className="text-base text-accent-text">✓</span>
                <p className="text-[13px] font-medium text-accent-text">
                  Tus minutos de {periodoLabel(periodo)} ya están publicados.
                  {interprete.genera_recibo_propio
                    ? " Revisa el detalle abajo y genera tu recibo cuando estés listo."
                    : " Genera tu recibo por honorarios directamente en SUNAT con estos datos."}
                </p>
              </div>

              <h2 className="font-serif text-lg font-bold text-ink">Mis minutos — {periodoLabel(periodo)}</h2>

              <div className="mt-4 overflow-hidden rounded-lg border border-border">
                {lineas.map((l, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-border px-4 py-3 last:border-b-0"
                  >
                    <div>
                      <p className="text-[13.5px] font-semibold text-ink">{PLAT_LABEL[l.plataforma] ?? l.plataforma}</p>
                      <p className="font-mono text-xs text-ink-soft">{l.minutos} min × ${l.tarifa.toFixed(2)}</p>
                    </div>
                    <p className="font-mono text-sm font-bold text-ink">{money(l.minutos * l.tarifa)}</p>
                  </div>
                ))}
                <div className="flex items-center justify-between bg-surface-2 px-4 py-3.5">
                  <p className="text-[15px] font-bold text-ink">Total</p>
                  <p className="font-mono text-[15px] font-bold text-ink">{money(total)}</p>
                </div>
              </div>

              {interprete.genera_recibo_propio && (
                <>
                  {errorMsg && <p className="mt-3 text-[13px] text-danger">{errorMsg}</p>}
                  {yaGenerado && reciboIdDelPeriodo ? (
                    <a
                      href={`/portal/recibo/${reciboIdDelPeriodo}`}
                      target="_blank"
                      className="mt-4 block w-full rounded-lg bg-accent py-3 text-center text-sm font-semibold text-white"
                    >
                      Ver / descargar recibo
                    </a>
                  ) : (
                    <button
                      onClick={onGenerar}
                      disabled={pending}
                      className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    >
                      {pending ? "Generando…" : `Generar mi recibo N° ${interprete.ultimo_recibo + 1}`}
                    </button>
                  )}
                </>
              )}

              <DatosPersonalesForm direccionActual={interprete.direccion} telefonoActual={interprete.telefono} />
              <DatosPagoForm metodoActual={interprete.metodo_pago} datosActuales={interprete.datos_pago} />

              <h2 className="mt-8 mb-3 font-serif text-base font-bold text-ink">Historial de recibos</h2>
              <div className="flex flex-col gap-2">
                {historial.length === 0 && <p className="text-[13px] text-ink-faint">Todavía no tienes recibos.</p>}
                {historial.map((h) => (
                  <a
                    key={h.id}
                    href={`/portal/recibo/${h.id}`}
                    target="_blank"
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-3 hover:bg-surface-2"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-ink">
                        Recibo N° {h.numero} · {periodoLabel(h.periodo)}
                      </p>
                      <p className="font-mono text-[11.5px] text-ink-faint">{h.fecha}</p>
                    </div>
                    <p className="font-mono text-[13.5px] font-bold text-ink">{money(h.total)}</p>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
