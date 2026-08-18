import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PLAT_LABEL, periodoLabel, money, numeroALetras } from "@/lib/recibo-utils";
import PrintButton from "./PrintButton";

export default async function ReciboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: recibo } = await supabase
    .from("recibos")
    .select("id, numero, periodo, fecha, total, interprete_id")
    .eq("id", id)
    .maybeSingle();

  if (!recibo) notFound();

  const { data: interprete } = await supabase
    .from("interpretes")
    .select("nombre, pais, metodo_pago, datos_pago")
    .eq("id", recibo.interprete_id)
    .maybeSingle();

  const { data: lineas } = await supabase
    .from("recibo_lineas")
    .select("plataforma, minutos, tarifa, subtotal")
    .eq("recibo_id", recibo.id);

  if (!interprete || !lineas) notFound();

  return (
    <main className="min-h-screen bg-bg px-4 py-10 print:bg-white print:p-0">
      <div className="no-print mx-auto mb-4 flex max-w-2xl justify-end">
        <PrintButton />
      </div>

      <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-10 text-[#1a1a1a] shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <div className="mb-8 flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <p className="font-serif text-2xl font-bold">RECIBO POR SERVICIOS</p>
            <p className="mt-1 font-mono text-sm text-gray-500">N° {recibo.numero}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold font-serif text-xl font-bold text-ink">
            M
          </div>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-500">Emitido por</p>
          <p className="text-base font-semibold">{interprete.nombre}</p>
          {interprete.pais && <p className="text-sm text-gray-600">{interprete.pais}</p>}
        </div>

        <div className="mb-6 rounded-lg bg-gray-50 p-4 text-sm leading-relaxed">
          <p>
            He recibido de: <strong>MADI CONSULTING LS S.A.C.</strong> — RUC 20611577126
          </p>
          <p className="text-gray-600">
            Cal. German Schreiber Nro. 276 Int. 240 (Edificio Schreiber Business Center), San Isidro, Lima, Perú
          </p>
          <p className="mt-2">
            Por concepto de: Honorarios por servicios de interpretación o traducción, correspondientes al periodo de{" "}
            {periodoLabel(recibo.periodo)}, según contrato.
          </p>
        </div>

        <table className="mb-2 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-300 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="pb-2">Plataforma</th>
              <th className="pb-2 text-right">Minutos</th>
              <th className="pb-2 text-right">Precio unit.</th>
              <th className="pb-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {lineas.map((l, i) => (
              <tr key={i} className="border-b border-gray-100">
                <td className="py-2">{PLAT_LABEL[l.plataforma] ?? l.plataforma}</td>
                <td className="py-2 text-right font-mono">{l.minutos}</td>
                <td className="py-2 text-right font-mono">${Number(l.tarifa).toFixed(2)}</td>
                <td className="py-2 text-right font-mono">{money(Number(l.subtotal))}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end border-t border-gray-300 pt-3">
          <p className="font-mono text-lg font-bold">TOTAL: {money(Number(recibo.total))}</p>
        </div>
        <p className="mt-1 text-right text-sm italic text-gray-600">{numeroALetras(Number(recibo.total))}.</p>

        {interprete.datos_pago && (
          <p className="mt-6 border-t border-dashed border-gray-300 pt-4 text-sm text-gray-700">
            <strong>Nota:</strong> Por favor sírvanse depositar el importe de mis honorarios a mi cuenta de{" "}
            {interprete.metodo_pago}: <span className="font-mono">{interprete.datos_pago}</span>
          </p>
        )}

        <div className="mt-12 flex items-end justify-between text-sm text-gray-500">
          <p>{interprete.pais ?? ""}, {recibo.fecha}</p>
          <div className="w-48 border-t border-gray-400 pt-1 text-center">Firma</div>
        </div>
      </div>
    </main>
  );
}
