// DA VERIFICARE: che il formato https://paypal.me/<handle>/<importo>EUR funzioni con l'handle fornito.
// Il ripiego (link al profilo senza importo) è sempre disponibile.

/** Accetta "marco", "@marco", "paypal.me/marco", "https://www.paypal.me/marco/10EUR". Restituisce l'handle o null. */
export function estraiHandlePaypal(testo: string): string | null {
  let t = testo.trim();
  if (!t) return null;
  t = t.replace(/^https?:\/\//i, "").replace(/^www\./i, "");
  t = t.replace(/^paypal\.me\//i, "").replace(/^@/, "");
  const handle = t.split(/[/?#]/)[0] ?? "";
  return /^[A-Za-z0-9._-]{1,40}$/.test(handle) ? handle : null;
}

export function linkPaypal(valore: string, importoCent: number | null): { conImporto: string | null; profilo: string } | null {
  const handle = estraiHandlePaypal(valore);
  if (!handle) return null;
  const profilo = `https://paypal.me/${handle}`;
  if (importoCent == null || importoCent <= 0) return { conImporto: null, profilo };
  const importo = importoCent % 100 === 0 ? String(importoCent / 100) : (importoCent / 100).toFixed(2);
  return { conImporto: `${profilo}/${importo}EUR`, profilo };
}
