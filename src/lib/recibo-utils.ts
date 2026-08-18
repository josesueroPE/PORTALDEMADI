export const PLAT_LABEL: Record<string, string> = {
  Propio: "Propio",
  TTG: "TTG",
  Maven: "Maven",
  LB: "Lionbridge",
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function periodoLabel(periodoISO: string) {
  const [y, m] = periodoISO.split("-").map(Number);
  const mes = MESES[m - 1];
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} ${y}`;
}

export function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export function numeroALetras(n: number): string {
  const entero = Math.floor(n);
  const centavos = Math.round((n - entero) * 100);
  const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
  const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
  const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
  const centenas = ["", "cien", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

  function tresDigitos(num: number): string {
    if (num === 0) return "";
    if (num === 100) return "cien";
    let s = "";
    const c = Math.floor(num / 100), d = Math.floor((num % 100) / 10), u = num % 10;
    if (c > 0) s += centenas[c] + " ";
    const resto = num % 100;
    if (resto >= 10 && resto < 20) s += especiales[resto - 10];
    else {
      if (d > 0) s += decenas[d];
      if (d > 0 && u > 0) s += " y ";
      if (u > 0 || d === 0) s += unidades[u];
    }
    return s.trim();
  }

  let resultado = "";
  if (entero === 0) resultado = "cero";
  else if (entero < 1000) resultado = tresDigitos(entero);
  else if (entero < 1000000) {
    const miles = Math.floor(entero / 1000);
    const resto = entero % 1000;
    resultado = (miles === 1 ? "mil" : tresDigitos(miles) + " mil") + (resto > 0 ? " " + tresDigitos(resto) : "");
  } else resultado = String(entero);

  resultado = resultado.charAt(0).toUpperCase() + resultado.slice(1);
  return `${resultado} con ${String(centavos).padStart(2, "0")}/100 dólares americanos`;
}
