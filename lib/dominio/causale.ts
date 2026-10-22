function soloLettere(testo: string): string {
  return testo
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 10);
}

/**
 * causale = <FESTEGGIATO>-<NOME>: solo A-Z maiuscole, accenti rimossi, massimo 10 caratteri per parte.
 * In caso di omonimia nella stessa colletta si aggiunge un numero: GIULIA-MARCO2.
 * `esistenti` sono le causali già assegnate ad altre righe della colletta.
 */
export function generaCausale(festeggiato: string, nome: string, esistenti: Iterable<string>): string {
  const base = `${soloLettere(festeggiato) || "REGALO"}-${soloLettere(nome) || "AMICO"}`;
  const occupate = new Set(esistenti);
  if (!occupate.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidata = `${base}${n}`;
    if (!occupate.has(candidata)) return candidata;
  }
}
