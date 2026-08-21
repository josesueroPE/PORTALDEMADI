"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ultimoDiaDelPeriodo } from "@/lib/recibo-utils";

export async function actualizarDatosPago(_prevState: string | null, formData: FormData) {
  const metodo = String(formData.get("metodo") || "");
  const datos = String(formData.get("datos") || "").trim();

  if (!datos) return "Escribe tu correo de Payoneer o los datos de tu cuenta bancaria.";

  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_mis_datos_pago", {
    p_metodo: metodo,
    p_datos: datos,
  });

  if (error) return "No se pudo guardar. Intenta de nuevo.";

  revalidatePath("/portal");
  return "ok";
}

export async function actualizarDatosPersonales(_prevState: string | null, formData: FormData) {
  const direccion = String(formData.get("direccion") || "").trim();
  const telefono = String(formData.get("telefono") || "").trim();
  const cedula = String(formData.get("cedula") || "").trim();

  if (!direccion) return "Escribe tu dirección.";

  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_mis_datos_personales", {
    p_direccion: direccion,
    p_telefono: telefono || null,
    p_cedula: cedula || null,
  });

  if (error) return "No se pudo guardar. Intenta de nuevo.";

  revalidatePath("/portal");
  return "ok";
}

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

  const { data: existente } = await supabase
    .from("recibos")
    .select("id")
    .eq("interprete_id", interprete.id)
    .eq("periodo", periodo)
    .maybeSingle();

  if (existente) {
    return existente.id as string;
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
      fecha: ultimoDiaDelPeriodo(periodo),
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
  return recibo.id as string;
}
