// Validazione IBAN: forma, lunghezza per paese e checksum mod 97.

const LUNGHEZZE: Record<string, number> = {
  AD: 24, AT: 20, BE: 16, BG: 22, CH: 21, CY: 28, CZ: 24, DE: 22, DK: 18, EE: 20,
  ES: 24, FI: 18, FR: 27, GB: 22, GI: 23, GR: 27, HR: 21, HU: 28, IE: 22, IS: 26,
  IT: 27, LI: 21, LT: 20, LU: 20, LV: 21, MC: 27, MT: 31, NL: 18, NO: 15, PL: 28,
  PT: 25, RO: 24, SE: 24, SI: 19, SK: 24, SM: 27, VA: 22,
};

export function normalizzaIban(testo: string): string {
  return testo.replace(/\s+/g, "").toUpperCase();
}

/** "IT60X0542811101000000123456" → "IT60 X054 2811 1010 0000 0123 456" */
export function formattaIban(testo: string): string {
  return normalizzaIban(testo).replace(/(.{4})/g, "$1 ").trim();
}

export type EsitoIban = { valido: true; iban: string } | { valido: false; motivo: string };

export function validaIban(testo: string): EsitoIban {
  const iban = normalizzaIban(testo);
  if (iban.length === 0) return { valido: false, motivo: "Inserisci l'IBAN." };
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    return { valido: false, motivo: "L'IBAN deve iniziare con due lettere e due cifre." };
  }
  const attesa = LUNGHEZZE[iban.slice(0, 2)];
  if (!attesa) return { valido: false, motivo: "Paese dell'IBAN non riconosciuto." };
  if (iban.length !== attesa) {
    return { valido: false, motivo: `Un IBAN ${iban.slice(0, 2)} ha ${attesa} caratteri, questo ne ha ${iban.length}.` };
  }
  const spostato = iban.slice(4) + iban.slice(0, 4);
  let resto = 0;
  for (const ch of spostato) {
    const cifre = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const c of cifre) resto = (resto * 10 + Number(c)) % 97;
  }
  if (resto !== 1) return { valido: false, motivo: "Il codice di controllo dell'IBAN non torna: ricontrolla le cifre." };
  return { valido: true, iban };
}
