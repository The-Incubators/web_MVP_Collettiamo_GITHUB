import Link from "next/link";
import { BottoneListaRegali } from "@/components/BottoneListaRegali";
import { CalcoloAGruppo } from "@/components/CalcoloAGruppo";
import { testoConsegna } from "@/components/SchedaProdotto";
import { BottoneLink, IconaEsterno, IconaOrologio, ImmagineProdotto } from "@/components/ui";
import { urlPerAcquisto } from "@/lib/dominio/amazon";
import { formattaEuro } from "@/lib/dominio/importi";
import { daProdotto, testoGiornoRilevazione } from "@/lib/dominio/regali";
import type { Prodotto } from "@/lib/tipi";

/**
 * Il contenuto della scheda prodotto. Sta in un componente a parte perché lo mostrano in due posti:
 * la pagina `/prodotto/[slug]` e il popup che si apre cliccando un prodotto nel catalogo. Così i due
 * non possono divergere.
 *
 * `comeTitolo` dice con che livello scrivere il nome: `h1` nella pagina, `h2` nel popup, dove il titolo
 * del dialogo è già annunciato da chi legge con uno screen reader.
 */
export function DettaglioProdotto({ p, comeTitolo = "h1" }: { p: Prodotto; comeTitolo?: "h1" | "h2" }) {
  const Titolo = comeTitolo;
  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-2 [&>*]:min-w-0">
      <div className="contenitore overflow-hidden">
        <ImmagineProdotto prodotto={p} />
      </div>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          {p.marca !== "Generico" ? <p className="text-sm text-ink-soft">{p.marca}</p> : null}
          <Titolo className="font-display text-3xl font-bold leading-tight">{p.nome}</Titolo>
          <p className="cifre text-3xl font-bold">{formattaEuro(p.prezzoCent)}</p>
          <p className="text-sm text-ink-soft">
            Prezzo rilevato il {testoGiornoRilevazione(p.rilevatoIl ?? "2026-10-14")}. Prezzo e disponibilità possono cambiare: fanno fede quelli
            mostrati su Amazon.it al momento dell’acquisto.
          </p>
        </div>
        <p className="text-lg">{p.descrizione}</p>
        {p.perche ? <p className="rounded-contenitore border border-gold-line bg-gold-field p-4 text-ink">{p.perche}</p> : null}
        <p className="flex items-center gap-2 text-ink-soft">
          <IconaOrologio width={18} height={18} />
          {testoConsegna(p.consegnaGiorni)}
        </p>
        <CalcoloAGruppo slug={p.slug} prezzoCent={p.prezzoCent} />
        <p className="flex items-center gap-3 text-sm text-ink-soft">
          <BottoneListaRegali prodotto={daProdotto(p)} />
          Aggiungilo alla lista dei regali per far votare il gruppo fra più idee.
        </p>
        <BottoneLink href={urlPerAcquisto(p.urlEsterno)} esterno variante="secondario">
          Vedi su Amazon.it <IconaEsterno width={18} height={18} />
        </BottoneLink>
        <p className="text-sm text-ink-soft">
          Insieme al regalo, un biglietto firmato da tutti?{" "}
          <Link href="/biglietto/nuovo" className="font-semibold text-accent-2 underline underline-offset-4">
            Crea un biglietto di gruppo
          </Link>
        </p>
        <p className="text-sm text-ink-soft">
          Il tempo di consegna è una stima, usata per calcolare la scadenza della raccolta.
        </p>
      </div>
    </div>
  );
}
