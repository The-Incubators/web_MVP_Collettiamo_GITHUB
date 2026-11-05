import Link from "next/link";
import { BottoneCondividi } from "@/components/BottoneCondividi";
import { BottoneCuore, BottonePreferitiTesto } from "@/components/BottoneCuore";
import { BottoneListaRegali } from "@/components/BottoneListaRegali";
import { CalcoloAGruppo } from "@/components/CalcoloAGruppo";
import { TestoEspandibile } from "@/components/TestoEspandibile";
import { BottoneLink, Icona, ImmagineProdotto } from "@/components/ui";
import { REL_LINK_PRODOTTO, urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { daProdotto, testoGiornoRilevazione } from "@/lib/dominio/regali";
import type { Prodotto } from "@/lib/tipi";
import type { ModoCatalogo } from "@/lib/ux";

/**
 * Il contenuto della scheda prodotto. Sta in un componente a parte perché lo mostrano in due posti:
 * la pagina `/prodotto/[slug]` e il popup che si apre cliccando un prodotto nel catalogo. Così i due
 * non possono divergere.
 *
 * `comeTitolo` dice con che livello scrivere il nome: `h1` nella pagina, `h2` nel popup, dove il titolo
 * del dialogo è già annunciato da chi legge con uno screen reader. `indietro` è il collegamento in alto a
 * sinistra (solo nella pagina: nel popup c'è la X).
 *
 * `modo` è la variante, come nel catalogo (lib/ux.ts): «gruppo» con il calcolo della quota, «Organizza la colletta»
 * e la lista per la votazione; «singolo» senza, con «Aggiungi ai preferiti» e «Guarda su Amazon».
 */
export function DettaglioProdotto({
  p,
  modo,
  comeTitolo = "h1",
  indietro,
}: {
  p: Prodotto;
  modo: ModoCatalogo;
  comeTitolo?: "h1" | "h2";
  indietro?: React.ReactNode;
}) {
  const Titolo = comeTitolo;
  const gruppo = modo === "gruppo";
  const dettagli = (
    <section aria-labelledby="dettagli-prodotto" className="flex flex-col gap-2 rounded-3xl bg-surface p-5 shadow-carta">
      <h2 id="dettagli-prodotto" className="flex items-center gap-2 text-xl font-semibold text-accent-2">
        <Icona nome="info" />
        Dettagli del prodotto
      </h2>
      {/* i testi vengono dal catalogo e sono spesso lunghi: tre righe, il resto a richiesta */}
      <TestoEspandibile testo={p.descrizione} extra={p.perche ? <p className="rounded-2xl bg-gold-field p-4 text-sm">{p.perche}</p> : undefined} />
    </section>
  );
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        {indietro ?? <span />}
        <div className="flex items-center gap-2">
          <BottoneCuore slug={p.slug} nome={p.nome} />
          <BottoneCondividi titolo={p.nome} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-8 [&>*]:min-w-0">
        <div className="relative self-start overflow-hidden rounded-3xl bg-surface p-4 shadow-carta">
          {p.marca !== "Generico" ? (
            <span className="absolute left-4 top-4 z-10 rounded-full bg-accent px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-on-accent">
              {p.marca}
            </span>
          ) : null}
          <ImmagineProdotto prodotto={p} className="rounded-2xl" />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Titolo className="font-display text-[26px] font-bold leading-tight text-accent-2">{p.nome}</Titolo>
            <p className="cifre text-[44px] font-extrabold leading-none tracking-tight text-accent-2">{formattaEuro(p.prezzoCent)}</p>
          </div>

          {gruppo ? (
            <>
              <CalcoloAGruppo slug={p.slug} prezzoCent={p.prezzoCent}>
                {dettagli}
              </CalcoloAGruppo>
              <BottoneListaRegali prodotto={daProdotto(p)} variante="largo" />
              <a
                href={urlPerAcquisto(p.urlEsterno)}
                target="_blank"
                rel={REL_LINK_PRODOTTO}
                className="inline-flex min-h-tocco items-center justify-center gap-1 self-center text-sm font-bold text-accent"
              >
                Vedi su Amazon.it <Icona nome="open_in_new" dimensione={18} />
              </a>
            </>
          ) : (
            <>
              {dettagli}
              <BottonePreferitiTesto slug={p.slug} nome={p.nome} grande />
              <BottoneLink href={urlPerAcquisto(p.urlEsterno)} esterno variante="azione" pieno>
                Guarda su Amazon
                <Icona nome="open_in_new" dimensione={22} />
                <span className="sr-only"> (si apre in una nuova scheda)</span>
              </BottoneLink>
            </>
          )}

          <div className="flex items-center gap-3 rounded-3xl bg-surface-2 p-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold-field text-gold">
              <Icona nome="mail" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="font-display text-lg font-semibold leading-tight">Vuoi solo il biglietto?</p>
              <p className="truncate text-xs text-ink-soft">Un biglietto firmato da tutto il gruppo</p>
            </div>
            <Link href="/biglietto/nuovo" className="inline-flex min-h-tocco shrink-0 items-center rounded-full bg-surface px-4 text-sm font-bold text-accent shadow-carta">
              Crea gratis
            </Link>
          </div>

          <div className="flex flex-col items-center gap-1 rounded-2xl p-2 text-center text-xs font-semibold text-ink-soft">
            <p>Prezzo rilevato il {testoGiornoRilevazione(p.rilevatoIl ?? "2026-10-14")}: su Amazon.it può essere cambiato.</p>
            {gruppo ? (
              <p className="inline-flex items-center gap-1">
                <Icona nome="lock" dimensione={14} />I soldi della colletta non passano da Gifty.
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
