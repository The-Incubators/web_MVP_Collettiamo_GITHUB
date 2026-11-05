import { accessoRecente, accountDa, cancellaAccount, pianoPer } from "@/lib/account/cancella";
import { errore, risposta } from "@/lib/biglietti/rotte";

export const dynamic = "force-dynamic";

/** Che cosa sparisce e che cosa resta, con i nomi veri (design.md §10.3, passo 1). Non tocca nulla. */
export async function GET(richiesta: Request) {
  const a = await accountDa(richiesta);
  if (!a) return errore("Accedi per vedere il tuo account.", 401, { motivo: "accesso" });
  const piano = await pianoPer(a);
  return risposta({ ok: true, riepilogo: piano.riepilogo });
}

/**
 * Cancella l'account (GDPR art. 17), subito. Serve un accesso di pochi minuti fa: la pagina lo chiede di nuovo con
 * «Accedi con Google e cancella» (Firebase lo pretende per cancellare un utente, e vale come verifica dell'identità,
 * art. 12 par. 6). Risponde con l'istante della cancellazione, che la pagina mostra con data e ora.
 */
export async function POST(richiesta: Request) {
  const a = await accountDa(richiesta);
  if (!a) return errore("Accedi di nuovo per confermare.", 401, { motivo: "accesso" });
  if (!accessoRecente(a)) return errore("Accedi di nuovo per confermare.", 401, { motivo: "accesso" });
  try {
    await cancellaAccount(a);
  } catch (e) {
    console.error("[cancella account]", e instanceof Error ? e.message : "errore");
    return errore("L'account non è stato cancellato.", 500);
  }
  return risposta({ ok: true, cancellatoIl: Date.now() });
}
