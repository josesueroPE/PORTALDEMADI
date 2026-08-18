"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function generarRecibo(periodo: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado");

  const { data: interprete, error: interpreteError } = await supabase
    .from("interpretes")
    .select("id, ultimo_recibo, genera_recibo_propio")
    .eq("user_id", user.id)
    .single();

  if (interpreteError || !interprete) throw new Error("No se encontró tu file de intérprete");
  if (!interprete.genera_recibo_propio) throw new Error("Este recibo se genera en SUNAT, no aquí");

  const { count: yaExiste } = await supabase
    .from("recibos")
    .select("id", { count: "exact", head: true })
    .eq("interprete_id", interprete.id)
    .eq("periodo", periodo);

  if (yaExiste && yaExiste > 0) {
    revalidatePath("/portal");
    return;
  }

  const { data: minutos, error: minutosError } = await supabase
    .from("minutos_periodo")
    .select("plataforma, minutos, tarifa")
    .eq("interprete_id", interprete.id)
    .eq("periodo", periodo);

  if (minutosError || !minutos || minutos.length === 0) throw new Error("No hay minutos para este periodo");

  const total = minutos.reduce((s, l) => s + l.minutos * Number(l.tarifa), 0);
  const numero = interprete.ultimo_recibo + 1;

  const { data: recibo, error: reciboError } = await supabase
    .from("recibos")
    .insert({
      tipo: "interprete",
      interprete_id: interprete.id,
      numero,
      periodo,
      total,
    })
    .select("id")
    .single();

  if (reciboError || !recibo) throw new Error("No se pudo generar el recibo");

  const lineas = minutos.map((l) => ({
    recibo_id: recibo.id,
    plataforma: l.plataforma,
    minutos: l.minutos,
    tarifa: l.tarifa,
    subtotal: l.minutos * Number(l.tarifa),
  }));

  await supabase.from("recibo_lineas").insert(lineas);
  await supabase.from("interpretes").update({ ultimo_recibo: numero }).eq("id", interprete.id);

  revalidatePath("/portal");
}
