"use client";

import { useActionState, useEffect, useState } from "react";
import { actualizarDatosPersonales } from "./actions";

export default function DatosPersonalesForm({
  direccionActual,
  telefonoActual,
  cedulaActual,
}: {
  direccionActual: string | null;
  telefonoActual: string | null;
  cedulaActual: string | null;
}) {
  const [result, formAction, pending] = useActionState(actualizarDatosPersonales, null);
  const [editando, setEditando] = useState(!direccionActual);

  useEffect(() => {
    if (result === "ok") setEditando(false);
  }, [result]);

  if (!editando) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
              Mis datos para el recibo
            </p>
            {cedulaActual && <p className="mt-1 text-[13px] text-ink">Cédula: {cedulaActual}</p>}
            <p className="text-[13px] text-ink">{direccionActual}</p>
            {telefonoActual && <p className="text-[13px] text-ink-soft">{telefonoActual}</p>}
          </div>
          <button
            onClick={() => setEditando(true)}
            className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink"
          >
            Editar
          </button>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-4 rounded-lg border border-border bg-surface-2 px-4 py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Mis datos para el recibo — cédula, dirección y teléfono
      </p>
      <div className="flex flex-col gap-2.5">
        <input
          name="cedula"
          defaultValue={cedulaActual ?? ""}
          placeholder="Cédula / N° de identidad"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          name="direccion"
          defaultValue={direccionActual ?? ""}
          placeholder="Dirección completa"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        <input
          name="telefono"
          defaultValue={telefonoActual ?? ""}
          placeholder="Teléfono (opcional)"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        {result && result !== "ok" && <p className="text-[12.5px] text-danger">{result}</p>}
        <div className="flex gap-2">
          {direccionActual && (
            <button
              type="button"
              onClick={() => setEditando(false)}
              className="flex-1 rounded-lg border border-border bg-surface py-2 text-sm font-medium text-ink"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-lg bg-ink py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}
