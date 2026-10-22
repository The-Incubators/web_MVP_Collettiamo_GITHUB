// Payload del codice QR "giro-code" (EPC069-12, versione 002, codifica UTF-8).
// DA VERIFICARE su app bancarie italiane reali.

export interface DatiEpc {
  iban: string;
  intestatario: string;
  importoCent: number;
  causale: string;
}

export function payloadEpc({ iban, intestatario, importoCent, causale }: DatiEpc): string {
  const importo = `EUR${(importoCent / 100).toFixed(2)}`;
  return [
    "BCD", // service tag
    "002", // versione
    "1", // UTF-8
    "SCT", // SEPA credit transfer
    "", // BIC: facoltativo per l'area SEPA nella versione 002
    intestatario.slice(0, 70),
    iban.replace(/\s+/g, "").toUpperCase(),
    importo,
    "", // purpose
    "", // riferimento strutturato (vuoto: si usa quello libero)
    causale.slice(0, 140),
  ].join("\n");
}
