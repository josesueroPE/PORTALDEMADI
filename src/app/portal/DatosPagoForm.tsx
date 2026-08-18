"use client";

import { useActionState, useEffect, useState } from "react";
import { actualizarDatosPago } from "./actions";

const METODOS = ["Payoneer", "Transferencia bancaria", "PayPal"];

export default function DatosPagoForm({
  metodoActual,
  datosActuales,
}: {
  metodoActual: string | null;
  datosActuales: string | null;
}) {
  const [result, formAction, pending] = useActionState(actualizarDatosPago, null);
  const [editando, setEditando] = useState(!datosActuales);
  const [metodo, setMetodo] = useState(metodoActual ?? "Payoneer");

  useEffect(() => {
    if (result === "ok") setEditando(false);
  }, [result]);

  if (!editando) {
    return (
      <div className="mt-8 rounded-lg border border-border bg-surface-2 px-4 py-3.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Mis datos de pago</p>
            <p className="mt-1 text-[13px] text-ink">
              {metodoActual}: <span className="font-mono">{datosActuales}</span>
            </p>
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
    <form action={formAction} className="mt-8 rounded-lg border border-border bg-surface-2 px-4 py-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Mis datos de pago — así se paga tu recibo
      </p>
      <div className="flex flex-col gap-2.5">
        <select
          name="metodo"
          value={metodo}
          onChange={(e) => setMetodo(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        >
          {METODOS.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
        <input
          name="datos"
          defaultValue={datosActuales ?? ""}
          placeholder={metodo === "Payoneer" ? "Correo de tu cuenta Payoneer" : "Banco, N° de cuenta, titular…"}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink"
        />
        {result && result !== "ok" && <p className="text-[12.5px] text-danger">{result}</p>}
        <div className="flex gap-2">
          {datosActuales && (
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
