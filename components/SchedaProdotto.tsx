import Link from "next/link";
import { BottoneCuore, BottonePreferitiTesto } from "@/components/BottoneCuore";
import { BottoneListaRegali } from "@/components/BottoneListaRegali";
import { BottoneLink, Icona, ImmagineProdotto } from "@/components/ui";
import { urlPerAcquisto } from "@/lib/dominio/amazon";
import { daProdotto } from "@/lib/dominio/regali";
import { formattaEuro } from "@/lib/dominio/importi";
import { quotaProposta } from "@/lib/dominio/quota";
import type { Prodotto } from "@/lib/tipi";
import { conModo } from "@/lib/ux";

export function testoConsegna(giorni: number): string {
  return giorni === 1 ? "Consegna stimata: 1 giorno" : `Consegna stimata: ${giorni} giorni`;
}

/** Le 12 persone che anche la home e la scheda prodotto propongono come punto di partenza. */
export const PERSONE_PREDEFINITE = 12;

/**
 * La card di un prodotto nelle griglie (catalogo, preferiti, risultati di «Trova il regalo»), come nel
 * disegno di UX_V4: foto con il cuore e la consegna, marca, nome, prezzo, quanto viene a testa in `persone`,
 * «Regalalo» e la lista dei regali. Pensata per stare in due colonne anche sul telefono.
 * Con `azione="amazon"` (risultati di «Trova il regalo») resta solo «Guarda su Amazon», con l'avviso che il prezzo
 * può essere cambiato: niente quota a testa, niente colletta né lista.
 * Con `azione="singolo"` (catalogo del regalo singolo) «Aggiungi ai preferiti» e «Guarda su Amazon», senza quota.
 */
export function SchedaProdotto({
  prodotto,
  persone = PERSONE_PREDEFINITE,
  azione = "colletta",
}: {
  prodotto: Prodotto;
  persone?: number;
  azione?: "colletta" | "amazon" | "singolo";
}) {
  const amazon = azione === "amazon";
  const singolo = azione === "singolo";
  // la scheda del prodotto si apre nella stessa variante: «Regalalo» va col regalo di gruppo, gli altri col singolo
  const scheda = conModo(`/prodotto/${prodotto.slug}`, singolo || amazon ? "singolo" : "gruppo");
  return (
    <article className="flex h-full flex-col gap-2 rounded-3xl bg-surface p-2.5 shadow-carta sm:p-3">
      <div className="relative">
        <Link href={scheda} className="block overflow-hidden rounded-2xl" aria-label={`${prodotto.nome}, scheda del prodotto`} tabIndex={-1}>
          <ImmagineProdotto prodotto={prodotto} />
        </Link>
        <BottoneCuore slug={prodotto.slug} nome={prodotto.nome} className="absolute right-2 top-2" />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-1">
        {prodotto.marca !== "Generico" ? (
          <p className="truncate text-[11px] font-bold uppercase tracking-widest text-ink-soft">{prodotto.marca}</p>
        ) : null}
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug sm:text-lg">
          <Link href={scheda} className="hover:underline">
            {prodotto.nome}
          </Link>
        </h3>
        <p className="cifre mt-auto pt-1 text-2xl font-extrabold text-accent-2">
          {formattaEuro(prodotto.prezzoCent)}
          {amazon ? (
            <sup aria-hidden="true" className="ml-0.5 text-base">
              *
            </sup>
          ) : null}
        </p>
        {amazon || singolo ? null : (
          <p className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] font-bold">
            In {persone} siete a {formattaEuro(quotaProposta(prodotto.prezzoCent, persone))}
          </p>
        )}
      </div>
      {singolo ? (
        <div className="flex flex-col gap-1.5">
          <BottonePreferitiTesto slug={prodotto.slug} nome={prodotto.nome} />
          <BottoneLink
            href={urlPerAcquisto(prodotto.urlEsterno)}
            esterno
            variante="azione"
            dimensione="piccolo"
            pieno
            className="!gap-1.5 !px-3 !text-sm leading-tight"
          >
            Guarda su Amazon
            <Icona nome="open_in_new" dimensione={18} />
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </BottoneLink>
        </div>
      ) : amazon ? (
        <div className="flex flex-col gap-1">
          {/* testo più piccolo del solito «azione»: in due colonne sul telefono va su due righe ordinate */}
          <BottoneLink
            href={urlPerAcquisto(prodotto.urlEsterno)}
            esterno
            variante="azione"
            dimensione="piccolo"
            pieno
            className="!gap-1.5 !px-3 !text-sm leading-tight"
          >
            <Icona nome="visibility" dimensione={18} />
            Guarda su Amazon
            <span className="sr-only"> (si apre in una nuova scheda)</span>
          </BottoneLink>
          <p className="px-1 text-center text-[10px] leading-tight text-ink-soft">* Il prezzo potrebbe variare, controlla su Amazon</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <BottoneLink href={`/crea?prodotto=${encodeURIComponent(prodotto.slug)}&persone=${persone}`} variante="azione" dimensione="piccolo" pieno>
            <Icona nome="group" dimensione={18} />
            Regalalo
          </BottoneLink>
          <BottoneListaRegali prodotto={daProdotto(prodotto)} variante="testo" />
        </div>
      )}
    </article>
  );
}
