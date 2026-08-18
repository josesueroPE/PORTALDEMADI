"use client";

import { useState, useTransition } from "react";
import { generarRecibo, logout } from "./actions";
import { PLAT_LABEL, periodoLabel, money, numeroALetras } from "@/lib/recibo-utils";

type Linea = { plataforma: string; minutos: number; tarifa: number };
type ReciboHist = { id: string; numero: number; periodo: string; total: number; fecha: string };
type ReciboGenerado = {
  numero: number;
  total: number;
  lineas: { plataforma: string; minutos: number; tarifa: number; subtotal: number }[];
};

export default function PortalClient({
  interprete,
  periodo,
  lineas,
  historial,
  yaGenerado,
  reciboGenerado,
}: {
  interprete: { id: string; nombre: string; pais: string | null; genera_recibo_propio: boolean; ultimo_recibo: number };
  periodo: string | null;
  lineas: Linea[];
  historial: ReciboHist[];
  yaGenerado: boolean;
  reciboGenerado: ReciboGenerado | null;
}) {
  const [showRecibo, setShowRecibo] = useState(false);
  const [pending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = lineas.reduce((s, l) => s + l.minutos * l.tarifa, 0);

  function onGenerar() {
    if (!periodo) return;
    setErrorMsg(null);
    startTransition(async () => {
      try {
        await generarRecibo(periodo);
        setShowRecibo(true);
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
                  <button
                    onClick={yaGenerado ? () => setShowRecibo(true) : onGenerar}
                    disabled={pending}
                    className="mt-4 w-full rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  >
                    {pending
                      ? "Generando…"
                      : yaGenerado
                      ? `Ver recibo N° ${reciboGenerado?.numero}`
                      : `Generar mi recibo N° ${interprete.ultimo_recibo + 1}`}
                  </button>
                </>
              )}

              <h2 className="mt-8 mb-3 font-serif text-base font-bold text-ink">Historial de recibos</h2>
              <div className="flex flex-col gap-2">
                {historial.length === 0 && <p className="text-[13px] text-ink-faint">Todavía no tienes recibos.</p>}
                {historial.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between rounded-lg border border-border bg-surface px-3.5 py-3"
                  >
                    <div>
                      <p className="text-[13px] font-semibold text-ink">
                        Recibo N° {h.numero} · {periodoLabel(h.periodo)}
                      </p>
                      <p className="font-mono text-[11.5px] text-ink-faint">{h.fecha}</p>
                    </div>
                    <p className="font-mono text-[13.5px] font-bold text-ink">{money(h.total)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {showRecibo && reciboGenerado && periodo && (
        <div
          onClick={() => setShowRecibo(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-7"
          >
            <h3 className="font-serif text-lg font-bold text-ink">Recibo N° {reciboGenerado.numero}</h3>
            <p className="mb-4 text-[12.5px] text-ink-soft">
              {interprete.nombre} · {periodoLabel(periodo)}
            </p>
            <p className="text-[13px] text-ink">
              He recibido de: <strong>MADI CONSULTING LS S.A.C.</strong> — RUC 20611577126
            </p>
            {reciboGenerado.lineas.map((l, i) => (
              <p key={i} className="my-1 text-[13px] text-ink">
                {PLAT_LABEL[l.plataforma] ?? l.plataforma}: {l.minutos} min × ${l.tarifa.toFixed(2)} = {money(l.subtotal)}
              </p>
            ))}
            <p className="mt-3 text-[17px] font-bold text-ink">TOTAL: {money(reciboGenerado.total)}</p>
            <p className="mb-5 text-[12.5px] italic text-ink-soft">{numeroALetras(reciboGenerado.total)}.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRecibo(false)}
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-xs font-medium text-ink"
              >
                Cerrar
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
