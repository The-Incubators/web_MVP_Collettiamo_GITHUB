// Gli importi sono sempre centesimi interi. La formattazione in euro avviene solo qui.

const nf0 = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const nf2 = new Intl.NumberFormat("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 1000 → "10 €", 1050 → "10,50 €". Spazio non separabile prima del simbolo. */
export function formattaEuro(cent: number): string {
  const segno = cent < 0 ? "-" : "";
  const assoluto = Math.abs(Math.round(cent));
  const testo = assoluto % 100 === 0 ? nf0.format(assoluto / 100) : nf2.format(assoluto / 100);
  return `${segno}${testo} €`;
}

/** Interpreta "10", "10,5", "10.50", "1.234,50", "€ 12" → centesimi. null se non valido o non positivo. */
export function leggiEuro(testo: string): number | null {
  let t = testo.replace(/[€\s ]/g, "");
  if (t === "") return null;
  if (t.includes(",")) {
    t = t.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(t)) {
    t = t.replace(/\./g, "");
  }
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  const [intero, frazione = ""] = t.split(".");
  const cent = Number(intero) * 100 + Number(frazione.padEnd(2, "0"));
  if (!Number.isSafeInteger(cent) || cent <= 0) return null;
  return cent;
}

/** Valore per un campo di testo: 1050 → "10,50", 1000 → "10". */
export function euroPerCampo(cent: number): string {
  return cent % 100 === 0 ? String(cent / 100) : (cent / 100).toFixed(2).replace(".", ",");
}
